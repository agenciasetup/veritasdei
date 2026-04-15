/**
 * Verifies geometric invariants of the rosary SVG layout.
 * Run with: `npx tsx scripts/verify-rosary-layout.ts`
 *
 * Exits with code 1 on the first failing assertion.
 */

import {
  computeRosaryLayout,
  LAYOUT_CONSTANTS,
  describeBead,
} from '../src/features/rosario/components/rosaryBeadsLayout'
import { PHYSICAL_BEADS, type BeadId } from '../src/features/rosario/data/beadSequence'

let failures = 0
function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    failures++
    console.error(`  ✗ ${msg}`)
  } else {
    console.log(`  ✓ ${msg}`)
  }
}
function section(title: string) {
  console.log(`\n${title}`)
}

const layout = computeRosaryLayout()
const C = LAYOUT_CONSTANTS

// ---------- Completeness ----------
section('Completeness')
assert(layout.length === 60, `Layout returns 60 beads (got ${layout.length})`)

const idsInLayout = new Set(layout.map((b) => b.id))
assert(idsInLayout.size === 60, 'All 60 bead ids are unique')

const missing: BeadId[] = PHYSICAL_BEADS.filter((id) => !idsInLayout.has(id))
assert(
  missing.length === 0,
  `Every PHYSICAL_BEAD has a layout entry (missing: ${missing.join(', ') || 'none'})`,
)

const extra: BeadId[] = [...idsInLayout].filter((id) => !PHYSICAL_BEADS.includes(id))
assert(
  extra.length === 0,
  `No layout entries outside PHYSICAL_BEADS (extra: ${extra.join(', ') || 'none'})`,
)

// ---------- Bounds ----------
section('Coordinates within viewBox')
const pad = 2
let outOfBounds = 0
for (const b of layout) {
  const ok =
    b.cx - b.r >= -pad &&
    b.cx + b.r <= C.viewBoxWidth + pad &&
    b.cy - b.r >= -pad &&
    b.cy + b.r <= C.viewBoxHeight + pad
  if (!ok) {
    outOfBounds++
    failures++
    console.error(`  ✗ ${b.id} out of bounds: (${b.cx.toFixed(1)}, ${b.cy.toFixed(1)}) r=${b.r}`)
  }
}
if (outOfBounds === 0) {
  console.log(`  ✓ All 60 beads fit within ${C.viewBoxWidth}×${C.viewBoxHeight} viewBox`)
}

// ---------- Overlaps ----------
section('No overlaps (with 5% breathing room)')
let overlapFailures = 0
let minDist = Infinity
let minPair: [BeadId, BeadId] = ['crucifix', 'crucifix']
for (let i = 0; i < layout.length; i++) {
  for (let j = i + 1; j < layout.length; j++) {
    const a = layout[i]
    const b = layout[j]
    const dist = Math.hypot(a.cx - b.cx, a.cy - b.cy)
    const minSep = (a.r + b.r) * 1.05
    if (dist < minSep) {
      overlapFailures++
      failures++
      console.error(
        `  ✗ ${a.id} (r=${a.r}) ↔ ${b.id} (r=${b.r}) dist=${dist.toFixed(2)} < ${minSep.toFixed(2)}`,
      )
    }
    if (dist < minDist) {
      minDist = dist
      minPair = [a.id, b.id]
    }
  }
}
if (overlapFailures === 0) {
  console.log(
    `  ✓ No bead pair overlaps (closest pair: ${minPair[0]} ↔ ${minPair[1]} = ${minDist.toFixed(2)}u)`,
  )
}

// ---------- Loop shape ----------
section('Loop geometry')
const loopBeads = layout.filter((b) => /^decade-/.test(b.id))
assert(loopBeads.length === 55, `Loop holds 55 beads (got ${loopBeads.length})`)

let maxRadialErr = 0
for (const b of loopBeads) {
  const d = Math.hypot(b.cx - C.loopCenterX, b.cy - C.loopCenterY)
  const err = Math.abs(d - C.loopRadius)
  if (err > maxRadialErr) maxRadialErr = err
}
assert(
  maxRadialErr < 1e-6,
  `All 55 loop beads lie on the circle (max radial error: ${maxRadialErr.toExponential(2)})`,
)

// Consecutive beads in canonical PHYSICAL_BEADS order should be equidistant
// around the ring, including wrap-around.
const loopOrder = PHYSICAL_BEADS.filter((id) => /^decade-/.test(id))
const byId = new Map(layout.map((b) => [b.id, b]))
const expectedStep = 2 * C.loopRadius * Math.sin(Math.PI / loopOrder.length)
let maxStepErr = 0
for (let i = 0; i < loopOrder.length; i++) {
  const a = byId.get(loopOrder[i])!
  const b = byId.get(loopOrder[(i + 1) % loopOrder.length])!
  const d = Math.hypot(a.cx - b.cx, a.cy - b.cy)
  const err = Math.abs(d - expectedStep)
  if (err > maxStepErr) maxStepErr = err
}
assert(
  maxStepErr < 1e-6,
  `Consecutive loop beads equidistant at ${expectedStep.toFixed(2)}u (max err ${maxStepErr.toExponential(2)})`,
)

// ---------- Pendant shape ----------
section('Pendant geometry')
const pendant = layout.filter((b) => /^intro-|^crucifix$/.test(b.id))
assert(pendant.length === 5, `Pendant holds 5 elements (got ${pendant.length})`)
assert(
  pendant.every((b) => Math.abs(b.cx - C.loopCenterX) < 1e-6),
  'All pendant beads are centred horizontally on the cord',
)
// Monotonically increasing y going down the pendant.
const pendantOrder: BeadId[] = [
  'intro-hail-mary-3',
  'intro-hail-mary-2',
  'intro-hail-mary-1',
  'intro-our-father',
  'crucifix',
]
const pendantYs = pendantOrder.map((id) => byId.get(id)!.cy)
let strictlyIncreasing = true
for (let i = 1; i < pendantYs.length; i++) {
  if (pendantYs[i] <= pendantYs[i - 1]) strictlyIncreasing = false
}
assert(strictlyIncreasing, 'Pendant beads are stacked top-to-bottom in canonical order')

// Crucifix sits below the loop.
const crucifix = byId.get('crucifix')!
assert(
  crucifix.cy > C.loopCenterY + C.loopRadius,
  'Crucifix sits below the loop junction',
)

// ---------- Bead kind accuracy ----------
section('Bead kinds')
const ourFathers = layout.filter((b) => b.kind === 'large')
const hailMarys = layout.filter((b) => b.kind === 'small')
const crucifixes = layout.filter((b) => b.kind === 'crucifix')
assert(ourFathers.length === 6, `6 large (Our Father) beads — 1 intro + 5 decade (got ${ourFathers.length})`)
assert(hailMarys.length === 53, `53 small (Hail Mary) beads — 3 intro + 50 decade (got ${hailMarys.length})`)
assert(crucifixes.length === 1, `1 crucifix (got ${crucifixes.length})`)

// ---------- describeBead sanity ----------
section('Accessibility labels')
const sampleIds: BeadId[] = [
  'crucifix',
  'intro-our-father',
  'intro-hail-mary-2',
  'decade-3-our-father',
  'decade-5-hail-mary-10',
]
for (const id of sampleIds) {
  const label = describeBead(id)
  assert(label.length > 0 && label !== id, `describeBead("${id}") → "${label}"`)
}

// ---------- summary ----------
console.log('')
if (failures > 0) {
  console.error(`FAILED: ${failures} assertion(s) did not pass.`)
  process.exit(1)
}
console.log(`OK — layout invariants hold for ${layout.length} beads.`)
