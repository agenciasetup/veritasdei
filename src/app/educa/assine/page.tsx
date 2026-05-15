/**
 * /educa/assine — página de venda do Veritas Educa.
 *
 * É a mesma EducaSalesPage da raiz do educa. O middleware do subdomínio
 * manda pra cá o usuário logado SEM assinatura ativa, então a página se
 * adapta: com sessão, esconde o cadastro e mostra só o botão "Assinar".
 *
 * `?plan=` é usado pra retomar o checkout depois do login com Google
 * (a página de venda passa esse next no signInWithOAuth).
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  getEducaSalesCartas,
  getEducaSalesPilares,
  getEducaSalesPrices,
  getEducaSalesTotals,
  type EducaSalesIntervalo,
} from '@/lib/educa/server-data'
import EducaSalesPage from '@/components/educa/sales/EducaSalesPage'

export const dynamic = 'force-dynamic'

const INTERVALOS: EducaSalesIntervalo[] = ['mensal', 'semestral', 'anual', 'unico']

export default async function AssineEducaPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const { plan } = await searchParams
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

  const [prices, pilares, cartas, totals] = await Promise.all([
    getEducaSalesPrices(),
    getEducaSalesPilares(),
    getEducaSalesCartas(),
    getEducaSalesTotals(),
  ])
  const autoPlan =
    plan && INTERVALOS.includes(plan as EducaSalesIntervalo)
      ? (plan as EducaSalesIntervalo)
      : null

  return (
    <>
      <link rel="preconnect" href="https://media.veritasdei.com.br" />
      <link rel="dns-prefetch" href="https://media.veritasdei.com.br" />
      <EducaSalesPage
        prices={prices}
        pilares={pilares}
        cartas={cartas}
        totals={totals}
        isAuthenticated={!!user}
        prefillEmail={user?.email ?? null}
        prefillName={prefillName}
        autoPlan={autoPlan}
      />
    </>
  )
}
