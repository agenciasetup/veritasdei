/**
 * Provider Hubla — checkout externo + webhook.
 *
 * A Hubla hospeda o checkout (pay.hubla.com.br/{produto}). Não há criação
 * de session via API como Stripe: o app só monta a URL com `email` e
 * `name` pré-preenchidos e redireciona o usuário. O retorno acontece via
 * webhook (assíncrono) que ativa a assinatura no Supabase.
 *
 * Eventos cobertos (Hubla webhooks v2):
 *  - subscription.created    → upsert status 'incomplete' (ainda não pago)
 *  - subscription.activated  → upsert status 'active'
 *  - subscription.expiring   → ignora (informativo)
 *  - subscription.deactivated → cancela
 *  - invoice.payment_succeeded → log + ativa caso a sub ainda esteja incomplete
 *  - invoice.payment_failed  → log
 *  - invoice.refunded        → cancela a sub
 *
 * Autenticação:
 *  - Header `x-hubla-token` (token estático configurado no painel Hubla)
 *  - Comparado em tempo constante com HUBLA_WEBHOOK_TOKEN.
 *
 * Idempotência:
 *  - Header `x-hubla-idempotency` é usado como provider_event_id.
 *    (billing_webhook_events tem UNIQUE em (provider, provider_event_id).)
 *
 * Mapeamento de plano:
 *  - O webhook traz `event.product.id` (UUID da Hubla). Como o produto
 *    Veritas Educa é fixo, mapeamos via env HUBLA_PRODUCT_ID_VERITAS_EDUCA.
 *  - Se quiser vender outros produtos pela Hubla no futuro, expandir
 *    HUBLA_PRODUCT_MAP (productId → codigoPlano).
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

// --------------------------------------------------------------------------
// Helpers de autenticação
// --------------------------------------------------------------------------

/** Comparação de string em tempo constante (evita timing attacks). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function getWebhookToken(): string {
  const tok = process.env.HUBLA_WEBHOOK_TOKEN
  if (!tok) throw new Error('HUBLA_WEBHOOK_TOKEN ausente no env')
  return tok
}

// --------------------------------------------------------------------------
// Helpers de mapeamento
// --------------------------------------------------------------------------

/** Mapa productId Hubla → código do plano no nosso banco. */
function getProductMap(): Record<string, string> {
  const educa = process.env.HUBLA_PRODUCT_ID_VERITAS_EDUCA
  const map: Record<string, string> = {}
  if (educa) map[educa] = 'veritas-educa'
  return map
}

function mapBillingCycleToIntervalo(
  months: number | null | undefined,
): 'mensal' | 'semestral' | 'anual' | 'unico' | undefined {
  if (!months) return undefined
  if (months === 1) return 'mensal'
  if (months === 6) return 'semestral'
  if (months === 12) return 'anual'
  return undefined
}

/**
 * Resolve o plano (e price default mensal, se existir) a partir do
 * productId que veio da Hubla. Retorna null se o produto não está
 * mapeado — caller decide se ignora ou explode.
 */
async function resolvePlanFromHublaProduct(
  productId: string | null | undefined,
): Promise<{ planId: string; codigo: string } | null> {
  if (!productId) return null
  const map = getProductMap()
  const codigo = map[productId]
  if (!codigo) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('billing_plans')
    .select('id, codigo')
    .eq('codigo', codigo)
    .maybeSingle()
  if (!data) return null
  return { planId: data.id as string, codigo: data.codigo as string }
}

// --------------------------------------------------------------------------
// Status mapping
// --------------------------------------------------------------------------

/** Mapeia status da subscription da Hubla pro nosso enum. */
function statusFromHubla(s: string | null | undefined): SubscriptionStatus {
  switch ((s ?? '').toLowerCase()) {
    case 'active':
    case 'activated':
      return 'active'
    case 'trialing':
    case 'trial':
      return 'trialing'
    case 'past_due':
    case 'overdue':
      return 'past_due'
    case 'canceled':
    case 'cancelled':
    case 'deactivated':
      return 'canceled'
    case 'paused':
      return 'paused'
    case 'incomplete':
    case 'pending':
    default:
      return 'incomplete'
  }
}

// --------------------------------------------------------------------------
// Tipos do payload Hubla (subset que usamos)
// --------------------------------------------------------------------------

type HublaUser = {
  id?: string
  email?: string
  firstName?: string
  lastName?: string
}

type HublaSubscription = {
  id?: string
  status?: string
  billingCycleMonths?: number
  autoRenew?: boolean
  activatedAt?: string
  inactivatedAt?: string
  modifiedAt?: string
  createdAt?: string
}

type HublaInvoice = {
  id?: string
  subscriptionId?: string
  status?: string
  paymentMethod?: string
  amount?: {
    totalCents?: number
  }
  payer?: HublaUser
}

type HublaPayload = {
  type?: string
  version?: string
  event?: {
    product?: { id?: string; name?: string }
    subscription?: HublaSubscription
    invoice?: HublaInvoice
    user?: HublaUser
  }
}

// --------------------------------------------------------------------------
// Resolução de userId (Supabase) a partir do email da Hubla
// --------------------------------------------------------------------------

/**
 * A Hubla não conhece o nosso UUID — só o email. Resolvemos olhando
 * `profiles.email` (que reflete auth.users.email após signup).
 *
 * Caso o usuário ainda não tenha conta, retornamos null. O dispatcher
 * vai falhar ao tentar upsert (subscription.upserted requer userId), e
 * o webhook ficará marcado com erro em billing_webhook_events. Quando
 * o usuário criar a conta com aquele email, basta reenviar o evento
 * (Hubla painel) ou rodar um script de reconciliação.
 */
async function resolveUserIdByEmail(
  email: string | null | undefined,
): Promise<string | null> {
  if (!email) return null
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('id')
    .ilike('email', email.trim())
    .limit(1)
    .maybeSingle()
  return (data?.id as string | undefined) ?? null
}

// --------------------------------------------------------------------------
// Provider
// --------------------------------------------------------------------------

export const hublaProvider: PaymentProvider = {
  id: 'hubla',

  async createCheckout(_input: CheckoutInput): Promise<CheckoutResult> {
    // Hubla não tem API de session de checkout — o link é estático.
    // Use `buildHublaCheckoutUrl` no client/server e redirecione direto.
    throw new Error(
      'Hubla não suporta createCheckout via API. Use buildHublaCheckoutUrl(email, name) e redirecione.',
    )
  },

  async createPortal(_input: PortalInput): Promise<PortalResult> {
    // Hubla não tem portal de cliente integrado. Direcione o usuário
    // ao centro de ajuda da Hubla ou ao seu próprio suporte.
    throw new Error('Hubla não tem portal de cliente integrado.')
  },

  async verifyAndParse(req: Request): Promise<NormalizedEvent> {
    const expected = getWebhookToken()
    const got = req.headers.get('x-hubla-token') || ''
    if (!got || !safeEqual(got, expected)) {
      throw new Error('x-hubla-token inválido')
    }

    // Idempotency: Hubla envia x-hubla-idempotency único por entrega.
    const idempotency = req.headers.get('x-hubla-idempotency')

    const body = await req.text()
    let payload: HublaPayload
    try {
      payload = JSON.parse(body) as HublaPayload
    } catch {
      throw new Error('payload inválido (não é JSON)')
    }

    return translateHublaEvent(payload, idempotency)
  },
}

// --------------------------------------------------------------------------
// Tradução de eventos Hubla → NormalizedEvent
// --------------------------------------------------------------------------

async function translateHublaEvent(
  payload: HublaPayload,
  idempotencyKey: string | null,
): Promise<NormalizedEvent> {
  const type = (payload.type ?? '').toLowerCase()
  const ev = payload.event ?? {}
  const user = ev.user
  const sub = ev.subscription
  const invoice = ev.invoice
  const productId = ev.product?.id

  // Fallback de idempotency: se Hubla não mandar o header (não deveria
  // acontecer), tenta derivar dos IDs do payload. Última opção é um
  // aleatório — não bloqueia processamento, mas perde a dedup.
  const providerEventId =
    idempotencyKey ||
    (sub?.id
      ? `${type}-${sub.id}-${sub.modifiedAt ?? sub.createdAt ?? ''}`
      : null) ||
    (invoice?.id ? `${type}-${invoice.id}` : null) ||
    `hubla-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  const base = {
    provider: 'hubla' as const,
    providerEventId,
    raw: payload as unknown,
  }

  switch (type) {
    case 'subscription.created':
    case 'subscription.activated':
    case 'subscription.renewal_enabled':
    case 'subscription.renewal_disabled': {
      if (!sub?.id) {
        return { ...base, type: 'ignore', reason: 'subscription sem id' }
      }
      const plan = await resolvePlanFromHublaProduct(productId)
      if (!plan) {
        return {
          ...base,
          type: 'ignore',
          reason: `produto Hubla ${productId} não mapeado`,
        }
      }
      const userId = await resolveUserIdByEmail(user?.email)
      const intervalo = mapBillingCycleToIntervalo(sub.billingCycleMonths)

      // Para `subscription.created` antes do pagamento, status pode vir
      // como pending/incomplete. Activated → active. Normalizamos.
      const status: SubscriptionStatus =
        type === 'subscription.activated'
          ? 'active'
          : statusFromHubla(sub.status)

      return {
        ...base,
        type: 'subscription.upserted',
        userId,
        providerCustomerId: user?.id ?? null,
        providerSubscriptionId: sub.id,
        status,
        priceRef: intervalo ? { intervalo } : null,
        currentPeriodStart: sub.activatedAt ?? sub.createdAt ?? null,
        currentPeriodEnd: null, // Hubla não expõe diretamente; ok deixar null.
        cancelAtPeriodEnd: sub.autoRenew === false,
        canceledAt: sub.inactivatedAt ?? null,
        trialEnd: null,
        metadata: {
          hubla_product_id: productId,
          hubla_product_name: ev.product?.name,
          billing_cycle_months: sub.billingCycleMonths,
          customer_email: user?.email,
          plan_codigo: plan.codigo,
        },
      }
    }

    case 'subscription.deactivated':
    case 'subscription.expired':
    case 'subscription.canceled': {
      if (!sub?.id) {
        return { ...base, type: 'ignore', reason: 'subscription sem id' }
      }
      return {
        ...base,
        type: 'subscription.canceled',
        providerSubscriptionId: sub.id,
        canceledAt:
          sub.inactivatedAt ?? sub.modifiedAt ?? new Date().toISOString(),
      }
    }

    case 'invoice.payment_succeeded':
    case 'invoice.paid': {
      // Se a sub correspondente ainda estiver `incomplete` no banco
      // (subscription.created chegou antes mas sem ativação), ativamos
      // agora via upsert. Caso contrário só logamos como payment.succeeded.
      const subId = invoice?.subscriptionId
      if (subId) {
        const plan = await resolvePlanFromHublaProduct(productId)
        const userId = await resolveUserIdByEmail(
          invoice?.payer?.email ?? user?.email,
        )
        if (plan && userId) {
          return {
            ...base,
            type: 'subscription.upserted',
            userId,
            providerCustomerId: invoice?.payer?.id ?? user?.id ?? null,
            providerSubscriptionId: subId,
            status: 'active',
            priceRef: null,
            currentPeriodStart: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            canceledAt: null,
            trialEnd: null,
            metadata: {
              hubla_product_id: productId,
              plan_codigo: plan.codigo,
              activated_by: 'invoice.payment_succeeded',
            },
          }
        }
      }
      return {
        ...base,
        type: 'payment.succeeded',
        providerSubscriptionId: invoice?.subscriptionId ?? null,
        userId: null,
        amountCents: invoice?.amount?.totalCents ?? 0,
        moeda: 'BRL',
      }
    }

    case 'invoice.payment_failed': {
      return {
        ...base,
        type: 'payment.failed',
        providerSubscriptionId: invoice?.subscriptionId ?? null,
        userId: null,
      }
    }

    case 'invoice.refunded': {
      if (invoice?.subscriptionId) {
        return {
          ...base,
          type: 'subscription.canceled',
          providerSubscriptionId: invoice.subscriptionId,
          canceledAt: new Date().toISOString(),
        }
      }
      return { ...base, type: 'ignore', reason: 'refund sem subscriptionId' }
    }

    default:
      return { ...base, type: 'ignore', reason: `unhandled: ${type || 'sem type'}` }
  }
}
