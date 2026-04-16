import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { NotificacaoFeedItem, NotificacaoIngestInput } from '@/types/notifications'

function sanitizeInput(body: unknown): NotificacaoIngestInput | null {
  if (!body || typeof body !== 'object') return null
  const parsed = body as Partial<NotificacaoIngestInput>

  const type = typeof parsed.type === 'string' ? parsed.type.trim() : ''
  const title = typeof parsed.title === 'string' ? parsed.title.trim() : ''
  const message = typeof parsed.body === 'string' ? parsed.body.trim() : ''

  if (!type || !title || !message) return null

  return {
    type,
    title,
    body: message,
    target_url: typeof parsed.target_url === 'string' ? parsed.target_url : null,
    payload: parsed.payload ?? {},
    source: typeof parsed.source === 'string' && parsed.source.trim() ? parsed.source.trim() : 'system',
    dedupe_key: typeof parsed.dedupe_key === 'string' && parsed.dedupe_key.trim()
      ? parsed.dedupe_key.trim()
      : null,
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const limitRaw = Number(req.nextUrl.searchParams.get('limit') ?? '40')
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, limitRaw)) : 40
  const includeArchived = req.nextUrl.searchParams.get('include_archived') === '1'

  let query = supabase
    .from('user_notificacoes_feed')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!includeArchived) query = query.is('archived_at', null)

  const [{ data, error }, unread] = await Promise.all([
    query,
    supabase
      .from('user_notificacoes_feed')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('archived_at', null)
      .is('read_at', null),
  ])

  if (error) {
    return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({
    items: ((data ?? []) as unknown as NotificacaoFeedItem[]),
    unread_count: unread.count ?? 0,
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const rawItems: unknown[] = Array.isArray(rawBody) ? rawBody : [rawBody]
  const items = rawItems
    .map(sanitizeInput)
    .filter((item): item is NotificacaoIngestInput => item !== null)

  if (items.length === 0) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const rows = items.map((item) => ({
    user_id: user.id,
    type: item.type,
    title: item.title,
    body: item.body,
    target_url: item.target_url ?? null,
    payload: item.payload ?? {},
    source: item.source ?? 'system',
    dedupe_key: item.dedupe_key ?? null,
  }))

  const { data, error } = await supabase
    .from('user_notificacoes_feed')
    .upsert(rows, { onConflict: 'user_id,dedupe_key' })
    .select('*')

  if (error) {
    return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({
    inserted: (data ?? []) as NotificacaoFeedItem[],
  })
}
