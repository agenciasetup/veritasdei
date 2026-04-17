import { NextRequest, NextResponse } from 'next/server'
import { fetchPostsByIds } from '@/lib/community/posts'
import { requireCommunityPremiumAccess } from '@/lib/community/server'
import { rateLimit } from '@/lib/rate-limit'
import { VERITAS_MAX_BODY } from '@/lib/community/constants'

const REPLIES_DEFAULT_LIMIT = 20
const REPLIES_MAX_LIMIT = 40

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await requireCommunityPremiumAccess()
  if (!access.ok) return access.response

  const { id } = await params
  const { supabase, user } = access.context

  const url = new URL(req.url)
  const limitParam = Number(url.searchParams.get('limit') ?? REPLIES_DEFAULT_LIMIT)
  const cursor = url.searchParams.get('cursor')
  const limit = Math.min(
    Math.max(Number.isFinite(limitParam) ? limitParam : REPLIES_DEFAULT_LIMIT, 1),
    REPLIES_MAX_LIMIT,
  )

  const [post] = await fetchPostsByIds(supabase, user.id, [id])
  if (!post) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  let repliesQuery = supabase
    .from('vd_posts')
    .select('id, created_at')
    .eq('parent_post_id', id)
    .eq('kind', 'reply')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(limit + 1)

  if (cursor) {
    repliesQuery = repliesQuery.gt('created_at', cursor)
  }

  const { data: replyRows, error } = await repliesQuery

  if (error) {
    return NextResponse.json({ error: 'replies_failed', detail: error.message }, { status: 500 })
  }

  const rows = (replyRows ?? []) as Array<{ id: string; created_at: string }>
  const hasMore = rows.length > limit
  const pageRows = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore ? pageRows[pageRows.length - 1]?.created_at ?? null : null

  const replies = await fetchPostsByIds(
    supabase,
    user.id,
    pageRows.map(row => row.id),
  )

  return NextResponse.json({
    post,
    replies,
    pagination: { next_cursor: nextCursor, limit },
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await requireCommunityPremiumAccess()
  if (!access.ok) return access.response

  const { id } = await params
  const { supabase, user } = access.context

  if (!rateLimit(`community:edit:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let payload: { body?: string }
  try {
    payload = await req.json() as { body?: string }
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const body = (payload.body ?? '').trim()
  if (!body || body.length > VERITAS_MAX_BODY) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  // Valida: author, não deletado, não é repost (repost não tem body próprio).
  const { data: existing } = await supabase
    .from('vd_posts')
    .select('id, author_user_id, deleted_at, kind')
    .eq('id', id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  if (existing.author_user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  if (existing.deleted_at) {
    return NextResponse.json({ error: 'deleted' }, { status: 410 })
  }
  if (existing.kind === 'repost') {
    return NextResponse.json({ error: 'repost_not_editable' }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from('vd_posts')
    .update({ body })
    .eq('id', id)
    .eq('author_user_id', user.id)

  if (updateError) {
    return NextResponse.json({ error: 'edit_failed', detail: updateError.message }, { status: 500 })
  }

  const [updated] = await fetchPostsByIds(supabase, user.id, [id])
  return NextResponse.json({ post: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await requireCommunityPremiumAccess()
  if (!access.ok) return access.response

  const { id } = await params
  const { supabase, user } = access.context

  if (!rateLimit(`community:delete:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const { data: existing, error: fetchError } = await supabase
    .from('vd_posts')
    .select('id, author_user_id, deleted_at')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    return NextResponse.json({ error: 'fetch_failed', detail: fetchError.message }, { status: 500 })
  }

  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  if (existing.author_user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  if (existing.deleted_at) {
    return NextResponse.json({ ok: true, already_deleted: true })
  }

  const { error: updateError } = await supabase
    .from('vd_posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('author_user_id', user.id)

  if (updateError) {
    return NextResponse.json({ error: 'delete_failed', detail: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
