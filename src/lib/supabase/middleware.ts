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
      path.startsWith('/checkout/')
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
  // Veritas Educa é um produto isolado. No subdomínio, apenas /educa/* +
  // rotas operacionais (auth, api, páginas legais) são acessíveis. Qualquer
  // outra rota redireciona pra /educa, evitando que o user "vaze" pro
  // Veritas full a partir do educa.veritasdei.com.br.
  //
  // - Raiz "/" → rewrite (URL preservada) pra /educa.
  // - Demais paths fora da whitelist → 307 redirect pra /educa.
  // ─────────────────────────────────────────────────────────────────────
  if (product === 'veritas-educa') {
    // ───────────────────────────────────────────────────────────────────
    // Gate de assinatura
    //
    // No Veritas Educa, o usuário logado sem assinatura ativa só pode
    // acessar a tela de assinatura e o próprio perfil. Todo o resto —
    // inclusive a raiz e a dashboard — é encaminhado pra /educa/assine.
    // A trava real continua server-side; isto é só o pedágio na borda.
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
          path === '/educa/assine' ||
          path === '/perfil' ||
          path.startsWith('/perfil/') ||
          path === '/login' ||
          path.startsWith('/auth/') ||
          path.startsWith('/api/') ||
          // Admin tem gate de role próprio no AdminLayout.
          path === '/admin' ||
          path.startsWith('/admin/') ||
          path === '/checkout' ||
          path.startsWith('/checkout/') ||
          path === '/privacidade' ||
          path === '/termos' ||
          path === '/diretrizes' ||
          path === '/cookies' ||
          path === '/dmca' ||
          path === '/consentimento-parental' ||
          path === '/excluir-conta'

        if (!allowedForFree) {
          const url = request.nextUrl.clone()
          url.pathname = '/educa/assine'
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
