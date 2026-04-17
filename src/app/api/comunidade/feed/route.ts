import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { loadCommunityFeed } from '@/lib/community/feed-loader'
import { requireCommunityPremiumAccess } from '@/lib/community/server'

export async function GET(req: NextRequest) {
  const access = await requireCommunityPremiumAccess()
  if (!access.ok) return access.response

  const { supabase, user } = access.context

  if (!rateLimit(`community:feed:${user.id}`, 60, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  try {
    const response = await loadCommunityFeed(supabase, user.id, {
      tab: req.nextUrl.searchParams.get('tab'),
      limit: req.nextUrl.searchParams.get('limit'),
      cursor: req.nextUrl.searchParams.get('cursor'),
    })
    return NextResponse.json(response)
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'feed_failed'
    return NextResponse.json({ error: 'feed_failed', detail }, { status: 500 })
  }
}
