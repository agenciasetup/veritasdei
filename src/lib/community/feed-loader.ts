import type { SupabaseClient } from '@supabase/supabase-js'
import { VERITAS_AUTO_HIDE_REPORT_THRESHOLD } from './constants'
import { buildFeedResponse, clampPageSize, fetchPostsByIds, parseCursor } from './posts'
import type { FeedResponse } from './types'

export type FeedTab = 'for_you' | 'following' | 'nearby'

export interface FeedLoadParams {
  tab?: FeedTab | string | null
  limit?: number | string | null
  cursor?: string | null
  /** Usado apenas quando tab === 'nearby'. Se ausente, cai na localização salva
   *  no profile; se nem isso existir, devolve feed vazio. */
  latitude?: number | string | null
  longitude?: number | string | null
  /** Raio em km para tab 'nearby'. Default 60. */
  radiusKm?: number | string | null
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
  const tab: FeedTab =
    params.tab === 'following' ? 'following'
    : params.tab === 'nearby' ? 'nearby'
    : 'for_you'
  const limit = clampPageSize(
    typeof params.limit === 'string' ? Number(params.limit) : (params.limit ?? 20),
  )
  const cursor = parseCursor(typeof params.cursor === 'string' ? params.cursor : null)

  if (tab === 'nearby') {
    return loadNearbyFeed(supabase, viewerUserId, params, { limit, cursor })
  }

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

function coerceNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const n = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(n) ? n : null
}

async function loadNearbyFeed(
  supabase: SupabaseClient,
  viewerUserId: string,
  params: FeedLoadParams,
  resolved: { limit: number; cursor: string | null },
): Promise<FeedResponse> {
  let lat = coerceNumber(params.latitude)
  let lng = coerceNumber(params.longitude)

  // Fallback: usa localização salva no profile se o client não mandou.
  if (lat === null || lng === null) {
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('location_lat, location_lng')
      .eq('id', viewerUserId)
      .maybeSingle()

    const row = profileRow as { location_lat: number | null; location_lng: number | null } | null
    if (row?.location_lat !== null && row?.location_lng !== null && row) {
      lat = Number(row.location_lat)
      lng = Number(row.location_lng)
    }
  }

  if (lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { tab: 'nearby', cursor: null, items: [] }
  }

  const radiusKm = Math.max(1, Math.min(200, coerceNumber(params.radiusKm) ?? 60))

  const { data: rpcRows, error } = await supabase.rpc('get_nearby_veritas', {
    p_viewer_id: viewerUserId,
    p_lat: lat,
    p_lng: lng,
    p_radius_km: radiusKm,
    p_limit: Math.max(resolved.limit * 3, 80),
    p_cursor: resolved.cursor,
  })

  if (error) throw new Error(error.message)

  const candidateIds = ((rpcRows ?? []) as Array<{ id: string }>).map(row => row.id)
  if (!candidateIds.length) {
    return { tab: 'nearby', cursor: null, items: [] }
  }

  const posts = await fetchPostsByIds(supabase, viewerUserId, candidateIds)
  const filtered = posts.filter(post => post.metrics.report_count < VERITAS_AUTO_HIDE_REPORT_THRESHOLD)

  return buildFeedResponse({ tab: 'nearby', posts: filtered, limit: resolved.limit })
}
