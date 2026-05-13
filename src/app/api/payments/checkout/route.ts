/**
 * POST /api/payments/checkout
 *
 * Body: { priceId?: string, intervalo?: 'mensal'|'semestral'|'anual', planCodigo?: string }
 * — Se priceId vier, usamos direto.
 * — Senão resolvemos pelo intervalo dentro do plano informado por
 *   planCodigo (default: primeiro plano ativo).
 *
 * Provedor:
 *  - Asaas é o default global (billing_plans.default_provider). Para Asaas,
 *    a URL retornada é INTERNA (/checkout/<sessionId>) — o checkout custom
 *    é renderizado pelo nosso app.
 *  - Stripe/Hubla continuam funcionando quando o plano estiver configurado
 *    com `default_provider` diferente.
 *
 * Retorna: { url, provider }
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { asaasProvider } from '@/lib/payments/providers/asaas'
import { stripeProvider } from '@/lib/payments/providers/stripe'
import type { PaymentProvider } from '@/lib/payments/types'

export const runtime = 'nodejs'

function pickProvider(id: string): PaymentProvider {
  if (id === 'asaas') return asaasProvider
  if (id === 'stripe') return stripeProvider
  // Hubla não suporta createCheckout via API (link estático). Caímos no
  // /educa/assine que tem seu próprio fluxo. Pra não silenciar, lança.
  throw new Error(`Provedor "${id}" não suporta checkout via API`)
}

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: { priceId?: string; intervalo?: string; planCodigo?: string } = {}
  try {
    body = await req.json()
  } catch {
    // body vazio é aceito — caímos no default
  }

  const admin = createAdminClient()
  let priceId = body.priceId
  let planRow: {
    id: string
    codigo: string
    ativo: boolean
    default_provider: string
  } | null = null

  if (!priceId) {
    const intervalo = body.intervalo ?? 'mensal'
    const planCodigo = body.planCodigo

    // Resolve plano + price ativos. Se planCodigo veio, filtra; senão pega
    // o primeiro plano ativo na ordem.
    const { data: priceRows } = await admin
      .from('billing_prices')
      .select(
        'id, plan_id, intervalo, plan:plan_id(id, codigo, ativo, default_provider, ordem)',
      )
      .eq('intervalo', intervalo)
      .eq('ativo', true)
    type PlanShape = {
      id: string
      codigo: string
      ativo: boolean
      default_provider: string
      ordem: number
    }
    type Row = {
      id: string
      intervalo: string
      // Supabase tipa relação a-1 como array; normalizamos abaixo.
      plan: PlanShape | PlanShape[] | null
    }
    const rows = (priceRows ?? []) as unknown as Row[]
    const normalized = rows.map(r => ({
      id: r.id,
      plan: Array.isArray(r.plan) ? (r.plan[0] ?? null) : r.plan,
    }))
    const eligible = normalized
      .filter(r => r.plan?.ativo)
      .filter(r => !planCodigo || r.plan?.codigo === planCodigo)
      .sort((a, b) => (a.plan?.ordem ?? 0) - (b.plan?.ordem ?? 0))

    if (eligible.length === 0) {
      return NextResponse.json(
        { error: `Nenhum preço ${intervalo} disponível` },
        { status: 400 },
      )
    }
    priceId = eligible[0].id
    planRow = eligible[0].plan
  } else {
    // priceId veio explícito — busca plan pra saber o default_provider
    const { data } = await admin
      .from('billing_prices')
      .select(
        'plan:plan_id(id, codigo, ativo, default_provider)',
      )
      .eq('id', priceId)
      .maybeSingle()
    type PlanShape = {
      id: string
      codigo: string
      ativo: boolean
      default_provider: string
    }
    type Row = { plan: PlanShape | PlanShape[] | null }
    const rawPlan = (data as unknown as Row | null)?.plan ?? null
    const resolvedPlan = Array.isArray(rawPlan) ? rawPlan[0] ?? null : rawPlan
    planRow = resolvedPlan
      ? {
          id: resolvedPlan.id,
          codigo: resolvedPlan.codigo,
          ativo: resolvedPlan.ativo,
          default_provider: resolvedPlan.default_provider,
        }
      : null
  }

  if (!planRow?.ativo) {
    return NextResponse.json({ error: 'Plano inativo' }, { status: 400 })
  }

  const providerId = planRow.default_provider ?? 'asaas'

  const origin =
    req.headers.get('origin') ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000'

  // Carrega nome do usuário (opcional, melhora UX do checkout)
  const { data: profile } = await admin
    .from('profiles')
    .select('nome, email')
    .eq('id', user.id)
    .maybeSingle()

  try {
    const provider = pickProvider(providerId)
    const result = await provider.createCheckout({
      userId: user.id,
      userEmail: user.email ?? (profile?.email as string | null) ?? '',
      userName: (profile?.nome as string | null) ?? null,
      priceId,
      successUrl: `${origin}/perfil?tab=assinatura&status=success`,
      cancelUrl: `${origin}/planos?status=canceled`,
    })
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'checkout falhou'
    console.warn('[payments] checkout error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
