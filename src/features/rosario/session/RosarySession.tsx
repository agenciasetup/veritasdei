'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
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
import type { MysteryGroup, MysterySet } from '@/features/rosario/data/types'
import {
  getRosaryTheme,
  type RosaryLanguage,
  type RosaryTheme,
} from '@/features/rosario/data/theme'
import type { RosarySkin, RosarySkinTheme } from '@/features/rosario/data/skinTypes'

/**
 * `<RosarySession />` — orquestrador completo de uma sessão de terço.
 *
 * Layout responsivo:
 *   - Mobile/tablet (≤lg): vertical scroll — terço no topo, oração abaixo.
 *   - Desktop (lg+): fullscreen split — terço SVG grande à esquerda,
 *     oração grande à direita. Sem cartões aninhados. Tipografia que
 *     respira como um missal aberto sobre a mesa.
 *
 * Dois modos visuais:
 *   - `pt` (padrão) — paleta dourada sobre preto profundo (token-driven).
 *   - `la` — missal antigo: ouro oxidado sobre borgonha. Toggle na topbar.
 */

const ORDINALS_PT: Record<number, string> = { 1: '1º', 2: '2º', 3: '3º', 4: '4º', 5: '5º' }
const ORDINALS_LA: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' }

const MYSTERY_SINGULAR_PT: Record<string, string> = {
  gozosos: 'Gozoso',
  luminosos: 'Luminoso',
  dolorosos: 'Doloroso',
  gloriosos: 'Glorioso',
}
const MYSTERY_SINGULAR_LA: Record<string, string> = {
  gozosos: 'Gaudiosum',
  luminosos: 'Luminosum',
  dolorosos: 'Dolorosum',
  gloriosos: 'Gloriosum',
}

const STEP_LABELS_PT: Record<string, string> = {
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
const STEP_LABELS_LA: Record<string, string> = {
  sign_of_cross: 'Signum Crucis',
  creed: 'Symbolum Apostolorum',
  our_father: 'Pater Noster',
  hail_mary: 'Ave Maria',
  glory: 'Gloria Patri',
  fatima: 'Oratio Fatimae',
  mystery_announce: 'Contemplatio',
  hail_holy_queen: 'Salve Regina',
  final_prayer: 'Oratio Finalis',
}

const LANGUAGE_STORAGE_KEY = 'rosary:language'

interface RosarySessionProps {
  fullRosary?: boolean
  /**
   * Skin ativa do user, carregada server-side. Define paleta visual
   * (`activeSkin.theme`) e — opcionalmente — substitui os 5 mistérios
   * pelo conjunto temático (`activeSkin.mysteries`). Quando nula,
   * cai pro tema/comportamento padrão (compat com cenários sem login).
   */
  activeSkin?: RosarySkin | null
  /**
   * Quando definido, sobrepõe os mistérios usando um MysteryGroup
   * arbitrário. Mantido por compat com a rota /rosario/tematicos/*
   * (que vai ser deprecada em favor de skins). Tem precedência sobre
   * `activeSkin.mysteries`.
   */
  customMysteryGroup?: MysteryGroup
  onExit?: () => void
}

const ROSARY_SEQUENCE: MysterySet[] = ['gozosos', 'luminosos', 'dolorosos', 'gloriosos']

export function RosarySession({
  fullRosary = false,
  activeSkin,
  customMysteryGroup,
  onExit,
}: RosarySessionProps) {
  // Mistérios temáticos podem vir de 2 fontes:
  //   (a) customMysteryGroup direto (legado /rosario/tematicos)
  //   (b) activeSkin.mysteries (loja de skins, fonte atual)
  // Em ambos os casos, o usuário não pode trocar o conjunto no menu e
  // a sessão não é gravada no histórico (enum DB só aceita os 4 canônicos).
  const skinMysteryGroup: MysteryGroup | undefined =
    activeSkin && activeSkin.mysteries && activeSkin.mysteries.length > 0
      ? {
          id: activeSkin.slug as MysteryGroup['id'],
          name: activeSkin.nome,
          days: activeSkin.subtitulo ?? '',
          mysteries: activeSkin.mysteries,
        }
      : undefined
  const effectiveCustomGroup = customMysteryGroup ?? skinMysteryGroup
  const usingThematic = effectiveCustomGroup !== undefined
  // --- Language / theme ---
  const [language, setLanguageState] = useState<RosaryLanguage>('pt')
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY)
      if (saved === 'la' || saved === 'pt') setLanguageState(saved)
    } catch {}
  }, [])
  const setLanguage = useCallback((lang: RosaryLanguage) => {
    setLanguageState(lang)
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, lang) } catch {}
  }, [])
  // Tema visual: vem da skin equipada quando há uma. Fallback pro tema
  // legado (gold pt / missal la) — preserva comportamento anônimo e DB
  // sem seed. O cast é seguro: RosarySkinTheme tem todas as chaves de
  // cor que RosaryTheme exige; campos extras (glyph variants) são lidos
  // por RosaryBeads quando presentes, ignorados caso contrário.
  const theme = useMemo<RosaryTheme>(() => {
    if (activeSkin?.theme) {
      return {
        ...(activeSkin.theme as RosarySkinTheme),
        language,
      } as unknown as RosaryTheme
    }
    return getRosaryTheme(language)
  }, [activeSkin?.theme, language])
  const isLatin = language === 'la'

  // Rosário completo: track which of the 4 terços we're on (0–3)
  const [rosarioIndex, setRosarioIndex] = useState(0)
  const [showTransition, setShowTransition] = useState(false)

  const [mysterySetId, setMysterySetId] = useState<MysterySet>(
    () => fullRosary ? ROSARY_SEQUENCE[0] : getMysteryForToday().id,
  )
  const fallbackMysteryGroup = useMemo(
    () => MYSTERY_GROUPS.find((g) => g.id === mysterySetId) ?? MYSTERY_GROUPS[0],
    [mysterySetId],
  )
  const mysteryGroup = effectiveCustomGroup ?? fallbackMysteryGroup

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
    // Terços temáticos começam sempre do zero — não restauramos
    // sessão salva (seria de outro conjunto de mistérios) nem salvamos
    // a esta sessão por cima.
    if (usingThematic) {
      setHydrated(true)
      return
    }
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
    if (usingThematic) return
    if (isCompleted) { clearSession(); return }
    if (currentIndex === 0) { clearSession(); return }
    saveSession({ mysterySetId, currentIndex, isCompleted })
  }, [hydrated, mysterySetId, currentIndex, isCompleted, usingThematic])

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
    // Terços temáticos não persistem no histórico — o enum `mystery_set`
    // no DB só aceita os 4 conjuntos canônicos. Mantemos a sessão funcional
    // mas pulamos o INSERT.
    if (usingThematic) {
      recordedCompletionRef.current = true
      return
    }
    recordedCompletionRef.current = true
    const startTs = sessionStartRef.current ?? Date.now()
    const durationSeconds = Math.max(0, Math.round((Date.now() - startTs) / 1000))
    void recordSession({
      mystery_set: mysterySetId,
      intention_id: activeIntentionId,
      started_at: new Date(startTs).toISOString(),
      duration_seconds: durationSeconds,
    })
  }, [hydrated, isCompleted, mysterySetId, activeIntentionId, recordSession, usingThematic])

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

  const effectiveCompleted = fullRosary ? rosarioFullyComplete : isCompleted

  // --- TTS ---
  const { enabled: ttsEnabled, speak: ttsSpeak, stop: ttsStop } = tts
  useEffect(() => {
    if (!hydrated) return
    if (!ttsEnabled) return
    if (isCompleted) { ttsStop(); return }
    const text = getSpeechText(currentStep, mysteryGroup, language)
    if (text) ttsSpeak(text)
  }, [hydrated, ttsEnabled, ttsSpeak, ttsStop, currentStep, mysteryGroup, isCompleted, language])

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

  // --- Derive prayer info ---
  const prayer = getPrayerById(currentStep.prayerId)
  const mystery =
    currentStep.decade !== undefined ? mysteryGroup.mysteries[currentStep.decade - 1] : null
  const isMysteryAnnounce = currentStep.type === 'mystery_announce'
  const showAveCounter =
    currentStep.type === 'hail_mary' && currentStep.decadePosition !== undefined

  const prayerDisplayName = prayer
    ? (isLatin && prayer.latinName ? prayer.latinName : prayer.name)
    : null
  const prayerDisplayText = prayer
    ? (isLatin && prayer.latinText ? prayer.latinText : prayer.text)
    : null
  const mysteryDisplayTitle = mystery
    ? (isLatin && mystery.latinTitle ? mystery.latinTitle : mystery.title)
    : null
  const mysteryDisplayFruit = mystery
    ? (isLatin && mystery.latinFruit ? mystery.latinFruit : mystery.fruit)
    : null
  const mysteryDisplayReflection = mystery
    ? (isLatin && mystery.latinReflection ? mystery.latinReflection : mystery.reflection)
    : null

  function getPhaseLabel(): string {
    if (currentStep.phase === 'intro') return isLatin ? 'Introitus' : 'Introdução'
    if (currentStep.phase === 'outro') return isLatin ? 'Conclusio' : 'Conclusão'
    if (currentStep.decade) {
      if (isLatin) {
        const ord = ORDINALS_LA[currentStep.decade] ?? `${currentStep.decade}`
        const singular = MYSTERY_SINGULAR_LA[mysteryGroup.id] ?? 'Mysterium'
        return `Mysterium ${singular} ${ord}`
      }
      const ord = ORDINALS_PT[currentStep.decade] ?? `${currentStep.decade}º`
      const singular = MYSTERY_SINGULAR_PT[mysteryGroup.id] ?? 'Mistério'
      return `${ord} Mistério ${singular}`
    }
    return ''
  }

  const mysteryShortNamePt = mysteryGroup.name.replace('Mistérios ', '')
  const mysteryShortName =
    isLatin && mysteryGroup.latinName
      ? mysteryGroup.latinName.replace('Mysteria ', '')
      : mysteryShortNamePt
  const headerTitle = usingThematic
    ? mysteryGroup.name
    : fullRosary
      ? `${mysteryShortName} (${rosarioIndex + 1}/4)`
      : mysteryShortName

  const stepLabels = isLatin ? STEP_LABELS_LA : STEP_LABELS_PT

  // Key changes on every step — used for content cross-fade.
  const stageKey = currentIndex

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        backgroundColor: theme.pageBg,
        color: theme.textPrimary,
        transition: 'background-color 320ms ease, color 320ms ease',
      }}
    >
      {/* Ambient background glow — anchored behind everything else */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: theme.pageBgAmbient }}
      />

      {/* ── Top bar ── */}
      <header
        className="relative z-20 flex flex-shrink-0 items-center justify-between gap-2 px-4 safe-top md:px-8"
        style={{
          height: '60px',
          borderBottom: `1px solid ${theme.border}`,
          backdropFilter: 'blur(8px)',
        }}
      >
        {onExit ? (
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 text-xs transition hover:opacity-100"
            style={{ color: theme.textMuted, background: 'none', border: 'none', opacity: 0.85 }}
            aria-label="Voltar"
          >
            <span aria-hidden>←</span>
            <span className="hidden sm:inline">Voltar</span>
          </button>
        ) : (
          <Link
            href="/orar"
            className="flex items-center gap-1.5 text-xs transition"
            style={{ color: theme.textMuted, textDecoration: 'none', opacity: 0.85 }}
            aria-label="Voltar para Orar"
          >
            <span aria-hidden>←</span>
            <span className="hidden sm:inline">Orar</span>
          </Link>
        )}

        <div className="min-w-0 flex-1 text-center">
          <h1
            className="truncate text-sm font-medium tracking-wide md:text-base"
            style={{
              color: theme.textPrimary,
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.06em',
            }}
          >
            {headerTitle}
          </h1>
          {!isOnline && (
            <span className="text-[9px]" style={{ color: theme.accentLight }}>
              Offline
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Latin toggle */}
          <button
            type="button"
            onClick={() => setLanguage(isLatin ? 'pt' : 'la')}
            className="flex h-9 items-center justify-center rounded-full px-3 transition active:scale-95"
            style={{
              background: isLatin
                ? 'linear-gradient(180deg, rgba(212,181,116,0.16), rgba(168,136,78,0.08))'
                : 'var(--surface-inset)',
              border: `1px solid ${isLatin ? theme.borderStrong : 'var(--border-1)'}`,
              color: isLatin ? theme.accentLight : 'var(--text-3)',
              fontFamily: 'var(--font-display)',
              fontSize: '10px',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              fontWeight: 600,
              textShadow: isLatin
                ? `0 0 12px color-mix(in srgb, ${theme.accentLight} 38%, transparent)`
                : 'none',
            }}
            aria-pressed={isLatin}
            aria-label={isLatin ? 'Desativar latim' : 'Ativar latim'}
            title={isLatin ? 'Rezando em latim' : 'Ativar rito em latim'}
          >
            LATIM
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full transition active:scale-95"
            style={{
              background: theme.cardBg,
              border: `1px solid ${theme.border}`,
              color: theme.accentLight,
            }}
            aria-label="Abrir opções"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="5" r="1.5" fill="currentColor" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              <circle cx="12" cy="19" r="1.5" fill="currentColor" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Resume banner ── */}
      {showResumeBanner && (
        <div
          className="relative z-20 flex flex-shrink-0 items-center justify-between gap-3 px-4 py-2 md:px-8"
          style={{
            backgroundColor: theme.cardBg,
            borderBottom: `1px solid ${theme.borderStrong}`,
          }}
          role="status"
          aria-live="polite"
        >
          <span className="text-xs" style={{ color: theme.accentLight }}>
            Retomando — passo {resumedFrom! + 1}/{totalSteps}
          </span>
          <button
            type="button"
            onClick={dismissResume}
            className="rounded px-2 py-1 text-[11px] uppercase tracking-wider transition"
            style={{ color: theme.accentLight, border: `1px solid ${theme.borderStrong}` }}
          >
            Recomeçar
          </button>
        </div>
      )}

      {/* ── Main content area ── */}
      <main className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        {/* Mobile: vertical scrolling, single column.
            Desktop (lg+): two columns side-by-side, both centered vertically. */}
        <div className="flex w-full flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          {/* ─── LEFT: Beads ─── */}
          <section
            className="
              flex flex-shrink-0 items-center justify-center
              px-4 pt-4 pb-2
              lg:h-full lg:w-[44%] lg:max-w-[640px] lg:px-12 lg:py-8 lg:pl-16
            "
            aria-label="Visualização do terço"
          >
            <div className="flex w-full flex-col items-center gap-4 lg:gap-6">
              {/* Phase + counter chip (always visible — top of beads block) */}
              <div className="flex items-center gap-3">
                <span
                  className="text-[10px] uppercase tracking-[0.28em] md:text-[11px]"
                  style={{ color: theme.textMuted, fontFamily: 'var(--font-display)' }}
                >
                  {getPhaseLabel()}
                </span>
                {showAveCounter && (
                  <span
                    className="font-mono text-[11px] md:text-xs"
                    style={{ color: theme.accentLight }}
                  >
                    {currentStep.decadePosition}/10
                  </span>
                )}
              </div>

              {/* The beads themselves */}
              <RosaryBeads
                currentBeadId={currentBeadId}
                completedBeadIds={completedBeadIds}
                onBeadSelect={goToBead}
                className="
                  h-auto w-full
                  max-w-[300px] sm:max-w-[360px] md:max-w-[420px]
                  lg:max-w-[480px] xl:max-w-[540px]
                "
                ariaDescription={`Terço — passo ${currentIndex + 1} de ${totalSteps}`}
                theme={theme}
              />

              {/* Slim progress */}
              <div
                className="
                  w-full
                  max-w-[300px] sm:max-w-[360px] md:max-w-[420px]
                  lg:max-w-[480px] xl:max-w-[540px]
                "
                aria-hidden
              >
                <div
                  className="h-px w-full overflow-hidden rounded-full"
                  style={{ background: theme.border }}
                >
                  <div
                    className="h-full transition-all duration-500 ease-out"
                    style={{
                      width: `${progressPct}%`,
                      background: `linear-gradient(90deg, ${theme.accent}, ${theme.accentLight})`,
                      boxShadow: `0 0 8px ${theme.accent}40`,
                    }}
                  />
                </div>
                <div
                  className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: theme.textMuted }}
                >
                  <span>{currentIndex + 1} / {totalSteps}</span>
                  <span>{progressPct}%</span>
                </div>
              </div>
            </div>
          </section>

          {/* ─── Divider (desktop only) ─── */}
          <div
            aria-hidden
            className="hidden lg:block lg:w-px lg:flex-shrink-0"
            style={{
              background: `linear-gradient(180deg, transparent, ${theme.border} 18%, ${theme.border} 82%, transparent)`,
            }}
          />

          {/* ─── RIGHT: Prayer content ─── */}
          <motion.section
            className="
              flex flex-1 flex-col
              px-4 pb-6 pt-2
              lg:items-center lg:justify-center lg:overflow-y-auto lg:px-12 lg:pr-16 lg:py-8
            "
            aria-live="polite"
            onPanEnd={(_e, info: PanInfo) => {
              const dx = info.offset.x
              const dy = info.offset.y
              if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return
              if (dx < 0) {
                haptic.pulse('medium')
                advanceWithHaptic()
              } else if (!isFirst) {
                haptic.pulse('medium')
                back()
              }
            }}
            style={{ touchAction: 'pan-y' }}
          >
            <div className="w-full max-w-2xl">
              {/* Intention pill */}
              {activeIntention && (
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="mx-auto mb-5 flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] transition active:scale-[0.97]"
                  style={{
                    border: `1px solid ${theme.borderStrong}`,
                    background: theme.cardBg,
                    color: theme.accentLight,
                  }}
                >
                  <span aria-hidden>✦</span>
                  <span className="truncate" style={{ maxWidth: '16rem' }}>
                    {activeIntention.titulo}
                  </span>
                </button>
              )}

              {/* Cross-fade content as the step changes */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={stageKey}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Mystery title block (during decade Hail Marys / Pai Nosso) */}
                  {mystery && !isMysteryAnnounce && (
                    <div className="mb-5">
                      <h2
                        className="text-xl leading-snug md:text-2xl lg:text-3xl"
                        style={{
                          color: theme.textPrimary,
                          fontFamily: 'var(--font-display)',
                          letterSpacing: '0.01em',
                        }}
                      >
                        {mysteryDisplayTitle}
                      </h2>
                      <p
                        className="mt-1 text-xs italic md:text-sm"
                        style={{ color: theme.textMuted }}
                      >
                        {isLatin ? 'Fructus' : 'Fruto'}: {mysteryDisplayFruit}
                      </p>
                    </div>
                  )}

                  {/* Prayer / Reflection content */}
                  {isMysteryAnnounce && mystery ? (
                    <article>
                      <h3
                        className="mb-3 text-xl md:text-2xl lg:text-3xl"
                        style={{
                          color: theme.accentLight,
                          fontFamily: 'var(--font-display)',
                          letterSpacing: '0.02em',
                        }}
                      >
                        {mysteryDisplayTitle}
                      </h3>
                      <p
                        className="text-lg italic leading-[1.65] md:text-xl lg:text-[1.55rem] lg:leading-[1.55]"
                        style={{
                          color: theme.textPrimary,
                          fontFamily: 'var(--font-elegant)',
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {mysteryDisplayReflection}
                      </p>
                      <p
                        className="mt-5 text-[10px] uppercase tracking-[0.3em] md:text-[11px]"
                        style={{ color: theme.textMuted, fontFamily: 'var(--font-display)' }}
                      >
                        {isLatin ? '✦   Contemplate in silentio   ✦' : '✦   Contemple em silêncio   ✦'}
                      </p>
                    </article>
                  ) : prayer ? (
                    <article>
                      <h3
                        className="mb-3 text-lg md:text-xl lg:text-2xl"
                        style={{
                          color: theme.accentLight,
                          fontFamily: 'var(--font-display)',
                          fontWeight: 500,
                          letterSpacing: '0.04em',
                        }}
                      >
                        {prayerDisplayName}
                      </h3>
                      <p
                        className="text-lg leading-[1.7] md:text-xl lg:text-[1.55rem] lg:leading-[1.6]"
                        style={{
                          color: theme.textPrimary,
                          whiteSpace: 'pre-line',
                          fontFamily: 'var(--font-elegant)',
                        }}
                      >
                        {prayerDisplayText}
                      </p>
                    </article>
                  ) : (
                    <p className="text-base" style={{ color: theme.textPrimary }}>
                      {stepLabels[currentStep.type] ?? currentStep.type}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Ave Maria dots */}
              {showAveCounter && currentStep.decadePosition !== undefined && (
                <AveMariaDots
                  current={currentStep.decadePosition}
                  accent={theme.accent}
                  accentLight={theme.accentLight}
                  muted={theme.border}
                />
              )}
            </div>
          </motion.section>
        </div>
      </main>

      {/* ── Rosário transition screen ── */}
      {showTransition && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: `color-mix(in srgb, ${theme.pageBg} 95%, transparent)` }}
        >
          <div className="max-w-md px-6 text-center">
            <div className="mb-4 text-4xl" aria-hidden>✦</div>
            <h2
              className="mb-2 text-xl md:text-2xl"
              style={{ color: theme.accentLight, fontFamily: 'var(--font-display)' }}
            >
              Mistérios {mysteryShortNamePt} concluídos
            </h2>
            <p className="mb-1 text-sm" style={{ color: theme.textSecondary }}>
              Terço {rosarioIndex + 1} de 4
            </p>
            <p className="mb-6 text-xs" style={{ color: theme.textMuted }}>
              Próximo: Mistérios {ROSARY_SEQUENCE[rosarioIndex + 1]
                ? MYSTERY_GROUPS.find(g => g.id === ROSARY_SEQUENCE[rosarioIndex + 1])?.name.replace('Mistérios ', '') ?? ''
                : ''}
            </p>
            <button
              type="button"
              onClick={advanceToNextRosarioSet}
              className="rounded-xl px-8 py-3 text-sm font-semibold transition active:scale-[0.97]"
              style={{
                background: `linear-gradient(180deg, ${theme.buttonGradient[0]}, ${theme.buttonGradient[1]})`,
                color: theme.buttonText,
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
          className="relative z-20 flex flex-shrink-0 items-center gap-3 px-4 safe-bottom md:px-8 lg:px-16"
          style={{
            height: '80px',
            borderTop: `1px solid ${theme.border}`,
            background: `color-mix(in srgb, ${theme.pageBg} 92%, transparent)`,
            backdropFilter: 'blur(14px)',
          }}
        >
          <button
            type="button"
            onClick={back}
            disabled={isFirst}
            className="flex h-12 w-12 items-center justify-center rounded-xl border transition active:scale-95 disabled:opacity-25 lg:h-14 lg:w-14"
            style={{
              borderColor: theme.borderStrong,
              color: theme.accentLight,
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
            className="h-12 flex-1 rounded-xl text-sm font-semibold transition active:scale-[0.97] lg:h-14 lg:max-w-md lg:mx-auto lg:text-base"
            style={{
              background: `linear-gradient(180deg, ${theme.buttonGradient[0]}, ${theme.buttonGradient[1]})`,
              color: theme.buttonText,
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              boxShadow: `0 4px 24px -8px ${theme.accent}50, 0 0 0 1px ${theme.border}`,
            }}
          >
            {isLatin ? 'Procedamus' : 'Avançar'}
          </button>

          <div className="hidden w-14 lg:flex" aria-hidden />
        </div>
      ) : !showTransition ? (
        /* ── Completion screen ── */
        <div
          className="relative z-20 flex-shrink-0 px-4 py-8 text-center safe-bottom md:px-8 lg:py-12"
          style={{
            borderTop: `1px solid ${theme.borderStrong}`,
            background: `color-mix(in srgb, ${theme.pageBg} 95%, transparent)`,
          }}
        >
          <div className="mb-3 text-3xl md:text-4xl" aria-hidden>✦</div>
          <h2
            className="mb-1 text-xl md:text-2xl"
            style={{ color: theme.accentLight, fontFamily: 'var(--font-display)' }}
          >
            {rosarioFullyComplete ? 'Rosário completo' : 'Terço completo'}
          </h2>
          <p className="mb-5 text-xs md:text-sm" style={{ color: theme.textMuted }}>
            Que Nossa Senhora interceda por você
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                reset()
                setResumedFrom(null)
              }}
              className="rounded-xl px-6 py-3 text-sm font-semibold transition active:scale-[0.97]"
              style={{
                background: `linear-gradient(180deg, ${theme.buttonGradient[0]}, ${theme.buttonGradient[1]})`,
                color: theme.buttonText,
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Rezar novamente
            </button>
            {onExit ? (
              <button
                type="button"
                onClick={onExit}
                className="rounded-xl border px-6 py-3 text-sm transition"
                style={{
                  borderColor: theme.borderStrong,
                  color: theme.accentLight,
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Voltar
              </button>
            ) : (
              <Link
                href="/orar"
                className="rounded-xl border px-6 py-3 text-sm transition"
                style={{
                  borderColor: theme.borderStrong,
                  color: theme.accentLight,
                  textDecoration: 'none',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
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
        mysteryLocked={fullRosary || usingThematic}
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
        theme={theme}
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

/**
 * Ten small pips that light up as each Ave Maria of the decade is said.
 * Helps the user keep their place when they accidentally advance twice
 * or lose focus — they can glance at the dots and know "we're on the 4th."
 */
function AveMariaDots({
  current,
  accent,
  accentLight,
  muted,
}: {
  current: number
  accent: string
  accentLight: string
  muted: string
}) {
  const total = 10
  return (
    <div
      className="mt-6 flex items-center justify-center gap-1.5 lg:mt-8 lg:gap-2"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={`Ave Maria ${current} de ${total}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1
        const filled = n <= current
        const isCurrent = n === current
        return (
          <span
            key={n}
            aria-hidden
            className="rounded-full transition-all duration-300"
            style={{
              width: isCurrent ? 12 : 8,
              height: isCurrent ? 12 : 8,
              background: filled ? (isCurrent ? accentLight : accent) : 'transparent',
              border: `1px solid ${filled ? accentLight : muted}`,
              boxShadow: isCurrent ? `0 0 10px ${accentLight}80` : 'none',
            }}
          />
        )
      })}
    </div>
  )
}
