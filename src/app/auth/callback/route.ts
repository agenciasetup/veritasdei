import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { safeNext } from '@/lib/auth/safe-next'
import { finalizeAuthSession } from '@/lib/auth/finalize-session'
import { clientIpFromHeaders, recordLoginEvent } from '@/lib/auth/log-login-event'

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

    // Aceita tanto `code` (PKCE / OAuth) quanto `token_hash` + `type`
    // (magic link / recovery / invite). Isso protege contra mismatch de
    // template Supabase vs. URL configurada no dashboard — comum quando
    // o template de magic link aponta pra /auth/callback mas o SDK
    // espera /auth/confirm.
    const result = await finalizeAuthSession(supabase, searchParams)
    if (!result.ok) {
      console.error('[Auth Callback]', result.reason)
      return NextResponse.redirect(`${origin}/login?error=auth`)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      try {
        await recordLoginEvent({
          supabase,
          userId: user.id,
          ip: clientIpFromHeaders(request.headers),
          userAgent: request.headers.get('user-agent'),
        })
      } catch (err) {
        console.error('[Auth Callback] login event log failed', err)
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('has_password_set, onboarding_completed')
        .eq('id', user.id)
        .single()

      // OAuth users (google, facebook, apple) don't need to set a password
      const provider = user.app_metadata?.provider
      const isOAuth = provider && provider !== 'email'

      if (!isOAuth && profile && !profile.has_password_set) {
        return NextResponse.redirect(`${origin}/perfil/seguranca`)
      }

      if (profile && !profile.onboarding_completed) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
    }

    return NextResponse.redirect(`${origin}${next}`)
  } catch (err) {
    console.error('[Auth Callback] Unexpected error:', err)
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }
}
