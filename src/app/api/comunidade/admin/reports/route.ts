import { NextRequest, NextResponse } from 'next/server'
import { requireCommunitySession } from '@/lib/community/server'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const session = await requireCommunitySession()
  if (!session.ok) return session.response

  const { supabase, user } = session

  if (!rateLimit(`community:admin:reports:${user.id}`, 60, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const url = new URL(req.url)
  const cursor = url.searchParams.get('cursor')
  const limit = 30

  const { data, error } = await supabase.rpc('admin_list_open_reports', {
    cursor_created_at: cursor,
    page_size: limit + 1,
  })

  if (error) {
    return NextResponse.json(
      { error: error.message.includes('negado') ? 'forbidden' : 'db_error', detail: error.message },
      { status: error.message.includes('negado') ? 403 : 500 },
    )
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>
  const hasMore = rows.length > limit
  const pageRows = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore
    ? (pageRows[pageRows.length - 1]?.report_created_at as string | null) ?? null
    : null

  return NextResponse.json({
    reports: pageRows,
    pagination: { next_cursor: nextCursor, limit },
  })
}
