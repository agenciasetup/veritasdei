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
import { getRosaryTheme, type RosaryLanguage } from '@/features/rosario/data/theme'

/**
 * `<RosarySession />` — orquestrador completo de uma sessão de terço.
 *
 * Dois modos visuais:
 *   - `pt` (padrão) — paleta dourada sobre preto profundo.
 *   - `la` — paleta vinho/rosa para o rito em latim. Toggle fica na topbar.
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
  onExit?: () => void
}

const ROSARY_SEQUENCE: MysterySet[] = ['gozosos', 'luminosos', 'dolorosos', 'gloriosos']

export function RosarySession({ fullRosary = false, onExit }: RosarySessionProps) {
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
  const theme = useMemo(() => getRosaryTheme(language), [language])
  const isLatin = language === 'la'

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

  // --- Derive prayer info for compact card ---
  const prayer = getPrayerById(currentStep.prayerId)
  const mystery =
    currentStep.decade !== undefined ? mysteryGroup.mysteries[currentStep.decade - 1] : null
  const isMysteryAnnounce = currentStep.type === 'mystery_announce'
  const showAveCounter =
    currentStep.type === 'hail_mary' && currentStep.decadePosition !== undefined

  // Language-resolved text bits
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

  // Phase label for display
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

  // Mystery name for header
  const mysteryShortNamePt = mysteryGroup.name.replace('Mistérios ', '')
  const mysteryShortName =
    isLatin && mysteryGroup.latinName
      ? mysteryGroup.latinName.replace('Mysteria ', '')
      : mysteryShortNamePt
  const headerTitle = fullRosary
    ? `${mysteryShortName} (${rosarioIndex + 1}/4)`
    : mysteryShortName

  const stepLabels = isLatin ? STEP_LABELS_LA : STEP_LABELS_PT

  return (
    <div
      className="fixed inset-0 flex flex-col md:static md:inset-auto md:mx-auto md:my-6 md:max-w-4xl md:min-h-[calc(100vh-7rem)] md:rounded-2xl md:border md:overflow-hidden"
      style={{
        backgroundColor: theme.pageBg,
        color: theme.textPrimary,
        borderColor: theme.border,
        transition: 'background-color 280ms ease, color 280ms ease, border-color 280ms ease',
      }}
    >
      {/* ── Top bar ── */}
      <header
        className="flex-shrink-0 flex items-center justify-between gap-2 px-3 safe-top"
        style={{
          height: '52px',
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        {onExit ? (
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 text-xs transition"
            style={{ color: theme.textMuted, background: 'none', border: 'none' }}
            aria-label="Voltar"
          >
            <span aria-hidden>←</span>
            <span className="hidden sm:inline">Voltar</span>
          </button>
        ) : (
          <Link
            href="/orar"
            className="flex items-center gap-1.5 text-xs transition"
            style={{ color: theme.textMuted, textDecoration: 'none' }}
            aria-label="Voltar para Orar"
          >
            <span aria-hidden>←</span>
            <span className="hidden sm:inline">Orar</span>
          </Link>
        )}

        <div className="text-center min-w-0 flex-1">
          <h1
            className="text-sm font-medium truncate"
            style={{ color: theme.textPrimary, fontFamily: 'var(--font-display)' }}
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
          {/* Latin toggle — rendered as chiseled text, gray off / accent on */}
          <button
            type="button"
            onClick={() => setLanguage(isLatin ? 'pt' : 'la')}
            className="flex items-center justify-center h-9 px-3 rounded-full transition active:scale-95"
            style={{
              background: isLatin
                ? 'linear-gradient(180deg, rgba(234,184,192,0.14), rgba(201,117,132,0.08))'
                : 'var(--surface-inset)',
              border: `1px solid ${isLatin ? theme.borderStrong : 'var(--border-1)'}`,
              color: isLatin ? theme.accentLight : 'var(--text-3)',
              fontFamily: 'var(--font-display)',
              fontSize: '10px',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              fontWeight: 600,
              textShadow: isLatin
                ? `0 0 10px color-mix(in srgb, ${theme.accentLight} 33%, transparent)`
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
            className="flex items-center justify-center w-9 h-9 rounded-full transition active:scale-95"
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
          className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-2"
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
            className="text-[11px] uppercase tracking-wider px-2 py-1 rounded transition"
            style={{ color: theme.accentLight, border: `1px solid ${theme.borderStrong}` }}
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
              border: `1px solid ${theme.borderStrong}`,
              background: theme.cardBg,
              color: theme.accentLight,
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
              className="w-full max-w-[340px] md:max-w-[380px] h-auto"
              ariaDescription={`Terço — passo ${currentIndex + 1} de ${totalSteps}`}
              theme={theme}
            />
          </div>

          {/* Compact progress */}
          <div className="mb-2 md:w-full md:max-w-[380px]" aria-hidden>
            <div
              className="h-0.5 w-full overflow-hidden rounded-full"
              style={{ background: theme.border }}
            >
              <div
                className="h-full transition-all duration-500 ease-out"
                style={{
                  width: `${progressPct}%`,
                  background: `linear-gradient(90deg, ${theme.accent}, ${theme.accentLight})`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Right column on desktop: prayer card */}
        <motion.section
          className="flex-shrink-0 rounded-xl p-4 md:flex-1 md:p-6"
          style={{
            background: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
            touchAction: 'pan-y',
            transition: 'background-color 280ms ease, border-color 280ms ease',
          }}
          aria-live="polite"
          onPanEnd={(_e, info: PanInfo) => {
            const dx = info.offset.x
            const dy = info.offset.y
            // ignora pans verticais (scroll) e quase-zero
            if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return
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
              style={{ color: theme.textMuted }}
            >
              {getPhaseLabel()}
            </span>
            {showAveCounter && (
              <span
                className="font-mono text-[11px] uppercase tracking-wider"
                style={{ color: theme.accentLight }}
              >
                {currentStep.decadePosition}/10
              </span>
            )}
          </div>

          {/* Mystery info (during decades) */}
          {mystery && !isMysteryAnnounce && (
            <div className="mb-3">
              <h2
                className="text-base leading-snug md:text-lg"
                style={{ color: theme.textPrimary, fontFamily: 'var(--font-display)' }}
              >
                {mysteryDisplayTitle}
              </h2>
              <p
                className="text-[11px] italic mt-0.5"
                style={{ color: theme.textMuted }}
              >
                {isLatin ? 'Fructus' : 'Fruto'}: {mysteryDisplayFruit}
              </p>
            </div>
          )}

          {/* Prayer content */}
          {isMysteryAnnounce && mystery ? (
            <div>
              <h3
                className="text-base mb-2 md:text-lg"
                style={{ color: theme.accentLight, fontFamily: 'var(--font-display)' }}
              >
                {mysteryDisplayTitle}
              </h3>
              <p
                className="text-base italic leading-relaxed md:text-lg"
                style={{
                  color: theme.textPrimary,
                  fontFamily: 'var(--font-cormorant, serif)',
                  whiteSpace: 'pre-line',
                }}
              >
                {mysteryDisplayReflection}
              </p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.15em]" style={{ color: theme.textMuted }}>
                {isLatin ? 'Contemplate in silentio' : 'Contemple em silêncio'}
              </p>
            </div>
          ) : prayer ? (
            <div>
              <h3
                className="text-base mb-2 md:text-lg"
                style={{ color: theme.accentLight, fontFamily: 'var(--font-display)', fontWeight: 500 }}
              >
                {prayerDisplayName}
              </h3>
              <p
                className="text-base leading-[1.7] md:text-lg"
                style={{
                  color: theme.textPrimary,
                  whiteSpace: 'pre-line',
                  fontFamily: 'var(--font-cormorant, serif)',
                }}
              >
                {prayerDisplayText}
              </p>
            </div>
          ) : (
            <p className="text-base" style={{ color: theme.textPrimary }}>
              {stepLabels[currentStep.type] ?? currentStep.type}
            </p>
          )}

          {/* Ave Maria progress dots — one per recited Ave in the decade */}
          {showAveCounter && currentStep.decadePosition !== undefined && (
            <AveMariaDots
              current={currentStep.decadePosition}
              accent={theme.accent}
              accentLight={theme.accentLight}
              muted={theme.border}
            />
          )}
        </motion.section>
      </div>

      {/* ── Rosário transition screen ── */}
      {showTransition && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: `color-mix(in srgb, ${theme.pageBg} 95%, transparent)` }}
        >
          <div className="text-center px-6 max-w-md">
            <div className="text-4xl mb-4" aria-hidden>✦</div>
            <h2
              className="text-xl mb-2"
              style={{ color: theme.accentLight, fontFamily: 'var(--font-display)' }}
            >
              Mistérios {mysteryShortNamePt} concluídos
            </h2>
            <p className="text-sm mb-1" style={{ color: theme.textSecondary }}>
              Terço {rosarioIndex + 1} de 4
            </p>
            <p className="text-xs mb-6" style={{ color: theme.textMuted }}>
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
          className="flex-shrink-0 flex items-center gap-3 px-4 safe-bottom md:px-8 md:rounded-b-2xl"
          style={{
            height: '72px',
            borderTop: `1px solid ${theme.border}`,
            background: `color-mix(in srgb, ${theme.pageBg} 95%, transparent)`,
            backdropFilter: 'blur(12px)',
          }}
        >
          <button
            type="button"
            onClick={back}
            disabled={isFirst}
            className="flex items-center justify-center w-12 h-12 rounded-xl border transition disabled:opacity-25 active:scale-95"
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
            className="flex-1 h-12 rounded-xl text-sm font-semibold transition active:scale-[0.97]"
            style={{
              background: `linear-gradient(180deg, ${theme.buttonGradient[0]}, ${theme.buttonGradient[1]})`,
              color: theme.buttonText,
            }}
          >
            {isLatin ? 'Procedamus' : 'Avançar'}
          </button>

          <div className="w-12 flex items-center justify-center">
            <span
              className="font-mono text-[10px]"
              style={{ color: theme.textMuted }}
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
            borderTop: `1px solid ${theme.borderStrong}`,
            background: `color-mix(in srgb, ${theme.pageBg} 95%, transparent)`,
          }}
        >
          <div className="text-3xl mb-2" aria-hidden>✦</div>
          <h2
            className="text-xl mb-1"
            style={{ color: theme.accentLight, fontFamily: 'var(--font-display)' }}
          >
            {rosarioFullyComplete ? 'Rosário completo' : 'Terço completo'}
          </h2>
          <p className="text-xs mb-4" style={{ color: theme.textMuted }}>
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
                background: `linear-gradient(180deg, ${theme.buttonGradient[0]}, ${theme.buttonGradient[1]})`,
                color: theme.buttonText,
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
                  borderColor: theme.borderStrong,
                  color: theme.accentLight,
                }}
              >
                Voltar
              </button>
            ) : (
              <Link
                href="/orar"
                className="rounded-xl border px-5 py-2.5 text-sm transition"
                style={{
                  borderColor: theme.borderStrong,
                  color: theme.accentLight,
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
      className="mt-4 flex items-center justify-center gap-1.5"
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
              boxShadow: isCurrent ? `0 0 8px ${accentLight}80` : 'none',
            }}
          />
        )
      })}
    </div>
  )
}
