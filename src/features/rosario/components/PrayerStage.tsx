'use client'

import type { RosaryStep } from '@/features/rosario/data/beadSequence'
import type { MysteryGroup } from '@/features/rosario/data/types'
import { getPrayerById } from '@/features/rosario/data/prayerMap'

/**
 * Renders the "prayer stage" for the current rosary step:
 *   - Phase label (intro / Xº mistério / conclusão)
 *   - Mystery title + fruit + scripture (only during decades)
 *   - Prayer name + text (or meditative pause for `mystery_announce`)
 *   - Ave Maria counter (1/10) inside a decade
 *
 * Pure presentation — navigation lives in the parent (useRosaryProgress).
 */

const ORDINALS: Record<number, string> = {
  1: '1º',
  2: '2º',
  3: '3º',
  4: '4º',
  5: '5º',
}

/** "Dolorosos" → "Doloroso", etc. Used for "2º Mistério Doloroso". */
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
  mystery_announce: 'Anúncio do mistério',
  hail_holy_queen: 'Salve Rainha',
  final_prayer: 'Oração final',
}

export interface PrayerStageProps {
  step: RosaryStep
  mysteryGroup: MysteryGroup
  isCompleted: boolean
  onAdvance: () => void
}

export function PrayerStage({ step, mysteryGroup, isCompleted, onAdvance }: PrayerStageProps) {
  const prayer = getPrayerById(step.prayerId)
  const mystery =
    step.decade !== undefined ? mysteryGroup.mysteries[step.decade - 1] : null

  const phaseLabel = getPhaseLabel(step, mysteryGroup)
  const isMysteryAnnounce = step.type === 'mystery_announce'
  const showAveCounter =
    step.type === 'hail_mary' && step.decadePosition !== undefined

  return (
    <section
      className="rounded-2xl border p-5 md:p-6"
      style={{
        borderColor: 'rgba(201, 168, 76, 0.22)',
        backgroundColor: 'rgba(20, 18, 14, 0.6)',
      }}
      aria-live="polite"
    >
      <div
        className="text-[10px] uppercase tracking-[0.25em]"
        style={{ color: '#7A7368' }}
      >
        {phaseLabel}
      </div>

      {mystery && (
        <header className="mt-2">
          <h2
            className="font-serif text-lg leading-snug md:text-xl"
            style={{ color: '#F2EDE4' }}
          >
            {mystery.title}
          </h2>
          <p
            className="mt-1 text-xs italic"
            style={{ color: '#7A7368', fontFamily: 'var(--font-cormorant, serif)' }}
          >
            Fruto: {mystery.fruit} · {mystery.scripture}
          </p>
        </header>
      )}

      <div className="mt-4">
        {isMysteryAnnounce && mystery ? (
          <MysteryReflection reflection={mystery.reflection} />
        ) : prayer ? (
          <PrayerBlock
            name={prayer.name}
            latinName={prayer.latinName}
            text={prayer.text}
            fallbackLabel={STEP_LABELS[step.type] ?? step.type}
          />
        ) : (
          <p className="text-sm" style={{ color: '#F2EDE4' }}>
            {STEP_LABELS[step.type] ?? step.type}
          </p>
        )}
      </div>

      {showAveCounter && (
        <div
          className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em]"
          style={{ color: '#D9C077' }}
          aria-label={`Ave Maria ${step.decadePosition} de 10`}
        >
          Ave Maria {step.decadePosition} / 10
        </div>
      )}

      <div className="mt-5">
        <button
          type="button"
          onClick={onAdvance}
          disabled={isCompleted}
          className="w-full rounded-lg px-4 py-3 text-sm font-semibold transition disabled:opacity-30"
          style={{
            backgroundColor: '#C9A84C',
            color: '#0F0E0C',
          }}
        >
          {isCompleted ? 'Terço completo ✦' : 'Avançar'}
        </button>
      </div>
    </section>
  )
}

function PrayerBlock({
  name,
  latinName,
  text,
  fallbackLabel,
}: {
  name: string
  latinName?: string
  text: string
  fallbackLabel: string
}) {
  return (
    <>
      <div className="flex items-baseline gap-2">
        <h3
          className="font-serif text-base"
          style={{ color: '#D9C077' }}
        >
          {name || fallbackLabel}
        </h3>
        {latinName && (
          <span
            className="text-[10px] uppercase tracking-[0.2em]"
            style={{ color: '#7A7368' }}
          >
            {latinName}
          </span>
        )}
      </div>
      <p
        className="mt-2 text-base leading-[1.7]"
        style={{
          color: '#F2EDE4',
          whiteSpace: 'pre-line',
          fontFamily: 'var(--font-cormorant, serif)',
        }}
      >
        {text}
      </p>
    </>
  )
}

function MysteryReflection({ reflection }: { reflection: string }) {
  return (
    <>
      <h3
        className="font-serif text-base"
        style={{ color: '#D9C077' }}
      >
        Meditação
      </h3>
      <p
        className="mt-2 text-sm italic leading-relaxed"
        style={{ color: '#F2EDE4', fontFamily: 'var(--font-cormorant, serif)' }}
      >
        {reflection}
      </p>
      <p
        className="mt-3 text-[11px] uppercase tracking-[0.2em]"
        style={{ color: '#7A7368' }}
      >
        Contemple em silêncio antes de avançar
      </p>
    </>
  )
}

function getPhaseLabel(step: RosaryStep, mysteryGroup: MysteryGroup): string {
  if (step.phase === 'intro') return 'Introdução'
  if (step.phase === 'outro') return 'Conclusão'
  if (step.decade) {
    const ord = ORDINALS[step.decade] ?? `${step.decade}º`
    const singular = MYSTERY_SINGULAR[mysteryGroup.id] ?? 'Mistério'
    return `${ord} Mistério ${singular}`
  }
  return 'Mistério'
}
