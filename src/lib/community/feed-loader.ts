import type { SupabaseClient } from '@supabase/supabase-js'
import { VERITAS_AUTO_HIDE_REPORT_THRESHOLD } from './constants'
import { buildFeedResponse, clampPageSize, fetchPostsByIds, parseCursor } from './posts'
import type { FeedResponse } from './types'

export type FeedTab = 'for_you' | 'following'

export interface FeedLoadParams {
  tab?: FeedTab | string | null
  limit?: number | string | null
  cursor?: string | null
}

/**
 * Lógica de montagem do feed compartilhada entre o handler HTTP
 * (`/api/comunidade/feed`) e o Server Component de `/comunidade/page.tsx`.
 *
 * Recebe supabase autenticado + user.id e devolve o `FeedResponse` pronto
 * para hidratar o `CommunityFeedClient`. Mantém o algoritmo original —
 * "for_you" com ranking + diversidade, "following" ordenado por data.
 */
export async function loadCommunityFeed(
  supabase: SupabaseClient,
  viewerUserId: string,
  params: FeedLoadParams,
): Promise<FeedResponse> {
  const tab: FeedTab = params.tab === 'following' ? 'following' : 'for_you'
  const limit = clampPageSize(
    typeof params.limit === 'string' ? Number(params.limit) : (params.limit ?? 20),
  )
  const cursor = parseCursor(typeof params.cursor === 'string' ? params.cursor : null)

  const { data: followsRows } = await supabase
    .from('vd_follows')
    .select('followed_user_id')
    .eq('follower_user_id', viewerUserId)

  const followingIds = new Set(
    ((followsRows ?? []) as Array<{ followed_user_id: string }>).map(row => row.followed_user_id),
  )

  let candidateIds: string[] = []

  if (tab === 'following') {
    const followedAndSelf = Array.from(new Set([...followingIds, viewerUserId]))
    if (followedAndSelf.length === 0) {
      return { tab, cursor: null, items: [] }
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
    if (error) throw new Error(error.message)

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
        const followedAndSelf = Array.from(new Set([...followingIds, viewerUserId]))
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

    if (recentRes.error) throw new Error(recentRes.error.message)
    if (followingRes.error) throw new Error(followingRes.error.message)

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

  const posts = await fetchPostsByIds(supabase, viewerUserId, candidateIds)

  const filtered = tab === 'following'
    ? posts.filter(post => (
      (post.author_user_id === viewerUserId || post.viewer.follows_author)
      && post.metrics.report_count < VERITAS_AUTO_HIDE_REPORT_THRESHOLD
    ))
    : posts.filter(post => post.metrics.report_count < VERITAS_AUTO_HIDE_REPORT_THRESHOLD)

  return buildFeedResponse({ tab, posts: filtered, limit })
}
