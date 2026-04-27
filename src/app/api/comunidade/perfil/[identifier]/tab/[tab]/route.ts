import { NextRequest, NextResponse } from 'next/server'
import { fetchPostsByIds } from '@/lib/community/posts'
import { requireCommunitySession } from '@/lib/community/server'
import { rateLimit } from '@/lib/rate-limit'

const VALID_TABS = new Set(['veritas', 'replies', 'media', 'likes'])
const RPC_BY_TAB: Record<string, string> = {
  veritas: 'get_profile_veritas',
  replies: 'get_profile_replies',
  media: 'get_profile_media',
  likes: 'get_profile_likes',
}

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 40

/**
 * GET /api/comunidade/perfil/[identifier]/tab/[tab]?cursor=...
 *
 * Carrega uma aba do perfil público. identifier aceita "@handle",
 * "handle" ou número. tab ∈ {replies, media, likes}.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ identifier: string; tab: string }> },
) {
  const session = await requireCommunitySession()
  if (!session.ok) return session.response
  const { supabase, user } = session

  if (!(await rateLimit(`community:profile-tab:${user.id}`, 60, 60_000))) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const { identifier: rawIdentifier, tab } = await params

  if (!VALID_TABS.has(tab)) {
    return NextResponse.json({ error: 'invalid_tab' }, { status: 400 })
  }

  let identifier = rawIdentifier
  try { identifier = decodeURIComponent(identifier) } catch { /* noop */ }

  const url = new URL(req.url)
  const cursor = url.searchParams.get('cursor')
  const limitParam = Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT)
  const limit = Math.min(
    Math.max(Number.isFinite(limitParam) ? limitParam : DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  )

  const { data, error } = await supabase.rpc(RPC_BY_TAB[tab], {
    identifier,
    cursor_created_at: cursor,
    page_size: limit + 1,
  })

  if (error) {
    return NextResponse.json(
      { error: 'db_error', detail: error.message },
      { status: 500 },
    )
  }

  const rows = (data ?? []) as Array<{ post_id: string; created_at: string }>
  const hasMore = rows.length > limit
  const pageRows = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore
    ? pageRows[pageRows.length - 1]?.created_at ?? null
    : null

  const posts = await fetchPostsByIds(
    supabase,
    user.id,
    pageRows.map(r => r.post_id),
  )

  // Preserva ordem do RPC.
  const order = new Map(pageRows.map((r, i) => [r.post_id, i]))
  posts.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))

  return NextResponse.json({
    tab,
    posts,
    pagination: { next_cursor: nextCursor, limit },
  })
}
