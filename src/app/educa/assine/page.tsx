/**
 * /educa/assine — primeira tela do subproduto Veritas Educa.
 *
 * Mostra o pitch, o input de email (pré-preenchido se o usuário já
 * estiver logado), o aviso de "use o mesmo email da sua conta" e o
 * botão que redireciona pro checkout externo da Hubla.
 *
 * O retorno acontece via webhook (subscription.activated/invoice.paid).
 * Após pagar, o usuário pode logar com o mesmo email e o entitlement
 * já está ativo. Configure a URL de "obrigado" da Hubla apontando pro
 * `/educa` (ou login com next=/educa).
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import AssineEducaClient from './AssineEducaClient'

export const dynamic = 'force-dynamic'

export default async function AssineEducaPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let prefillEmail: string | null = user?.email ?? null
  let prefillName: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .maybeSingle()
    if (profile?.email) prefillEmail = profile.email as string
    if (profile?.name) prefillName = profile.name as string
  }

  // Base URL do checkout. Usamos NEXT_PUBLIC pra também ficar disponível
  // no client (não é segredo — é a URL pública da oferta na Hubla).
  const checkoutBaseUrl =
    process.env.NEXT_PUBLIC_HUBLA_CHECKOUT_URL_VERITAS_EDUCA ?? null

  return (
    <AssineEducaClient
      prefillEmail={prefillEmail}
      prefillName={prefillName}
      isAuthenticated={!!user}
      checkoutBaseUrl={checkoutBaseUrl}
    />
  )
}
