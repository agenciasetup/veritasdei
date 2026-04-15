/**
 * Verifies structural invariants of the canonical rosary step sequence.
 * Run with: `npx tsx scripts/verify-rosary-sequence.ts`
 *
 * Exits with code 1 on the first failing assertion so it can gate CI later.
 */

import {
  ROSARY_STEPS,
  PHYSICAL_BEADS,
  PRAYER_IDS,
  type BeadId,
  type RosaryStep,
} from '../src/features/rosario/data/beadSequence'
import * as prayersModule from '../src/features/rosario/data/prayers'
import type { Prayer } from '../src/features/rosario/data/types'

// ---------- tiny assert ----------
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

// ---------- collect prayer ids available in prayers.ts ----------
const availablePrayerIds = new Set<string>(
  Object.values(prayersModule)
    .filter((v): v is Prayer => typeof v === 'object' && v !== null && 'id' in v && 'text' in v)
    .map((p) => p.id),
)

// ---------- totals ----------
section('Totals')
assert(ROSARY_STEPS.length === 80, `ROSARY_STEPS has 80 entries (got ${ROSARY_STEPS.length})`)
assert(PHYSICAL_BEADS.length === 60, `PHYSICAL_BEADS has 60 entries (got ${PHYSICAL_BEADS.length})`)

// ---------- indices are 0..N-1 consecutive ----------
section('Indices')
const badIndex = ROSARY_STEPS.findIndex((s, i) => s.index !== i)
assert(badIndex === -1, `All step.index are consecutive 0..${ROSARY_STEPS.length - 1}`)

// ---------- phase counts ----------
section('Phase breakdown')
const introSteps = ROSARY_STEPS.filter((s) => s.phase === 'intro')
const decadeSteps = ROSARY_STEPS.filter((s) => s.phase === 'decade')
const outroSteps = ROSARY_STEPS.filter((s) => s.phase === 'outro')
assert(introSteps.length === 7, `Intro has 7 steps (got ${introSteps.length})`)
assert(decadeSteps.length === 70, `Decade phase has 70 steps (got ${decadeSteps.length})`)
assert(outroSteps.length === 3, `Outro has 3 steps (got ${outroSteps.length})`)

// ---------- intro composition ----------
section('Intro composition')
const introTypes = introSteps.map((s) => s.type)
assert(
  JSON.stringify(introTypes) ===
    JSON.stringify([
      'sign_of_cross',
      'creed',
      'our_father',
      'hail_mary',
      'hail_mary',
      'hail_mary',
      'glory',
    ]),
  'Intro steps are [sign_of_cross, creed, our_father, 3x hail_mary, glory]',
)

// ---------- decade composition ----------
section('Decades')
for (const d of [1, 2, 3, 4, 5] as const) {
  const dSteps = ROSARY_STEPS.filter((s) => s.decade === d && s.phase === 'decade')
  assert(dSteps.length === 14, `Decade ${d} has 14 steps`)
  const firstTwo = dSteps.slice(0, 2).map((s) => s.type)
  assert(
    firstTwo[0] === 'mystery_announce' && firstTwo[1] === 'our_father',
    `Decade ${d} begins with mystery_announce then our_father`,
  )
  const hails = dSteps.filter((s) => s.type === 'hail_mary')
  assert(hails.length === 10, `Decade ${d} has exactly 10 Ave Marias`)
  const positions = hails.map((s) => s.decadePosition)
  assert(
    JSON.stringify(positions) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
    `Decade ${d} hail_mary positions are 1..10 in order`,
  )
  const lastTwo = dSteps.slice(-2).map((s) => s.type)
  assert(
    lastTwo[0] === 'glory' && lastTwo[1] === 'fatima',
    `Decade ${d} ends with glory then fatima`,
  )
}

// ---------- outro composition ----------
section('Outro composition')
const outroTypes = outroSteps.map((s) => s.type)
assert(
  JSON.stringify(outroTypes) === JSON.stringify(['hail_holy_queen', 'final_prayer', 'sign_of_cross']),
  'Outro steps are [hail_holy_queen, final_prayer, sign_of_cross]',
)

// ---------- physical beads uniqueness ----------
section('Physical beads')
const beadSet = new Set(PHYSICAL_BEADS)
assert(beadSet.size === PHYSICAL_BEADS.length, 'PHYSICAL_BEADS has no duplicates')

const expectedBeads: BeadId[] = [
  'crucifix',
  'intro-our-father',
  'intro-hail-mary-1',
  'intro-hail-mary-2',
  'intro-hail-mary-3',
  ...([1, 2, 3, 4, 5] as const).flatMap((d) => [
    `decade-${d}-our-father` as BeadId,
    ...Array.from(
      { length: 10 },
      (_, k) => `decade-${d}-hail-mary-${k + 1}` as BeadId,
    ),
  ]),
]
assert(
  JSON.stringify([...PHYSICAL_BEADS]) === JSON.stringify(expectedBeads),
  'PHYSICAL_BEADS matches canonical 60-bead order',
)

// ---------- every non-null beadId in steps exists in PHYSICAL_BEADS ----------
const beadIdsInSteps = new Set<BeadId>()
for (const s of ROSARY_STEPS) if (s.beadId) beadIdsInSteps.add(s.beadId)
const unknown: BeadId[] = []
for (const b of beadIdsInSteps) if (!beadSet.has(b)) unknown.push(b)
assert(unknown.length === 0, `Every step.beadId is a known physical bead (unknown: ${unknown.join(', ') || 'none'})`)

// ---------- coverage: every physical bead is reached by at least one step ----------
const reachedBeads = new Set<BeadId>()
for (const s of ROSARY_STEPS) if (s.beadId) reachedBeads.add(s.beadId)
const missing: BeadId[] = []
for (const b of PHYSICAL_BEADS) if (!reachedBeads.has(b)) missing.push(b)
assert(missing.length === 0, `Every physical bead is reached by a step (missing: ${missing.join(', ') || 'none'})`)

// ---------- prayer id integrity ----------
section('Prayer ids')
const missingPrayers: string[] = []
const nullPrayers: RosaryStep[] = []
for (const s of ROSARY_STEPS) {
  if (s.prayerId === null) {
    nullPrayers.push(s)
    continue
  }
  if (!availablePrayerIds.has(s.prayerId)) missingPrayers.push(`${s.index}:${s.prayerId}`)
}
assert(
  missingPrayers.length === 0,
  `All non-null prayerIds exist in prayers.ts (missing: ${missingPrayers.join(', ') || 'none'})`,
)
assert(
  nullPrayers.every((s) => s.type === 'mystery_announce'),
  'Only mystery_announce steps have a null prayerId',
)

// ---------- sanity: PRAYER_IDS constants all exist ----------
const missingConstants = Object.entries(PRAYER_IDS).filter(([, id]) => !availablePrayerIds.has(id))
assert(
  missingConstants.length === 0,
  `PRAYER_IDS constants all resolve to a real prayer (missing: ${missingConstants.map(([k]) => k).join(', ') || 'none'})`,
)

// ---------- summary ----------
console.log('')
if (failures > 0) {
  console.error(`FAILED: ${failures} assertion(s) did not pass.`)
  process.exit(1)
}
console.log(`OK — all invariants hold across ${ROSARY_STEPS.length} steps / ${PHYSICAL_BEADS.length} beads.`)
