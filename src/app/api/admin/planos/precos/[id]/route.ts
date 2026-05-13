/**
 * PATCH  /api/admin/planos/precos/:id — edita um preço individual
 *   (amount_cents, stripe_price_id, ativo, intervalo)
 * DELETE /api/admin/planos/precos/:id — remove um preço.
 *   Falha com 409 se houver subscription ativa referenciando — neste caso
 *   prefira PATCH `{ ativo: false }` para preservar histórico.
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

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin()
  if ('error' in gate)
    return NextResponse.json({ error: gate.error }, { status: gate.status })

  const { id } = await ctx.params
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>

  const patch: Record<string, unknown> = {}
  if ('amount_cents' in body) {
    const n = Number(body.amount_cents)
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json(
        { error: 'amount_cents inválido' },
        { status: 400 },
      )
    }
    patch.amount_cents = n
  }
  if ('stripe_price_id' in body) {
    const v = body.stripe_price_id
    patch.stripe_price_id =
      typeof v === 'string' && v.trim().length > 0 ? v.trim() : null
  }
  if ('ativo' in body) patch.ativo = !!body.ativo
  if ('intervalo' in body) {
    const v = String(body.intervalo)
    if (!['mensal', 'semestral', 'anual', 'unico'].includes(v)) {
      return NextResponse.json({ error: 'intervalo inválido' }, { status: 400 })
    }
    patch.intervalo = v
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nada a atualizar' }, { status: 400 })
  }

  const { data, error } = await gate.supabase
    .from('billing_prices')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ price: data })
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin()
  if ('error' in gate)
    return NextResponse.json({ error: gate.error }, { status: gate.status })

  const { id } = await ctx.params

  // Bloqueia se houver subscription apontando pro price (histórico).
  const { count } = await gate.supabase
    .from('billing_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('price_id', id)

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error:
          'Preço em uso por assinaturas existentes. Desative em vez de excluir.',
      },
      { status: 409 },
    )
  }

  const { error } = await gate.supabase
    .from('billing_prices')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
