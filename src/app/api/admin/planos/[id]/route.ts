/**
 * PATCH  /api/admin/planos/:id — atualiza campos do plano
 * DELETE /api/admin/planos/:id — inativa (não deleta para preservar histórico)
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
  return { supabase, user }
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

  // whitelist de campos editáveis
  const patch: Record<string, unknown> = {}
  for (const k of [
    'nome',
    'descricao',
    'beneficios',
    'destaque',
    'ativo',
    'ordem',
    'default_provider',
  ]) {
    if (k in body) patch[k] = body[k]
  }

  // Valida default_provider (CHECK constraint no banco já barra, mas
  // damos erro user-friendly).
  if (
    patch.default_provider !== undefined &&
    !['asaas', 'stripe', 'hubla', 'manual'].includes(
      String(patch.default_provider),
    )
  ) {
    return NextResponse.json(
      { error: 'default_provider inválido' },
      { status: 400 },
    )
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nada a atualizar' }, { status: 400 })
  }

  const { data, error } = await gate.supabase
    .from('billing_plans')
    .update(patch)
    .eq('id', id)
    .select('*, billing_prices(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ plan: data })
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin()
  if ('error' in gate)
    return NextResponse.json({ error: gate.error }, { status: gate.status })

  const { id } = await ctx.params
  // Inativa em vez de deletar pra preservar histórico de assinaturas.
  const { error } = await gate.supabase
    .from('billing_plans')
    .update({ ativo: false })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
