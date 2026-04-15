'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ROSARY_STEPS, type BeadId } from '@/features/rosario/data/beadSequence'
import { RosaryBeads } from '@/features/rosario/components/RosaryBeads'
import { PrayerStage } from '@/features/rosario/components/PrayerStage'
import { useRosaryProgress } from '@/features/rosario/session/useRosaryProgress'
import {
  clearSession,
  loadSession,
  saveSession,
} from '@/features/rosario/session/rosarySessionStorage'
import { useWakeLock } from '@/features/rosario/session/useWakeLock'
import { useHapticFeedback } from '@/features/rosario/session/useHapticFeedback'
import { useOnboarding } from '@/features/rosario/session/useOnboarding'
import { useSpeechSynthesis } from '@/features/rosario/session/useSpeechSynthesis'
import { useOnlineStatus } from '@/features/rosario/session/useOnlineStatus'
import { useRosaryHistoryRecord } from '@/features/rosario/session/useRosaryHistoryRecord'
import { OnboardingOverlay } from '@/features/rosario/components/OnboardingOverlay'
import { MYSTERY_GROUPS, getMysteryForToday } from '@/features/rosario/data/mysteries'
import { getSpeechText } from '@/features/rosario/data/speechText'
import type { MysterySet } from '@/features/rosario/data/types'

/**
 * `<RosarySession />` — orquestrador completo de uma sessão de terço.
 *
 * Junta as três peças já construídas nos sprints anteriores:
 *   - `useRosaryProgress`   (estado do passo atual)
 *   - `<RosaryBeads />`     (contas clicáveis e com navegação por teclado)
 *   - `<PrayerStage />`     (oração, mistério e botão de avançar)
 *
 * Sprint 1.6: retoma o passo salvo no `localStorage` (TTL de 24 h) e salva
 * automaticamente a cada mudança. Se o terço foi concluído, limpa o salvo
 * para que a próxima sessão comece do início.
 *
 * Sprint 1.7: mantém a tela ligada (Wake Lock) enquanto a sessão estiver
 * ativa, e dispara vibração discreta a cada avanço (opt-out). A barra de
 * progresso e o pulso da conta atual respeitam `prefers-reduced-motion`.
 *
 * Sprint 1.8: modo silêncio — um toggle opt-in que esconde header, seletor
 * de mistérios, barra de progresso e rodapé, deixando apenas as contas e a
 * oração. Usa um botão X discreto no canto superior para sair.
 *
 * Sprint 1.9: onboarding iniciantes — overlay de boas-vindas (4 passos)
 * para quem abre o terço pela primeira vez. Persistido em
 * `veritasdei:rosario:onboarded`. Quem está retomando uma sessão salva
 * pula o overlay. Há um botão discreto "Ver tutorial" que reabre.
 *
 * Sprint 1.10: TTS guiado — leitura em voz alta das orações via
 * Web Speech API, opt-in pelo usuário (default desligado), com escolha
 * automática de voz pt-BR quando disponível. A cada passo o texto é
 * derivado por `getSpeechText` e a utterance anterior é cancelada.
 *
 * Sprint 1.11: PWA offline — o service worker (`public/sw.js`) cacheia
 * o shell de `/rosario` e seus assets estáticos, e este componente mostra
 * um badge discreto "Offline" quando `navigator.onLine` cai, para
 * sinalizar ao usuário que a sessão está funcionando a partir do cache.
 *
 * Sprint 2.3: histórico no Supabase — ao completar um terço (e apenas ao
 * completar, uma única vez por conclusão), dispara um POST best-effort
 * para `/api/rosario/sessions` com mistério, duração e (no sprint 2.5)
 * intenção. Se o usuário não estiver logado ou a rede falhar, a função
 * engole o erro — o terço funciona 100% sem conta.
 */

export function RosarySession() {
  const [mysterySetId, setMysterySetId] = useState<MysterySet>(
    () => getMysteryForToday().id,
  )
  const todayId = useMemo(() => getMysteryForToday().id, [])
  const mysteryGroup = useMemo(
    () => MYSTERY_GROUPS.find((g) => g.id === mysterySetId) ?? MYSTERY_GROUPS[0],
    [mysterySetId],
  )

  const {
    currentIndex,
    currentStep,
    currentBeadId,
    completedIndices,
    isFirst,
    isCompleted,
    totalSteps,
    advance,
    back,
    reset,
    goTo,
    goToBead,
  } = useRosaryProgress()

  // Mantém a tela ligada enquanto a sessão não foi concluída.
  useWakeLock(!isCompleted)

  // Vibração discreta a cada passo (opt-out via localStorage).
  const haptic = useHapticFeedback()

  // Onboarding de boas-vindas (opt-out persistido).
  const onboarding = useOnboarding()

  // TTS guiado (leitura em voz alta das orações, opt-in persistido).
  const tts = useSpeechSynthesis()

  // Status online/offline para mostrar o badge no header.
  const isOnline = useOnlineStatus()

  // Gravação best-effort do histórico no Supabase (sprint 2.3).
  const { recordSession } = useRosaryHistoryRecord()

  // Modo silêncio: UI mínima, sem chrome, focada na oração.
  const [silentMode, setSilentMode] = useState(false)
  const toggleSilent = useCallback(() => setSilentMode((v) => !v), [])

  // Passo atual antes do avanço — usado pra detectar fronteira de dezena.
  const prevStepTypeRef = useRef(currentStep.type)
  useEffect(() => {
    prevStepTypeRef.current = currentStep.type
  }, [currentStep.type])

  const advanceWithHaptic = useCallback(() => {
    // Detecta "fim de dezena" pelo próximo passo: glory após 10 Ave Marias.
    const nextIndex = Math.min(currentIndex + 1, ROSARY_STEPS.length - 1)
    const nextStep = ROSARY_STEPS[nextIndex]
    const crossingDecade =
      currentStep.type === 'hail_mary' &&
      currentStep.decadePosition === 10 &&
      nextStep.type === 'glory'
    const isLastStep = currentIndex === ROSARY_STEPS.length - 1

    if (isLastStep) haptic.pulse('complete')
    else if (crossingDecade) haptic.pulse('decade')
    else haptic.pulse('step')

    advance()
  }, [advance, currentIndex, currentStep, haptic])

  /**
   * Hidratação: ao montar, tenta restaurar a sessão salva. Só começamos a
   * persistir novas mudanças depois que isso rodou — senão o primeiro render
   * sobrescreveria o snapshot salvo com `{ currentIndex: 0 }`.
   */
  const [hydrated, setHydrated] = useState(false)
  const [resumedFrom, setResumedFrom] = useState<number | null>(null)

  useEffect(() => {
    const saved = loadSession()
    if (saved && !saved.isCompleted && saved.currentIndex > 0) {
      setMysterySetId(saved.mysterySetId)
      goTo(saved.currentIndex)
      setResumedFrom(saved.currentIndex)
    }
    setHydrated(true)
    // Só queremos rodar 1x no mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Salva o snapshot sempre que o estado muda (após hidratação). */
  useEffect(() => {
    if (!hydrated) return
    if (isCompleted) {
      clearSession()
      return
    }
    if (currentIndex === 0) {
      // Sessão no passo inicial é equivalente a "nenhuma sessão" — não
      // precisamos guardar nada e evitamos mostrar um banner de retomar
      // que aponta pro passo 1.
      clearSession()
      return
    }
    saveSession({ mysterySetId, currentIndex, isCompleted })
  }, [hydrated, mysterySetId, currentIndex, isCompleted])

  /**
   * Marca o início da sessão a primeira vez em que o usuário sai do passo 0
   * após a hidratação. Usado para calcular `duration_seconds` quando
   * gravamos o histórico no Supabase ao concluir.
   *
   * Se for um resume (retomada), o start conta como "agora" — perdemos a
   * duração total da sessão original, mas registramos pelo menos o tempo
   * gasto na retomada. Uma imprecisão aceitável para um MVP de histórico.
   */
  const sessionStartRef = useRef<number | null>(null)
  useEffect(() => {
    if (!hydrated) return
    if (currentIndex === 0) {
      sessionStartRef.current = null
      return
    }
    if (sessionStartRef.current === null) {
      sessionStartRef.current = Date.now()
    }
  }, [hydrated, currentIndex])

  /**
   * Gravação no Supabase ao completar. Usa uma ref para garantir que cada
   * conclusão seja registrada exatamente uma vez (reset permite nova
   * gravação na próxima sessão completa).
   */
  const recordedCompletionRef = useRef(false)
  useEffect(() => {
    if (!hydrated) return
    if (!isCompleted) {
      recordedCompletionRef.current = false
      return
    }
    if (recordedCompletionRef.current) return
    recordedCompletionRef.current = true

    const startTs = sessionStartRef.current ?? Date.now()
    const durationSeconds = Math.max(0, Math.round((Date.now() - startTs) / 1000))

    void recordSession({
      mystery_set: mysterySetId,
      intention_id: null, // preenchido no sprint 2.5
      started_at: new Date(startTs).toISOString(),
      duration_seconds: durationSeconds,
    })
  }, [hydrated, isCompleted, mysterySetId, recordSession])

  /**
   * Fala o texto do passo atual quando o TTS está ligado. Cancela a utterance
   * anterior implicitamente (o próprio `speak` chama `cancel`). Só roda após
   * a hidratação para não disparar fala durante o SSR/restore. Quando o
   * terço é concluído, para a fala.
   */
  const { enabled: ttsEnabled, speak: ttsSpeak, stop: ttsStop } = tts
  useEffect(() => {
    if (!hydrated) return
    if (!ttsEnabled) return
    if (isCompleted) {
      ttsStop()
      return
    }
    const text = getSpeechText(currentStep, mysteryGroup)
    if (text) ttsSpeak(text)
  }, [hydrated, ttsEnabled, ttsSpeak, ttsStop, currentStep, mysteryGroup, isCompleted])

  /** Esconde o banner de retomada assim que o usuário interagir. */
  const initialResumeIndexRef = useRef<number | null>(null)
  if (initialResumeIndexRef.current === null && resumedFrom !== null) {
    initialResumeIndexRef.current = resumedFrom
  }
  const showResumeBanner =
    resumedFrom !== null && currentIndex === initialResumeIndexRef.current

  const dismissResume = useCallback(() => {
    setResumedFrom(null)
    reset()
  }, [reset])

  const handleMysteryChange = useCallback(
    (nextId: MysterySet) => {
      if (nextId === mysterySetId) return
      setMysterySetId(nextId)
      reset()
      setResumedFrom(null)
    },
    [mysterySetId, reset],
  )

  const completedBeadIds = useMemo<ReadonlySet<BeadId>>(() => {
    const set = new Set<BeadId>()
    for (const idx of completedIndices) {
      const b = ROSARY_STEPS[idx].beadId
      if (b) set.add(b)
    }
    return set
  }, [completedIndices])

  const progressPct = Math.round(((currentIndex + (isCompleted ? 1 : 0)) / totalSteps) * 100)

  // Overlay de boas-vindas: mostra só depois da hidratação, se o usuário
  // nunca dispensou e se não está retomando uma sessão salva. Usuário em
  // modo silêncio também não vê (é um estado deliberado de concentração).
  const showOnboarding =
    hydrated && !onboarding.dismissed && resumedFrom === null && !silentMode

  return (
    <main
      className="relative min-h-screen w-full px-4 py-10 md:py-14"
      style={{ backgroundColor: '#0F0E0C', color: '#F2EDE4' }}
    >
      {!silentMode && <div className="bg-glow" aria-hidden />}

      {silentMode && (
        <button
          type="button"
          onClick={toggleSilent}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border text-base transition"
          style={{
            borderColor: 'rgba(201, 168, 76, 0.35)',
            color: '#D9C077',
            backgroundColor: 'rgba(20, 18, 14, 0.6)',
          }}
          aria-label="Sair do modo silêncio"
        >
          ×
        </button>
      )}

      <div className="relative z-10 mx-auto max-w-xl">
        {!silentMode && !isOnline && (
          <div
            className="mb-4 flex items-center justify-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em]"
            style={{
              borderColor: 'rgba(201, 168, 76, 0.35)',
              color: '#D9C077',
              backgroundColor: 'rgba(20,18,14,0.6)',
              width: 'fit-content',
              margin: '0 auto 1rem',
            }}
            role="status"
            aria-live="polite"
          >
            <span aria-hidden>◉</span>
            <span>Modo offline — rezando a partir do cache</span>
          </div>
        )}

        {!silentMode && (
          <header className="mb-8 text-center">
            <h1
              className="font-serif text-3xl md:text-4xl"
              style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}
            >
              Santo Rosário
            </h1>
            <p
              className="mt-2 text-xs md:text-sm"
              style={{ color: '#7A7368' }}
            >
              Medite os mistérios da vida de Cristo com Nossa Senhora
            </p>
            <div className="ornament-divider max-w-xs mx-auto mt-4">
              <span>&#10022;</span>
            </div>
          </header>
        )}

        {!silentMode && showResumeBanner && (
          <div
            className="mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
            style={{
              borderColor: 'rgba(201, 168, 76, 0.35)',
              backgroundColor: 'rgba(201, 168, 76, 0.08)',
            }}
            role="status"
            aria-live="polite"
          >
            <div className="text-xs" style={{ color: '#F2EDE4' }}>
              <span style={{ color: '#D9C077', fontWeight: 600 }}>
                Retomando de onde parou
              </span>
              <span className="ml-1" style={{ color: '#7A7368' }}>
                — passo {resumedFrom! + 1} de {totalSteps}
              </span>
            </div>
            <button
              type="button"
              onClick={dismissResume}
              className="shrink-0 rounded-md border px-2 py-1 text-[11px] uppercase tracking-wider transition"
              style={{
                borderColor: 'rgba(201, 168, 76, 0.35)',
                color: '#D9C077',
              }}
            >
              Começar do início
            </button>
          </div>
        )}

        {!silentMode && (
        <fieldset className="mb-6">
          <legend className="sr-only">Seleção de mistérios</legend>
          <div
            className="flex gap-1.5 rounded-xl p-1.5"
            role="radiogroup"
            aria-label="Mistérios do dia"
            style={{
              background: 'rgba(20,18,14,0.6)',
              border: '1px solid rgba(201,168,76,0.08)',
            }}
          >
            {MYSTERY_GROUPS.map((g) => {
              const active = g.id === mysterySetId
              const isToday = g.id === todayId
              return (
                <button
                  key={g.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => handleMysteryChange(g.id)}
                  className="min-w-0 flex-1 rounded-lg px-2 py-2 text-center transition"
                  style={{
                    background: active ? 'rgba(201,168,76,0.12)' : 'transparent',
                    border: active ? '1px solid rgba(201,168,76,0.2)' : '1px solid transparent',
                  }}
                >
                  <span
                    className="block text-[11px] font-semibold tracking-wide"
                    style={{
                      fontFamily: 'Cinzel, serif',
                      color: active ? '#C9A84C' : '#7A7368',
                    }}
                  >
                    {g.name.replace('Mistérios ', '')}
                  </span>
                  <span
                    className="mt-0.5 block text-[9px] tracking-wider"
                    style={{
                      color: isToday ? '#D9C077' : 'rgba(122,115,104,0.5)',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    {isToday ? '● Hoje' : g.days}
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>
        )}

        <div className="mb-4">
          <RosaryBeads
            currentBeadId={currentBeadId}
            completedBeadIds={completedBeadIds}
            onBeadSelect={goToBead}
            className="mx-auto h-auto w-full max-w-md"
            ariaDescription={`Terço — passo ${currentIndex + 1} de ${totalSteps}`}
          />
        </div>

        {!silentMode && (
        <div className="mb-4" aria-hidden>
          <div
            className="h-1 w-full overflow-hidden rounded-full"
            style={{ background: 'rgba(201,168,76,0.08)' }}
          >
            <div
              className="rosary-progress-fill h-full"
              style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #C9A84C, #D9C077)',
              }}
            />
          </div>
          <div
            className="mt-2 text-center font-mono text-[11px] uppercase tracking-[0.25em]"
            style={{ color: '#7A7368' }}
          >
            Passo {currentIndex + 1} / {totalSteps}
          </div>
        </div>
        )}

        <PrayerStage
          step={currentStep}
          mysteryGroup={mysteryGroup}
          isCompleted={isCompleted}
          onAdvance={advanceWithHaptic}
        />

        {!silentMode && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {haptic.supported && (
              <button
                type="button"
                onClick={() => haptic.setEnabled(!haptic.enabled)}
                className="rounded-md px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] transition"
                aria-pressed={haptic.enabled}
                style={{
                  color: haptic.enabled ? '#D9C077' : '#7A7368',
                  border: `1px solid ${haptic.enabled ? 'rgba(201,168,76,0.35)' : 'rgba(122,115,104,0.35)'}`,
                }}
              >
                Vibração: {haptic.enabled ? 'ligada' : 'desligada'}
              </button>
            )}
            {tts.supported && (
              <button
                type="button"
                onClick={() => tts.setEnabled(!tts.enabled)}
                className="rounded-md px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] transition"
                aria-pressed={tts.enabled}
                style={{
                  color: tts.enabled ? '#D9C077' : '#7A7368',
                  border: `1px solid ${tts.enabled ? 'rgba(201,168,76,0.35)' : 'rgba(122,115,104,0.35)'}`,
                }}
              >
                Voz: {tts.enabled ? (tts.speaking ? 'falando…' : 'ligada') : 'desligada'}
              </button>
            )}
            <button
              type="button"
              onClick={toggleSilent}
              className="rounded-md px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] transition"
              aria-pressed={silentMode}
              style={{
                color: '#7A7368',
                border: '1px solid rgba(122,115,104,0.35)',
              }}
            >
              Modo silêncio
            </button>
            <button
              type="button"
              onClick={onboarding.reopen}
              className="rounded-md px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] transition"
              style={{
                color: '#7A7368',
                border: '1px solid rgba(122,115,104,0.35)',
              }}
              aria-label="Abrir tutorial de boas-vindas"
            >
              Tutorial
            </button>
            <a
              href="/rosario/historico"
              className="rounded-md px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] transition"
              style={{
                color: '#7A7368',
                border: '1px solid rgba(122,115,104,0.35)',
                textDecoration: 'none',
              }}
            >
              Histórico
            </a>
          </div>
        )}

        <style>{`
          .rosary-progress-fill {
            transition: width 500ms ease-out;
          }
          @media (prefers-reduced-motion: reduce) {
            .rosary-progress-fill { transition: none; }
          }
        `}</style>

        {!silentMode && (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={back}
              disabled={isFirst}
              className="flex-1 rounded-lg border px-4 py-2 text-sm transition disabled:opacity-30"
              style={{
                borderColor: 'rgba(201, 168, 76, 0.35)',
                color: '#D9C077',
              }}
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={() => {
                reset()
                setResumedFrom(null)
              }}
              className="flex-1 rounded-lg border px-4 py-2 text-sm transition"
              style={{
                borderColor: 'rgba(201, 168, 76, 0.35)',
                color: '#D9C077',
              }}
            >
              Reiniciar
            </button>
          </div>
        )}
      </div>

      {showOnboarding && <OnboardingOverlay onDismiss={onboarding.dismiss} />}
    </main>
  )
}
