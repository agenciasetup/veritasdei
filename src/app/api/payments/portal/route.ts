/**
 * POST /api/payments/portal
 *
 * Abre a gestão da assinatura do usuário logado. Roteia pelo provider
 * da assinatura ativa:
 *  - 'stripe'   → Stripe Billing Portal (URL hospedada).
 *  - 'asaas'    → URL interna do perfil (Asaas não tem portal nativo;
 *                  cancelamento usa /api/payments/cancel).
 *  - outros     → 400 com mensagem informativa.
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { asaasProvider } from '@/lib/payments/providers/asaas'
import { stripeProvider } from '@/lib/payments/providers/stripe'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('billing_subscriptions')
    .select('provider, status')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing', 'past_due', 'canceled'])
    .order('atualizado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  const origin =
    req.headers.get('origin') ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000'

  const provider = sub?.provider ?? 'asaas'

  try {
    if (provider === 'stripe') {
      const result = await stripeProvider.createPortal({
        userId: user.id,
        returnUrl: `${origin}/perfil?tab=assinatura`,
      })
      return NextResponse.json(result)
    }
    if (provider === 'asaas') {
      const result = await asaasProvider.createPortal({
        userId: user.id,
        returnUrl: `${origin}/perfil?tab=assinatura`,
      })
      return NextResponse.json(result)
    }
    return NextResponse.json(
      {
        error: `Gestão automática indisponível para ${provider}. Fale com o suporte.`,
      },
      { status: 400 },
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'portal falhou'
    console.warn('[payments] portal error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
