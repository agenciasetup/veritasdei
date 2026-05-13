/**
 * GET   /api/payments/subscription
 *   → dados da assinatura ativa do usuário (provider, status, próximo
 *     vencimento, billingType, valor, plano, histórico curto de cobranças).
 *
 * PATCH /api/payments/subscription
 *   Body: { nextDueDate?: 'YYYY-MM-DD', billingType?: 'PIX'|'BOLETO'|'CREDIT_CARD' }
 *   → atualiza Asaas via PUT /v3/subscriptions/:id.
 *
 * Por enquanto, suporta APENAS Asaas. Stripe tem o Customer Portal pra
 * isso e Hubla gerencia fora.
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  AsaasApiError,
  getSubscription,
  listCustomerPayments,
  updateSubscription,
  type AsaasBillingType,
} from '@/lib/payments/providers/asaas-client'

export const runtime = 'nodejs'

const ALLOWED_BILLING_TYPES: AsaasBillingType[] = [
  'PIX',
  'BOLETO',
  'CREDIT_CARD',
]

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s))
}

async function loadActiveSubscription(userId: string) {
  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('billing_subscriptions')
    .select(
      'id, provider, provider_customer_id, provider_subscription_id, status, current_period_end, cancel_at_period_end, plan_id, price_id, metadata',
    )
    .eq('user_id', userId)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('atualizado_em', { ascending: false })
    .limit(1)
    .maybeSingle()
  return sub
}

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const sub = await loadActiveSubscription(user.id)
  if (!sub) {
    return NextResponse.json({ subscription: null })
  }

  // Para providers não-Asaas (Stripe, Hubla, RevenueCat) devolvemos o
  // mínimo do nosso banco — o painel cai no botão "Gerenciar pagamento"
  // (portal) que já existe.
  if (sub.provider !== 'asaas' || !sub.provider_subscription_id) {
    return NextResponse.json({
      subscription: {
        provider: sub.provider,
        status: sub.status,
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        supportsSelfService: false,
      },
    })
  }

  // Asaas: complementa com dados do gateway + últimos pagamentos.
  try {
    const [asaasSub, payments] = await Promise.all([
      getSubscription(sub.provider_subscription_id as string),
      sub.provider_customer_id
        ? listCustomerPayments(sub.provider_customer_id as string, {
            limit: 10,
          })
        : Promise.resolve({ data: [], hasMore: false, totalCount: 0 }),
    ])

    return NextResponse.json({
      subscription: {
        provider: 'asaas',
        supportsSelfService: true,
        status: sub.status,
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        // Direto do Asaas (fonte da verdade para campos editáveis):
        nextDueDate: asaasSub.nextDueDate,
        billingType: asaasSub.billingType,
        value: asaasSub.value,
        cycle: asaasSub.cycle,
        asaasStatus: asaasSub.status,
      },
      payments: payments.data.map(p => ({
        id: p.id,
        value: p.value,
        status: p.status,
        billingType: p.billingType,
        dueDate: p.dueDate,
        paymentDate: p.paymentDate ?? null,
        invoiceUrl: p.invoiceUrl ?? null,
      })),
    })
  } catch (err) {
    if (err instanceof AsaasApiError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    const msg = err instanceof Error ? err.message : 'Falha ao carregar'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: { nextDueDate?: string; billingType?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const sub = await loadActiveSubscription(user.id)
  if (!sub || sub.provider !== 'asaas' || !sub.provider_subscription_id) {
    return NextResponse.json(
      { error: 'Sem assinatura Asaas ativa' },
      { status: 404 },
    )
  }

  const patch: {
    nextDueDate?: string
    billingType?: AsaasBillingType
    updatePendingPayments?: boolean
  } = {}

  if (body.nextDueDate) {
    if (!isValidDate(body.nextDueDate)) {
      return NextResponse.json(
        { error: 'nextDueDate deve ser YYYY-MM-DD' },
        { status: 400 },
      )
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (new Date(body.nextDueDate) < today) {
      return NextResponse.json(
        { error: 'Nova data não pode ser no passado' },
        { status: 400 },
      )
    }
    patch.nextDueDate = body.nextDueDate
    // Propaga pra fatura pendente: se o usuário muda a data, espera-se
    // que a próxima cobrança em aberto também acompanhe.
    patch.updatePendingPayments = true
  }

  if (body.billingType) {
    const bt = body.billingType.toUpperCase() as AsaasBillingType
    if (!ALLOWED_BILLING_TYPES.includes(bt)) {
      return NextResponse.json(
        { error: 'billingType inválido' },
        { status: 400 },
      )
    }
    // Trocar pra CREDIT_CARD aqui só funciona se a sub já tinha cartão
    // tokenizado antes (Asaas reusa). Sem cartão prévio, retornamos um
    // erro guiado pro endpoint /credit-card.
    patch.billingType = bt
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 })
  }

  try {
    const updated = await updateSubscription(
      sub.provider_subscription_id as string,
      patch,
    )
    return NextResponse.json({
      ok: true,
      subscription: {
        nextDueDate: updated.nextDueDate,
        billingType: updated.billingType,
        value: updated.value,
      },
    })
  } catch (err) {
    if (err instanceof AsaasApiError) {
      return NextResponse.json(
        { error: err.message, code: err.errors[0]?.code ?? null },
        { status: 400 },
      )
    }
    const msg = err instanceof Error ? err.message : 'Falha ao atualizar'
    console.error('[subscription PATCH] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
