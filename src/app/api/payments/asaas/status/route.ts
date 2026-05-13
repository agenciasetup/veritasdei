/**
 * GET /api/payments/asaas/status?sessionId=...
 *
 * Polling do checkout. Retorna se a sessão já foi paga.
 *
 * O caminho rápido é a `billing_checkout_sessions.status`, que muda pra
 * 'paid' quando o webhook PAYMENT_RECEIVED/CONFIRMED chega e o dispatcher
 * upserta a subscription. Caso a session não tenha sido marcada ainda,
 * fazemos fallback consultando a Asaas direto (tolera latência do webhook).
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPayment } from '@/lib/payments/providers/asaas-client'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const sessionId = new URL(req.url).searchParams.get('sessionId')
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId obrigatório' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: sess } = await admin
    .from('billing_checkout_sessions')
    .select('id, user_id, status, asaas_payment_id, asaas_subscription_id')
    .eq('id', sessionId)
    .maybeSingle()
  if (!sess) {
    return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
  }
  if (sess.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (sess.status === 'paid') {
    return NextResponse.json({ paid: true, status: 'paid' })
  }

  // Fallback: webhook ainda não chegou. Consulta Asaas direto.
  if (sess.asaas_payment_id) {
    try {
      const payment = await getPayment(sess.asaas_payment_id as string)
      const isPaid =
        payment.status === 'RECEIVED' || payment.status === 'CONFIRMED'
      if (isPaid) {
        // Marca como paid pra próximas chamadas — o webhook vai upsertar
        // a subscription independentemente.
        await admin
          .from('billing_checkout_sessions')
          .update({
            status: 'paid',
            atualizado_em: new Date().toISOString(),
          })
          .eq('id', sess.id)
        return NextResponse.json({ paid: true, status: 'paid', via: 'poll' })
      }
      return NextResponse.json({
        paid: false,
        status: sess.status,
        asaasStatus: payment.status,
      })
    } catch {
      return NextResponse.json({ paid: false, status: sess.status })
    }
  }

  return NextResponse.json({ paid: false, status: sess.status })
}
