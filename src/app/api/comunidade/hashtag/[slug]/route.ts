import { NextRequest, NextResponse } from 'next/server'
import { fetchPostsByIds } from '@/lib/community/posts'
import { requireCommunityPremiumAccess } from '@/lib/community/server'
import { rateLimit } from '@/lib/rate-limit'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 40

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const access = await requireCommunityPremiumAccess()
  if (!access.ok) return access.response

  const { slug: rawSlug } = await params
  const { supabase, user } = access.context

  if (!rateLimit(`community:hashtag:${user.id}`, 60, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  // Normaliza o slug da URL (decode + lowercase). A tabela guarda já
  // normalizado (lowercase + unaccented + [a-z0-9_]{2,50}).
  const slug = decodeURIComponent(rawSlug).toLowerCase().trim()
  if (!/^[a-z0-9_]{2,50}$/.test(slug)) {
    return NextResponse.json({ error: 'invalid_slug' }, { status: 400 })
  }

  const url = new URL(req.url)
  const limitParam = Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT)
  const cursor = url.searchParams.get('cursor')
  const limit = Math.min(
    Math.max(Number.isFinite(limitParam) ? limitParam : DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  )

  const { data: hashtag, error: hashtagError } = await supabase
    .from('vd_hashtags')
    .select('id, slug, display, usage_count, last_used_at')
    .eq('slug', slug)
    .maybeSingle()

  if (hashtagError) {
    return NextResponse.json(
      { error: 'hashtag_lookup_failed', detail: hashtagError.message },
      { status: 500 },
    )
  }

  if (!hashtag) {
    return NextResponse.json({
      hashtag: { slug, display: `#${slug}`, usage_count: 0, last_used_at: null },
      posts: [],
      pagination: { next_cursor: null, limit },
    })
  }

  let junctionQuery = supabase
    .from('vd_post_hashtags')
    .select('post_id, created_at')
    .eq('hashtag_id', hashtag.id)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    junctionQuery = junctionQuery.lt('created_at', cursor)
  }

  const { data: junctionRows, error: junctionError } = await junctionQuery

  if (junctionError) {
    return NextResponse.json(
      { error: 'posts_lookup_failed', detail: junctionError.message },
      { status: 500 },
    )
  }

  const rows = (junctionRows ?? []) as Array<{ post_id: string; created_at: string }>
  const hasMore = rows.length > limit
  const pageRows = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore ? pageRows[pageRows.length - 1]?.created_at ?? null : null

  // fetchPostsByIds já filtra soft-deleted. Reposts não entram na junção
  // (trigger pula), então não precisamos filtrar por kind aqui.
  const posts = await fetchPostsByIds(
    supabase,
    user.id,
    pageRows.map(row => row.post_id),
  )

  // Preserva ordem do junction (por created_at desc da junção, que é o
  // momento em que o post foi indexado com a hashtag).
  const orderById = new Map(pageRows.map((row, idx) => [row.post_id, idx]))
  const sortedPosts = posts.sort(
    (a, b) => (orderById.get(a.id) ?? 0) - (orderById.get(b.id) ?? 0),
  )

  return NextResponse.json({
    hashtag: {
      slug: hashtag.slug,
      display: hashtag.display,
      usage_count: hashtag.usage_count,
      last_used_at: hashtag.last_used_at,
    },
    posts: sortedPosts,
    pagination: { next_cursor: nextCursor, limit },
  })
}
