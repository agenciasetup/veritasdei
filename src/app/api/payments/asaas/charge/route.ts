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
  getPayment,
  getPixQrCode,
  intervaloToCycle,
  listSubscriptionPayments,
  updateCustomer,
  type AsaasBillingType,
  type AsaasCreditCard,
  type AsaasCreditCardHolderInfo,
} from '@/lib/payments/providers/asaas-client'
import {
  maxInstallments,
  totalWithInterest,
  type Intervalo,
} from '@/lib/payments/installments'

export const runtime = 'nodejs'

const cardSchema = z.object({
  holderName: z.string().min(2),
  number: z.string().min(13).max(19),
  expiryMonth: z.string().min(1).max(2),
  expiryYear: z.string().min(2).max(4),
  ccv: z.string().min(3).max(4),
})

// Dados que SEMPRE precisamos no customer Asaas pra cobrar (PIX/Boleto/Cartão).
// O CPF é o que faltava — Asaas exige `cpfCnpj` no customer pra qualquer
// cobrança, retornando "É necessário preencher o CPF ou CNPJ do cliente".
const customerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  cpfCnpj: z
    .string()
    .min(11)
    .max(18)
    .refine(v => {
      const d = v.replace(/\D/g, '')
      return d.length === 11 || d.length === 14
    }, 'CPF/CNPJ deve ter 11 ou 14 dígitos'),
  mobilePhone: z.string().max(20).optional(),
})

// Endereço usado só pra cartão (Asaas exige no creditCardHolderInfo).
const addressSchema = z.object({
  postalCode: z.string().min(8).max(9),
  addressNumber: z.string().min(1).max(10),
  addressComplement: z.string().max(80).optional(),
})

// Cartão pode vir como dados completos (primeira vez) OU só como token
// (reuso de cartão salvo). Validamos no handler (não via union) pra
// preservar inferência de tipo no body.
const bodySchema = z.discriminatedUnion('method', [
  z.object({
    sessionId: z.string().uuid(),
    method: z.literal('pix'),
    customer: customerSchema,
  }),
  z.object({
    sessionId: z.string().uuid(),
    method: z.literal('boleto'),
    customer: customerSchema,
  }),
  z.object({
    sessionId: z.string().uuid(),
    method: z.literal('credit_card'),
    customer: customerSchema,
    installments: z.number().int().min(1).max(12).optional(),
    card: cardSchema.optional(),
    address: addressSchema.optional(),
    // savedCardId é o UUID local da row em billing_saved_cards. O backend
    // resolve pro token Asaas — nunca expomos o token bruto no client.
    savedCardId: z.string().uuid().optional(),
    saveCard: z.boolean().optional(),
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

  const intervalo = sess.intervalo as Intervalo
  const cycle = intervaloToCycle(intervalo as 'mensal' | 'semestral' | 'anual')
  if (!cycle) {
    return NextResponse.json(
      { error: `Intervalo "${sess.intervalo}" não suporta assinatura recorrente` },
      { status: 400 },
    )
  }
  const baseCents = sess.amount_cents as number
  const baseValue = baseCents / 100
  const nextDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const billingType: AsaasBillingType =
    body.method === 'pix'
      ? 'PIX'
      : body.method === 'boleto'
        ? 'BOLETO'
        : 'CREDIT_CARD'

  // Parcelamento: só aplica em cartão. Mensal sempre 1x; semestral até
  // 6x; anual até 12x. Juros 2,49% ao mês simples repassados ao cliente.
  const requestedInstallments =
    body.method === 'credit_card' && typeof body.installments === 'number'
      ? body.installments
      : 1
  const allowedMax =
    body.method === 'credit_card'
      ? maxInstallments(intervalo, 12)
      : 1
  const installments = Math.max(
    1,
    Math.min(requestedInstallments, allowedMax),
  )
  const isInstalledPayment = body.method === 'credit_card' && installments > 1
  const totalCentsForCard =
    body.method === 'credit_card'
      ? totalWithInterest(baseCents, installments)
      : baseCents

  // Cartão pode vir como dados completos OU como token (cartão salvo).
  type CreditCardData = {
    fullCard: AsaasCreditCard | null
    holderInfo: AsaasCreditCardHolderInfo | null
    cardToken: string | null
    saveCard: boolean
  }
  let cc: CreditCardData = {
    fullCard: null,
    holderInfo: null,
    cardToken: null,
    saveCard: false,
  }
  if (body.method === 'credit_card') {
    if (body.savedCardId) {
      // Resolve o token Asaas a partir do registro local. RLS garante que
      // user só lê os próprios cartões.
      const { data: savedCard } = await admin
        .from('billing_saved_cards')
        .select('asaas_credit_card_token')
        .eq('id', body.savedCardId)
        .eq('user_id', user.id)
        .maybeSingle()
      if (!savedCard?.asaas_credit_card_token) {
        return NextResponse.json(
          { error: 'Cartão salvo não encontrado' },
          { status: 404 },
        )
      }
      cc = {
        fullCard: null,
        holderInfo: null,
        cardToken: savedCard.asaas_credit_card_token as string,
        saveCard: false,
      }
    } else if (body.card && body.address) {
      cc = {
        fullCard: {
          holderName: body.card.holderName,
          number: body.card.number.replace(/\s+/g, ''),
          expiryMonth: body.card.expiryMonth.padStart(2, '0'),
          expiryYear:
            body.card.expiryYear.length === 2
              ? `20${body.card.expiryYear}`
              : body.card.expiryYear,
          ccv: body.card.ccv,
        },
        holderInfo: {
          name: body.customer.name,
          email: body.customer.email,
          cpfCnpj: body.customer.cpfCnpj.replace(/\D/g, ''),
          postalCode: body.address.postalCode.replace(/\D/g, ''),
          addressNumber: body.address.addressNumber,
          addressComplement: body.address.addressComplement,
          mobilePhone:
            body.customer.mobilePhone?.replace(/\D/g, '') || undefined,
        },
        cardToken: null,
        saveCard: !!body.saveCard,
      }
    } else {
      return NextResponse.json(
        { error: 'Cartão ou token obrigatório' },
        { status: 400 },
      )
    }
  }

  try {
    // 4. Atualiza o customer Asaas. Sem cpfCnpj, qualquer cobrança falha.
    await updateCustomer(sess.asaas_customer_id as string, {
      name: body.customer.name,
      email: body.customer.email,
      cpfCnpj: body.customer.cpfCnpj.replace(/\D/g, ''),
      mobilePhone: body.customer.mobilePhone?.replace(/\D/g, '') || undefined,
      ...(body.method === 'credit_card' && cc.holderInfo
        ? {
            postalCode: cc.holderInfo.postalCode,
            addressNumber: cc.holderInfo.addressNumber,
            addressComplement: cc.holderInfo.addressComplement,
          }
        : {}),
    })

    // 5. Cria a cobrança. Caminho A) parcelado no cartão → PAYMENT único
    // com installmentCount; Caminho B) demais casos → SUBSCRIPTION
    // recorrente como antes.
    let subscriptionId: string | null = null
    let firstPayment: Awaited<
      ReturnType<typeof listSubscriptionPayments>
    >['data'][number] | undefined

    if (isInstalledPayment) {
      // Importa lazy pra não engordar o bundle no caminho comum.
      const { createPayment } = await import(
        '@/lib/payments/providers/asaas-client'
      )
      const payment = await createPayment({
        customer: sess.asaas_customer_id as string,
        billingType: 'CREDIT_CARD',
        value: totalCentsForCard / 100 / installments, // Asaas calcula nominal por parcela
        dueDate: nextDueDate,
        description: `Veritas Dei — ${sess.intervalo} (${installments}x)`,
        externalReference: user.id,
        installmentCount: installments,
        totalValue: totalCentsForCard / 100,
        ...(cc.cardToken
          ? { creditCardToken: cc.cardToken }
          : {
              creditCard: cc.fullCard ?? undefined,
              creditCardHolderInfo: cc.holderInfo ?? undefined,
              remoteIp: getRemoteIp(req),
            }),
      })
      firstPayment = payment
    } else {
      const sub = await createSubscription({
        customer: sess.asaas_customer_id as string,
        billingType,
        value: baseValue,
        nextDueDate,
        cycle,
        description: `Assinatura Veritas Dei — ${sess.intervalo}`,
        externalReference: user.id,
        ...(body.method === 'credit_card'
          ? cc.cardToken
            ? { creditCardToken: cc.cardToken, remoteIp: getRemoteIp(req) }
            : {
                creditCard: cc.fullCard ?? undefined,
                creditCardHolderInfo: cc.holderInfo ?? undefined,
                remoteIp: getRemoteIp(req),
              }
          : {}),
      })
      subscriptionId = sub.id

      // Pega o primeiro invoice (retry: 4x com backoff)
      for (let attempt = 0; attempt < 4; attempt++) {
        const list = await listSubscriptionPayments(sub.id, 1)
        firstPayment = list.data[0]
        if (firstPayment) break
        await new Promise(r => setTimeout(r, 250 * (attempt + 1)))
      }
    }

    // 6. Salva cartão se solicitado e tiver token retornado pela Asaas.
    if (
      body.method === 'credit_card' &&
      cc.saveCard &&
      cc.fullCard &&
      firstPayment
    ) {
      // Asaas devolve o token na resposta do payment; em subscription
      // precisamos consultar o payment recém-criado pra pegar o cartão.
      try {
        const fresh = await getPayment(firstPayment.id)
        const token = fresh.creditCard?.creditCardToken
        const last4 = fresh.creditCard?.creditCardNumber
        const brand = fresh.creditCard?.creditCardBrand?.toLowerCase() ?? null
        if (token && last4) {
          await admin
            .from('billing_saved_cards')
            .upsert(
              {
                user_id: user.id,
                provider: 'asaas',
                asaas_credit_card_token: token,
                brand,
                last4,
                holder_name: cc.fullCard.holderName,
                expiry_month: cc.fullCard.expiryMonth,
                expiry_year: cc.fullCard.expiryYear,
              },
              { onConflict: 'user_id,asaas_credit_card_token' },
            )
        }
      } catch (err) {
        // não bloqueia o checkout — salvar cartão é melhoria, não crítico.
        console.warn('[asaas/charge] saveCard falhou:', err)
      }
    }

    // 7. Atualiza session
    await admin
      .from('billing_checkout_sessions')
      .update({
        asaas_subscription_id: subscriptionId,
        asaas_payment_id: firstPayment?.id ?? null,
        status: 'awaiting_payment',
        amount_cents: totalCentsForCard,
        atualizado_em: new Date().toISOString(),
        metadata: {
          ...(sess.metadata as Record<string, unknown>),
          method: body.method,
          billing_type: billingType,
          installments,
          base_cents: baseCents,
          total_cents: totalCentsForCard,
          card_token_used: cc.cardToken ?? null,
        },
      })
      .eq('id', sess.id)

    // Compat: o resto do código usa "sub.id"; cria um alias.
    const sub = { id: subscriptionId ?? firstPayment?.id ?? '' }

    // 7. PIX: busca QR code (retry — pode demorar ~500ms pra Asaas
    // gerar o QR após o invoice nascer).
    if (body.method === 'pix' && firstPayment) {
      let lastErr: unknown = null
      for (let attempt = 0; attempt < 4; attempt++) {
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
          lastErr = err
          await new Promise(r => setTimeout(r, 350 * (attempt + 1)))
        }
      }
      const msg = lastErr instanceof Error ? lastErr.message : 'Falha ao gerar QR PIX'
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

    // 8. Boleto: devolve a URL do bankSlip (a Asaas hospeda) +
    // o invoiceUrl (página completa da fatura).
    if (body.method === 'boleto' && firstPayment) {
      return NextResponse.json({
        ok: true,
        paymentId: firstPayment.id,
        subscriptionId: sub.id,
        boleto: {
          bankSlipUrl: firstPayment.bankSlipUrl ?? null,
          dueDate: firstPayment.dueDate,
        },
        invoiceUrl: firstPayment.invoiceUrl ?? null,
      })
    }

    // 9. Cartão: o payment já vem confirmado (capture síncrona)
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
