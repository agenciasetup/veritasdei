/**
 * POST /api/payments/cancel
 *
 * Cancela a assinatura ativa do usuário logado no provider de origem.
 *
 * - Asaas: chama DELETE /v3/subscriptions/:id e marca canceled_at_period_end.
 *   O webhook SUBSCRIPTION_DELETED chega em seguida e finaliza no banco;
 *   ainda assim atualizamos localmente pra dar feedback imediato na UI.
 * - Outros providers: hoje retornamos 400 pedindo pra usar o portal
 *   (Stripe tem portal próprio; Hubla é gerenciado fora).
 *
 * Body opcional: { cancelAtPeriodEnd?: boolean } — Asaas hoje cancela
 * imediato (não aceita soft cancel), mas mantemos a flag pra futuro.
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  AsaasApiError,
  cancelSubscription,
} from '@/lib/payments/providers/asaas-client'

export const runtime = 'nodejs'

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // Pega a assinatura ativa mais recente
  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('billing_subscriptions')
    .select('id, provider, provider_subscription_id, status, canceled_at')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('atualizado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sub) {
    return NextResponse.json(
      { error: 'Nenhuma assinatura ativa encontrada' },
      { status: 404 },
    )
  }

  if (sub.provider !== 'asaas') {
    return NextResponse.json(
      {
        error: `Cancelamento direto suportado apenas para Asaas. Use o portal para ${sub.provider}.`,
      },
      { status: 400 },
    )
  }

  if (!sub.provider_subscription_id) {
    return NextResponse.json(
      { error: 'Assinatura sem provider_subscription_id' },
      { status: 400 },
    )
  }

  try {
    await cancelSubscription(sub.provider_subscription_id as string)

    // Marca como canceled localmente. O webhook SUBSCRIPTION_DELETED também
    // vai chegar e re-aplicar — idempotente.
    await admin
      .from('billing_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        cancel_at_period_end: false,
      })
      .eq('id', sub.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof AsaasApiError) {
      return NextResponse.json(
        { error: err.message, code: err.errors[0]?.code ?? null },
        { status: 400 },
      )
    }
    const msg = err instanceof Error ? err.message : 'Falha ao cancelar'
    console.error('[payments/cancel] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
