/**
 * /educa — raiz do subproduto Veritas Educa.
 *
 * Server component:
 *   - visitante deslogado  → página de venda (EducaSalesPage)
 *   - usuário logado       → dashboard (EducaDashboard)
 *
 * Observações:
 *   - No subdomínio educa.veritasdei.com.br o middleware reescreve "/" pra
 *     cá, então esta é a home pública do produto.
 *   - O usuário logado SEM assinatura é interceptado pelo middleware antes
 *     de chegar aqui e mandado pra /educa/assine — então, se há `user`,
 *     mostramos a dashboard direto.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getEducaSalesPrices } from '@/lib/educa/server-data'
import EducaDashboard from './EducaDashboard'
import EducaSalesPage from '@/components/educa/sales/EducaSalesPage'

export const dynamic = 'force-dynamic'

export default async function EducaPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const prices = await getEducaSalesPrices()
    return (
      <EducaSalesPage
        prices={prices}
        isAuthenticated={false}
        prefillEmail={null}
        prefillName={null}
        autoPlan={null}
      />
    )
  }

  return <EducaDashboard />
}
