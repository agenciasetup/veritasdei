import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { VERITAS_AUTO_HIDE_REPORT_THRESHOLD } from '@/lib/community/constants'
import { buildFeedResponse, clampPageSize, fetchPostsByIds, parseCursor } from '@/lib/community/posts'
import { requireCommunityPremiumAccess } from '@/lib/community/server'

export async function GET(req: NextRequest) {
  const access = await requireCommunityPremiumAccess()
  if (!access.ok) return access.response

  const { supabase, user } = access.context

  if (!rateLimit(`community:feed:${user.id}`, 60, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const tab = req.nextUrl.searchParams.get('tab') === 'following' ? 'following' : 'for_you'
  const limit = clampPageSize(Number(req.nextUrl.searchParams.get('limit') ?? '20'))
  const cursor = parseCursor(req.nextUrl.searchParams.get('cursor'))

  const { data: followsRows } = await supabase
    .from('vd_follows')
    .select('followed_user_id')
    .eq('follower_user_id', user.id)

  const followingIds = new Set(((followsRows ?? []) as Array<{ followed_user_id: string }>).map(row => row.followed_user_id))

  let candidateIds: string[] = []

  if (tab === 'following') {
    const followedAndSelf = Array.from(new Set([...followingIds, user.id]))
    if (followedAndSelf.length === 0) {
      return NextResponse.json({ tab, cursor: null, items: [] })
    }

    let query = supabase
      .from('vd_posts')
      .select('id, created_at')
      .in('author_user_id', followedAndSelf)
      .neq('kind', 'reply')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(Math.max(limit * 3, 80))

    if (cursor) query = query.lt('created_at', cursor)

    const { data: rows, error } = await query

    if (error) {
      return NextResponse.json({ error: 'feed_query_failed', detail: error.message }, { status: 500 })
    }

    candidateIds = ((rows ?? []) as Array<{ id: string }>).map(row => row.id)
  } else {
    const now = Date.now()
    const recent72h = new Date(now - (72 * 60 * 60 * 1000)).toISOString()
    const recent7d = new Date(now - (7 * 24 * 60 * 60 * 1000)).toISOString()

    let recentQuery = supabase
      .from('vd_posts')
      .select('id, created_at')
      .gte('created_at', recent72h)
      .neq('kind', 'reply')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(220)

    if (cursor) recentQuery = recentQuery.lt('created_at', cursor)

    const [recentRes, followingRes] = await Promise.all([
      recentQuery,
      (() => {
        const followedAndSelf = Array.from(new Set([...followingIds, user.id]))
        if (!followedAndSelf.length) {
          return Promise.resolve({ data: [] as Array<{ id: string }>, error: null })
        }

        let q = supabase
          .from('vd_posts')
          .select('id, created_at')
          .in('author_user_id', followedAndSelf)
          .gte('created_at', recent7d)
          .neq('kind', 'reply')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(140)

        if (cursor) q = q.lt('created_at', cursor)
        return q
      })(),
    ])

    if (recentRes.error) {
      return NextResponse.json({ error: 'feed_recent_failed', detail: recentRes.error.message }, { status: 500 })
    }

    if (followingRes.error) {
      return NextResponse.json({ error: 'feed_following_recent_failed', detail: followingRes.error.message }, { status: 500 })
    }

    const merged = [
      ...((recentRes.data ?? []) as Array<{ id: string }>),
      ...((followingRes.data ?? []) as Array<{ id: string }>),
    ]

    const unique = new Set<string>()
    for (const row of merged) unique.add(row.id)
    candidateIds = Array.from(unique)

    if (candidateIds.length < 60) {
      let fallbackQuery = supabase
        .from('vd_posts')
        .select('id')
        .gte('created_at', recent7d)
        .neq('kind', 'reply')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(180)

      if (cursor) fallbackQuery = fallbackQuery.lt('created_at', cursor)

      const { data: fallbackRows } = await fallbackQuery
      for (const row of ((fallbackRows ?? []) as Array<{ id: string }>)) {
        unique.add(row.id)
      }
      candidateIds = Array.from(unique)
    }
  }

  const posts = await fetchPostsByIds(supabase, user.id, candidateIds)

  const filteredPosts = tab === 'following'
    ? posts.filter(post => (
      (post.author_user_id === user.id || post.viewer.follows_author)
      && post.metrics.report_count < VERITAS_AUTO_HIDE_REPORT_THRESHOLD
    ))
    : posts.filter(post => post.metrics.report_count < VERITAS_AUTO_HIDE_REPORT_THRESHOLD)

  const response = buildFeedResponse({
    tab,
    posts: filteredPosts,
    limit,
  })

  return NextResponse.json(response)
}
