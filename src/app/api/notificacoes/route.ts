import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/api/guard'
import { parseJson, internalPathSchema } from '@/lib/api/validate'
import type { NotificacaoFeedItem } from '@/types/notifications'

// Schema único de ingest. target_url agora só aceita caminhos internos —
// resolve M6 da auditoria (antes: qualquer string, inclusive
// "javascript:alert(1)" ou "//evil.com").
const ingestSchema = z.object({
  type: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(2000),
  target_url: internalPathSchema.nullish(),
  payload: z.record(z.string(), z.unknown()).optional(),
  source: z.string().trim().min(1).max(64).optional(),
  dedupe_key: z.string().trim().min(1).max(128).nullish(),
})

const ingestRequestSchema = z.union([
  ingestSchema,
  z.array(ingestSchema).min(1).max(100),
])

export async function GET(req: NextRequest) {
  const guard = await requireUser()
  if (guard instanceof NextResponse) return guard
  const { user, supabase } = guard

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
    console.error('[notificacoes GET] db error:', error.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({
    items: ((data ?? []) as unknown as NotificacaoFeedItem[]),
    unread_count: unread.count ?? 0,
  })
}

export async function POST(req: NextRequest) {
  const guard = await requireUser()
  if (guard instanceof NextResponse) return guard
  const { user, supabase } = guard

  const body = await parseJson(req, ingestRequestSchema)
  if (body instanceof NextResponse) return body

  const items = Array.isArray(body) ? body : [body]

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
    console.error('[notificacoes POST] db error:', error.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({
    inserted: (data ?? []) as NotificacaoFeedItem[],
  })
}
