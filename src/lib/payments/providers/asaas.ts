/**
 * Provider Asaas — default global do Veritas Dei e Veritas Educa.
 *
 * Fluxo de checkout (diferente de Stripe):
 *  1. `createCheckout` é chamado por /api/payments/checkout.
 *  2. Resolvemos/criamos o customer Asaas (externalReference=user_id).
 *  3. Criamos uma `billing_checkout_sessions` (estado nosso) e retornamos
 *     a URL interna `/checkout/<sessionId>` — NÃO redirecionamos pra
 *     Asaas hosted page. O checkout custom é renderizado pelo nosso app.
 *  4. Em /checkout/[sessionId], o usuário escolhe PIX/cartão, e a rota
 *     `/api/payments/asaas/charge` chama `createPayment` ou
 *     `createSubscription` no Asaas conforme escolha.
 *  5. Pagamento confirmado → webhook PAYMENT_RECEIVED/CONFIRMED →
 *     dispatcher ativa a assinatura em billing_subscriptions.
 *
 * Webhook:
 *  - Header `asaas-access-token` comparado em tempo constante com
 *    ASAAS_WEBHOOK_TOKEN.
 *  - Idempotência via providerEventId = `${event}-${payment.id}`.
 *  - Eventos cobertos: PAYMENT_CONFIRMED, PAYMENT_RECEIVED → activa.
 *    PAYMENT_OVERDUE/REFUNDED → past_due/canceled.
 *    SUBSCRIPTION_* → atualiza/cancela.
 *
 * Portal:
 *  - Asaas não tem portal nativo. Surfacemos os dados em /perfil?tab=assinatura
 *    e expomos um endpoint próprio /api/payments/cancel (que chama
 *    cancelSubscription). createPortal() retorna a URL do nosso perfil.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type {
  CheckoutInput,
  CheckoutResult,
  NormalizedEvent,
  PaymentProvider,
  PortalInput,
  PortalResult,
  SubscriptionStatus,
} from '../types'
import {
  AsaasApiError,
  createCustomer,
  findCustomerByExternalReference,
  intervaloToCycle,
  type AsaasPayment,
  type AsaasSubscription,
} from './asaas-client'

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function getWebhookToken(): string {
  const tok = process.env.ASAAS_WEBHOOK_TOKEN
  if (!tok) throw new Error('ASAAS_WEBHOOK_TOKEN ausente no env')
  return tok
}

/**
 * Resolve customer Asaas a partir do user_id Veritas. Tenta:
 *  1. Lookup em billing_subscriptions/asaas → reusa customer_id existente.
 *  2. findCustomerByExternalReference (caso já exista mas sem subscription).
 *  3. createCustomer (novo).
 */
async function resolveOrCreateCustomer(
  userId: string,
  userEmail: string,
  userName: string,
): Promise<string> {
  const admin = createAdminClient()

  // 1. Tem assinatura Asaas anterior com customer_id? Reusa.
  const { data: existingSub } = await admin
    .from('billing_subscriptions')
    .select('provider_customer_id')
    .eq('user_id', userId)
    .eq('provider', 'asaas')
    .not('provider_customer_id', 'is', null)
    .limit(1)
    .maybeSingle()

  if (existingSub?.provider_customer_id) {
    return existingSub.provider_customer_id as string
  }

  // 2. Já existe no Asaas via externalReference?
  try {
    const existing = await findCustomerByExternalReference(userId)
    if (existing) return existing.id
  } catch (err) {
    // Tolerar 404/list vazia — vamos criar.
    if (err instanceof AsaasApiError && err.status >= 500) throw err
  }

  // 3. Cria novo.
  const created = await createCustomer({
    name: userName || userEmail.split('@')[0] || 'Cliente Veritas',
    email: userEmail,
    externalReference: userId,
    notificationDisabled: false,
  })
  return created.id
}

// --------------------------------------------------------------------------
// Provider implementation
// --------------------------------------------------------------------------

export const asaasProvider: PaymentProvider = {
  id: 'asaas',

  /**
   * Cria uma billing_checkout_sessions e retorna a URL interna do checkout
   * customizado. Não redirecionamos pra página do Asaas.
   */
  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const admin = createAdminClient()

    // Busca o price + plan
    const { data: priceRow, error: priceErr } = await admin
      .from('billing_prices')
      .select('id, plan_id, intervalo, amount_cents, asaas_value_cents, ativo')
      .eq('id', input.priceId)
      .maybeSingle()
    if (priceErr) throw new Error(`price lookup: ${priceErr.message}`)
    if (!priceRow) throw new Error('Preço não encontrado')
    if (!priceRow.ativo) throw new Error('Preço inativo')

    const amountCents =
      (priceRow.asaas_value_cents as number | null) ??
      (priceRow.amount_cents as number)
    if (!amountCents || amountCents <= 0) {
      throw new Error('Preço sem valor válido')
    }

    // Cria/resolve customer no Asaas (precisa cpfCnpj só na hora do pagamento).
    const customerId = await resolveOrCreateCustomer(
      input.userId,
      input.userEmail,
      input.userName ?? '',
    )

    // Cria a session interna. Sem chamar Asaas ainda — pagamento é gerado
    // no /api/payments/asaas/charge quando o usuário confirma método.
    const { data: session, error: sessErr } = await admin
      .from('billing_checkout_sessions')
      .insert({
        user_id: input.userId,
        price_id: priceRow.id,
        plan_id: priceRow.plan_id,
        provider: 'asaas',
        asaas_customer_id: customerId,
        status: 'pending',
        amount_cents: amountCents,
        intervalo: priceRow.intervalo,
        metadata: {
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
        },
      })
      .select('id')
      .single()
    if (sessErr) throw new Error(`session create: ${sessErr.message}`)

    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
      'http://localhost:3000'

    return {
      url: `${origin}/checkout/${session.id as string}`,
      provider: 'asaas',
    }
  },

  /**
   * Asaas não tem portal nativo. Retornamos URL do perfil (a UI lá expõe
   * "Cancelar assinatura" que chama /api/payments/cancel).
   */
  async createPortal(input: PortalInput): Promise<PortalResult> {
    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
      input.returnUrl ??
      'http://localhost:3000'
    return { url: `${origin}/perfil?tab=assinatura` }
  },

  async verifyAndParse(req: Request): Promise<NormalizedEvent> {
    const expected = getWebhookToken()
    const got = req.headers.get('asaas-access-token') || ''
    if (!got || !safeEqual(got, expected)) {
      throw new Error('asaas-access-token inválido')
    }

    const body = await req.text()
    let payload: AsaasWebhookPayload
    try {
      payload = JSON.parse(body) as AsaasWebhookPayload
    } catch {
      throw new Error('payload inválido (não é JSON)')
    }

    return translateAsaasEvent(payload)
  },
}

// --------------------------------------------------------------------------
// Webhook payload
// --------------------------------------------------------------------------

type AsaasWebhookPayload = {
  id?: string // id único da entrega (idempotency)
  event:
    | 'PAYMENT_CREATED'
    | 'PAYMENT_AWAITING_RISK_ANALYSIS'
    | 'PAYMENT_APPROVED_BY_RISK_ANALYSIS'
    | 'PAYMENT_REPROVED_BY_RISK_ANALYSIS'
    | 'PAYMENT_UPDATED'
    | 'PAYMENT_CONFIRMED'
    | 'PAYMENT_RECEIVED'
    | 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED'
    | 'PAYMENT_OVERDUE'
    | 'PAYMENT_DELETED'
    | 'PAYMENT_RESTORED'
    | 'PAYMENT_REFUNDED'
    | 'PAYMENT_CHARGEBACK_REQUESTED'
    | 'PAYMENT_CHARGEBACK_DISPUTE'
    | 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL'
    | 'PAYMENT_DUNNING_RECEIVED'
    | 'PAYMENT_DUNNING_REQUESTED'
    | 'PAYMENT_BANK_SLIP_VIEWED'
    | 'PAYMENT_CHECKOUT_VIEWED'
    | 'SUBSCRIPTION_CREATED'
    | 'SUBSCRIPTION_UPDATED'
    | 'SUBSCRIPTION_DELETED'
    | 'SUBSCRIPTION_INACTIVATED'
    | string // tolerante a eventos novos
  payment?: AsaasPayment
  subscription?: AsaasSubscription
}

function translateAsaasEvent(
  payload: AsaasWebhookPayload,
): NormalizedEvent {
  const event = payload.event
  const payment = payload.payment
  const subscription = payload.subscription

  // Idempotency: Asaas envia `id` único por entrega. Caso ausente, usamos
  // event + payment/subscription id (suficiente pra dedup).
  const providerEventId =
    payload.id ||
    (payment ? `${event}-${payment.id}` : null) ||
    (subscription ? `${event}-${subscription.id}` : null) ||
    `asaas-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const base = {
    provider: 'asaas' as const,
    providerEventId,
    raw: payload as unknown,
  }

  // ===== Payment events =====
  if (event.startsWith('PAYMENT_')) {
    if (!payment) {
      return { ...base, type: 'ignore', reason: 'PAYMENT_* sem payment' }
    }

    // PAYMENT_CONFIRMED = cartão capturado (subscription pode estar a caminho)
    // PAYMENT_RECEIVED = caiu na conta (PIX/boleto/cartão confirmado)
    if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
      const userId = payment.externalReference ?? null
      return {
        ...base,
        type: 'subscription.upserted',
        userId,
        providerCustomerId: payment.customer,
        providerSubscriptionId: payment.subscription ?? payment.id,
        status: 'active',
        priceRef: null,
        currentPeriodStart: payment.paymentDate ?? null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        trialEnd: null,
        metadata: {
          asaas_payment_id: payment.id,
          asaas_subscription_id: payment.subscription ?? null,
          billing_type: payment.billingType,
          value_cents: Math.round(payment.value * 100),
          source_event: event,
        },
      }
    }

    if (event === 'PAYMENT_OVERDUE') {
      return {
        ...base,
        type: 'payment.failed',
        providerSubscriptionId: payment.subscription ?? payment.id,
        userId: payment.externalReference ?? null,
      }
    }

    if (event === 'PAYMENT_REFUNDED' || event === 'PAYMENT_CHARGEBACK_REQUESTED') {
      // Cancela a assinatura se o pagamento estava ligado a uma sub
      const subId = payment.subscription ?? payment.id
      return {
        ...base,
        type: 'subscription.canceled',
        providerSubscriptionId: subId,
        canceledAt: new Date().toISOString(),
      }
    }

    if (event === 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED') {
      return {
        ...base,
        type: 'payment.failed',
        providerSubscriptionId: payment.subscription ?? payment.id,
        userId: payment.externalReference ?? null,
      }
    }

    // Outros payment events (CREATED, UPDATED, DELETED, RESTORED, etc.) — só loga.
    return { ...base, type: 'ignore', reason: `payment event sem ação: ${event}` }
  }

  // ===== Subscription events =====
  if (event.startsWith('SUBSCRIPTION_')) {
    if (!subscription) {
      return { ...base, type: 'ignore', reason: 'SUBSCRIPTION_* sem subscription' }
    }

    if (
      event === 'SUBSCRIPTION_DELETED' ||
      event === 'SUBSCRIPTION_INACTIVATED'
    ) {
      return {
        ...base,
        type: 'subscription.canceled',
        providerSubscriptionId: subscription.id,
        canceledAt: new Date().toISOString(),
      }
    }

    if (event === 'SUBSCRIPTION_CREATED' || event === 'SUBSCRIPTION_UPDATED') {
      const userId = subscription.externalReference ?? null
      const status: SubscriptionStatus =
        subscription.status === 'ACTIVE'
          ? 'active'
          : subscription.status === 'EXPIRED'
            ? 'canceled'
            : 'incomplete'
      return {
        ...base,
        type: 'subscription.upserted',
        userId,
        providerCustomerId: subscription.customer,
        providerSubscriptionId: subscription.id,
        status,
        priceRef: null,
        currentPeriodStart: null,
        currentPeriodEnd: subscription.nextDueDate ?? null,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        trialEnd: null,
        metadata: {
          billing_type: subscription.billingType,
          cycle: subscription.cycle,
          value_cents: Math.round(subscription.value * 100),
          source_event: event,
        },
      }
    }

    return {
      ...base,
      type: 'ignore',
      reason: `subscription event sem ação: ${event}`,
    }
  }

  return { ...base, type: 'ignore', reason: `unhandled: ${event}` }
}

// Re-export pra uso por outros módulos (ex.: /api/payments/cancel)
export { intervaloToCycle }
