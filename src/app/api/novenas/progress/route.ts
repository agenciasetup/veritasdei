import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/novenas/progress?status=active|completed|all
 *
 * Retorna o progresso do usuário em suas novenas.
 *   - active:    completed_at IS NULL (padrão)
 *   - completed: completed_at IS NOT NULL
 *   - all:       sem filtro
 */

const VALID_STATUSES = new Set(['active', 'completed', 'all'])
const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const url = new URL(req.url)
  const status = url.searchParams.get('status') ?? 'active'
  if (!VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: 'invalid_status' }, { status: 400 })
  }

  const limitParam = Number(url.searchParams.get('limit'))
  const limit = Number.isFinite(limitParam) && limitParam > 0
    ? Math.min(Math.floor(limitParam), MAX_LIMIT)
    : DEFAULT_LIMIT

  let query = supabase
    .from('novenas_progress')
    .select(`
      id, user_id, builtin_slug, custom_novena_id, intention_id,
      current_day, started_at, last_prayed_at, completed_at, created_at, updated_at,
      custom_novena:novenas_custom ( id, titulo, descricao ),
      intention:rosary_intentions ( id, titulo ),
      daily_logs:novenas_daily_log ( id, day_number, prayed_at )
    `)
    .eq('user_id', user.id)
    .limit(limit)

  if (status === 'active') {
    query = query.is('completed_at', null).order('updated_at', { ascending: false })
  } else if (status === 'completed') {
    query = query.not('completed_at', 'is', null).order('completed_at', { ascending: false })
  } else {
    query = query.order('updated_at', { ascending: false })
  }

  const { data, error } = await query

  if (error) {
    console.error('[novenas/progress] select error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ progress: data ?? [] })
}
