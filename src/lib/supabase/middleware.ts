import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { PRODUCT_HEADER, productFromHostname } from '@/lib/product/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export async function updateSession(request: NextRequest) {
  // Detecta produto pelo hostname (ex.: educa.veritasdei.com.br → veritas-educa)
  // e injeta no header da request. Server components consultam via
  // `getCurrentProduct()` (lib/product/server.ts).
  const product = productFromHostname(request.headers.get('host'))
  request.headers.set(PRODUCT_HEADER, product)

  let supabaseResponse = NextResponse.next({ request })

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  // Skip auth refresh for public API routes, auth routes, and public pages.
  // Keep refresh for /api/verbum/ and /api/admin/ to prevent stale tokens.
  const path = request.nextUrl.pathname
  const isProtectedApi =
    path.startsWith('/api/verbum/')
    || path.startsWith('/api/admin/')
    || path.startsWith('/api/comunidade/')
  if (
    (path.startsWith('/api/') && !isProtectedApi) ||
    path.startsWith('/auth/') ||
    path === '/privacidade' ||
    path === '/termos' ||
    path === '/diretrizes' ||
    path === '/cookies' ||
    path === '/dmca' ||
    path === '/consentimento-parental'
  ) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() validates the session server-side and refreshes tokens if needed.
  // This is critical — without it, server components see stale/expired sessions.
  try {
    await supabase.auth.getUser()
  } catch {
    // Retry once on failure before giving up
    try {
      await supabase.auth.getUser()
    } catch (retryErr) {
      console.error('[Middleware] Auth refresh failed after retry:', retryErr)
    }
  }

  return supabaseResponse
}
