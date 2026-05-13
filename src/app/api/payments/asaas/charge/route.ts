/**
 * POST /api/payments/asaas/charge
 *
 * Chamado pelo /checkout/[sessionId] quando o usuário escolhe o método.
 * Cria a subscription Asaas (PIX ou cartão) e atualiza a session com
 * `asaas_subscription_id` + `asaas_payment_id` (1ª invoice).
 *
 * Body:
 *  - { sessionId, method: 'pix' }                                   → PIX
 *  - { sessionId, method: 'credit_card', card, holder, installments? } → cartão
 *
 * Resposta (PIX):    { ok, paymentId, pix: { encodedImage, payload, expirationDate } }
 * Resposta (cartão): { ok, paymentId, status: 'CONFIRMED' | 'PENDING' | ... }
 *
 * Em caso de erro do Asaas, repassa a mensagem (já user-friendly).
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  AsaasApiError,
  createSubscription,
  getPixQrCode,
  intervaloToCycle,
  listSubscriptionPayments,
  type AsaasBillingType,
} from '@/lib/payments/providers/asaas-client'

export const runtime = 'nodejs'

const cardSchema = z.object({
  holderName: z.string().min(2),
  number: z.string().min(13).max(19),
  expiryMonth: z.string().min(1).max(2),
  expiryYear: z.string().min(2).max(4),
  ccv: z.string().min(3).max(4),
})

const holderSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  cpfCnpj: z.string().min(11).max(18),
  postalCode: z.string().min(8).max(9),
  addressNumber: z.string().min(1).max(10),
  addressComplement: z.string().max(80).optional(),
  phone: z.string().max(20).optional(),
  mobilePhone: z.string().max(20).optional(),
})

const bodySchema = z.discriminatedUnion('method', [
  z.object({
    sessionId: z.string().uuid(),
    method: z.literal('pix'),
  }),
  z.object({
    sessionId: z.string().uuid(),
    method: z.literal('credit_card'),
    card: cardSchema,
    holder: holderSchema,
    installments: z.number().int().min(1).max(12).optional(),
  }),
])

function getRemoteIp(req: Request): string | undefined {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const real = req.headers.get('x-real-ip')
  return real ?? undefined
}

export async function POST(req: Request) {
  // 1. Auth
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // 2. Body
  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Body inválido', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const body = parsed.data

  // 3. Carrega session via service role (RLS bloqueia update do client mesmo)
  const admin = createAdminClient()
  const { data: sess } = await admin
    .from('billing_checkout_sessions')
    .select('*')
    .eq('id', body.sessionId)
    .maybeSingle()
  if (!sess) {
    return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
  }
  if (sess.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (sess.status === 'paid') {
    return NextResponse.json(
      { error: 'Sessão já paga', alreadyPaid: true },
      { status: 409 },
    )
  }
  if (new Date(sess.expira_em as string).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Sessão expirada' }, { status: 410 })
  }
  if (!sess.asaas_customer_id) {
    return NextResponse.json(
      { error: 'Sessão sem customer Asaas — recrie pelo /planos' },
      { status: 400 },
    )
  }

  const cycle = intervaloToCycle(sess.intervalo as 'mensal' | 'semestral' | 'anual')
  if (!cycle) {
    return NextResponse.json(
      { error: `Intervalo "${sess.intervalo}" não suporta assinatura recorrente` },
      { status: 400 },
    )
  }
  const value = (sess.amount_cents as number) / 100
  const nextDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10) // YYYY-MM-DD (D+1)

  const billingType: AsaasBillingType =
    body.method === 'pix' ? 'PIX' : 'CREDIT_CARD'

  try {
    // 4. Cria subscription no Asaas
    const sub = await createSubscription({
      customer: sess.asaas_customer_id as string,
      billingType,
      value,
      nextDueDate,
      cycle,
      description: `Assinatura Veritas Dei — ${sess.intervalo}`,
      externalReference: user.id,
      ...(body.method === 'credit_card'
        ? {
            creditCard: {
              holderName: body.card.holderName,
              number: body.card.number.replace(/\s+/g, ''),
              expiryMonth: body.card.expiryMonth.padStart(2, '0'),
              expiryYear:
                body.card.expiryYear.length === 2
                  ? `20${body.card.expiryYear}`
                  : body.card.expiryYear,
              ccv: body.card.ccv,
            },
            creditCardHolderInfo: body.holder,
            remoteIp: getRemoteIp(req),
          }
        : {}),
    })

    // 5. Pega o primeiro payment dessa sub (o invoice imediato)
    const list = await listSubscriptionPayments(sub.id, 1)
    const firstPayment = list.data[0]

    // 6. Atualiza session
    await admin
      .from('billing_checkout_sessions')
      .update({
        asaas_subscription_id: sub.id,
        asaas_payment_id: firstPayment?.id ?? null,
        status: 'awaiting_payment',
        atualizado_em: new Date().toISOString(),
        metadata: {
          ...(sess.metadata as Record<string, unknown>),
          method: body.method,
          billing_type: billingType,
        },
      })
      .eq('id', sess.id)

    // 7. PIX: busca QR code
    if (body.method === 'pix' && firstPayment) {
      try {
        const qr = await getPixQrCode(firstPayment.id)
        return NextResponse.json({
          ok: true,
          paymentId: firstPayment.id,
          subscriptionId: sub.id,
          pix: {
            encodedImage: qr.encodedImage,
            payload: qr.payload,
            expirationDate: qr.expirationDate,
          },
          invoiceUrl: firstPayment.invoiceUrl ?? null,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Falha ao gerar QR PIX'
        return NextResponse.json(
          {
            ok: true,
            paymentId: firstPayment.id,
            subscriptionId: sub.id,
            invoiceUrl: firstPayment.invoiceUrl ?? null,
            warning: msg,
          },
          { status: 200 },
        )
      }
    }

    // 8. Cartão: o payment já vem confirmado (capture síncrona)
    return NextResponse.json({
      ok: true,
      paymentId: firstPayment?.id ?? null,
      subscriptionId: sub.id,
      status: firstPayment?.status ?? 'PENDING',
      invoiceUrl: firstPayment?.invoiceUrl ?? null,
    })
  } catch (err) {
    if (err instanceof AsaasApiError) {
      console.warn('[asaas/charge] api error:', err.status, err.errors)
      return NextResponse.json(
        { error: err.message, code: err.errors[0]?.code ?? null },
        { status: 400 },
      )
    }
    const msg = err instanceof Error ? err.message : 'Falha ao cobrar'
    console.error('[asaas/charge] unexpected:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
