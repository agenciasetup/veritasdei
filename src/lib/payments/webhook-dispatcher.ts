/**
 * Webhook dispatcher — aplica NormalizedEvent no Supabase.
 *
 * Responsabilidades:
 *  - Deduplica via `billing_webhook_events (provider, provider_event_id)`.
 *  - Upserta `billing_subscriptions` pelo `(provider, provider_subscription_id)`.
 *  - Marca `processado_em` ao final (ou `erro` se falhar).
 *
 * Tudo usa o service role client — RLS está travada para o client.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { NormalizedEvent, Intervalo } from './types'

type DispatchResult = {
  ok: boolean
  duplicated?: boolean
  ignored?: boolean
  error?: string
}

export async function dispatchEvent(
  event: NormalizedEvent,
): Promise<DispatchResult> {
  const admin = createAdminClient()

  // 1. Idempotência: insert-or-skip. Se já existe, é duplicado.
  const { data: existing } = await admin
    .from('billing_webhook_events')
    .select('id, processado_em')
    .eq('provider', event.provider)
    .eq('provider_event_id', event.providerEventId)
    .maybeSingle()

  if (existing?.processado_em) {
    return { ok: true, duplicated: true }
  }

  let logId = existing?.id as string | undefined

  if (!logId) {
    const { data: inserted, error: insertErr } = await admin
      .from('billing_webhook_events')
      .insert({
        provider: event.provider,
        provider_event_id: event.providerEventId,
        tipo: event.type,
        payload: event.raw as Record<string, unknown>,
      })
      .select('id')
      .single()
    if (insertErr) {
      // Possível corrida: outro worker já inseriu. Tenta de novo como dup.
      const { data: again } = await admin
        .from('billing_webhook_events')
        .select('id, processado_em')
        .eq('provider', event.provider)
        .eq('provider_event_id', event.providerEventId)
        .maybeSingle()
      if (again?.processado_em) return { ok: true, duplicated: true }
      logId = again?.id
      if (!logId) return { ok: false, error: insertErr.message }
    } else {
      logId = inserted.id as string
    }
  }

  // 2. Processa conforme tipo
  try {
    if (event.type === 'ignore') {
      await markProcessed(admin, logId!, null)
      return { ok: true, ignored: true }
    }

    if (event.type === 'subscription.upserted') {
      await upsertSubscription(admin, event)
    } else if (event.type === 'subscription.canceled') {
      await markCanceled(admin, event)
    } else if (event.type === 'payment.succeeded') {
      // v1: só loga. Futuro: ativar anexos, enviar recibo, etc.
    } else if (event.type === 'payment.failed') {
      // v1: só loga.
    }

    await markProcessed(admin, logId!, null)
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await markProcessed(admin, logId!, msg)
    return { ok: false, error: msg }
  }
}

type AdminDb = ReturnType<typeof createAdminClient>

async function markProcessed(
  admin: AdminDb,
  logId: string,
  erro: string | null,
) {
  await admin
    .from('billing_webhook_events')
    .update({
      processado_em: new Date().toISOString(),
      erro,
    })
    .eq('id', logId)
}

async function upsertSubscription(
  admin: AdminDb,
  event: Extract<NormalizedEvent, { type: 'subscription.upserted' }>,
) {
  if (!event.userId) {
    throw new Error('subscription.upserted sem userId — metadata ausente')
  }

  // Resolve plan_id + price_id a partir do que o provider mandou
  const priceRow = await resolvePrice(admin, event.priceRef)
  const planId = priceRow?.plan_id ?? null
  const priceId = priceRow?.id ?? null

  const row = {
    user_id: event.userId,
    plan_id: planId,
    price_id: priceId,
    provider: event.provider,
    provider_customer_id: event.providerCustomerId,
    provider_subscription_id: event.providerSubscriptionId,
    status: event.status,
    current_period_start: event.currentPeriodStart,
    current_period_end: event.currentPeriodEnd,
    cancel_at_period_end: event.cancelAtPeriodEnd,
    canceled_at: event.canceledAt,
    trial_end: event.trialEnd,
    metadata: event.metadata,
  }

  const { error } = await admin
    .from('billing_subscriptions')
    .upsert(row, { onConflict: 'provider,provider_subscription_id' })
  if (error) throw new Error(`upsert subscription: ${error.message}`)
}

async function markCanceled(
  admin: AdminDb,
  event: Extract<NormalizedEvent, { type: 'subscription.canceled' }>,
) {
  let query = admin
    .from('billing_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: event.canceledAt,
    })
    .eq('provider', event.provider)

  if (event.providerSubscriptionId) {
    query = query.eq('provider_subscription_id', event.providerSubscriptionId)
  } else if (event.providerCustomerId) {
    // Pix Automático: o evento traz o id da autorização, não o da
    // subscription. Casamos pelo customer e só cancelamos o que ainda
    // está vigente — evita reescrever rows já encerradas.
    query = query
      .eq('provider_customer_id', event.providerCustomerId)
      .in('status', ['active', 'past_due', 'incomplete', 'trialing'])
  } else {
    throw new Error(
      'subscription.canceled sem identificador (provider_subscription_id ou customer)',
    )
  }

  const { error } = await query
  if (error) throw new Error(`cancel subscription: ${error.message}`)
}

async function resolvePrice(
  admin: AdminDb,
  ref: { intervalo?: Intervalo; stripePriceId?: string } | null,
): Promise<{ id: string; plan_id: string } | null> {
  if (!ref) return null

  if (ref.stripePriceId) {
    const { data } = await admin
      .from('billing_prices')
      .select('id, plan_id')
      .eq('stripe_price_id', ref.stripePriceId)
      .maybeSingle()
    if (data) return data as { id: string; plan_id: string }
  }

  if (ref.intervalo) {
    const { data } = await admin
      .from('billing_prices')
      .select('id, plan_id')
      .eq('intervalo', ref.intervalo)
      .eq('ativo', true)
      .limit(1)
      .maybeSingle()
    if (data) return data as { id: string; plan_id: string }
  }

  return null
}
