/**
 * /educa/checkout — checkout focado do Veritas Educa.
 *
 * Página pós-login. Toda a landing já foi mostrada; aqui o usuário só
 * precisa:
 *   - escolher o plano (mensal/semestral/anual)
 *   - preencher CPF/telefone se ainda não estiverem no profile
 *   - clicar em "Pagar agora" → checkout Asaas
 *
 * Server component: confirma auth (anon vai pra /login com next=/educa),
 * lê o profile pra pré-preencher CPF/telefone, lê os planos ativos.
 * Recebe `?plan=` opcionalmente (vem do CTA da landing ou do retorno do
 * Google OAuth) pra já marcar o plano correto.
 */

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  getEducaSalesPrices,
  type EducaSalesIntervalo,
} from '@/lib/educa/server-data'
import EducaCheckoutClient from './EducaCheckoutClient'

export const dynamic = 'force-dynamic'

const INTERVALOS: EducaSalesIntervalo[] = ['mensal', 'semestral', 'anual', 'unico']

export default async function EducaCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const { plan } = await searchParams
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/educa/checkout' + (plan ? `?plan=${plan}` : ''))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, cpf, telefone')
    .eq('id', user.id)
    .maybeSingle()

  const prices = await getEducaSalesPrices()

  const autoPlan =
    plan && INTERVALOS.includes(plan as EducaSalesIntervalo)
      ? (plan as EducaSalesIntervalo)
      : null

  return (
    <EducaCheckoutClient
      prices={prices}
      autoPlan={autoPlan}
      name={profile?.name ?? null}
      email={user.email ?? null}
      cpf={typeof profile?.cpf === 'string' ? profile.cpf : null}
      telefone={typeof profile?.telefone === 'string' ? profile.telefone : null}
    />
  )
}
