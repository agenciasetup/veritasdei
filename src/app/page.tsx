/**
 * `/` — rota raiz.
 *
 * Dispatch por produto:
 *   - veritas-educa (subdomínio educa.*) → renderiza a sales/landing
 *     direto (não vai pra /educa). É a página de venda pública, igual
 *     pra todos — visitante ou logado.
 *   - veritas-dei (domínio principal) → VeritasHomeClient (redirecting
 *     pra /rezar se logado, LandingPage se anônimo).
 *
 * No subdomínio educa, /educa é o DASHBOARD (não a landing). Quem é
 * assinante e clica em "Entrar" cai em /educa.
 */

import { getCurrentProduct } from '@/lib/product/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  getEducaLandingDestaques,
  getEducaSalesCartas,
  getEducaSalesPilares,
  getEducaSalesPrices,
  getEducaSalesTotals,
} from '@/lib/educa/server-data'
import EducaSalesPage from '@/components/educa/sales/EducaSalesPage'
import VeritasHomeClient from './VeritasHomeClient'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const product = await getCurrentProduct()

  if (product === 'veritas-educa') {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let prefillName: string | null = null
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .maybeSingle()
      if (profile?.name) prefillName = profile.name as string
    }

    const [prices, pilares, cartas, totals, destaques] = await Promise.all([
      getEducaSalesPrices(),
      getEducaSalesPilares(),
      getEducaSalesCartas(),
      getEducaSalesTotals(),
      getEducaLandingDestaques(),
    ])

    return (
      <>
        {/* Preconnect ao bucket de imagens — economiza ~100-200ms de
            handshake DNS+TLS pra capas e ilustrações de carta. */}
        <link rel="preconnect" href="https://media.veritasdei.com.br" />
        <link rel="dns-prefetch" href="https://media.veritasdei.com.br" />
        <EducaSalesPage
          prices={prices}
          pilares={pilares}
          cartas={cartas}
          totals={totals}
          destaques={destaques}
          isAuthenticated={!!user}
          prefillEmail={user?.email ?? null}
          prefillName={prefillName}
          autoPlan={null}
        />
      </>
    )
  }

  return <VeritasHomeClient />
}
