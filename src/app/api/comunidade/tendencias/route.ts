import { NextRequest, NextResponse } from 'next/server'
import { requireCommunitySession } from '@/lib/community/server'
import { rateLimit } from '@/lib/rate-limit'

// Tendências são leitura — abertas a qualquer usuário logado.
export async function GET(req: NextRequest) {
  const session = await requireCommunitySession()
  if (!session.ok) return session.response

  const { supabase, user } = session

  if (!rateLimit(`community:trending:${user.id}`, 60, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const url = new URL(req.url)
  const windowDays = Number(url.searchParams.get('window_days') ?? 7)
  const limit = Number(url.searchParams.get('limit') ?? 10)

  const { data, error } = await supabase.rpc('get_trending_hashtags', {
    window_days: Math.min(Math.max(Number.isFinite(windowDays) ? windowDays : 7, 1), 30),
    page_size: Math.min(Math.max(Number.isFinite(limit) ? limit : 10, 1), 30),
  })

  if (error) {
    return NextResponse.json(
      { error: 'trending_failed', detail: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({ hashtags: data ?? [] })
}
