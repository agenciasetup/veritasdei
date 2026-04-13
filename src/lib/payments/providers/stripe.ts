/**
 * Provider Stripe.
 *
 * Esta implementação é a espinha dorsal — quando você rodar testes com
 * chaves reais e a doc da Stripe aberta, vai querer revisar:
 *   1. API version fixa (hoje usamos a default do SDK). Pinar via
 *      `apiVersion: '2025-XX-XX'` quando definido.
 *   2. `payment_method_types` — hoje enviamos ['card','pix','boleto'],
 *      mas PIX/boleto no Brasil têm requisitos (endereço, CPF).
 *   3. Customer Portal — precisa ser habilitado no dashboard.
 *
 * Fluxo:
 *  - createCheckout → Checkout Session em modo subscription
 *  - createPortal   → Billing Portal Session
 *  - verifyAndParse → verifica `stripe-signature` e traduz eventos
 */

import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type {
  PaymentProvider,
  CheckoutInput,
  CheckoutResult,
  PortalInput,
  PortalResult,
  NormalizedEvent,
  SubscriptionStatus,
} from '../types'

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY ausente no env')
  // apiVersion: usar a default do SDK por enquanto; pinar depois da revisão.
  return new Stripe(key)
}

function statusFromStripe(s: Stripe.Subscription.Status): SubscriptionStatus {
  // Stripe e nosso enum combinam 1:1.
  return s as SubscriptionStatus
}

function ts(unix: number | null | undefined): string | null {
  if (!unix) return null
  return new Date(unix * 1000).toISOString()
}

async function resolveCustomerId(
  stripe: Stripe,
  userId: string,
  userEmail: string,
): Promise<string> {
  // Procura assinatura existente pra reusar customer_id
  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('billing_subscriptions')
    .select('provider_customer_id')
    .eq('user_id', userId)
    .eq('provider', 'stripe')
    .not('provider_customer_id', 'is', null)
    .limit(1)
    .maybeSingle()

  if (sub?.provider_customer_id) return sub.provider_customer_id as string

  // Cria novo customer com metadata apontando pro user Supabase
  const customer = await stripe.customers.create({
    email: userEmail,
    metadata: { supabase_user_id: userId },
  })
  return customer.id
}

export const stripeProvider: PaymentProvider = {
  id: 'stripe',

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const stripe = getStripe()

    // Busca o price no banco e pega stripe_price_id
    const admin = createAdminClient()
    const { data: price, error } = await admin
      .from('billing_prices')
      .select('id, stripe_price_id, intervalo, amount_cents')
      .eq('id', input.priceId)
      .maybeSingle()
    if (error) throw new Error(`price lookup: ${error.message}`)
    if (!price) throw new Error('Preço não encontrado')
    if (!price.stripe_price_id) {
      throw new Error(
        `Preço ${price.intervalo} ainda não tem stripe_price_id configurado. ` +
          `Cadastre no dashboard Stripe e cole o ID em Admin → Planos.`,
      )
    }

    const customerId = await resolveCustomerId(
      stripe,
      input.userId,
      input.userEmail,
    )

    // Habilita cartão + PIX + boleto (Brasil)
    // Nota: PIX/boleto só funcionam em BRL e têm requisitos de config.
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      payment_method_types: ['card'],
      // PIX/boleto serão habilitados após revisão da doc Stripe.
      // payment_method_types: ['card', 'pix', 'boleto'],
      line_items: [{ price: price.stripe_price_id, quantity: 1 }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      client_reference_id: input.userId,
      subscription_data: {
        metadata: {
          supabase_user_id: input.userId,
          veritasdei_price_id: price.id,
          intervalo: price.intervalo,
        },
      },
      metadata: {
        supabase_user_id: input.userId,
        veritasdei_price_id: price.id,
      },
    })

    if (!session.url) throw new Error('Stripe não retornou URL de checkout')
    return { url: session.url, provider: 'stripe' }
  },

  async createPortal(input: PortalInput): Promise<PortalResult> {
    const stripe = getStripe()
    const admin = createAdminClient()

    const { data: sub } = await admin
      .from('billing_subscriptions')
      .select('provider_customer_id')
      .eq('user_id', input.userId)
      .eq('provider', 'stripe')
      .not('provider_customer_id', 'is', null)
      .limit(1)
      .maybeSingle()

    if (!sub?.provider_customer_id) {
      throw new Error('Você ainda não tem uma assinatura Stripe ativa.')
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.provider_customer_id as string,
      return_url: input.returnUrl,
    })
    return { url: portal.url }
  },

  async verifyAndParse(req: Request): Promise<NormalizedEvent> {
    const stripe = getStripe()
    const secret = process.env.STRIPE_WEBHOOK_SECRET
    if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET ausente no env')

    const signature = req.headers.get('stripe-signature')
    if (!signature) throw new Error('stripe-signature ausente')

    const body = await req.text()
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, secret)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`Assinatura inválida: ${msg}`)
    }

    return translateStripeEvent(event)
  },
}

function translateStripeEvent(event: Stripe.Event): NormalizedEvent {
  const base = {
    provider: 'stripe' as const,
    providerEventId: event.id,
    raw: event as unknown,
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription' || !session.subscription) {
        return { ...base, type: 'ignore', reason: 'not a subscription checkout' }
      }
      const userId =
        (session.metadata?.supabase_user_id as string | undefined) ??
        (session.client_reference_id as string | null) ??
        null
      const subId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id
      return {
        ...base,
        type: 'subscription.upserted',
        userId,
        providerCustomerId:
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id ?? null,
        providerSubscriptionId: subId,
        status: 'active',
        priceRef: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        trialEnd: null,
        metadata: (session.metadata ?? {}) as Record<string, unknown>,
      }
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const priceObj = sub.items.data[0]?.price
      const stripePriceId = priceObj?.id ?? undefined
      const userId =
        (sub.metadata?.supabase_user_id as string | undefined) ?? null

      const item = sub.items.data[0] as
        | (Stripe.SubscriptionItem & {
            current_period_start?: number
            current_period_end?: number
          })
        | undefined
      const periodStart =
        (sub as unknown as { current_period_start?: number })
          .current_period_start ?? item?.current_period_start ?? null
      const periodEnd =
        (sub as unknown as { current_period_end?: number }).current_period_end ??
        item?.current_period_end ??
        null

      return {
        ...base,
        type: 'subscription.upserted',
        userId,
        providerCustomerId:
          typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
        providerSubscriptionId: sub.id,
        status: statusFromStripe(sub.status),
        priceRef: stripePriceId ? { stripePriceId } : null,
        currentPeriodStart: ts(periodStart),
        currentPeriodEnd: ts(periodEnd),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        canceledAt: ts(sub.canceled_at),
        trialEnd: ts(sub.trial_end),
        metadata: (sub.metadata ?? {}) as Record<string, unknown>,
      }
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      return {
        ...base,
        type: 'subscription.canceled',
        providerSubscriptionId: sub.id,
        canceledAt: new Date().toISOString(),
      }
    }

    case 'invoice.paid':
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice & {
        subscription?: string | Stripe.Subscription | null
      }
      return {
        ...base,
        type: 'payment.succeeded',
        providerSubscriptionId:
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id ?? null,
        userId:
          (invoice.metadata?.supabase_user_id as string | undefined) ?? null,
        amountCents: invoice.amount_paid ?? 0,
        moeda: (invoice.currency ?? 'brl').toUpperCase(),
      }
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice & {
        subscription?: string | Stripe.Subscription | null
      }
      return {
        ...base,
        type: 'payment.failed',
        providerSubscriptionId:
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id ?? null,
        userId:
          (invoice.metadata?.supabase_user_id as string | undefined) ?? null,
      }
    }

    default:
      return { ...base, type: 'ignore', reason: `unhandled: ${event.type}` }
  }
}
