/**
 * POST /api/payments/checkout
 *
 * Body: { priceId: string, intervalo?: 'mensal'|'semestral'|'anual' }
 * — se priceId vier, usamos direto; senão resolvemos pelo intervalo
 *   no plano ativo padrão ('premium').
 *
 * Retorna: { url } para o frontend redirecionar.
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripeProvider } from '@/lib/payments/providers/stripe'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: { priceId?: string; intervalo?: string } = {}
  try {
    body = await req.json()
  } catch {
    // body vazio é aceito — caímos no default
  }

  const admin = createAdminClient()
  let priceId = body.priceId

  // Se não veio priceId explícito, resolve por intervalo no plano padrão
  if (!priceId) {
    const intervalo = body.intervalo ?? 'mensal'
    const { data: price } = await admin
      .from('billing_prices')
      .select('id, plan:plan_id(codigo, ativo)')
      .eq('intervalo', intervalo)
      .eq('ativo', true)
      .limit(1)
      .maybeSingle()

    type Row = { id: string; plan: { codigo: string; ativo: boolean } | null }
    const row = price as Row | null
    if (!row || !row.plan?.ativo) {
      return NextResponse.json(
        { error: `Nenhum preço ${intervalo} disponível` },
        { status: 400 },
      )
    }
    priceId = row.id
  }

  const origin =
    req.headers.get('origin') ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000'

  try {
    const result = await stripeProvider.createCheckout({
      userId: user.id,
      userEmail: user.email ?? '',
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
