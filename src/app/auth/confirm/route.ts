import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { safeNext } from '@/lib/auth/safe-next'
import type { EmailOtpType } from '@supabase/supabase-js'

function getOrigin(requestUrl: string): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  return new URL(requestUrl).origin
}

// Whitelist dos tipos aceitos pelo verifyOtp. Qualquer string fora disso
// cai no fluxo de erro, em vez de ser passada direto ao Supabase.
const VALID_OTP_TYPES: ReadonlySet<EmailOtpType> = new Set<EmailOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
])

function parseOtpType(raw: string | null): EmailOtpType | null {
  if (!raw) return null
  return VALID_OTP_TYPES.has(raw as EmailOtpType) ? (raw as EmailOtpType) : null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const origin = getOrigin(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = parseOtpType(searchParams.get('type'))
  const next = safeNext(searchParams.get('next'))

  if (token_hash && type) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirm`)
}
