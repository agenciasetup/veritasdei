/**
 * POST /api/payments/webhooks/asaas
 *
 * Endpoint cru do Asaas. Fluxo:
 *  1. `asaasProvider.verifyAndParse` valida `asaas-access-token`.
 *  2. `dispatchEvent` aplica no banco (idempotente).
 *
 * O Asaas exige resposta 2xx em ≤5s — qualquer falha temporária deve
 * retornar 500 para forçar retry. Erro de assinatura/payload retorna 400
 * (Asaas não faz retry).
 */

import { NextResponse } from 'next/server'
import { asaasProvider } from '@/lib/payments/providers/asaas'
import { dispatchEvent } from '@/lib/payments/webhook-dispatcher'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const event = await asaasProvider.verifyAndParse(req)
    const result = await dispatchEvent(event)
    if (!result.ok && result.error) {
      console.warn('[webhooks/asaas] dispatch error:', result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json({
      received: true,
      duplicated: result.duplicated ?? false,
      ignored: result.ignored ?? false,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('[webhooks/asaas] verify error:', msg)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
