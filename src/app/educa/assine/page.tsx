/**
 * /educa/assine — assinatura do subproduto Veritas Educa.
 *
 * Usa o checkout custom Asaas (via /api/payments/checkout?planCodigo=veritas-educa).
 * Antes redirecionava pra link estático da Hubla; agora cria uma session
 * Asaas e redireciona pra /checkout/[sessionId] com a identidade visual
 * configurada em /admin/checkout.
 *
 * Hubla continua como provider alternativo: basta o admin trocar o
 * default_provider do plano `veritas-educa` em /admin/planos.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import AssineEducaClient from './AssineEducaClient'

export const dynamic = 'force-dynamic'

export default async function AssineEducaPage() {
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

  return (
    <AssineEducaClient
      prefillEmail={user?.email ?? null}
      prefillName={prefillName}
      isAuthenticated={!!user}
    />
  )
}
