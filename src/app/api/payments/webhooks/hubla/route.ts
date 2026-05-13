/**
 * POST /api/payments/webhooks/hubla
 *
 * Endpoint cru da Hubla. Fluxo idêntico ao do Stripe:
 *  1. `hublaProvider.verifyAndParse` valida `x-hubla-token` e usa
 *     `x-hubla-idempotency` como provider_event_id (dedup garantida
 *     pelo UNIQUE em billing_webhook_events).
 *  2. `dispatchEvent` aplica no banco. Se já processado, retorna
 *     {duplicated: true} e respondemos 200 (Hubla não faz retry).
 *
 * Códigos de resposta — alinhados às boas práticas Hubla:
 *  - 200: recebido e (idealmente) processado, ou duplicado/ignorado.
 *  - 400: header `x-hubla-token` inválido / payload malformado.
 *  - 500: erro transitório (queremos retry da Hubla, se houver).
 *
 * Runtime nodejs: leitura de body cru + acesso a env vars.
 */

import { NextResponse } from 'next/server'
import { hublaProvider } from '@/lib/payments/providers/hubla'
import { dispatchEvent } from '@/lib/payments/webhook-dispatcher'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const event = await hublaProvider.verifyAndParse(req)
    const result = await dispatchEvent(event)
    if (!result.ok && result.error) {
      console.warn('[webhooks/hubla] dispatch error:', result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json({
      received: true,
      duplicated: result.duplicated ?? false,
      ignored: result.ignored ?? false,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('[webhooks/hubla] verify error:', msg)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
