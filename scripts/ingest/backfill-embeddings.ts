/**
 * One-shot backfill for missing embeddings across three tables:
 *   - magisterio   (0/40 embedded at time of writing)
 *   - patristica   (10/58 embedded — 48 missing)
 *   - etymo_terms  (0/95 embedded — column added 2026-04-13)
 *
 * Running:
 *   npx tsx scripts/ingest/backfill-embeddings.ts             # all three
 *   npx tsx scripts/ingest/backfill-embeddings.ts magisterio  # single table
 *
 * Safe to re-run: only touches rows whose embedding IS NULL.
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_KEY = process.env.OPENAI_API_KEY

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_KEY) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / OPENAI_API_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const openai = new OpenAI({ apiKey: OPENAI_KEY, timeout: 60000 })

async function embed(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.replace(/\n/g, ' ').slice(0, 8000),
  })
  return response.data[0].embedding
}

type BackfillTable = 'magisterio' | 'patristica' | 'etymo_terms'

async function backfillMagisterio(): Promise<void> {
  console.log('\n=== magisterio ===')
  const { data, error } = await supabase
    .from('magisterio')
    .select('id, reference, text')
    .is('embedding', null)

  if (error) throw new Error(`magisterio select: ${error.message}`)
  if (!data || data.length === 0) {
    console.log('Nothing to backfill.')
    return
  }

  console.log(`${data.length} rows missing embeddings`)
  let ok = 0
  for (const row of data) {
    try {
      const vec = await embed(row.text ?? '')
      const { error: upErr } = await supabase
        .from('magisterio')
        .update({ embedding: vec })
        .eq('id', row.id)
      if (upErr) {
        console.error(`  ✗ ${row.reference}: ${upErr.message}`)
      } else {
        ok++
        console.log(`  ✓ ${row.reference}`)
      }
    } catch (err) {
      console.error(`  ✗ ${row.reference}:`, err instanceof Error ? err.message : err)
    }
  }
  console.log(`magisterio: ${ok}/${data.length} embedded`)
}

async function backfillPatristica(): Promise<void> {
  console.log('\n=== patristica ===')
  const { data, error } = await supabase
    .from('patristica')
    .select('id, reference, text')
    .is('embedding', null)

  if (error) throw new Error(`patristica select: ${error.message}`)
  if (!data || data.length === 0) {
    console.log('Nothing to backfill.')
    return
  }

  console.log(`${data.length} rows missing embeddings`)
  let ok = 0
  for (const row of data) {
    try {
      const vec = await embed(row.text ?? '')
      const { error: upErr } = await supabase
        .from('patristica')
        .update({ embedding: vec })
        .eq('id', row.id)
      if (upErr) {
        console.error(`  ✗ ${row.reference}: ${upErr.message}`)
      } else {
        ok++
        console.log(`  ✓ ${row.reference}`)
      }
    } catch (err) {
      console.error(`  ✗ ${row.reference}:`, err instanceof Error ? err.message : err)
    }
  }
  console.log(`patristica: ${ok}/${data.length} embedded`)
}

async function backfillEtymoTerms(): Promise<void> {
  console.log('\n=== etymo_terms ===')
  const { data, error } = await supabase
    .from('etymo_terms')
    .select('id, term_pt, term_original, transliteration, original_meaning, modern_difference')
    .is('embedding', null)

  if (error) throw new Error(`etymo_terms select: ${error.message}`)
  if (!data || data.length === 0) {
    console.log('Nothing to backfill.')
    return
  }

  console.log(`${data.length} rows missing embeddings`)
  let ok = 0
  for (const row of data) {
    try {
      // Build a rich embedding input combining all semantic fields.
      const parts = [
        row.term_pt,
        row.term_original,
        row.transliteration,
        row.original_meaning,
        row.modern_difference,
      ].filter((p): p is string => typeof p === 'string' && p.length > 0)
      const input = parts.join('. ')
      if (!input) {
        console.warn(`  - ${row.term_pt}: empty input, skipping`)
        continue
      }

      const vec = await embed(input)
      const { error: upErr } = await supabase
        .from('etymo_terms')
        .update({ embedding: vec })
        .eq('id', row.id)
      if (upErr) {
        console.error(`  ✗ ${row.term_pt}: ${upErr.message}`)
      } else {
        ok++
        console.log(`  ✓ ${row.term_pt}`)
      }
    } catch (err) {
      console.error(`  ✗ ${row.term_pt}:`, err instanceof Error ? err.message : err)
    }
  }
  console.log(`etymo_terms: ${ok}/${data.length} embedded`)
}

async function main(): Promise<void> {
  const arg = process.argv[2] as BackfillTable | undefined
  const targets: BackfillTable[] = arg
    ? [arg]
    : ['magisterio', 'patristica', 'etymo_terms']

  for (const t of targets) {
    if (t === 'magisterio') await backfillMagisterio()
    else if (t === 'patristica') await backfillPatristica()
    else if (t === 'etymo_terms') await backfillEtymoTerms()
    else console.error(`Unknown table: ${t}`)
  }

  console.log('\nBackfill complete.')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
