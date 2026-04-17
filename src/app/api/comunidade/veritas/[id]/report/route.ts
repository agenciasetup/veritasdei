import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { VERITAS_MAX_REPORT_DETAILS, VERITAS_MAX_REASONS } from '@/lib/community/constants'
import { COMMUNITY_EVENTS } from '@/lib/community/events'
import { requireCommunityPremiumAccess } from '@/lib/community/server'

interface ReportBody {
  reason: string
  details?: string | null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await requireCommunityPremiumAccess()
  if (!access.ok) return access.response

  const { id } = await params
  const { supabase, user } = access.context

  if (!rateLimit(`community:report:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let body: ReportBody
  try {
    body = await req.json() as ReportBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const reason = (body.reason ?? '').trim()
  const details = body.details?.trim() || null

  if (reason.length < 3 || reason.length > VERITAS_MAX_REASONS) {
    return NextResponse.json({ error: 'invalid_reason' }, { status: 400 })
  }

  if (details && details.length > VERITAS_MAX_REPORT_DETAILS) {
    return NextResponse.json({ error: 'details_too_long' }, { status: 400 })
  }

  const { error } = await supabase
    .from('vd_reports')
    .upsert({
      reporter_user_id: user.id,
      post_id: id,
      reason,
      details,
      status: 'open',
    }, {
      onConflict: 'reporter_user_id,post_id',
    })

  if (error) {
    return NextResponse.json({ error: 'report_failed', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({ event: COMMUNITY_EVENTS.reportCreated, ok: true })
}
