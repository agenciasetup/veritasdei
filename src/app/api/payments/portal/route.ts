/**
 * POST /api/payments/portal
 *
 * Cria uma sessão do Stripe Billing Portal para o usuário logado
 * gerenciar (cancelar, atualizar cartão, ver histórico) a assinatura.
 *
 * Requer que o Portal esteja configurado no dashboard Stripe.
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
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

  const origin =
    req.headers.get('origin') ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000'

  try {
    const result = await stripeProvider.createPortal({
      userId: user.id,
      returnUrl: `${origin}/perfil?tab=assinatura`,
    })
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'portal falhou'
    console.warn('[payments] portal error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
