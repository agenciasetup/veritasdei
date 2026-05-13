/**
 * GET  /api/admin/order-bumps      — lista todos (ativos + inativos)
 * POST /api/admin/order-bumps      — cria um novo bump
 *
 * Body do POST: { codigo, titulo, descricao?, valor_cents, badge?,
 *                 plan_codigos?, ordem?, ativo? }
 *
 * Gate: profile.role = 'admin'.
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

export async function GET() {
  const gate = await requireAdmin()
  if ('error' in gate)
    return NextResponse.json({ error: gate.error }, { status: gate.status })

  // Service role pra ver inativos também (a policy pública filtra ativo=true).
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('billing_order_bumps')
    .select('*')
    .order('ordem', { ascending: true })
    .order('criado_em', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bumps: data ?? [] })
}

export async function POST(req: Request) {
  const gate = await requireAdmin()
  if ('error' in gate)
    return NextResponse.json({ error: gate.error }, { status: gate.status })

  const body = (await req.json().catch(() => null)) as {
    codigo?: string
    titulo?: string
    descricao?: string | null
    valor_cents?: number
    badge?: string | null
    plan_codigos?: string[]
    ordem?: number
    ativo?: boolean
  } | null

  if (!body?.codigo || !body.titulo) {
    return NextResponse.json(
      { error: 'codigo e titulo são obrigatórios' },
      { status: 400 },
    )
  }
  const cents = Number(body.valor_cents)
  if (!Number.isFinite(cents) || cents < 0) {
    return NextResponse.json({ error: 'valor_cents inválido' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('billing_order_bumps')
    .insert({
      codigo: body.codigo.trim(),
      titulo: body.titulo.trim(),
      descricao: body.descricao?.trim() || null,
      valor_cents: cents,
      badge: body.badge?.trim() || null,
      plan_codigos: body.plan_codigos ?? [],
      ordem: body.ordem ?? 0,
      ativo: body.ativo ?? true,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bump: data })
}
