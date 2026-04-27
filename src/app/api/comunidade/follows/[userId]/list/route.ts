import { NextRequest, NextResponse } from 'next/server'
import { requireCommunitySession } from '@/lib/community/server'
import { rateLimit } from '@/lib/rate-limit'

const DEFAULT_LIMIT = 30
const MAX_LIMIT = 60

/**
 * GET /api/comunidade/follows/[userId]/list?type=followers|following
 *
 * Retorna lista de profiles:
 * - type=followers: quem segue o userId.
 * - type=following: quem o userId segue.
 *
 * Cursor: created_at (ISO) — descende pelo created_at do follow row.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await requireCommunitySession()
  if (!session.ok) return session.response

  const { supabase, user } = session
  const { userId } = await params

  if (!(await rateLimit(`community:follows:list:${user.id}`, 60, 60_000))) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const url = new URL(req.url)
  const type = url.searchParams.get('type')
  if (type !== 'followers' && type !== 'following') {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
  }

  const cursor = url.searchParams.get('cursor')
  const limitParam = Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT)
  const limit = Math.min(
    Math.max(Number.isFinite(limitParam) ? limitParam : DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  )

  const userColumn = type === 'followers' ? 'followed_user_id' : 'follower_user_id'
  const otherColumn = type === 'followers' ? 'follower_user_id' : 'followed_user_id'

  let query = supabase
    .from('vd_follows')
    .select(`created_at, ${otherColumn}`)
    .eq(userColumn, userId)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data: rows, error } = await query

  if (error) {
    return NextResponse.json(
      { error: 'list_failed', detail: error.message },
      { status: 500 },
    )
  }

  const typed = (rows ?? []) as unknown as Array<Record<string, string>>
  const hasMore = typed.length > limit
  const pageRows = hasMore ? typed.slice(0, limit) : typed
  const nextCursor = hasMore ? pageRows[pageRows.length - 1]?.created_at ?? null : null

  const profileIds = pageRows.map(r => r[otherColumn]).filter(Boolean)

  let profiles: Array<Record<string, unknown>> = []
  if (profileIds.length > 0) {
    const { data: profData } = await supabase
      .from('profiles')
      .select('id, name, public_handle, user_number, profile_image_url, community_role, verified, bio_short')
      .in('id', profileIds)
    profiles = (profData ?? []) as Array<Record<string, unknown>>
  }

  // Viewer's follows para marcar botão "Seguindo" vs "Seguir"
  let viewerFollowing = new Set<string>()
  if (profileIds.length > 0 && user.id) {
    const { data: viewerFollows } = await supabase
      .from('vd_follows')
      .select('followed_user_id')
      .eq('follower_user_id', user.id)
      .in('followed_user_id', profileIds)
    viewerFollowing = new Set(
      ((viewerFollows ?? []) as Array<{ followed_user_id: string }>)
        .map(r => r.followed_user_id),
    )
  }

  const orderById = new Map(pageRows.map((r, idx) => [r[otherColumn], idx]))
  const enriched = profiles.map(p => {
    const id = p.id as string
    return {
      ...p,
      id,
      viewer_follows: viewerFollowing.has(id),
      is_viewer: id === user.id,
    }
  })
  const sorted = enriched.sort(
    (a, b) => (orderById.get(a.id) ?? 0) - (orderById.get(b.id) ?? 0),
  )

  return NextResponse.json({
    type,
    profiles: sorted,
    pagination: { next_cursor: nextCursor, limit },
  })
}
