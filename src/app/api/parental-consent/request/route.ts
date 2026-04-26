import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateToken } from '@/lib/legal/parental-token'
import { sendParentalConsentRequestEmail } from '@/lib/legal/parental-email'

type Body = {
  parentEmail?: string
}

function clientIp(req: NextRequest): string | null {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip')
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parentEmail = body.parentEmail?.trim().toLowerCase()
  if (!parentEmail || !isValidEmail(parentEmail)) {
    return NextResponse.json({ error: 'invalid_parent_email' }, { status: 400 })
  }

  if (parentEmail === user.email?.toLowerCase()) {
    return NextResponse.json({ error: 'parent_email_cannot_be_own_email' }, { status: 400 })
  }

  const { token, tokenHash } = generateToken()
  const ip = clientIp(req)

  const { data: inserted, error: insertError } = await supabase
    .from('parental_consents')
    .insert({
      user_id: user.id,
      parent_email: parentEmail,
      token_hash: tokenHash,
      requested_ip: ip,
    })
    .select('expires_at')
    .single()
  if (insertError || !inserted) {
    return NextResponse.json({ error: 'db_error', detail: insertError?.message }, { status: 500 })
  }

  const { error: statusError } = await supabase
    .from('profiles')
    .update({ account_status: 'pending_parental_consent' })
    .eq('id', user.id)
  if (statusError) {
    return NextResponse.json({ error: 'db_error', detail: statusError.message }, { status: 500 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin

  let emailDelivered = false
  let emailError: string | undefined
  try {
    await sendParentalConsentRequestEmail({
      parentEmail,
      minorName: profile?.name ?? 'um adolescente',
      token,
      expiresAt: new Date(inserted.expires_at),
      baseUrl,
    })
    emailDelivered = true
  } catch (err) {
    emailError = err instanceof Error ? err.message : String(err)
    console.error('[parental-consent/request] e-mail falhou:', emailError)
  }

  return NextResponse.json({
    ok: true,
    parentEmail,
    expiresAt: inserted.expires_at,
    emailDelivered,
    ...(emailError ? { emailError } : {}),
  })
}
