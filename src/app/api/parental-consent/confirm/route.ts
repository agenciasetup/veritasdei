import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashToken } from '@/lib/legal/parental-token'
import { sendParentalConsentConfirmedEmails } from '@/lib/legal/parental-email'

type Body = {
  token?: string
  parentName?: string
  parentRelation?: 'pai' | 'mae' | 'tutor_legal' | 'responsavel_legal'
}

function clientIp(req: NextRequest): string | null {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip')
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const token = body.token?.trim()
  const parentName = body.parentName?.trim()
  const parentRelation = body.parentRelation

  if (!token || token.length < 32) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 })
  }
  if (!parentName || parentName.length < 3 || parentName.length > 120) {
    return NextResponse.json({ error: 'invalid_parent_name' }, { status: 400 })
  }
  if (!parentRelation || !['pai', 'mae', 'tutor_legal', 'responsavel_legal'].includes(parentRelation)) {
    return NextResponse.json({ error: 'invalid_parent_relation' }, { status: 400 })
  }

  const tokenHash = hashToken(token)
  const admin = createAdminClient()

  const { data: consent, error: selectError } = await admin
    .from('parental_consents')
    .select('id, user_id, parent_email, expires_at, confirmed_at, revoked_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()
  if (selectError) {
    return NextResponse.json({ error: 'db_error', detail: selectError.message }, { status: 500 })
  }
  if (!consent) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (consent.revoked_at) return NextResponse.json({ error: 'revoked' }, { status: 410 })
  if (consent.confirmed_at) return NextResponse.json({ error: 'already_confirmed' }, { status: 409 })
  if (new Date(consent.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'expired' }, { status: 410 })
  }

  const ip = clientIp(req)
  const nowIso = new Date().toISOString()

  const { error: updateError } = await admin
    .from('parental_consents')
    .update({
      confirmed_at: nowIso,
      confirmed_ip: ip,
      parent_name: parentName,
      parent_relation: parentRelation,
    })
    .eq('id', consent.id)
  if (updateError) {
    return NextResponse.json({ error: 'db_error', detail: updateError.message }, { status: 500 })
  }

  const { error: statusError } = await admin
    .from('profiles')
    .update({ account_status: 'active' })
    .eq('id', consent.user_id)
  if (statusError) {
    return NextResponse.json({ error: 'db_error', detail: statusError.message }, { status: 500 })
  }

  try {
    const { data: profile } = await admin
      .from('profiles')
      .select('display_name')
      .eq('id', consent.user_id)
      .maybeSingle()
    const { data: authUser } = await admin.auth.admin.getUserById(consent.user_id)
    await sendParentalConsentConfirmedEmails({
      parentEmail: consent.parent_email,
      parentName: parentName,
      minorName: profile?.display_name ?? 'um adolescente',
      minorEmail: authUser?.user?.email ?? null,
    })
  } catch (err) {
    console.error('[parental-consent/confirm] e-mail confirmação falhou:', err)
  }

  return NextResponse.json({ ok: true })
}
