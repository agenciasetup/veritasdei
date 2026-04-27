/**
 * RevenueCat — provider server-side (webhook normalize).
 *
 * RevenueCat agrega Google Play Billing (Android) e StoreKit (iOS) e
 * dispara um único webhook unificado para o nosso backend, com payload
 * documentado em https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields.
 *
 * Diferente do Stripe, NÃO existe createCheckout/createPortal aqui:
 *  - A compra acontece nativamente no app via SDK (Purchases.purchasePackage).
 *  - O "portal" é o Customer Center (também via SDK) ou o app-store
 *    deep link nativo. O servidor não monta URL.
 *
 * Por isso `createCheckout` e `createPortal` lançam — chamar essas
 * funções num contexto RevenueCat indica bug no caller (que deveria
 * estar no client, não no servidor).
 */

import type {
  PaymentProvider,
  NormalizedEvent,
  CheckoutInput,
  PortalInput,
  Intervalo,
  SubscriptionStatus,
} from '../types'

const SECRET = process.env.REVENUECAT_WEBHOOK_SECRET ?? ''

/**
 * Mapeia product_id RevenueCat → intervalo do nosso billing_prices.
 *
 * Os product IDs são definidos no painel RevenueCat (Test Store hoje;
 * Play/Apple no futuro). A convenção `premium_<intervalo>` permite
 * derivar sem lookup adicional. Se aparecer um ID desconhecido,
 * caímos em null (o dispatcher só não consegue resolver price_id —
 * a subscription ainda é gravada com plan_id=null e o webhook não
 * trava).
 */
function intervaloFromProductId(productId: string): Intervalo | undefined {
  if (productId === 'premium_mensal') return 'mensal'
  if (productId === 'premium_semestral') return 'semestral'
  if (productId === 'premium_anual') return 'anual'
  if (productId === 'premium_vitalicio') return 'unico'
  return undefined
}

/**
 * Mapeia event_type RevenueCat → SubscriptionStatus.
 *
 * Eventos que indicam acesso ATIVO viram 'active' (ou 'trialing' se
 * is_trial_period=true). Cancelamentos viram 'canceled'. Falhas de
 * cobrança viram 'past_due'. Lifetime (NON_RENEWING_PURCHASE) é
 * 'active' permanente.
 */
function statusFromEvent(
  type: string,
  isTrial: boolean,
): SubscriptionStatus {
  switch (type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'PRODUCT_CHANGE':
    case 'UNCANCELLATION':
    case 'NON_RENEWING_PURCHASE':
      return isTrial ? 'trialing' : 'active'
    case 'CANCELLATION':
      // CANCELLATION significa "marcada para não renovar". O usuário
      // ainda tem acesso até expiration_at_ms — status segue ativo.
      return 'active'
    case 'EXPIRATION':
      return 'canceled'
    case 'BILLING_ISSUE':
      return 'past_due'
    case 'SUBSCRIPTION_PAUSED':
      return 'paused'
    default:
      return 'active'
  }
}

/**
 * Compara dois headers de autorização em tempo constante.
 * Evita timing attacks ao validar o webhook secret.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

type RcEvent = {
  type: string
  id: string
  app_user_id: string
  original_app_user_id?: string
  product_id?: string
  period_type?: string
  purchased_at_ms?: number
  expiration_at_ms?: number | null
  cancel_reason?: string | null
  is_trial_period?: boolean
  transaction_id?: string
  original_transaction_id?: string
  app_id?: string
  store?: string
  environment?: string
  price?: number
  currency?: string
  takehome_percentage?: number
  presented_offering_id?: string | null
}

type RcWebhookBody = {
  event: RcEvent
  api_version?: string
}

export const revenuecatProvider: PaymentProvider = {
  id: 'revenuecat',

  async createCheckout(_input: CheckoutInput) {
    throw new Error(
      '[revenuecat] createCheckout não se aplica — compras acontecem ' +
        'nativamente via Purchases.purchasePackage no client.',
    )
  },

  async createPortal(_input: PortalInput) {
    throw new Error(
      '[revenuecat] createPortal não se aplica — gerenciamento via ' +
        'Customer Center (SDK) ou deep link de app store.',
    )
  },

  async verifyAndParse(req: Request): Promise<NormalizedEvent> {
    const auth = req.headers.get('authorization') ?? ''
    if (!SECRET || !safeEqual(auth, SECRET)) {
      throw new Error('Authorization header inválido')
    }

    const body = (await req.json()) as RcWebhookBody
    const ev = body.event
    if (!ev || !ev.type || !ev.id) {
      throw new Error('payload sem event.type ou event.id')
    }

    // Eventos sem impacto em entitlement — ignoramos pra deduplicar
    // sem custo. Lista baseada em
    // https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields.
    const IGNORED = new Set([
      'TEST',
      'SUBSCRIBER_ALIAS',
      'TRANSFER',
      'INVOICE_ISSUANCE',
      'TEMPORARY_ENTITLEMENT_GRANT',
    ])
    if (IGNORED.has(ev.type)) {
      return {
        type: 'ignore',
        provider: 'revenuecat',
        providerEventId: ev.id,
        reason: `evento '${ev.type}' não afeta entitlement`,
        raw: body,
      }
    }

    // Identificador único da assinatura.
    // Para subs recorrentes: original_transaction_id é estável entre renovações.
    // Para lifetime (NON_RENEWING_PURCHASE): cai pro transaction_id.
    const subscriptionId =
      ev.original_transaction_id ?? ev.transaction_id ?? ev.id
    const userId = ev.app_user_id || null

    if (ev.type === 'EXPIRATION' || ev.type === 'CANCELLATION' && ev.expiration_at_ms && ev.expiration_at_ms < Date.now()) {
      return {
        type: 'subscription.canceled',
        provider: 'revenuecat',
        providerEventId: ev.id,
        providerSubscriptionId: subscriptionId,
        canceledAt: new Date(ev.expiration_at_ms ?? Date.now()).toISOString(),
        raw: body,
      }
    }

    const status = statusFromEvent(ev.type, !!ev.is_trial_period)
    const cancelAtPeriodEnd = ev.type === 'CANCELLATION'
    const intervalo = ev.product_id
      ? intervaloFromProductId(ev.product_id)
      : undefined

    return {
      type: 'subscription.upserted',
      provider: 'revenuecat',
      providerEventId: ev.id,
      userId,
      providerCustomerId: ev.original_app_user_id ?? userId,
      providerSubscriptionId: subscriptionId,
      status,
      priceRef: intervalo ? { intervalo } : null,
      currentPeriodStart: ev.purchased_at_ms
        ? new Date(ev.purchased_at_ms).toISOString()
        : null,
      currentPeriodEnd: ev.expiration_at_ms
        ? new Date(ev.expiration_at_ms).toISOString()
        : null,
      cancelAtPeriodEnd,
      canceledAt:
        ev.type === 'CANCELLATION' && ev.expiration_at_ms
          ? new Date(ev.expiration_at_ms).toISOString()
          : null,
      trialEnd:
        ev.is_trial_period && ev.expiration_at_ms
          ? new Date(ev.expiration_at_ms).toISOString()
          : null,
      metadata: {
        rc_event_type: ev.type,
        rc_store: ev.store ?? null,
        rc_environment: ev.environment ?? null,
        rc_product_id: ev.product_id ?? null,
        rc_period_type: ev.period_type ?? null,
      },
      raw: body,
    }
  },
}
