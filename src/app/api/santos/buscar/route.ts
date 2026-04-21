import { NextResponse, type NextRequest } from 'next/server'
import { getTop30Santos, searchSantos } from '@/lib/santos/queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 20, 1), 40)
  const top = url.searchParams.get('top') === '1'

  if (top || q.length < 2) {
    const santos = await getTop30Santos()
    return NextResponse.json(
      { santos },
      { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } }
    )
  }

  const santos = await searchSantos(q, limit)
  return NextResponse.json(
    { santos },
    { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } }
  )
}
