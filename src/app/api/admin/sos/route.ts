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
    .from('vd_sos_reports')
    .select('id, reporter_user_id, target_user_id, target_post_id, category, details, status, created_at, triaged_at, triaged_by, closed_at, closed_by')
    .in('status', ['open', 'triaged', 'escalated'])
    .order('created_at', { ascending: true })
    .limit(200)
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 })

  return NextResponse.json({ items: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = (await req.json().catch(() => null)) as
    | { id?: string; status?: 'triaged' | 'escalated' | 'closed' }
    | null
  if (!body?.id || !body.status || !['triaged', 'escalated', 'closed'].includes(body.status)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const admin = createAdminClient()
  const patch: Record<string, unknown> = { status: body.status }
  const nowIso = new Date().toISOString()
  if (body.status === 'triaged') {
    patch.triaged_at = nowIso
    patch.triaged_by = guard.ctx.user.id
  }
  if (body.status === 'closed') {
    patch.closed_at = nowIso
    patch.closed_by = guard.ctx.user.id
  }

  const { error } = await admin.from('vd_sos_reports').update(patch).eq('id', body.id)
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 })

  await logAdminAction({
    admin,
    actorId: guard.ctx.user.id,
    actorEmail: guard.ctx.email,
    action: `sos.${body.status}`,
    target: body.id,
    payload: {},
    ip: clientIpFromHeaders(req.headers),
    ua: req.headers.get('user-agent'),
  })

  return NextResponse.json({ ok: true })
}
