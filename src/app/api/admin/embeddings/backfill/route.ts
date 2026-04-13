import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { openai } from '@/lib/openai/client'
import { rateLimit } from '@/lib/rate-limit'

/**
 * Admin endpoint: backfill missing vector embeddings on magisterio,
 * patristica and etymo_terms.
 *
 * Why this exists: the three tables had text content but no/partial
 * embeddings, so vector search was silently dead for those sources.
 * The RAG pipeline has FTS fallbacks to stay functional, but the
 * semantic ("by meaning") search only works once embeddings exist.
 *
 * Safe to re-run: only touches rows where `embedding IS NULL`.
 *
 * Usage (from a logged-in admin session):
 *   POST /api/admin/embeddings/backfill
 *   body: { "table": "magisterio" | "patristica" | "etymo_terms" | "all",
 *           "limit": 100 }   // optional, default 200 per call
 *
 * The `limit` exists so you can chunk very large backfills under
 * Vercel's 300s function timeout. For the current volume (~183 rows
 * total) a single call with the default is fine.
 */

// Pro plan: 300s max. Leave a little headroom.
export const maxDuration = 290

type TableName = 'magisterio' | 'patristica' | 'etymo_terms'

interface BackfillResult {
  table: TableName
  attempted: number
  succeeded: number
  failed: number
  remaining: number
  errors: Array<{ reference?: string; term?: string; message: string }>
}

async function embed(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.replace(/\n/g, ' ').slice(0, 8000),
  })
  return response.data[0].embedding
}

async function backfillMagisterio(
  admin: ReturnType<typeof createAdminClient>,
  limit: number,
): Promise<BackfillResult> {
  const result: BackfillResult = {
    table: 'magisterio',
    attempted: 0,
    succeeded: 0,
    failed: 0,
    remaining: 0,
    errors: [],
  }

  const { data, error } = await admin
    .from('magisterio')
    .select('id, reference, text')
    .is('embedding', null)
    .limit(limit)

  if (error) {
    result.errors.push({ message: `select: ${error.message}` })
    return result
  }
  const rows = data ?? []
  result.attempted = rows.length

  for (const row of rows) {
    try {
      const vec = await embed(row.text ?? '')
      const { error: upErr } = await admin
        .from('magisterio')
        .update({ embedding: vec })
        .eq('id', row.id)
      if (upErr) {
        result.failed++
        result.errors.push({ reference: row.reference, message: upErr.message })
      } else {
        result.succeeded++
      }
    } catch (err) {
      result.failed++
      result.errors.push({
        reference: row.reference,
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const { count } = await admin
    .from('magisterio')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null)
  result.remaining = count ?? 0
  return result
}

async function backfillPatristica(
  admin: ReturnType<typeof createAdminClient>,
  limit: number,
): Promise<BackfillResult> {
  const result: BackfillResult = {
    table: 'patristica',
    attempted: 0,
    succeeded: 0,
    failed: 0,
    remaining: 0,
    errors: [],
  }

  const { data, error } = await admin
    .from('patristica')
    .select('id, reference, text')
    .is('embedding', null)
    .limit(limit)

  if (error) {
    result.errors.push({ message: `select: ${error.message}` })
    return result
  }
  const rows = data ?? []
  result.attempted = rows.length

  for (const row of rows) {
    try {
      const vec = await embed(row.text ?? '')
      const { error: upErr } = await admin
        .from('patristica')
        .update({ embedding: vec })
        .eq('id', row.id)
      if (upErr) {
        result.failed++
        result.errors.push({ reference: row.reference, message: upErr.message })
      } else {
        result.succeeded++
      }
    } catch (err) {
      result.failed++
      result.errors.push({
        reference: row.reference,
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const { count } = await admin
    .from('patristica')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null)
  result.remaining = count ?? 0
  return result
}

async function backfillEtymoTerms(
  admin: ReturnType<typeof createAdminClient>,
  limit: number,
): Promise<BackfillResult> {
  const result: BackfillResult = {
    table: 'etymo_terms',
    attempted: 0,
    succeeded: 0,
    failed: 0,
    remaining: 0,
    errors: [],
  }

  const { data, error } = await admin
    .from('etymo_terms')
    .select('id, term_pt, term_original, transliteration, original_meaning, modern_difference')
    .is('embedding', null)
    .limit(limit)

  if (error) {
    result.errors.push({ message: `select: ${error.message}` })
    return result
  }
  const rows = data ?? []
  result.attempted = rows.length

  for (const row of rows) {
    try {
      // Build a rich embedding input combining all semantic fields,
      // so the vector captures "Eucaristia = εὐχαριστία = thanksgiving"
      // not just the Portuguese term in isolation.
      const parts = [
        row.term_pt,
        row.term_original,
        row.transliteration,
        row.original_meaning,
        row.modern_difference,
      ].filter((p): p is string => typeof p === 'string' && p.length > 0)
      const input = parts.join('. ')
      if (!input) {
        continue
      }

      const vec = await embed(input)
      const { error: upErr } = await admin
        .from('etymo_terms')
        .update({ embedding: vec })
        .eq('id', row.id)
      if (upErr) {
        result.failed++
        result.errors.push({ term: row.term_pt, message: upErr.message })
      } else {
        result.succeeded++
      }
    } catch (err) {
      result.failed++
      result.errors.push({
        term: row.term_pt,
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const { count } = await admin
    .from('etymo_terms')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null)
  result.remaining = count ?? 0
  return result
}

export async function POST(req: NextRequest) {
  try {
    // Auth: must be a logged-in admin
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Rate limit: 3 requests per minute per admin (each call can take minutes)
    if (!rateLimit(`embeddings-backfill:${user.id}`, 3, 60_000)) {
      return NextResponse.json(
        { error: 'Muitas requisições. Aguarde um momento.' },
        { status: 429 },
      )
    }

    const body = await req.json().catch(() => ({}))
    const table = (body.table ?? 'all') as TableName | 'all'
    const limit = Math.min(
      Math.max(1, Number(body.limit) || 200),
      500,
    )

    const admin = createAdminClient()
    const results: BackfillResult[] = []

    if (table === 'all' || table === 'magisterio') {
      results.push(await backfillMagisterio(admin, limit))
    }
    if (table === 'all' || table === 'patristica') {
      results.push(await backfillPatristica(admin, limit))
    }
    if (table === 'all' || table === 'etymo_terms') {
      results.push(await backfillEtymoTerms(admin, limit))
    }

    if (results.length === 0) {
      return NextResponse.json(
        { error: `Tabela inválida: ${table}. Use magisterio | patristica | etymo_terms | all.` },
        { status: 400 },
      )
    }

    const summary = {
      attempted: results.reduce((a, r) => a + r.attempted, 0),
      succeeded: results.reduce((a, r) => a + r.succeeded, 0),
      failed: results.reduce((a, r) => a + r.failed, 0),
      remaining: results.reduce((a, r) => a + r.remaining, 0),
    }

    return NextResponse.json({ summary, results })
  } catch (error) {
    console.error('[embeddings/backfill] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao executar backfill de embeddings' },
      { status: 500 },
    )
  }
}

/**
 * GET returns the current "embedding coverage" for the three tables so
 * you can tell from the browser whether the backfill still needs to run.
 */
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const admin = createAdminClient()
  async function stats(table: TableName) {
    const { count: total } = await admin
      .from(table)
      .select('id', { count: 'exact', head: true })
    const { count: missing } = await admin
      .from(table)
      .select('id', { count: 'exact', head: true })
      .is('embedding', null)
    return { table, total: total ?? 0, missing: missing ?? 0 }
  }

  const coverage = await Promise.all([
    stats('magisterio'),
    stats('patristica'),
    stats('etymo_terms'),
  ])
  return NextResponse.json({ coverage })
}
