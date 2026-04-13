/**
 * /planos — página pública de assinatura.
 *
 * Server Component: lê os planos ativos + preços direto do Supabase
 * (RLS permite leitura pública) e renderiza o card do Premium com
 * os 3 intervalos. Seleção e checkout acontecem no client wrapper.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import PlanosClient from './PlanosClient'

export const revalidate = 60 // catálogo muda raramente

type Price = {
  id: string
  intervalo: 'mensal' | 'semestral' | 'anual' | 'unico'
  amount_cents: number
  moeda: string
  ativo: boolean
}

type Plan = {
  id: string
  codigo: string
  nome: string
  descricao: string | null
  beneficios: string[]
  destaque: string | null
  billing_prices: Price[]
}

export default async function PlanosPage() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('billing_plans')
    .select(
      'id, codigo, nome, descricao, beneficios, destaque, billing_prices(id, intervalo, amount_cents, moeda, ativo)',
    )
    .eq('ativo', true)
    .order('ordem', { ascending: true })

  const plans = ((data ?? []) as Plan[]).map(p => ({
    ...p,
    billing_prices: p.billing_prices.filter(pr => pr.ativo),
  }))

  return <PlanosClient plans={plans} />
}
