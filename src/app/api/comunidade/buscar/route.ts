import { NextRequest, NextResponse } from 'next/server'
import { fetchPostsByIds } from '@/lib/community/posts'
import { requireCommunitySession } from '@/lib/community/server'
import { rateLimit } from '@/lib/rate-limit'

const VALID_TABS = new Set(['top', 'posts', 'people', 'hashtags'])

// Busca aberta a qualquer usuário logado — apenas escrever exige Premium.
export async function GET(req: NextRequest) {
  const session = await requireCommunitySession()
  if (!session.ok) return session.response

  const { supabase, user } = session

  if (!rateLimit(`community:search:${user.id}`, 60, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  const tab = url.searchParams.get('tab') ?? 'top'

  if (!VALID_TABS.has(tab)) {
    return NextResponse.json({ error: 'invalid_tab' }, { status: 400 })
  }

  if (q.length < 2) {
    return NextResponse.json({
      query: q,
      tab,
      posts: [],
      people: [],
      hashtags: [],
    })
  }

  // Decide quais RPCs rodar. Em "top" roda todas com limites menores.
  const runPosts = tab === 'top' || tab === 'posts'
  const runPeople = tab === 'top' || tab === 'people'
  const runHashtags = tab === 'top' || tab === 'hashtags'

  const topLimit = 5
  const fullLimit = 20
  const postsLimit = tab === 'top' ? topLimit : fullLimit
  const peopleLimit = tab === 'top' ? topLimit : fullLimit
  const hashtagsLimit = tab === 'top' ? topLimit : 20

  const [postResults, peopleResults, hashtagResults] = await Promise.all([
    runPosts
      ? supabase.rpc('search_community_posts', {
          q,
          cursor_created_at: null,
          cursor_id: null,
          page_size: postsLimit,
        })
      : Promise.resolve({ data: [], error: null }),
    runPeople
      ? supabase.rpc('search_community_people', {
          q,
          cursor_rank: null,
          cursor_id: null,
          page_size: peopleLimit,
        })
      : Promise.resolve({ data: [], error: null }),
    runHashtags
      ? supabase.rpc('search_community_hashtags', {
          q,
          page_size: hashtagsLimit,
        })
      : Promise.resolve({ data: [], error: null }),
  ])

  if (postResults.error) {
    return NextResponse.json(
      { error: 'posts_failed', detail: postResults.error.message },
      { status: 500 },
    )
  }
  if (peopleResults.error) {
    return NextResponse.json(
      { error: 'people_failed', detail: peopleResults.error.message },
      { status: 500 },
    )
  }
  if (hashtagResults.error) {
    return NextResponse.json(
      { error: 'hashtags_failed', detail: hashtagResults.error.message },
      { status: 500 },
    )
  }

  // Hydrata os posts com metrics/media/viewer via fetchPostsByIds.
  const postRows = (postResults.data ?? []) as Array<{ id: string }>
  const posts = postRows.length
    ? await fetchPostsByIds(supabase, user.id, postRows.map(r => r.id))
    : []

  // Preserva ordem do RPC.
  const orderById = new Map(postRows.map((r, idx) => [r.id, idx]))
  const sortedPosts = posts.sort(
    (a, b) => (orderById.get(a.id) ?? 0) - (orderById.get(b.id) ?? 0),
  )

  return NextResponse.json({
    query: q,
    tab,
    posts: sortedPosts,
    people: peopleResults.data ?? [],
    hashtags: hashtagResults.data ?? [],
  })
}
