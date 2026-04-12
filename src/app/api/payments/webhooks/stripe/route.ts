/**
 * POST /api/payments/webhooks/stripe
 *
 * Endpoint cru do Stripe. Fluxo:
 *  1. `stripeProvider.verifyAndParse` valida `stripe-signature`.
 *  2. `dispatchEvent` aplica no banco (idempotente).
 *
 * Importante: precisa rodar em node runtime pra ler o body como texto
 * cru (signature verification não funciona com body parseado).
 */

import { NextResponse } from 'next/server'
import { stripeProvider } from '@/lib/payments/providers/stripe'
import { dispatchEvent } from '@/lib/payments/webhook-dispatcher'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const event = await stripeProvider.verifyAndParse(req)
    const result = await dispatchEvent(event)
    if (!result.ok && result.error) {
      // Retornando 500 faz o Stripe retry — desejável pra falhas transitórias.
      console.warn('[webhooks/stripe] dispatch error:', result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json({
      received: true,
      duplicated: result.duplicated ?? false,
      ignored: result.ignored ?? false,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('[webhooks/stripe] verify error:', msg)
    // 400 = assinatura inválida. Stripe não faz retry de 400.
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
