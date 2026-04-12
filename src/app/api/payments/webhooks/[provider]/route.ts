/**
 * POST /api/payments/webhooks/:provider
 *
 * Endpoint genérico pra webhooks de outros provedores (Kirvano, Hotmart,
 * Eduzz). Por enquanto, cada um só loga o evento — o mapeamento
 * específico de cada plataforma é implementado quando for necessário.
 *
 * Gating: exige header `x-webhook-secret` correspondente à env do
 * provider (KIRVANO_WEBHOOK_SECRET etc).
 */

import { NextResponse } from 'next/server'
import { verifyGenericWebhook } from '@/lib/payments/providers/generic'
import { dispatchEvent } from '@/lib/payments/webhook-dispatcher'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  ctx: { params: Promise<{ provider: string }> },
) {
  const { provider } = await ctx.params
  if (provider === 'stripe') {
    // Stripe tem rota dedicada. Evita rota genérica cair no fluxo errado.
    return NextResponse.json(
      { error: 'Use /api/payments/webhooks/stripe para Stripe' },
      { status: 400 },
    )
  }

  try {
    const event = await verifyGenericWebhook(provider, req)
    const result = await dispatchEvent(event)
    if (!result.ok && result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json({
      received: true,
      duplicated: result.duplicated ?? false,
      ignored: result.ignored ?? false,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`[webhooks/${provider}] error:`, msg)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
