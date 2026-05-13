/**
 * PUT /api/payments/subscription/credit-card
 *
 * Atualiza o cartão da assinatura Asaas ativa do usuário. Aceita os
 * mesmos dados que o checkout original — dados do cartão + holder info
 * — e propaga via PUT /v3/subscriptions/:id com billingType=CREDIT_CARD.
 *
 * Asaas tokeniza no momento da chamada (não armazenamos PAN/CCV).
 *
 * Body:
 * {
 *   creditCard: { holderName, number, expiryMonth, expiryYear, ccv },
 *   creditCardHolderInfo: { name, email, cpfCnpj, postalCode, addressNumber, phone? },
 *   remoteIp: string  // capturado pelo client via Request headers
 * }
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  AsaasApiError,
  updateSubscription,
  type AsaasCreditCard,
  type AsaasCreditCardHolderInfo,
} from '@/lib/payments/providers/asaas-client'

export const runtime = 'nodejs'

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? '0.0.0.0'
}

function validateCard(c: Partial<AsaasCreditCard>): string | null {
  if (!c.holderName || c.holderName.length < 2) return 'Nome do titular inválido'
  if (!c.number || c.number.replace(/\D/g, '').length < 13) {
    return 'Número do cartão inválido'
  }
  if (!c.expiryMonth || !/^\d{2}$/.test(c.expiryMonth)) return 'Mês inválido'
  if (!c.expiryYear || !/^\d{4}$/.test(c.expiryYear)) return 'Ano inválido'
  if (!c.ccv || !/^\d{3,4}$/.test(c.ccv)) return 'CCV inválido'
  return null
}

function validateHolder(h: Partial<AsaasCreditCardHolderInfo>): string | null {
  if (!h.name) return 'Nome do titular obrigatório'
  if (!h.email) return 'E-mail obrigatório'
  if (!h.cpfCnpj || h.cpfCnpj.replace(/\D/g, '').length < 11) {
    return 'CPF/CNPJ inválido'
  }
  if (!h.postalCode || h.postalCode.replace(/\D/g, '').length !== 8) {
    return 'CEP inválido'
  }
  if (!h.addressNumber) return 'Número do endereço obrigatório'
  return null
}

export async function PUT(req: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: {
    creditCard?: AsaasCreditCard
    creditCardHolderInfo?: AsaasCreditCardHolderInfo
  } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const cardErr = validateCard(body.creditCard ?? {})
  if (cardErr) return NextResponse.json({ error: cardErr }, { status: 400 })
  const holderErr = validateHolder(body.creditCardHolderInfo ?? {})
  if (holderErr) return NextResponse.json({ error: holderErr }, { status: 400 })

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('billing_subscriptions')
    .select('id, provider, provider_subscription_id')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('atualizado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sub || sub.provider !== 'asaas' || !sub.provider_subscription_id) {
    return NextResponse.json(
      { error: 'Sem assinatura Asaas ativa' },
      { status: 404 },
    )
  }

  try {
    await updateSubscription(sub.provider_subscription_id as string, {
      billingType: 'CREDIT_CARD',
      creditCard: body.creditCard,
      creditCardHolderInfo: body.creditCardHolderInfo,
      remoteIp: clientIp(req),
      updatePendingPayments: true,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof AsaasApiError) {
      return NextResponse.json(
        { error: err.message, code: err.errors[0]?.code ?? null },
        { status: 400 },
      )
    }
    const msg = err instanceof Error ? err.message : 'Falha ao atualizar cartão'
    console.error('[subscription/credit-card] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
