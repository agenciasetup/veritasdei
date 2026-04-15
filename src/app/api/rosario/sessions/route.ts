import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Histórico de terços completados.
 *
 *   GET  /api/rosario/sessions?limit=50
 *        → lista as últimas sessões do usuário, mais recentes primeiro,
 *          já com o título da intenção (nested select).
 *
 *   POST /api/rosario/sessions
 *        body: {
 *          mystery_set: 'gozosos' | 'luminosos' | 'dolorosos' | 'gloriosos',
 *          intention_id?: string | null,
 *          started_at?: ISO string | null,
 *          duration_seconds?: number | null
 *        }
 *        → registra uma sessão COMPLETA. Sessões abandonadas ficam no
 *          localStorage do sprint 1.6 e nunca vêm pra cá.
 *
 * Tabela é append-only pela RLS: não expomos UPDATE.
 */

const VALID_MYSTERY_SETS = new Set(['gozosos', 'luminosos', 'dolorosos', 'gloriosos'])
const MAX_DURATION_SECONDS = 24 * 60 * 60 // 24h — sanity
const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

interface SessionInsertBody {
  mystery_set?: unknown
  intention_id?: unknown
  started_at?: unknown
  duration_seconds?: unknown
}

function sanitizeInsert(body: SessionInsertBody) {
  if (typeof body.mystery_set !== 'string') return null
  if (!VALID_MYSTERY_SETS.has(body.mystery_set)) return null

  let intentionId: string | null = null
  if (body.intention_id !== undefined && body.intention_id !== null) {
    if (typeof body.intention_id !== 'string') return null
    // UUID shallow validation — RLS faz a validação real.
    if (body.intention_id.length < 32 || body.intention_id.length > 64) return null
    intentionId = body.intention_id
  }

  let startedAt: string | null = null
  if (body.started_at !== undefined && body.started_at !== null) {
    if (typeof body.started_at !== 'string') return null
    const parsed = Date.parse(body.started_at)
    if (Number.isNaN(parsed)) return null
    startedAt = new Date(parsed).toISOString()
  }

  let durationSeconds: number | null = null
  if (body.duration_seconds !== undefined && body.duration_seconds !== null) {
    if (typeof body.duration_seconds !== 'number' || !Number.isFinite(body.duration_seconds)) {
      return null
    }
    const rounded = Math.round(body.duration_seconds)
    if (rounded < 0 || rounded > MAX_DURATION_SECONDS) return null
    durationSeconds = rounded
  }

  return {
    mystery_set: body.mystery_set,
    intention_id: intentionId,
    started_at: startedAt,
    duration_seconds: durationSeconds,
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const url = new URL(req.url)
  const limitParam = Number(url.searchParams.get('limit'))
  const limit = Number.isFinite(limitParam) && limitParam > 0
    ? Math.min(Math.floor(limitParam), MAX_LIMIT)
    : DEFAULT_LIMIT

  const { data, error } = await supabase
    .from('rosary_sessions')
    .select(
      `id, user_id, mystery_set, intention_id, started_at, completed_at, duration_seconds, created_at,
       intention:rosary_intentions ( id, titulo )`,
    )
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[rosary_sessions] select error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ sessions: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let body: SessionInsertBody
  try {
    body = (await req.json()) as SessionInsertBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const insert = sanitizeInsert(body)
  if (!insert) {
    return NextResponse.json({ error: 'invalid_fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('rosary_sessions')
    .insert({
      user_id: user.id,
      mystery_set: insert.mystery_set,
      intention_id: insert.intention_id,
      started_at: insert.started_at,
      duration_seconds: insert.duration_seconds,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[rosary_sessions] insert error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ session: data })
}
