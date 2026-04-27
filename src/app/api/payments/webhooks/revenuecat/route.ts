/**
 * POST /api/payments/webhooks/revenuecat
 *
 * Endpoint cru do RevenueCat. Mesmo padrão do webhook do Stripe:
 *  1. revenuecatProvider.verifyAndParse valida o header Authorization
 *     e traduz o payload em NormalizedEvent.
 *  2. dispatchEvent grava no Supabase (idempotente via
 *     billing_webhook_events).
 *
 * Roda em node runtime (precisa ler body como JSON; nada que exija
 * edge especificamente).
 */

import { NextResponse } from 'next/server'
import { revenuecatProvider } from '@/lib/payments/providers/revenuecat'
import { dispatchEvent } from '@/lib/payments/webhook-dispatcher'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const event = await revenuecatProvider.verifyAndParse(req)
    const result = await dispatchEvent(event)
    if (!result.ok && result.error) {
      // 500 faz o RevenueCat retentar (eles tentam por até 72h).
      console.warn('[webhooks/revenuecat] dispatch error:', result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json({
      received: true,
      duplicated: result.duplicated ?? false,
      ignored: result.ignored ?? false,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('[webhooks/revenuecat] verify error:', msg)
    // 401 quando header inválido. RevenueCat não retenta 4xx.
    return NextResponse.json({ error: msg }, { status: 401 })
  }
}
