import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateToken } from '@/lib/legal/parental-token'
import { sendParentalConsentRequestEmail } from '@/lib/legal/parental-email'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const allowed = await rateLimit(`parental:resend:${user.id}`, 3, 60 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json({ error: 'rate_limited', retryAfterSeconds: 3600 }, { status: 429 })
  }

  const { data: latest, error: lookupErr } = await supabase
    .from('parental_consents')
    .select('id, parent_email, requested_at, expires_at, confirmed_at, revoked_at')
    .eq('user_id', user.id)
    .is('confirmed_at', null)
    .is('revoked_at', null)
    .order('requested_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (lookupErr) {
    return NextResponse.json({ error: 'db_error', detail: lookupErr.message }, { status: 500 })
  }
  if (!latest) {
    return NextResponse.json({ error: 'no_pending_consent' }, { status: 404 })
  }

  const requestedAt = new Date(latest.requested_at).getTime()
  if (Date.now() - requestedAt < 60 * 60 * 1000) {
    return NextResponse.json(
      { error: 'too_soon', retryAfterSeconds: Math.ceil((60 * 60 * 1000 - (Date.now() - requestedAt)) / 1000) },
      { status: 429 },
    )
  }

  await supabase
    .from('parental_consents')
    .update({ revoked_at: new Date().toISOString(), revoked_reason: 'resent' })
    .eq('id', latest.id)

  const { token, tokenHash } = generateToken()
  const { data: inserted, error: insertErr } = await supabase
    .from('parental_consents')
    .insert({
      user_id: user.id,
      parent_email: latest.parent_email,
      token_hash: tokenHash,
    })
    .select('expires_at')
    .single()
  if (insertErr || !inserted) {
    return NextResponse.json({ error: 'db_error', detail: insertErr?.message }, { status: 500 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin

  let emailDelivered = false
  let emailError: string | undefined
  try {
    await sendParentalConsentRequestEmail({
      parentEmail: latest.parent_email,
      minorName: profile?.display_name ?? 'um adolescente',
      token,
      expiresAt: new Date(inserted.expires_at),
      baseUrl,
    })
    emailDelivered = true
  } catch (err) {
    emailError = err instanceof Error ? err.message : String(err)
    console.error('[parental-consent/resend] e-mail falhou:', emailError)
  }

  return NextResponse.json({
    ok: true,
    parentEmail: latest.parent_email,
    expiresAt: inserted.expires_at,
    emailDelivered,
    ...(emailError ? { emailError } : {}),
  })
}
