/**
 * GET /api/checkout/bumps?planCodigo=...
 *
 * Devolve a lista de order bumps ativos que aparecem para o plano
 * informado. Se `plan_codigos` do bump for vazio, ele aparece em
 * QUALQUER plano. Caso contrário, só aparece se o plano estiver na
 * lista.
 *
 * Sem auth — é informação pública (oferta de checkout).
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const planCodigo = searchParams.get('planCodigo')

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('billing_order_bumps')
    .select('id, codigo, titulo, descricao, valor_cents, badge, plan_codigos, ordem')
    .eq('ativo', true)
    .order('ordem', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  type Row = {
    id: string
    codigo: string
    titulo: string
    descricao: string | null
    valor_cents: number
    badge: string | null
    plan_codigos: string[]
    ordem: number
  }
  const bumps = ((data ?? []) as Row[]).filter(b => {
    if (!b.plan_codigos || b.plan_codigos.length === 0) return true
    if (!planCodigo) return true
    return b.plan_codigos.includes(planCodigo)
  })

  return NextResponse.json({ bumps })
}
