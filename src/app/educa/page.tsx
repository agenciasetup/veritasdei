/**
 * /educa — raiz do subproduto Veritas Educa. Sempre renderiza a landing
 * de venda, esteja o visitante logado ou não.
 *
 * Quem é assinante e quer ir direto pro estudo usa /educa/inicio (ou o
 * link "Continuar estudando" no Hero). Quem está logado sem assinar
 * usa o CTA da landing pra ir pro /educa/checkout.
 *
 * Server component: pré-carrega dados públicos cacheáveis (pilares,
 * cartas, planos, destaques) e passa pra o cliente. Auth é só lido pra
 * pré-popular nome/email no painel "logado" e mudar copy dos CTAs.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  getEducaLandingDestaques,
  getEducaSalesCartas,
  getEducaSalesPilares,
  getEducaSalesPrices,
  getEducaSalesTotals,
} from '@/lib/educa/server-data'
import EducaSalesPage from '@/components/educa/sales/EducaSalesPage'

export const dynamic = 'force-dynamic'

export default async function EducaPage() {
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
