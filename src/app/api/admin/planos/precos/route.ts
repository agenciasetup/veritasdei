/**
 * POST /api/admin/planos/precos — cria um novo preço para um plano.
 *
 * Body: { plan_id, intervalo, amount_cents, stripe_price_id?, ativo? }
 *
 * Útil pra subprodutos (ex.: veritas-educa) onde os preços foram
 * cadastrados depois do plano, ou para adicionar variações novas
 * (mensal/semestral/anual) sem precisar de migration.
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

async function requireAdmin() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' as const, status: 401 }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile || profile.role !== 'admin') {
    return { error: 'forbidden' as const, status: 403 }
  }
  return { supabase }
}

const INTERVALOS = ['mensal', 'semestral', 'anual', 'unico'] as const

export async function POST(req: Request) {
  const gate = await requireAdmin()
  if ('error' in gate)
    return NextResponse.json({ error: gate.error }, { status: gate.status })

  const body = (await req.json().catch(() => null)) as {
    plan_id?: string
    intervalo?: string
    amount_cents?: number
    stripe_price_id?: string | null
    ativo?: boolean
    moeda?: string
  } | null

  if (!body?.plan_id) {
    return NextResponse.json({ error: 'plan_id obrigatório' }, { status: 400 })
  }
  if (!body.intervalo || !INTERVALOS.includes(body.intervalo as never)) {
    return NextResponse.json({ error: 'intervalo inválido' }, { status: 400 })
  }
  const cents = Number(body.amount_cents)
  if (!Number.isFinite(cents) || cents < 0) {
    return NextResponse.json(
      { error: 'amount_cents inválido' },
      { status: 400 },
    )
  }

  const { data, error } = await gate.supabase
    .from('billing_prices')
    .insert({
      plan_id: body.plan_id,
      intervalo: body.intervalo,
      amount_cents: cents,
      moeda: body.moeda ?? 'BRL',
      stripe_price_id:
        typeof body.stripe_price_id === 'string' && body.stripe_price_id.trim()
          ? body.stripe_price_id.trim()
          : null,
      ativo: body.ativo ?? true,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ price: data })
}
