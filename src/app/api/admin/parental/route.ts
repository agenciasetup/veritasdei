import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAdminAction } from '@/lib/admin/audit'
import { generateToken, buildConsentUrl } from '@/lib/legal/parental-token'
import { sendParentalConsentRequestEmail } from '@/lib/legal/parental-email'
import { clientIpFromHeaders } from '@/lib/auth/log-login-event'

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('parental_consents')
    .select('id, user_id, parent_email, requested_at, expires_at')
    .is('confirmed_at', null)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('requested_at', { ascending: false })
    .limit(200)
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 })

  return NextResponse.json({ items: data ?? [] })
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = (await req.json().catch(() => null)) as
    | { action?: 'resend' | 'cancel' | 'copy_link'; userId?: string }
    | null
  if (!body?.action || !body.userId) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: latest, error: lookupErr } = await admin
    .from('parental_consents')
    .select('id, parent_email')
    .eq('user_id', body.userId)
    .is('confirmed_at', null)
    .is('revoked_at', null)
    .order('requested_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (lookupErr) return NextResponse.json({ error: 'db_error', detail: lookupErr.message }, { status: 500 })
  if (!latest) return NextResponse.json({ error: 'no_pending_consent' }, { status: 404 })

  if (body.action === 'cancel') {
    await admin
      .from('parental_consents')
      .update({ revoked_at: new Date().toISOString(), revoked_reason: 'admin_cancel' })
      .eq('id', latest.id)

    await logAdminAction({
      admin,
      actorId: guard.ctx.user.id,
      actorEmail: guard.ctx.email,
      action: 'parental.cancel',
      target: body.userId,
      ip: clientIpFromHeaders(req.headers),
      ua: req.headers.get('user-agent'),
    })
    return NextResponse.json({ ok: true })
  }

  await admin
    .from('parental_consents')
    .update({ revoked_at: new Date().toISOString(), revoked_reason: `admin_${body.action}` })
    .eq('id', latest.id)

  const { token, tokenHash } = generateToken()
  const { data: inserted, error: insertErr } = await admin
    .from('parental_consents')
    .insert({
      user_id: body.userId,
      parent_email: latest.parent_email,
      token_hash: tokenHash,
    })
    .select('expires_at')
    .single()
  if (insertErr || !inserted) {
    return NextResponse.json({ error: 'db_error', detail: insertErr?.message }, { status: 500 })
  }

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin).replace(/\/$/, '')
  const consentUrl = buildConsentUrl(baseUrl, token)

  if (body.action === 'resend') {
    const { data: profile } = await admin
      .from('profiles')
      .select('name')
      .eq('id', body.userId)
      .maybeSingle()
    let emailDelivered = false
    let emailError: string | undefined
    try {
      await sendParentalConsentRequestEmail({
        parentEmail: latest.parent_email,
        minorName: profile?.name ?? 'um adolescente',
        token,
        expiresAt: new Date(inserted.expires_at),
        baseUrl,
      })
      emailDelivered = true
    } catch (err) {
      emailError = err instanceof Error ? err.message : String(err)
    }

    await logAdminAction({
      admin,
      actorId: guard.ctx.user.id,
      actorEmail: guard.ctx.email,
      action: 'parental.resend',
      target: body.userId,
      payload: { emailDelivered, emailError },
      ip: clientIpFromHeaders(req.headers),
      ua: req.headers.get('user-agent'),
    })
    return NextResponse.json({ ok: true, emailDelivered, ...(emailError ? { emailError } : {}) })
  }

  await logAdminAction({
    admin,
    actorId: guard.ctx.user.id,
    actorEmail: guard.ctx.email,
    action: 'parental.copy_link',
    target: body.userId,
    ip: clientIpFromHeaders(req.headers),
    ua: req.headers.get('user-agent'),
  })
  return NextResponse.json({ ok: true, consentUrl })
}
