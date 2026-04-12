/**
 * GET  /api/admin/planos         — lista planos com preços
 * POST /api/admin/planos         — cria plano (raramente usado, só 1 por enquanto)
 *
 * Gate: profile.role = 'admin'.
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

export async function GET() {
  const gate = await requireAdmin()
  if ('error' in gate)
    return NextResponse.json({ error: gate.error }, { status: gate.status })

  const { data: plans, error } = await gate.supabase
    .from('billing_plans')
    .select('*, billing_prices(*)')
    .order('ordem', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ plans: plans ?? [] })
}

export async function POST(req: Request) {
  const gate = await requireAdmin()
  if ('error' in gate)
    return NextResponse.json({ error: gate.error }, { status: gate.status })

  const body = (await req.json().catch(() => null)) as {
    codigo?: string
    nome?: string
    descricao?: string
    beneficios?: string[]
    destaque?: string
    ativo?: boolean
    ordem?: number
  } | null

  if (!body?.codigo || !body.nome) {
    return NextResponse.json(
      { error: 'codigo e nome são obrigatórios' },
      { status: 400 },
    )
  }

  const { data, error } = await gate.supabase
    .from('billing_plans')
    .insert({
      codigo: body.codigo,
      nome: body.nome,
      descricao: body.descricao ?? null,
      beneficios: body.beneficios ?? [],
      destaque: body.destaque ?? null,
      ativo: body.ativo ?? true,
      ordem: body.ordem ?? 0,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ plan: data })
}
