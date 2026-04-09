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
        // OAuth users (google, facebook, apple) don't need to set a password
        const provider = user.app_metadata?.provider
        const isOAuth = provider && provider !== 'email'

        if (!isOAuth) {
          // Only check password for email-based users (magic link / first access)
          const { data: profile } = await supabase
            .from('profiles')
            .select('has_password_set')
            .eq('id', user.id)
            .single()

          if (profile && !profile.has_password_set) {
            return NextResponse.redirect(`${origin}/perfil/seguranca`)
          }
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
