/**
 * POST /api/checkout/bumps/apply
 *
 * Body: { sessionId: uuid, bumpIds: uuid[] }
 *
 * Recalcula `amount_cents` da billing_checkout_sessions somando o
 * preço base do price com os bumps selecionados. Grava em
 * `metadata.order_bumps` um snapshot (codigo, titulo, valor) pra
 * preservar histórico mesmo se o bump for editado/excluído depois.
 *
 * Retorna o novo total. Cliente refresca o resumo.
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type SessionRow = {
  id: string
  user_id: string
  price_id: string
  status: string
  amount_cents: number
  metadata: Record<string, unknown> | null
}

type PriceRow = {
  id: string
  amount_cents: number
}

type BumpRow = {
  id: string
  codigo: string
  titulo: string
  valor_cents: number
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
    bumpIds?: string[]
  } | null
  if (!body?.sessionId) {
    return NextResponse.json({ error: 'sessionId obrigatório' }, { status: 400 })
  }
  const bumpIds = Array.isArray(body.bumpIds) ? body.bumpIds : []

  const admin = createAdminClient()

  // 1. Sessão pertence ao user e ainda não foi paga
  const { data: sess } = await admin
    .from('billing_checkout_sessions')
    .select('id, user_id, price_id, status, amount_cents, metadata')
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
      { error: 'Sessão já em pagamento — não dá pra alterar bumps agora.' },
      { status: 409 },
    )
  }

  // 2. Preço base
  const { data: price } = await admin
    .from('billing_prices')
    .select('id, amount_cents')
    .eq('id', session.price_id)
    .maybeSingle()
  if (!price) {
    return NextResponse.json({ error: 'Preço base não encontrado' }, { status: 500 })
  }
  const basePrice = price as PriceRow

  // 3. Bumps válidos (ativos + ids existentes)
  let bumps: BumpRow[] = []
  if (bumpIds.length > 0) {
    const { data } = await admin
      .from('billing_order_bumps')
      .select('id, codigo, titulo, valor_cents, ativo')
      .in('id', bumpIds)
      .eq('ativo', true)
    bumps = (data ?? []) as BumpRow[]
  }
  const bumpsTotal = bumps.reduce((acc, b) => acc + (b.valor_cents ?? 0), 0)
  const newTotal = basePrice.amount_cents + bumpsTotal

  // 4. Atualiza session
  const snapshot = bumps.map(b => ({
    id: b.id,
    codigo: b.codigo,
    titulo: b.titulo,
    valor_cents: b.valor_cents,
  }))

  const { error: updErr } = await admin
    .from('billing_checkout_sessions')
    .update({
      amount_cents: newTotal,
      metadata: {
        ...(session.metadata ?? {}),
        order_bumps: snapshot,
      },
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', session.id)

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    amount_cents: newTotal,
    base_cents: basePrice.amount_cents,
    bumps_cents: bumpsTotal,
    bumps: snapshot,
  })
}
