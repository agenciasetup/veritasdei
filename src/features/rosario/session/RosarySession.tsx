'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import { ROSARY_STEPS, type BeadId } from '@/features/rosario/data/beadSequence'
import { RosaryBeads } from '@/features/rosario/components/RosaryBeads'
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
import { useIntentions } from '@/features/rosario/session/useIntentions'
import { OnboardingOverlay } from '@/features/rosario/components/OnboardingOverlay'
import { IntentionPicker } from '@/features/rosario/components/IntentionPicker'
import { RosaryMenu } from '@/features/rosario/components/RosaryMenu'
import { MYSTERY_GROUPS, getMysteryForToday } from '@/features/rosario/data/mysteries'
import { getSpeechText } from '@/features/rosario/data/speechText'
import { getPrayerById } from '@/features/rosario/data/prayerMap'
import type { MysterySet } from '@/features/rosario/data/types'

/**
 * `<RosarySession />` — orquestrador completo de uma sessão de terço.
 *
 * Layout mobile-first redesenhado:
 *   - Header compacto com nome do mistério + menu
 *   - Contas SVG proeminentes
 *   - Card de oração compacto
 *   - Bottom bar fixa com Voltar / Avançar
 *   - Floating menu (bottom sheet) com todas as opções
 */

const ORDINALS: Record<number, string> = { 1: '1º', 2: '2º', 3: '3º', 4: '4º', 5: '5º' }

const MYSTERY_SINGULAR: Record<string, string> = {
  gozosos: 'Gozoso',
  luminosos: 'Luminoso',
  dolorosos: 'Doloroso',
  gloriosos: 'Glorioso',
}

const STEP_LABELS: Record<string, string> = {
  sign_of_cross: 'Sinal da Cruz',
  creed: 'Credo Apostólico',
  our_father: 'Pai Nosso',
  hail_mary: 'Ave Maria',
  glory: 'Glória ao Pai',
  fatima: 'Oração de Fátima',
  mystery_announce: 'Contemplação',
  hail_holy_queen: 'Salve Rainha',
  final_prayer: 'Oração Final',
}

interface RosarySessionProps {
  fullRosary?: boolean
  onExit?: () => void
}

const ROSARY_SEQUENCE: MysterySet[] = ['gozosos', 'luminosos', 'dolorosos', 'gloriosos']

export function RosarySession({ fullRosary = false, onExit }: RosarySessionProps) {
  // Rosário completo: track which of the 4 terços we're on (0–3)
  const [rosarioIndex, setRosarioIndex] = useState(0)
  const [showTransition, setShowTransition] = useState(false)

  const [mysterySetId, setMysterySetId] = useState<MysterySet>(
    () => fullRosary ? ROSARY_SEQUENCE[0] : getMysteryForToday().id,
  )
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

  useWakeLock(!isCompleted)
  const haptic = useHapticFeedback()
  const onboarding = useOnboarding()
  const tts = useSpeechSynthesis()
  const isOnline = useOnlineStatus()
  const { recordSession } = useRosaryHistoryRecord()
  const intentionsState = useIntentions()
  const [activeIntentionId, setActiveIntentionId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const activeIntention = useMemo(() => {
    if (!activeIntentionId) return null
    return intentionsState.intentions.find((i) => i.id === activeIntentionId) ?? null
  }, [activeIntentionId, intentionsState.intentions])

  // --- Haptic + advance ---
  const advanceWithHaptic = useCallback(() => {
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

  // --- Session persistence ---
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (isCompleted) { clearSession(); return }
    if (currentIndex === 0) { clearSession(); return }
    saveSession({ mysterySetId, currentIndex, isCompleted })
  }, [hydrated, mysterySetId, currentIndex, isCompleted])

  // --- Session timing for history ---
  const sessionStartRef = useRef<number | null>(null)
  useEffect(() => {
    if (!hydrated) return
    if (currentIndex === 0) { sessionStartRef.current = null; return }
    if (sessionStartRef.current === null) sessionStartRef.current = Date.now()
  }, [hydrated, currentIndex])

  const recordedCompletionRef = useRef(false)
  useEffect(() => {
    if (!hydrated) return
    if (!isCompleted) { recordedCompletionRef.current = false; return }
    if (recordedCompletionRef.current) return
    recordedCompletionRef.current = true
    const startTs = sessionStartRef.current ?? Date.now()
    const durationSeconds = Math.max(0, Math.round((Date.now() - startTs) / 1000))
    void recordSession({
      mystery_set: mysterySetId,
      intention_id: activeIntentionId,
      started_at: new Date(startTs).toISOString(),
      duration_seconds: durationSeconds,
    })
  }, [hydrated, isCompleted, mysterySetId, activeIntentionId, recordSession])

  // --- Rosário completo: intercept completion to show transition ---
  const isLastRosarioSet = rosarioIndex >= ROSARY_SEQUENCE.length - 1
  const rosarioFullyComplete = fullRosary && isCompleted && isLastRosarioSet

  useEffect(() => {
    if (!fullRosary || !isCompleted || isLastRosarioSet) return
    setShowTransition(true)
  }, [fullRosary, isCompleted, isLastRosarioSet])

  function advanceToNextRosarioSet() {
    const nextIndex = rosarioIndex + 1
    setRosarioIndex(nextIndex)
    setMysterySetId(ROSARY_SEQUENCE[nextIndex])
    setShowTransition(false)
    reset()
    setResumedFrom(null)
    sessionStartRef.current = Date.now()
    recordedCompletionRef.current = false
  }

  // In full rosary mode, show effective completion only after all 4
  const effectiveCompleted = fullRosary ? rosarioFullyComplete : isCompleted

  // --- TTS ---
  const { enabled: ttsEnabled, speak: ttsSpeak, stop: ttsStop } = tts
  useEffect(() => {
    if (!hydrated) return
    if (!ttsEnabled) return
    if (isCompleted) { ttsStop(); return }
    const text = getSpeechText(currentStep, mysteryGroup)
    if (text) ttsSpeak(text)
  }, [hydrated, ttsEnabled, ttsSpeak, ttsStop, currentStep, mysteryGroup, isCompleted])

  // --- Resume banner ---
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

  const showOnboarding =
    hydrated && !onboarding.dismissed && resumedFrom === null

  // --- Derive prayer info for compact card ---
  const prayer = getPrayerById(currentStep.prayerId)
  const mystery =
    currentStep.decade !== undefined ? mysteryGroup.mysteries[currentStep.decade - 1] : null
  const isMysteryAnnounce = currentStep.type === 'mystery_announce'
  const showAveCounter =
    currentStep.type === 'hail_mary' && currentStep.decadePosition !== undefined

  // Phase label for display
  function getPhaseLabel(): string {
    if (currentStep.phase === 'intro') return 'Introdução'
    if (currentStep.phase === 'outro') return 'Conclusão'
    if (currentStep.decade) {
      const ord = ORDINALS[currentStep.decade] ?? `${currentStep.decade}º`
      const singular = MYSTERY_SINGULAR[mysteryGroup.id] ?? 'Mistério'
      return `${ord} Mistério ${singular}`
    }
    return ''
  }

  // Mystery name for header
  const mysteryShortName = mysteryGroup.name.replace('Mistérios ', '')
  const headerTitle = fullRosary
    ? `${mysteryShortName} (${rosarioIndex + 1}/4)`
    : mysteryShortName

  return (
    <div
      className="fixed inset-0 flex flex-col md:static md:inset-auto md:mx-auto md:my-6 md:max-w-4xl md:min-h-[calc(100vh-7rem)] md:rounded-2xl md:border md:overflow-hidden"
      style={{
        backgroundColor: '#0F0E0C',
        color: '#F2EDE4',
        borderColor: 'rgba(201, 168, 76, 0.12)',
      }}
    >
      {/* ── Top bar ── */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-4 safe-top"
        style={{
          height: '52px',
          borderBottom: '1px solid rgba(201, 168, 76, 0.08)',
        }}
      >
        {onExit ? (
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 text-xs transition"
            style={{ color: '#7A7368', background: 'none', border: 'none' }}
            aria-label="Voltar"
          >
            <span aria-hidden>←</span>
            <span className="hidden sm:inline">Voltar</span>
          </button>
        ) : (
          <Link
            href="/orar"
            className="flex items-center gap-1.5 text-xs transition"
            style={{ color: '#7A7368', textDecoration: 'none' }}
            aria-label="Voltar para Orar"
          >
            <span aria-hidden>←</span>
            <span className="hidden sm:inline">Orar</span>
          </Link>
        )}

        <div className="text-center">
          <h1
            className="text-sm font-medium"
            style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}
          >
            {headerTitle}
          </h1>
          {!isOnline && (
            <span className="text-[9px]" style={{ color: '#D9C077' }}>
              Offline
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex items-center justify-center w-9 h-9 rounded-full transition active:scale-95"
          style={{
            background: 'rgba(201, 168, 76, 0.08)',
            border: '1px solid rgba(201, 168, 76, 0.15)',
            color: '#D9C077',
          }}
          aria-label="Abrir opções"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="5" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <circle cx="12" cy="19" r="1.5" fill="currentColor" />
          </svg>
        </button>
      </header>

      {/* ── Resume banner ── */}
      {showResumeBanner && (
        <div
          className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-2"
          style={{
            backgroundColor: 'rgba(201, 168, 76, 0.08)',
            borderBottom: '1px solid rgba(201, 168, 76, 0.15)',
          }}
          role="status"
          aria-live="polite"
        >
          <span className="text-xs" style={{ color: '#D9C077' }}>
            Retomando — passo {resumedFrom! + 1}/{totalSteps}
          </span>
          <button
            type="button"
            onClick={dismissResume}
            className="text-[11px] uppercase tracking-wider px-2 py-1 rounded transition"
            style={{ color: '#D9C077', border: '1px solid rgba(201, 168, 76, 0.3)' }}
          >
            Recomeçar
          </button>
        </div>
      )}

      {/* ── Main content area (flex-grow, scrollable) ── */}
      <div className="flex-1 flex flex-col overflow-y-auto px-4 pt-2 pb-2 md:flex-row md:items-start md:gap-8 md:px-8 md:pt-6">
        {/* Intention pill (if set) */}
        {activeIntention && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="self-center flex items-center gap-1.5 rounded-full px-3 py-1 mb-2 text-[10px] transition active:scale-[0.97]"
            style={{
              border: '1px solid rgba(201, 168, 76, 0.3)',
              background: 'rgba(201, 168, 76, 0.06)',
              color: '#D9C077',
            }}
          >
            <span aria-hidden>✦</span>
            <span className="truncate" style={{ maxWidth: '12rem' }}>
              {activeIntention.titulo}
            </span>
          </button>
        )}

        {/* Left column: beads + progress */}
        <div className="flex-shrink-0 md:flex-1 md:flex md:flex-col md:items-center md:sticky md:top-4">
          {/* Rosary beads */}
          <div className="flex justify-center">
            <RosaryBeads
              currentBeadId={currentBeadId}
              completedBeadIds={completedBeadIds}
              onBeadSelect={goToBead}
              className="w-full max-w-[280px] md:max-w-[360px] h-auto"
              ariaDescription={`Terço — passo ${currentIndex + 1} de ${totalSteps}`}
            />
          </div>

          {/* Compact progress */}
          <div className="mb-2 md:w-full md:max-w-[360px]" aria-hidden>
            <div
              className="h-0.5 w-full overflow-hidden rounded-full"
              style={{ background: 'rgba(201, 168, 76, 0.08)' }}
            >
              <div
                className="h-full transition-all duration-500 ease-out"
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(90deg, #C9A84C, #D9C077)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Right column on desktop: prayer card */}
        <motion.section
          className="flex-shrink-0 rounded-xl p-4 md:flex-1 md:p-6"
          style={{
            background: 'rgba(20, 18, 14, 0.6)',
            border: '1px solid rgba(201, 168, 76, 0.12)',
            touchAction: 'pan-y',
          }}
          aria-live="polite"
          onPanEnd={(_e, info: PanInfo) => {
            const dx = info.offset.x
            const dy = info.offset.y
            // ignora pans verticais (scroll) e quase-zero
            if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return
            if (dx < 0) {
              haptic.pulse('medium')
              advanceWithHaptic()
            } else if (!isFirst) {
              haptic.pulse('medium')
              back()
            }
          }}
        >
          {/* Phase + counter */}
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[10px] uppercase tracking-[0.2em]"
              style={{ color: '#7A7368' }}
            >
              {getPhaseLabel()}
            </span>
            {showAveCounter && (
              <span
                className="font-mono text-[11px] uppercase tracking-wider"
                style={{ color: '#D9C077' }}
              >
                {currentStep.decadePosition}/10
              </span>
            )}
          </div>

          {/* Mystery info (during decades) */}
          {mystery && !isMysteryAnnounce && (
            <div className="mb-2">
              <h2
                className="text-base leading-snug"
                style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}
              >
                {mystery.title}
              </h2>
              <p
                className="text-[11px] italic mt-0.5"
                style={{ color: '#7A7368' }}
              >
                Fruto: {mystery.fruit}
              </p>
            </div>
          )}

          {/* Prayer content */}
          {isMysteryAnnounce && mystery ? (
            <div>
              <h3
                className="text-sm mb-1"
                style={{ color: '#D9C077', fontFamily: 'Cinzel, serif' }}
              >
                {mystery.title}
              </h3>
              <p
                className="text-sm italic leading-relaxed"
                style={{ color: '#F2EDE4', fontFamily: 'var(--font-cormorant, serif)' }}
              >
                {mystery.reflection}
              </p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.15em]" style={{ color: '#7A7368' }}>
                Contemple em silêncio
              </p>
            </div>
          ) : prayer ? (
            <div>
              <h3 className="text-sm mb-1" style={{ color: '#D9C077' }}>
                {prayer.name}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: '#F2EDE4' }}
              >
                {prayer.text}
              </p>
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#F2EDE4' }}>
              {STEP_LABELS[currentStep.type] ?? currentStep.type}
            </p>
          )}
        </motion.section>
      </div>

      {/* ── Rosário transition screen ── */}
      {showTransition && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(15, 14, 12, 0.97)' }}
        >
          <div className="text-center px-6 max-w-md">
            <div className="text-4xl mb-4" aria-hidden>✦</div>
            <h2
              className="text-xl mb-2"
              style={{ color: '#D9C077', fontFamily: 'Cinzel, serif' }}
            >
              Mistérios {mysteryShortName} concluídos
            </h2>
            <p className="text-sm mb-1" style={{ color: '#B8AFA2' }}>
              Terço {rosarioIndex + 1} de 4
            </p>
            <p className="text-xs mb-6" style={{ color: '#7A7368' }}>
              Próximo: Mistérios {ROSARY_SEQUENCE[rosarioIndex + 1]
                ? MYSTERY_GROUPS.find(g => g.id === ROSARY_SEQUENCE[rosarioIndex + 1])?.name.replace('Mistérios ', '') ?? ''
                : ''}
            </p>
            <button
              type="button"
              onClick={advanceToNextRosarioSet}
              className="rounded-xl px-8 py-3 text-sm font-semibold transition active:scale-[0.97]"
              style={{
                background: 'linear-gradient(180deg, #C9A84C, #A88437)',
                color: '#0F0E0C',
              }}
            >
              Continuar o Rosário
            </button>
          </div>
        </div>
      )}

      {/* ── Fixed bottom bar ── */}
      {!effectiveCompleted && !showTransition && !isCompleted ? (
        <div
          className="flex-shrink-0 flex items-center gap-3 px-4 safe-bottom md:px-8 md:rounded-b-2xl"
          style={{
            height: '72px',
            borderTop: '1px solid rgba(201, 168, 76, 0.1)',
            background: 'rgba(15, 14, 12, 0.95)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <button
            type="button"
            onClick={back}
            disabled={isFirst}
            className="flex items-center justify-center w-12 h-12 rounded-xl border transition disabled:opacity-25 active:scale-95"
            style={{
              borderColor: 'rgba(201, 168, 76, 0.25)',
              color: '#D9C077',
            }}
            aria-label="Voltar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={advanceWithHaptic}
            className="flex-1 h-12 rounded-xl text-sm font-semibold transition active:scale-[0.97]"
            style={{
              background: 'linear-gradient(180deg, #C9A84C, #A88437)',
              color: '#0F0E0C',
            }}
          >
            Avançar
          </button>

          <div className="w-12 flex items-center justify-center">
            <span
              className="font-mono text-[10px]"
              style={{ color: '#7A7368' }}
            >
              {currentIndex + 1}/{totalSteps}
            </span>
          </div>
        </div>
      ) : !showTransition ? (
        /* ── Completion screen ── */
        <div
          className="flex-shrink-0 px-4 py-6 text-center safe-bottom"
          style={{
            borderTop: '1px solid rgba(201, 168, 76, 0.15)',
            background: 'rgba(15, 14, 12, 0.95)',
          }}
        >
          <div className="text-3xl mb-2" aria-hidden>✦</div>
          <h2
            className="text-xl mb-1"
            style={{ color: '#D9C077', fontFamily: 'Cinzel, serif' }}
          >
            {rosarioFullyComplete ? 'Rosário completo' : 'Terço completo'}
          </h2>
          <p className="text-xs mb-4" style={{ color: '#7A7368' }}>
            Que Nossa Senhora interceda por você
          </p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                reset()
                setResumedFrom(null)
              }}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold transition active:scale-[0.97]"
              style={{
                background: 'linear-gradient(180deg, #C9A84C, #A88437)',
                color: '#0F0E0C',
              }}
            >
              Rezar novamente
            </button>
            {onExit ? (
              <button
                type="button"
                onClick={onExit}
                className="rounded-xl border px-5 py-2.5 text-sm transition"
                style={{
                  borderColor: 'rgba(201, 168, 76, 0.3)',
                  color: '#D9C077',
                }}
              >
                Voltar
              </button>
            ) : (
              <Link
                href="/orar"
                className="rounded-xl border px-5 py-2.5 text-sm transition"
                style={{
                  borderColor: 'rgba(201, 168, 76, 0.3)',
                  color: '#D9C077',
                  textDecoration: 'none',
                }}
              >
                Voltar
              </Link>
            )}
          </div>
        </div>
      ) : null}

      {/* ── Floating menu (bottom sheet) ── */}
      <RosaryMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        mysterySetId={mysterySetId}
        onMysteryChange={handleMysteryChange}
        mysteryLocked={fullRosary}
        hapticSupported={haptic.supported}
        hapticEnabled={haptic.enabled}
        onHapticToggle={() => haptic.setEnabled(!haptic.enabled)}
        ttsSupported={tts.supported}
        ttsEnabled={tts.enabled}
        ttsSpeaking={tts.speaking}
        onTtsToggle={() => tts.setEnabled(!tts.enabled)}
        intentionAvailable={intentionsState.available}
        intentionLabel={activeIntention?.titulo ?? null}
        onIntentionOpen={() => setPickerOpen(true)}
        onRestart={() => {
          reset()
          setResumedFrom(null)
        }}
        onTutorial={onboarding.reopen}
      />

      {/* ── Overlays ── */}
      {showOnboarding && <OnboardingOverlay onDismiss={onboarding.dismiss} />}
      {intentionsState.available && (
        <IntentionPicker
          open={pickerOpen}
          intentions={intentionsState.intentions}
          selectedId={activeIntentionId}
          onSelect={(id) => setActiveIntentionId(id)}
          onCreate={async (titulo, descricao) => {
            const created = await intentionsState.create({ titulo, descricao })
            if (created) setActiveIntentionId(created.id)
          }}
          onArchive={async (id) => {
            await intentionsState.update(id, { arquivada: true })
            if (activeIntentionId === id) setActiveIntentionId(null)
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      <style>{`
        .safe-top { padding-top: env(safe-area-inset-top, 0px); }
        .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
        @media (prefers-reduced-motion: reduce) {
          * { transition-duration: 0ms !important; animation-duration: 0ms !important; }
        }
      `}</style>
    </div>
  )
}
