/**
 * Billing — tipos compartilhados.
 *
 * A ideia central: cada provider (Stripe, Kirvano, Hotmart, manual…)
 * traduz seus próprios eventos em um `NormalizedEvent` comum. O
 * `webhook-dispatcher` só conhece esse shape e atualiza o Supabase.
 */

export type ProviderId =
  | 'stripe'
  | 'kirvano'
  | 'hotmart'
  | 'eduzz'
  | 'manual'
  | 'revenuecat'

export type Intervalo = 'mensal' | 'semestral' | 'anual' | 'unico'

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused'

/** Shape que todo provider entrega ao dispatcher. */
export type NormalizedEvent =
  | {
      type: 'subscription.upserted'
      provider: ProviderId
      providerEventId: string
      userId: string | null
      providerCustomerId: string | null
      providerSubscriptionId: string
      status: SubscriptionStatus
      priceRef: { intervalo?: Intervalo; stripePriceId?: string } | null
      currentPeriodStart: string | null
      currentPeriodEnd: string | null
      cancelAtPeriodEnd: boolean
      canceledAt: string | null
      trialEnd: string | null
      metadata: Record<string, unknown>
      raw: unknown
    }
  | {
      type: 'subscription.canceled'
      provider: ProviderId
      providerEventId: string
      providerSubscriptionId: string
      canceledAt: string
      raw: unknown
    }
  | {
      type: 'payment.succeeded'
      provider: ProviderId
      providerEventId: string
      providerSubscriptionId: string | null
      userId: string | null
      amountCents: number
      moeda: string
      raw: unknown
    }
  | {
      type: 'payment.failed'
      provider: ProviderId
      providerEventId: string
      providerSubscriptionId: string | null
      userId: string | null
      raw: unknown
    }
  | {
      type: 'ignore'
      provider: ProviderId
      providerEventId: string
      reason: string
      raw: unknown
    }

export type CheckoutInput = {
  userId: string
  userEmail: string
  priceId: string // id da row billing_prices
  successUrl: string
  cancelUrl: string
}

export type CheckoutResult = { url: string; provider: ProviderId }

export type PortalInput = {
  userId: string
  returnUrl: string
}

export type PortalResult = { url: string }

/**
 * Contrato que cada provider implementa.
 *
 * `verifyAndParse` é a única porta de entrada pra webhook: valida
 * assinatura + traduz em NormalizedEvent (ou 'ignore'). Se a
 * assinatura for inválida, deve lançar.
 */
export interface PaymentProvider {
  id: ProviderId

  createCheckout(input: CheckoutInput): Promise<CheckoutResult>

  createPortal(input: PortalInput): Promise<PortalResult>

  verifyAndParse(req: Request): Promise<NormalizedEvent>
}
