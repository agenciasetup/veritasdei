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
    .from('profiles')
    .select('id, name, deletion_scheduled_for, deletion_requested_at')
    .eq('account_status', 'pending_deletion')
    .order('deletion_scheduled_for', { ascending: true })
    .limit(200)
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 })

  return NextResponse.json({ items: data ?? [] })
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(['admin'])
  if (!guard.ok) return guard.response

  const body = (await req.json().catch(() => null)) as
    | { userId?: string; action?: 'execute_now' | 'restore' }
    | null
  if (!body?.userId || !body.action || !['execute_now', 'restore'].includes(body.action)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const admin = createAdminClient()
  if (body.action === 'execute_now') {
    const { error } = await admin.rpc('soft_delete_user', { p_user_id: body.userId })
    if (error) return NextResponse.json({ error: 'rpc_error', detail: error.message }, { status: 500 })
  } else {
    const { error } = await admin.rpc('cancel_account_deletion', { p_user_id: body.userId })
    if (error) return NextResponse.json({ error: 'rpc_error', detail: error.message }, { status: 500 })
  }

  await logAdminAction({
    admin,
    actorId: guard.ctx.user.id,
    actorEmail: guard.ctx.email,
    action: `lgpd.${body.action}`,
    target: body.userId,
    ip: clientIpFromHeaders(req.headers),
    ua: req.headers.get('user-agent'),
  })

  return NextResponse.json({ ok: true })
}
