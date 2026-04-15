/**
 * Canonical sequence of steps and physical beads for a full 5-decade Rosary.
 *
 * Two related concepts live here:
 *
 * 1. `RosaryStep` — one prayer action the user takes in order. Some steps
 *    correspond to a visible bead (`beadId != null`) and some are transitional
 *    prayers between beads (Glória, Oração de Fátima, Salve Rainha, etc.)
 *    that don't advance the physical counter.
 *
 * 2. `BeadId` / `PHYSICAL_BEADS` — the 60 visible beads rendered in the SVG
 *    rosary. Each bead can be highlighted when any of its associated steps
 *    is the current step.
 *
 * Total: 80 steps, 60 physical beads.
 *
 * The step list is agnostic to which mystery set (gozosos / luminosos /
 * dolorosos / gloriosos) is being prayed. Consumers resolve the concrete
 * mystery via `step.decade` against the active `MysteryGroup`.
 */

export type StepType =
  | 'sign_of_cross'
  | 'creed'
  | 'our_father'
  | 'hail_mary'
  | 'glory'
  | 'fatima'
  | 'mystery_announce'
  | 'hail_holy_queen'
  | 'final_prayer'

export type DecadeNumber = 1 | 2 | 3 | 4 | 5

export type BeadId =
  | 'crucifix'
  | 'intro-our-father'
  | `intro-hail-mary-${1 | 2 | 3}`
  | `decade-${DecadeNumber}-our-father`
  | `decade-${DecadeNumber}-hail-mary-${number}`

export type RosaryPhase = 'intro' | 'decade' | 'outro'

export interface RosaryStep {
  /** Zero-based index into `ROSARY_STEPS`. */
  readonly index: number
  readonly type: StepType
  /** Visual bead highlighted while this step is current. `null` for transitional prayers. */
  readonly beadId: BeadId | null
  readonly phase: RosaryPhase
  /** 1..5 — set on every step inside a decade (including the mystery announce). */
  readonly decade?: DecadeNumber
  /** 1..10 — only set on `hail_mary` steps inside a decade. */
  readonly decadePosition?: number
  /**
   * Reference to a Prayer.id from `prayers.ts`.
   * `null` for `mystery_announce`, which is a meditative pause, not a prayer text.
   */
  readonly prayerId: string | null
}

/** Prayer ids — keep in sync with `prayers.ts`. */
export const PRAYER_IDS = {
  sign_of_cross: 'sinal-da-cruz',
  creed: 'credo',
  our_father: 'pai-nosso',
  hail_mary: 'ave-maria',
  glory: 'gloria',
  fatima: 'oracao-fatima',
  hail_holy_queen: 'salve-rainha',
  final_prayer: 'oracao-final',
} as const

const DECADES: readonly DecadeNumber[] = [1, 2, 3, 4, 5] as const
const AVE_MARIAS_PER_DECADE = 10

function buildSteps(): RosaryStep[] {
  const steps: RosaryStep[] = []
  let i = 0
  const push = (step: Omit<RosaryStep, 'index'>) => {
    steps.push({ index: i++, ...step })
  }

  // ===== INTRO =====
  push({ type: 'sign_of_cross', beadId: 'crucifix', phase: 'intro', prayerId: PRAYER_IDS.sign_of_cross })
  push({ type: 'creed',         beadId: 'crucifix', phase: 'intro', prayerId: PRAYER_IDS.creed })
  push({ type: 'our_father',    beadId: 'intro-our-father', phase: 'intro', prayerId: PRAYER_IDS.our_father })
  for (const n of [1, 2, 3] as const) {
    push({
      type: 'hail_mary',
      beadId: `intro-hail-mary-${n}`,
      phase: 'intro',
      prayerId: PRAYER_IDS.hail_mary,
    })
  }
  push({ type: 'glory', beadId: null, phase: 'intro', prayerId: PRAYER_IDS.glory })

  // ===== 5 DECADES =====
  for (const d of DECADES) {
    push({
      type: 'mystery_announce',
      beadId: `decade-${d}-our-father`,
      phase: 'decade',
      decade: d,
      prayerId: null,
    })
    push({
      type: 'our_father',
      beadId: `decade-${d}-our-father`,
      phase: 'decade',
      decade: d,
      prayerId: PRAYER_IDS.our_father,
    })
    for (let p = 1; p <= AVE_MARIAS_PER_DECADE; p++) {
      push({
        type: 'hail_mary',
        beadId: `decade-${d}-hail-mary-${p}`,
        phase: 'decade',
        decade: d,
        decadePosition: p,
        prayerId: PRAYER_IDS.hail_mary,
      })
    }
    push({ type: 'glory',  beadId: null, phase: 'decade', decade: d, prayerId: PRAYER_IDS.glory })
    push({ type: 'fatima', beadId: null, phase: 'decade', decade: d, prayerId: PRAYER_IDS.fatima })
  }

  // ===== OUTRO =====
  push({ type: 'hail_holy_queen', beadId: null,       phase: 'outro', prayerId: PRAYER_IDS.hail_holy_queen })
  push({ type: 'final_prayer',    beadId: null,       phase: 'outro', prayerId: PRAYER_IDS.final_prayer })
  push({ type: 'sign_of_cross',   beadId: 'crucifix', phase: 'outro', prayerId: PRAYER_IDS.sign_of_cross })

  return steps
}

/** Canonical immutable step sequence. 80 entries. */
export const ROSARY_STEPS: readonly RosaryStep[] = Object.freeze(buildSteps())

/** All physical beads rendered in the SVG, in canonical visitation order. 60 entries. */
export const PHYSICAL_BEADS: readonly BeadId[] = Object.freeze([
  'crucifix',
  'intro-our-father',
  'intro-hail-mary-1',
  'intro-hail-mary-2',
  'intro-hail-mary-3',
  ...DECADES.flatMap((d) => [
    `decade-${d}-our-father` as BeadId,
    ...Array.from(
      { length: AVE_MARIAS_PER_DECADE },
      (_, k) => `decade-${d}-hail-mary-${k + 1}` as BeadId,
    ),
  ]),
])

/** Returns the first step whose `beadId` matches, or `undefined`. */
export function firstStepForBead(beadId: BeadId): RosaryStep | undefined {
  return ROSARY_STEPS.find((s) => s.beadId === beadId)
}

/** Returns all steps associated with a given physical bead (may be more than one). */
export function stepsForBead(beadId: BeadId): RosaryStep[] {
  return ROSARY_STEPS.filter((s) => s.beadId === beadId)
}
