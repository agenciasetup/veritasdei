import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { loadCommunityFeed } from '@/lib/community/feed-loader'
import { requireCommunitySession } from '@/lib/community/server'

// Leitura do feed é aberta a qualquer usuário logado (free ou premium).
// Apenas ações de escrita (postar, curtir, seguir) exigem Premium.
export async function GET(req: NextRequest) {
  const session = await requireCommunitySession()
  if (!session.ok) return session.response

  const { supabase, user } = session

  if (!rateLimit(`community:feed:${user.id}`, 60, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  try {
    const response = await loadCommunityFeed(supabase, user.id, {
      tab: req.nextUrl.searchParams.get('tab'),
      limit: req.nextUrl.searchParams.get('limit'),
      cursor: req.nextUrl.searchParams.get('cursor'),
      latitude: req.nextUrl.searchParams.get('lat'),
      longitude: req.nextUrl.searchParams.get('lng'),
      radiusKm: req.nextUrl.searchParams.get('radius'),
    })
    return NextResponse.json(response)
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'feed_failed'
    return NextResponse.json({ error: 'feed_failed', detail }, { status: 500 })
  }
}
