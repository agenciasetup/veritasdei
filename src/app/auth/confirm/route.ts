import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { safeNext } from '@/lib/auth/safe-next'
import { finalizeAuthSession } from '@/lib/auth/finalize-session'

function getOrigin(requestUrl: string): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  return new URL(requestUrl).origin
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const origin = getOrigin(request.url)
  const next = safeNext(searchParams.get('next'))

  try {
    const supabase = await createServerSupabaseClient()
    // Mesma lógica de /auth/callback — aceita code OU token_hash+type.
    const result = await finalizeAuthSession(supabase, searchParams)
    if (!result.ok) {
      console.error('[Auth Confirm]', result.reason)
      return NextResponse.redirect(`${origin}/login?error=confirm`)
    }

    return NextResponse.redirect(`${origin}${next}`)
  } catch (err) {
    console.error('[Auth Confirm] Unexpected error:', err)
    return NextResponse.redirect(`${origin}/login?error=confirm`)
  }
}
