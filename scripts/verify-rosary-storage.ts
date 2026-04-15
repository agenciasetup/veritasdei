/**
 * Verifies the `rosarySessionStorage` helpers in isolation:
 *   - serialize / parse roundtrip
 *   - schema version rejection
 *   - TTL rejection
 *   - guards against nonsense index / mystery set / booleans
 *
 * Run with: `npx tsx scripts/verify-rosary-storage.ts`
 */

import { ROSARY_STEPS } from '../src/features/rosario/data/beadSequence'
import {
  SCHEMA_VERSION,
  TTL_MS,
  parseSessionPayload,
  serializeSessionPayload,
  type RosarySessionSnapshot,
} from '../src/features/rosario/session/rosarySessionStorage'

let failures = 0
function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    failures++
    console.error(`  ✗ ${msg}`)
  } else {
    console.log(`  ✓ ${msg}`)
  }
}
function section(t: string) {
  console.log(`\n${t}`)
}

const NOW = 1_700_000_000_000 // arbitrary fixed "now" for deterministic TTL tests

// ---------- Roundtrip ----------
section('Serialize / parse roundtrip')
{
  const snap: RosarySessionSnapshot = {
    mysterySetId: 'dolorosos',
    currentIndex: 23,
    isCompleted: false,
    savedAt: NOW - 5_000,
  }
  const json = serializeSessionPayload(snap)
  const parsed = JSON.parse(json)
  assert(parsed.v === SCHEMA_VERSION, `Serialized payload contains v = ${SCHEMA_VERSION}`)

  const back = parseSessionPayload(parsed, NOW)
  assert(back !== null, 'Roundtrip parse returns a snapshot')
  assert(back?.mysterySetId === 'dolorosos', 'Roundtrip preserves mysterySetId')
  assert(back?.currentIndex === 23, 'Roundtrip preserves currentIndex')
  assert(back?.isCompleted === false, 'Roundtrip preserves isCompleted')
  assert(back?.savedAt === snap.savedAt, 'Roundtrip preserves savedAt')
}

// ---------- Valid mystery sets ----------
section('Valid mystery sets')
for (const id of ['gozosos', 'luminosos', 'dolorosos', 'gloriosos'] as const) {
  const parsed = parseSessionPayload(
    { v: SCHEMA_VERSION, mysterySetId: id, currentIndex: 1, isCompleted: false, savedAt: NOW },
    NOW,
  )
  assert(parsed !== null, `Accepts mysterySetId=${id}`)
}

// ---------- Rejects nonsense ----------
section('Rejects invalid payloads')
{
  assert(parseSessionPayload(null, NOW) === null, 'Rejects null')
  assert(parseSessionPayload(undefined, NOW) === null, 'Rejects undefined')
  assert(parseSessionPayload('nope', NOW) === null, 'Rejects string')
  assert(parseSessionPayload(42, NOW) === null, 'Rejects number')
  assert(
    parseSessionPayload({ v: 0, mysterySetId: 'gozosos', currentIndex: 1, isCompleted: false, savedAt: NOW }, NOW) === null,
    'Rejects schema version 0',
  )
  assert(
    parseSessionPayload({ v: SCHEMA_VERSION + 1, mysterySetId: 'gozosos', currentIndex: 1, isCompleted: false, savedAt: NOW }, NOW) === null,
    `Rejects schema version ${SCHEMA_VERSION + 1}`,
  )
  assert(
    parseSessionPayload({ v: SCHEMA_VERSION, mysterySetId: 'invalid', currentIndex: 1, isCompleted: false, savedAt: NOW }, NOW) === null,
    'Rejects unknown mysterySetId',
  )
  assert(
    parseSessionPayload({ v: SCHEMA_VERSION, mysterySetId: 'gozosos', currentIndex: -1, isCompleted: false, savedAt: NOW }, NOW) === null,
    'Rejects negative currentIndex',
  )
  assert(
    parseSessionPayload({ v: SCHEMA_VERSION, mysterySetId: 'gozosos', currentIndex: ROSARY_STEPS.length, isCompleted: false, savedAt: NOW }, NOW) === null,
    'Rejects currentIndex beyond last step',
  )
  assert(
    parseSessionPayload({ v: SCHEMA_VERSION, mysterySetId: 'gozosos', currentIndex: 3.5, isCompleted: false, savedAt: NOW }, NOW) === null,
    'Rejects non-integer currentIndex',
  )
  assert(
    parseSessionPayload({ v: SCHEMA_VERSION, mysterySetId: 'gozosos', currentIndex: 1, isCompleted: 'yes', savedAt: NOW }, NOW) === null,
    'Rejects non-boolean isCompleted',
  )
  assert(
    parseSessionPayload({ v: SCHEMA_VERSION, mysterySetId: 'gozosos', currentIndex: 1, isCompleted: false, savedAt: 'now' }, NOW) === null,
    'Rejects non-numeric savedAt',
  )
}

// ---------- TTL ----------
section('TTL of 24 h')
{
  const fresh = parseSessionPayload(
    { v: SCHEMA_VERSION, mysterySetId: 'gozosos', currentIndex: 5, isCompleted: false, savedAt: NOW - (TTL_MS - 1_000) },
    NOW,
  )
  assert(fresh !== null, 'Accepts payload just under TTL')

  const stale = parseSessionPayload(
    { v: SCHEMA_VERSION, mysterySetId: 'gozosos', currentIndex: 5, isCompleted: false, savedAt: NOW - (TTL_MS + 1_000) },
    NOW,
  )
  assert(stale === null, 'Rejects payload just past TTL')

  const future = parseSessionPayload(
    { v: SCHEMA_VERSION, mysterySetId: 'gozosos', currentIndex: 5, isCompleted: false, savedAt: NOW + 120_000 },
    NOW,
  )
  assert(future === null, 'Rejects payload from the suspicious future')
}

// ---------- Index edge cases ----------
section('Index bounds')
{
  const first = parseSessionPayload(
    { v: SCHEMA_VERSION, mysterySetId: 'gozosos', currentIndex: 0, isCompleted: false, savedAt: NOW },
    NOW,
  )
  assert(first !== null && first.currentIndex === 0, 'Accepts currentIndex = 0')

  const last = parseSessionPayload(
    {
      v: SCHEMA_VERSION,
      mysterySetId: 'gozosos',
      currentIndex: ROSARY_STEPS.length - 1,
      isCompleted: false,
      savedAt: NOW,
    },
    NOW,
  )
  assert(
    last !== null && last.currentIndex === ROSARY_STEPS.length - 1,
    `Accepts currentIndex = ${ROSARY_STEPS.length - 1} (last step)`,
  )
}

// ---------- Summary ----------
if (failures > 0) {
  console.error(`\nFAIL — ${failures} storage invariant(s) failed.`)
  process.exit(1)
} else {
  console.log('\nOK — rosarySessionStorage invariants hold.')
}
