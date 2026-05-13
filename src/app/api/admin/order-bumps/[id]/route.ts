/**
 * PATCH  /api/admin/order-bumps/:id  — edita campos
 * DELETE /api/admin/order-bumps/:id  — remove. Bloqueia se houver
 *   session referenciando em metadata.order_bumps (preserva histórico).
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
  if ('codigo' in body) patch.codigo = String(body.codigo).trim()
  if ('titulo' in body) patch.titulo = String(body.titulo).trim()
  if ('descricao' in body) {
    const v = body.descricao
    patch.descricao =
      typeof v === 'string' && v.trim().length > 0 ? v.trim() : null
  }
  if ('valor_cents' in body) {
    const n = Number(body.valor_cents)
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json(
        { error: 'valor_cents inválido' },
        { status: 400 },
      )
    }
    patch.valor_cents = n
  }
  if ('badge' in body) {
    const v = body.badge
    patch.badge = typeof v === 'string' && v.trim().length > 0 ? v.trim() : null
  }
  if ('plan_codigos' in body && Array.isArray(body.plan_codigos)) {
    patch.plan_codigos = (body.plan_codigos as unknown[])
      .filter(v => typeof v === 'string')
      .map(v => (v as string).trim())
      .filter(Boolean)
  }
  if ('ordem' in body) {
    const n = Number(body.ordem)
    if (Number.isFinite(n)) patch.ordem = n
  }
  if ('ativo' in body) patch.ativo = !!body.ativo

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nada a atualizar' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('billing_order_bumps')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bump: data })
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin()
  if ('error' in gate)
    return NextResponse.json({ error: gate.error }, { status: gate.status })

  const { id } = await ctx.params

  // Hard delete; o histórico de uso fica em billing_checkout_sessions.metadata
  // como snapshot (codigo+titulo+valor) — não depende do bump existir.
  const admin = createAdminClient()
  const { error } = await admin
    .from('billing_order_bumps')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
