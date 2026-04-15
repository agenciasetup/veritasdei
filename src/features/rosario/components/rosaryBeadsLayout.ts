/**
 * Pure SVG layout for the rosary beads.
 *
 * Anatomy:
 *  - A circular loop holding the 55 decade beads (5 × 11).
 *  - A pendant extending downward from the loop junction, holding the 4
 *    intro beads (1 Pai Nosso + 3 Ave Marias) and the crucifix at the bottom.
 *
 * This function is pure and deterministic — it contains no React code so it
 * can be reused by tests, verification scripts and the offline SVG renderer.
 */

import { type BeadId } from '@/features/rosario/data/beadSequence'

export type BeadKind = 'large' | 'small' | 'crucifix'

export interface BeadLayout {
  readonly id: BeadId
  readonly cx: number
  readonly cy: number
  readonly r: number
  readonly kind: BeadKind
}

export const LAYOUT_CONSTANTS = {
  viewBoxWidth: 480,
  viewBoxHeight: 660,
  loopCenterX: 240,
  loopCenterY: 240,
  loopRadius: 175,
  largeBeadRadius: 10,
  smallBeadRadius: 6.5,
  crucifixSize: 22,
  pendantGapFromLoop: 26,
  pendantSpacing: 28,
} as const

const LOOP_ORDER: readonly BeadId[] = ([1, 2, 3, 4, 5] as const).flatMap((d) => [
  `decade-${d}-our-father` as BeadId,
  ...Array.from({ length: 10 }, (_, k) => `decade-${d}-hail-mary-${k + 1}` as BeadId),
])

const PENDANT_ORDER: readonly BeadId[] = [
  'intro-hail-mary-3',
  'intro-hail-mary-2',
  'intro-hail-mary-1',
  'intro-our-father',
  'crucifix',
]

function isOurFather(id: BeadId): boolean {
  return id === 'intro-our-father' || /^decade-\d-our-father$/.test(id)
}

export function computeRosaryLayout(): BeadLayout[] {
  const C = LAYOUT_CONSTANTS
  const layouts: BeadLayout[] = []

  // ===== Loop =====
  // Bead i sits at the center of the i-th arc slice, so the junction gap at
  // the bottom equals the step between any two consecutive beads and the
  // whole ring is visually symmetric.
  const n = LOOP_ORDER.length
  for (let i = 0; i < n; i++) {
    const theta = Math.PI / 2 - (2 * Math.PI * (i + 0.5)) / n
    const cx = C.loopCenterX + C.loopRadius * Math.cos(theta)
    const cy = C.loopCenterY + C.loopRadius * Math.sin(theta)
    const id = LOOP_ORDER[i]
    const kind: BeadKind = isOurFather(id) ? 'large' : 'small'
    layouts.push({
      id,
      cx,
      cy,
      r: kind === 'large' ? C.largeBeadRadius : C.smallBeadRadius,
      kind,
    })
  }

  // ===== Pendant =====
  const junctionY = C.loopCenterY + C.loopRadius
  for (let i = 0; i < PENDANT_ORDER.length; i++) {
    const id = PENDANT_ORDER[i]
    const baseY = junctionY + C.pendantGapFromLoop + C.pendantSpacing * i
    if (id === 'crucifix') {
      layouts.push({
        id,
        cx: C.loopCenterX,
        cy: baseY + 10,
        r: C.crucifixSize,
        kind: 'crucifix',
      })
    } else {
      const kind: BeadKind = isOurFather(id) ? 'large' : 'small'
      layouts.push({
        id,
        cx: C.loopCenterX,
        cy: baseY,
        r: kind === 'large' ? C.largeBeadRadius : C.smallBeadRadius,
        kind,
      })
    }
  }

  return layouts
}

/** Human-readable Portuguese label for a bead, for accessibility tooling. */
export function describeBead(id: BeadId): string {
  if (id === 'crucifix') return 'Crucifixo'
  if (id === 'intro-our-father') return 'Pai Nosso inicial'
  if (id.startsWith('intro-hail-mary-')) {
    const n = id.slice('intro-hail-mary-'.length)
    return `${n}ª Ave Maria inicial`
  }
  const ofMatch = /^decade-(\d)-our-father$/.exec(id)
  if (ofMatch) return `Pai Nosso do ${ofMatch[1]}º mistério`
  const hmMatch = /^decade-(\d)-hail-mary-(\d+)$/.exec(id)
  if (hmMatch) return `${hmMatch[2]}ª Ave Maria do ${hmMatch[1]}º mistério`
  return id
}
