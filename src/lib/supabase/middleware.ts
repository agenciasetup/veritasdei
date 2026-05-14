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

  // ─────────────────────────────────────────────────────────────────────
  // Trancamento do subdomínio educa.*
  //
  // Veritas Educa é um produto isolado. No subdomínio, apenas /educa/* +
  // rotas operacionais (auth, api, páginas legais) são acessíveis. Qualquer
  // outra rota redireciona pra /educa, evitando que o user "vaze" pro
  // Veritas full a partir do educa.veritasdei.com.br.
  //
  // - Raiz "/" → rewrite (URL preservada) pra /educa.
  // - Demais paths fora da whitelist → 307 redirect pra /educa.
  // ─────────────────────────────────────────────────────────────────────
  if (product === 'veritas-educa') {
    const isAllowedInEduca =
      path === '/educa' ||
      path.startsWith('/educa/') ||
      // Conteúdo de estudo (pilares, tópicos, subtópicos, grupos) — o
      // shell continua sendo o EducaShell (decidido pelo hostname); só
      // permitimos as rotas em si.
      path === '/estudo' ||
      path.startsWith('/estudo/') ||
      // Rosário (terço solo + sessões compartilhadas + histórico).
      path === '/rosario' ||
      path.startsWith('/rosario/') ||
      // Liturgia do dia — leitura completa (cor / grade / leituras).
      // Card da dashboard /educa linka pra /liturgia/hoje; sem essa
      // entrada o middleware do subdomínio educa empurrava pra /educa.
      path === '/liturgia' ||
      path.startsWith('/liturgia/') ||
      // Perfil rico do Veritas: reusado direto no Educa (sem comunidade —
      // a aba "Carteirinha" é escondida no front quando product=educa).
      path === '/perfil' ||
      path.startsWith('/perfil/') ||
      // Painel admin — o gate de role=admin já é feito no AdminLayout.
      // Admin precisa acessar /admin/educa/banners de dentro do subdomínio,
      // e o atalho "Admin" no perfil leva pra cá.
      path === '/admin' ||
      path.startsWith('/admin/') ||
      // Checkout custom (Asaas). /educa/assine cria a sessão e redireciona
      // pra /checkout/<sessionId>; sem essa permissão o middleware joga o
      // usuário de volta pra /educa.
      path === '/checkout' ||
      path.startsWith('/checkout/') ||
      // Auth / API / páginas legais
      path === '/login' ||
      path.startsWith('/auth/') ||
      path.startsWith('/api/') ||
      path === '/privacidade' ||
      path === '/termos' ||
      path === '/diretrizes' ||
      path === '/cookies' ||
      path === '/dmca' ||
      path === '/consentimento-parental' ||
      path === '/excluir-conta'

    if (path === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/educa'
      const rewriteResponse = NextResponse.rewrite(url, { request })
      for (const setCookie of supabaseResponse.headers.getSetCookie()) {
        rewriteResponse.headers.append('set-cookie', setCookie)
      }
      return rewriteResponse
    }

    if (!isAllowedInEduca) {
      const url = request.nextUrl.clone()
      url.pathname = '/educa'
      url.search = ''
      const redirectResponse = NextResponse.redirect(url, 307)
      for (const setCookie of supabaseResponse.headers.getSetCookie()) {
        redirectResponse.headers.append('set-cookie', setCookie)
      }
      return redirectResponse
    }
  }

  return supabaseResponse
}
