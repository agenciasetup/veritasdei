import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
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

        // Redirect to onboarding if not completed
        if (profile && !profile.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
