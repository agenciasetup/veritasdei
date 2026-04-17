import type { SupabaseClient } from '@supabase/supabase-js'
import type { FeedResponse, VeritasAuthorSnapshot, VeritasMediaAsset, VeritasMetrics, VeritasPost } from './types'
import { VERITAS_DEFAULT_PAGE_SIZE, VERITAS_MAX_PAGE_SIZE } from './constants'

interface PostRow {
  id: string
  author_user_id: string
  kind: VeritasPost['kind']
  variant: VeritasPost['variant']
  body: string
  parent_post_id: string | null
  created_at: string
}

interface AuthorRow {
  id: string
  public_handle: string | null
  user_number: number | null
  name: string | null
  vocacao: VeritasPost['author']['vocacao']
  community_role: VeritasAuthorSnapshot['community_role'] | null
  verified: boolean | null
  profile_image_url: string | null
}

interface MetricRow {
  post_id: string
  like_count: number
  repost_count: number
  quote_count: number
  reply_count: number
  share_cross_count: number
  report_count: number
  score: number
}

interface PostMediaRow {
  post_id: string
  media_asset_id: string
  position: number
}

interface MediaRow {
  id: string
  media_kind: VeritasMediaAsset['kind']
  mime_type: string
  object_key: string
  width: number | null
  height: number | null
  variants: VeritasMediaAsset['variants']
}

export function parseCursor(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

export function clampPageSize(value: number | null | undefined): number {
  if (!value || !Number.isFinite(value)) return VERITAS_DEFAULT_PAGE_SIZE
  return Math.max(1, Math.min(VERITAS_MAX_PAGE_SIZE, Math.floor(value)))
}

export async function fetchPostsByIds(
  supabase: SupabaseClient,
  viewerUserId: string,
  postIds: string[],
): Promise<VeritasPost[]> {
  if (!postIds.length) return []

  const { data: postsData, error: postsError } = await supabase
    .from('vd_posts')
    .select('id, author_user_id, kind, variant, body, parent_post_id, created_at')
    .in('id', postIds)
    .is('deleted_at', null)

  if (postsError || !postsData) {
    throw new Error(postsError?.message ?? 'Erro ao carregar posts')
  }

  const posts = postsData as PostRow[]
  const authorIds = Array.from(new Set(posts.map(post => post.author_user_id)))

  const [{ data: authorsData }, { data: metricsData }, { data: postMediaData }, { data: reactionsData }, { data: repostedData }, { data: followsData }, { data: blocksData }, { data: mutesData }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, public_handle, user_number, name, vocacao, community_role, verified, profile_image_url')
      .in('id', authorIds),
    supabase
      .from('vd_post_metrics')
      .select('post_id, like_count, repost_count, quote_count, reply_count, share_cross_count, report_count, score')
      .in('post_id', posts.map(post => post.id)),
    supabase
      .from('vd_post_media')
      .select('post_id, media_asset_id, position')
      .in('post_id', posts.map(post => post.id)),
    supabase
      .from('vd_reactions')
      .select('post_id, type')
      .eq('user_id', viewerUserId)
      .in('post_id', posts.map(post => post.id)),
    supabase
      .from('vd_posts')
      .select('parent_post_id')
      .eq('author_user_id', viewerUserId)
      .eq('kind', 'repost')
      .in('parent_post_id', posts.map(post => post.id))
      .is('deleted_at', null),
    supabase
      .from('vd_follows')
      .select('followed_user_id')
      .eq('follower_user_id', viewerUserId)
      .in('followed_user_id', authorIds),
    supabase
      .from('vd_blocks')
      .select('blocked_user_id')
      .eq('blocker_user_id', viewerUserId)
      .in('blocked_user_id', authorIds),
    supabase
      .from('vd_mutes')
      .select('muted_user_id')
      .eq('muter_user_id', viewerUserId)
      .in('muted_user_id', authorIds),
  ])

  const authorMap = new Map((authorsData as AuthorRow[] | null | undefined)?.map(author => [author.id, author]) ?? [])
  const metricMap = new Map((metricsData as MetricRow[] | null | undefined)?.map(metric => [metric.post_id, metric]) ?? [])

  const postMediaRows = (postMediaData as PostMediaRow[] | null | undefined) ?? []
  const mediaAssetIds = Array.from(new Set(postMediaRows.map(row => row.media_asset_id)))

  const mediaAssetsMap = new Map<string, MediaRow>()
  if (mediaAssetIds.length) {
    const { data: mediaAssetsData } = await supabase
      .from('vd_media_assets')
      .select('id, media_kind, mime_type, object_key, width, height, variants')
      .in('id', mediaAssetIds)

    for (const media of (mediaAssetsData as MediaRow[] | null | undefined) ?? []) {
      mediaAssetsMap.set(media.id, media)
    }
  }

  const mediaByPost = new Map<string, VeritasMediaAsset[]>()
  for (const row of postMediaRows) {
    const media = mediaAssetsMap.get(row.media_asset_id)
    if (!media) continue

    const postMediaList = mediaByPost.get(row.post_id) ?? []
    postMediaList.push({
      id: media.id,
      kind: media.media_kind,
      mime_type: media.mime_type,
      object_key: media.object_key,
      width: media.width,
      height: media.height,
      variants: media.variants,
      position: row.position,
    })
    mediaByPost.set(row.post_id, postMediaList)
  }

  for (const [, mediaList] of mediaByPost) {
    mediaList.sort((a, b) => a.position - b.position)
  }

  const likedSet = new Set(
    ((reactionsData as Array<{ post_id: string; type: 'like' | 'share_cross' }> | null | undefined) ?? [])
      .filter(reaction => reaction.type === 'like')
      .map(reaction => reaction.post_id),
  )

  const sharedCrossSet = new Set(
    ((reactionsData as Array<{ post_id: string; type: 'like' | 'share_cross' }> | null | undefined) ?? [])
      .filter(reaction => reaction.type === 'share_cross')
      .map(reaction => reaction.post_id),
  )

  const repostedSet = new Set(
    ((repostedData as Array<{ parent_post_id: string | null }> | null | undefined) ?? [])
      .map(row => row.parent_post_id)
      .filter((value): value is string => Boolean(value)),
  )

  const followsSet = new Set(
    ((followsData as Array<{ followed_user_id: string }> | null | undefined) ?? [])
      .map(row => row.followed_user_id),
  )

  const blockedSet = new Set(
    ((blocksData as Array<{ blocked_user_id: string }> | null | undefined) ?? [])
      .map(row => row.blocked_user_id),
  )

  const mutedSet = new Set(
    ((mutesData as Array<{ muted_user_id: string }> | null | undefined) ?? [])
      .map(row => row.muted_user_id),
  )

  const byId = new Map(posts.map(post => [post.id, post]))

  return postIds
    .map(id => byId.get(id))
    .filter((post): post is PostRow => Boolean(post))
    .map(post => {
      const author = authorMap.get(post.author_user_id)
      const metric = metricMap.get(post.id)
      const metrics: VeritasMetrics = {
        like_count: metric?.like_count ?? 0,
        repost_count: metric?.repost_count ?? 0,
        quote_count: metric?.quote_count ?? 0,
        reply_count: metric?.reply_count ?? 0,
        share_cross_count: metric?.share_cross_count ?? 0,
        report_count: metric?.report_count ?? 0,
        score: metric?.score ?? 0,
      }

      return {
        id: post.id,
        author_user_id: post.author_user_id,
        kind: post.kind,
        variant: post.variant ?? 'default',
        body: post.body,
        parent_post_id: post.parent_post_id,
        created_at: post.created_at,
        author: {
          id: author?.id ?? post.author_user_id,
          public_handle: author?.public_handle ?? null,
          user_number: author?.user_number ?? null,
          name: author?.name ?? null,
          vocacao: author?.vocacao ?? null,
          community_role: (author?.community_role as VeritasAuthorSnapshot['community_role']) ?? 'leigo',
          verified: Boolean(author?.verified),
          profile_image_url: author?.profile_image_url ?? null,
        },
        metrics,
        media: mediaByPost.get(post.id) ?? [],
        viewer: {
          liked: likedSet.has(post.id),
          shared_cross: sharedCrossSet.has(post.id),
          reposted: repostedSet.has(post.id),
          follows_author: followsSet.has(post.author_user_id),
          blocked_author: blockedSet.has(post.author_user_id),
          muted_author: mutedSet.has(post.author_user_id),
        },
      }
    })
}

function computeForYouScore(post: VeritasPost, nowMs: number): number {
  const createdMs = new Date(post.created_at).getTime()
  const ageHours = Math.max(0, (nowMs - createdMs) / (1000 * 60 * 60))
  const decay = Math.exp(-ageHours / 24)

  const engagement =
    (post.metrics.like_count * 1)
    + (post.metrics.reply_count * 3)
    + (post.metrics.repost_count * 4)
    + (post.metrics.quote_count * 4)
    + (post.metrics.share_cross_count * 2)

  const followBonus = post.viewer.follows_author ? 1.25 : 0
  const freshnessBonus = 1 / (1 + ageHours / 6)
  const reportPenalty = (post.metrics.report_count ?? 0) * 2.5

  return engagement * decay + followBonus + freshnessBonus - reportPenalty
}

function applyAuthorDiversity(posts: VeritasPost[]): VeritasPost[] {
  const maxPerWindow = 2
  const windowSize = 20
  const selected: VeritasPost[] = []
  const queue: string[] = []
  const inWindowCount = new Map<string, number>()
  const deferred: VeritasPost[] = []

  for (const post of posts) {
    const authorId = post.author_user_id
    const count = inWindowCount.get(authorId) ?? 0

    if (count >= maxPerWindow) {
      deferred.push(post)
      continue
    }

    selected.push(post)
    queue.push(authorId)
    inWindowCount.set(authorId, count + 1)

    if (queue.length > windowSize) {
      const removed = queue.shift()!
      const current = inWindowCount.get(removed)
      if (current && current > 1) inWindowCount.set(removed, current - 1)
      else inWindowCount.delete(removed)
    }
  }

  if (deferred.length) {
    selected.push(...deferred)
  }

  return selected
}

export function buildFeedResponse(params: {
  tab: 'for_you' | 'following'
  posts: VeritasPost[]
  limit: number
}): FeedResponse {
  const nowMs = Date.now()

  const visible = params.posts.filter(post => !post.viewer.blocked_author && !post.viewer.muted_author)

  let sorted: VeritasPost[]
  if (params.tab === 'following') {
    sorted = visible
      .sort((a, b) => {
        const dateDiff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        if (dateDiff !== 0) return dateDiff
        return b.id.localeCompare(a.id)
      })
  } else {
    sorted = visible
      .map(post => ({ post, score: computeForYouScore(post, nowMs) }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return new Date(b.post.created_at).getTime() - new Date(a.post.created_at).getTime()
      })
      .map(entry => entry.post)

    sorted = applyAuthorDiversity(sorted)
  }

  const pageItems = sorted.slice(0, params.limit)
  const cursor = pageItems.length ? pageItems[pageItems.length - 1].created_at : null

  return {
    tab: params.tab,
    cursor,
    items: pageItems,
  }
}
