import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { PRODUCT_HEADER, productFromHostname } from '@/lib/product/types'
import {
  readCachedEntitlement,
  writeCachedEntitlement,
} from '@/lib/supabase/educa-entitlement-cache'

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

  const path = request.nextUrl.pathname

  // ─────────────────────────────────────────────────────────────────────
  // Trava do Veritas Dei (domínio principal)
  //
  // Enquanto o foco do produto é o Veritas Educa, o domínio principal
  // (veritasdei.com.br) fica travado: toda navegação de PÁGINA é
  // encaminhada pro subdomínio educa.* preservando o path.
  //
  // Rotas operacionais continuam funcionando no domínio principal pra
  // não quebrar integrações externas:
  //   - /api/*      → webhooks de pagamento (Asaas/Stripe), cron, etc.
  //   - /auth/*     → callbacks de OAuth / magic link
  //   - /checkout/* → retorno dos provedores de pagamento
  //
  // Desligar a trava (quando o Veritas Dei full voltar a ser usado):
  // env LOCK_VERITAS_DEI=false. Ver docs/VERITAS-DEI-LOCK.md.
  // ─────────────────────────────────────────────────────────────────────
  if (product === 'veritas-dei' && process.env.LOCK_VERITAS_DEI !== 'false') {
    const stayOnMainDomain =
      path.startsWith('/api/') ||
      path.startsWith('/auth/') ||
      path === '/checkout' ||
      path.startsWith('/checkout/') ||
      // Certificado público de carta — funciona em qualquer domínio sem
      // empurrar pro subdomínio educa.* (compartilhável "tipo NFT").
      path.startsWith('/c/')
    if (!stayOnMainDomain) {
      const host = request.headers.get('host') ?? ''
      const educaHost = host.startsWith('educa.')
        ? host
        : `educa.${host.replace(/^www\./, '')}`
      if (host && educaHost !== host) {
        const target = new URL(
          `${request.nextUrl.pathname}${request.nextUrl.search}`,
          `${request.nextUrl.protocol}//${educaHost}`,
        )
        return NextResponse.redirect(target, 307)
      }
    }
  }

  // Skip auth refresh for public API routes, auth routes, and public pages.
  // Keep refresh for /api/verbum/, /api/admin/, /api/comunidade/ and for
  // QUALQUER mutação (POST/PUT/PATCH/DELETE) — sem isso, salvar carta /
  // perfil podia falhar com token expirado e só voltava após reload.
  const isProtectedApi =
    path.startsWith('/api/verbum/')
    || path.startsWith('/api/admin/')
    || path.startsWith('/api/comunidade/')
  const isMutation =
    request.method !== 'GET' && request.method !== 'HEAD'
  if (
    (path.startsWith('/api/') && !isProtectedApi && !isMutation) ||
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
  let authedUser: { id: string } | null = null
  try {
    const { data } = await supabase.auth.getUser()
    authedUser = data.user
  } catch {
    // Retry once on failure before giving up
    try {
      const { data } = await supabase.auth.getUser()
      authedUser = data.user
    } catch (retryErr) {
      console.error('[Middleware] Auth refresh failed after retry:', retryErr)
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Trancamento do subdomínio educa.*
  //
  // Veritas Educa é um produto isolado. No subdomínio:
  //   - "/"     → landing/sales (pública pra todo mundo, logado ou não)
  //   - /educa  → dashboard (Início) — só logado + assinante
  //   - /educa/checkout, /educa/assine → checkout (público)
  //   - /estudo, /rosario, /colecao, /perfil, /liturgia → conteúdo premium
  //   - Demais paths → redireciona pra / (landing)
  // ─────────────────────────────────────────────────────────────────────
  if (product === 'veritas-educa') {
    // Paths sempre públicos no subdomínio: landing, auth, legais,
    // checkout/assine. Não exigem login pra serem renderizados.
    const isAlwaysPublic =
      path === '/' ||
      path === '/educa/assine' ||
      path === '/educa/checkout' ||
      path === '/login' ||
      path.startsWith('/auth/') ||
      path.startsWith('/api/') ||
      path === '/privacidade' ||
      path === '/termos' ||
      path === '/diretrizes' ||
      path === '/cookies' ||
      path === '/dmca' ||
      path === '/consentimento-parental' ||
      path === '/excluir-conta' ||
      // Certificado público da coleção (carta NFT-style) — qualquer pessoa
      // com o token consegue verificar a autenticidade sem login.
      path.startsWith('/c/')

    // ───────────────────────────────────────────────────────────────────
    // Anônimo: bloqueia conteúdo premium.
    //
    // Sem login não dá pra entrar em /educa (dashboard), /estudo, /colecao,
    // /rosario etc. Tudo que não estiver na whitelist pública volta pra /
    // (landing), que tem CTA de assinar.
    // ───────────────────────────────────────────────────────────────────
    if (!authedUser) {
      const isPremiumArea =
        path === '/educa' || // dashboard
        path === '/estudo' || path.startsWith('/estudo/') ||
        path === '/rosario' || path.startsWith('/rosario/') ||
        path === '/colecao' || path.startsWith('/colecao/') ||
        path === '/perfil' || path.startsWith('/perfil/') ||
        path === '/liturgia' || path.startsWith('/liturgia/') ||
        (path.startsWith('/educa/') && !isAlwaysPublic) ||
        path === '/admin' || path.startsWith('/admin/')

      if (isPremiumArea) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        url.search = ''
        const redirectResponse = NextResponse.redirect(url, 307)
        for (const setCookie of supabaseResponse.headers.getSetCookie()) {
          redirectResponse.headers.append('set-cookie', setCookie)
        }
        return redirectResponse
      }
    }

    // ───────────────────────────────────────────────────────────────────
    // Gate de assinatura (logado mas sem premium)
    //
    // Pode ver landing (/) e checkout (/educa/checkout, /educa/assine).
    // Qualquer rota de conteúdo premium — inclusive /educa (dashboard) —
    // redireciona pro checkout focado.
    // ───────────────────────────────────────────────────────────────────
    if (authedUser) {
      // Cache de 60s num cookie assinado evita um RPC de DB por navegação.
      let isPremium = await readCachedEntitlement(request, authedUser.id)
      if (isPremium === null) {
        try {
          const { data: entData } = await supabase.rpc('get_user_entitlement', {
            uid: authedUser.id,
          })
          const row = Array.isArray(entData) ? entData[0] : entData
          isPremium = !!(row as { ativo?: boolean } | null)?.ativo
          // Só cacheia resultado positivo: assim, ao assinar, o acesso é
          // liberado na navegação seguinte (sem esperar o TTL expirar).
          // Pra quem já é premium, o cache evita o RPC repetido.
          if (isPremium) {
            await writeCachedEntitlement(supabaseResponse, authedUser.id, true)
          }
        } catch (err) {
          // Fail-open: um erro transitório de DB não pode trancar quem já
          // paga. O conteúdo premium ainda tem gates server-side próprios.
          console.error('[Middleware] entitlement check failed:', err)
          isPremium = true
        }
      }

      if (!isPremium) {
        const allowedForFree =
          isAlwaysPublic ||
          // Admin tem gate de role próprio no AdminLayout.
          path === '/admin' ||
          path.startsWith('/admin/') ||
          path === '/checkout' ||
          path.startsWith('/checkout/')

        if (!allowedForFree) {
          const url = request.nextUrl.clone()
          url.pathname = '/educa/checkout'
          url.search = ''
          const redirectResponse = NextResponse.redirect(url, 307)
          for (const setCookie of supabaseResponse.headers.getSetCookie()) {
            redirectResponse.headers.append('set-cookie', setCookie)
          }
          return redirectResponse
        }
      }
    }

    const isAllowedInEduca =
      path === '/' ||
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
      // Coleção (Códex de cartas) — desbloqueada via estudo, faz parte
      // da experiência do Educa.
      path === '/colecao' ||
      path.startsWith('/colecao/') ||
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
      path === '/excluir-conta' ||
      // Certificado público da coleção (carta NFT-style) — qualquer pessoa
      // com o token consegue verificar a autenticidade sem login.
      path.startsWith('/c/')

    // ───────────────────────────────────────────────────────────────────
    // OAuth callback fallback
    //
    // O Supabase às vezes devolve o `?code=` na raiz do subdomínio (ex.:
    // educa.veritasdei.com.br/?code=xxx) em vez de em /auth/callback —
    // acontece quando a redirect URL exata do subdomínio não está na
    // whitelist do projeto Supabase e ele cai no Site URL fallback.
    //
    // Sem esse forward, o /educa renderiza sem trocar o `code` por
    // sessão e o usuário fica deslogado depois do "Continuar com Google".
    // Aqui detectamos o pattern e reencaminhamos pro handler correto,
    // que faz o exchangeCodeForSession e segue pro next esperado.
    // ───────────────────────────────────────────────────────────────────
    if (
      request.method === 'GET' &&
      request.nextUrl.searchParams.has('code') &&
      !path.startsWith('/auth/') &&
      !path.startsWith('/api/')
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/callback'
      if (!url.searchParams.has('next')) {
        // Se o usuário voltou pra raiz / com OAuth, mandamos pro checkout
        // focado — é o destino esperado de quem clica "Continuar com
        // Google" na landing. O /auth/callback decide se redireciona pra
        // /onboarding ou /perfil/seguranca antes disso.
        url.searchParams.set('next', '/educa/checkout')
      }
      return NextResponse.redirect(url, 307)
    }

    if (!isAllowedInEduca) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
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
