import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAdminAction } from '@/lib/admin/audit'
import { hashIdentifier } from '@/lib/auth/identifier-guard'
import { clientIpFromHeaders } from '@/lib/auth/log-login-event'

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('banned_identifiers')
    .select('id, kind, value_hash, reason, banned_at, banned_by, expires_at')
    .order('banned_at', { ascending: false })
    .limit(200)
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 })

  return NextResponse.json({ items: data ?? [] })
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(['admin'])
  if (!guard.ok) return guard.response

  const body = (await req.json().catch(() => null)) as
    | { kind?: 'email' | 'ip'; value?: string; reason?: string; expiresAt?: string | null; ttlDays?: number | null }
    | null
  if (!body?.kind || !['email', 'ip'].includes(body.kind) || !body.value || body.value.length < 3) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  let expiresAtIso: string | null = null
  if (body.expiresAt) {
    const t = new Date(body.expiresAt).getTime()
    if (Number.isFinite(t)) expiresAtIso = new Date(t).toISOString()
  } else if (typeof body.ttlDays === 'number' && body.ttlDays > 0) {
    expiresAtIso = new Date(Date.now() + body.ttlDays * 86400_000).toISOString()
  }

  const admin = createAdminClient()
  const { data: inserted, error } = await admin
    .from('banned_identifiers')
    .insert({
      kind: body.kind,
      value_hash: hashIdentifier(body.value),
      reason: body.reason?.trim().slice(0, 400) ?? 'manual',
      banned_by: guard.ctx.user.id,
      expires_at: expiresAtIso,
    })
    .select('id')
    .single()

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'already_banned' }, { status: 409 })
    }
    return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 })
  }

  await logAdminAction({
    admin,
    actorId: guard.ctx.user.id,
    actorEmail: guard.ctx.email,
    action: 'bans.create',
    target: inserted.id,
    payload: { kind: body.kind, ttl_days: body.ttlDays ?? null, expires_at: expiresAtIso },
    ip: clientIpFromHeaders(req.headers),
    ua: req.headers.get('user-agent'),
  })

  return NextResponse.json({ ok: true, id: inserted.id })
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin(['admin'])
  if (!guard.ok) return guard.response

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id_required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('banned_identifiers').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 })

  await logAdminAction({
    admin,
    actorId: guard.ctx.user.id,
    actorEmail: guard.ctx.email,
    action: 'bans.delete',
    target: id,
    ip: clientIpFromHeaders(req.headers),
    ua: req.headers.get('user-agent'),
  })

  return NextResponse.json({ ok: true })
}
