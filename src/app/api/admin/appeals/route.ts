import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAdminAction } from '@/lib/admin/audit'
import { clientIpFromHeaders } from '@/lib/auth/log-login-event'

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('vd_report_appeals')
    .select('id, user_id, post_id, report_id, reason, status, resolved_by, resolved_at, resolution_note, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(200)
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 })

  return NextResponse.json({ items: data ?? [] })
}

type Decision = 'upheld' | 'denied' | 'dismissed'

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = (await req.json().catch(() => null)) as
    | { id?: string; decision?: Decision; note?: string; overrideSameModerator?: boolean }
    | null
  if (!body?.id || !body.decision || !['upheld', 'denied', 'dismissed'].includes(body.decision)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: appeal, error: lookupErr } = await admin
    .from('vd_report_appeals')
    .select('id, post_id, report_id, status')
    .eq('id', body.id)
    .maybeSingle()
  if (lookupErr) return NextResponse.json({ error: 'db_error', detail: lookupErr.message }, { status: 500 })
  if (!appeal) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (appeal.status !== 'pending') return NextResponse.json({ error: 'already_resolved' }, { status: 409 })

  if (appeal.report_id) {
    const { data: original } = await admin
      .from('vd_reports')
      .select('reporter_user_id')
      .eq('id', appeal.report_id)
      .maybeSingle()
    if (original?.reporter_user_id === guard.ctx.user.id && !body.overrideSameModerator) {
      return NextResponse.json({ error: 'same_moderator_block' }, { status: 409 })
    }
  }

  const note = body.note?.trim().slice(0, 2000) || null

  const { error: updErr } = await admin
    .from('vd_report_appeals')
    .update({
      status: body.decision,
      resolved_by: guard.ctx.user.id,
      resolved_at: new Date().toISOString(),
      resolution_note: note,
    })
    .eq('id', body.id)
  if (updErr) return NextResponse.json({ error: 'db_error', detail: updErr.message }, { status: 500 })

  if (body.decision === 'upheld' && appeal.post_id) {
    await admin.from('vd_posts').update({ deleted_at: null }).eq('id', appeal.post_id)
  }

  await logAdminAction({
    admin,
    actorId: guard.ctx.user.id,
    actorEmail: guard.ctx.email,
    action: `appeals.${body.decision}`,
    target: body.id,
    payload: {
      post_id: appeal.post_id,
      report_id: appeal.report_id,
      override_same_moderator: body.overrideSameModerator ?? false,
    },
    ip: clientIpFromHeaders(req.headers),
    ua: req.headers.get('user-agent'),
  })

  return NextResponse.json({ ok: true })
}
