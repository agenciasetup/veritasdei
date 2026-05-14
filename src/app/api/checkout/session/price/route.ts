/**
 * POST /api/checkout/session/price
 *
 * Body: { sessionId: uuid, priceId: uuid }
 *
 * Troca o intervalo/preço da sessão de checkout (ex: cliente entrou em
 * mensal mas decidiu o anual no checkout). Valida:
 *  - sessão pertence ao usuário logado;
 *  - sessão ainda não está em pagamento (paid/awaiting_payment);
 *  - novo priceId pertence ao MESMO plano da sessão atual (não permite
 *    trocar de Premium pra Educa, por exemplo);
 *  - novo price está ativo.
 *
 * Recalcula amount_cents preservando os bumps já aplicados (lê do
 * metadata.order_bumps e soma de novo).
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type SessionRow = {
  id: string
  user_id: string
  plan_id: string
  price_id: string
  status: string
  amount_cents: number
  metadata: Record<string, unknown> | null
}

type PriceRow = {
  id: string
  plan_id: string
  intervalo: 'mensal' | 'semestral' | 'anual' | 'unico'
  amount_cents: number
  ativo: boolean
}

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = (await req.json().catch(() => null)) as {
    sessionId?: string
    priceId?: string
  } | null
  if (!body?.sessionId || !body.priceId) {
    return NextResponse.json(
      { error: 'sessionId e priceId obrigatórios' },
      { status: 400 },
    )
  }

  const admin = createAdminClient()
  const { data: sess } = await admin
    .from('billing_checkout_sessions')
    .select('id, user_id, plan_id, price_id, status, amount_cents, metadata')
    .eq('id', body.sessionId)
    .maybeSingle()
  if (!sess) {
    return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
  }
  const session = sess as SessionRow
  if (session.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (session.status === 'paid' || session.status === 'awaiting_payment') {
    return NextResponse.json(
      { error: 'Sessão já em pagamento' },
      { status: 409 },
    )
  }

  const { data: price } = await admin
    .from('billing_prices')
    .select('id, plan_id, intervalo, amount_cents, ativo')
    .eq('id', body.priceId)
    .maybeSingle()
  if (!price) {
    return NextResponse.json({ error: 'Preço não encontrado' }, { status: 404 })
  }
  const newPrice = price as PriceRow
  if (newPrice.plan_id !== session.plan_id) {
    return NextResponse.json(
      { error: 'Preço pertence a outro plano' },
      { status: 400 },
    )
  }
  if (!newPrice.ativo) {
    return NextResponse.json({ error: 'Preço inativo' }, { status: 400 })
  }

  // Soma os bumps já aplicados (snapshot em metadata).
  const snapshot = (session.metadata?.order_bumps ?? []) as Array<{
    valor_cents: number
  }>
  const bumpsTotal = snapshot.reduce(
    (acc, b) => acc + (Number(b.valor_cents) || 0),
    0,
  )
  const newTotal = newPrice.amount_cents + bumpsTotal

  const { error: updErr } = await admin
    .from('billing_checkout_sessions')
    .update({
      price_id: newPrice.id,
      intervalo: newPrice.intervalo,
      amount_cents: newTotal,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', session.id)
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    price_id: newPrice.id,
    intervalo: newPrice.intervalo,
    amount_cents: newTotal,
    base_cents: newPrice.amount_cents,
    bumps_cents: bumpsTotal,
  })
}
