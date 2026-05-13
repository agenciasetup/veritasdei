/**
 * /checkout/[sessionId] — checkout customizado Veritas (Asaas).
 *
 * Server Component que carrega a sessão (criada por
 * `asaasProvider.createCheckout`) + plano + preço + customização global
 * em `billing_checkout_settings`. Tudo passa pro client que renderiza
 * a UI com tabs PIX / Cartão.
 *
 * Gates:
 *  - Sessão precisa pertencer ao usuário logado (RLS na select garante).
 *  - Sessão expirada ou paga → redireciona pra /perfil ou /planos.
 */

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import CheckoutClient from './CheckoutClient'

export const dynamic = 'force-dynamic'

type CheckoutSessionRow = {
  id: string
  user_id: string
  price_id: string
  plan_id: string
  provider: string
  asaas_customer_id: string | null
  asaas_payment_id: string | null
  asaas_subscription_id: string | null
  status: 'pending' | 'awaiting_payment' | 'paid' | 'expired' | 'canceled'
  amount_cents: number
  intervalo: 'mensal' | 'semestral' | 'anual' | 'unico'
  metadata: Record<string, unknown>
  expira_em: string
}

type SettingsRow = {
  logo_url: string | null
  primary_color: string
  accent_color: string
  background_color: string
  text_color: string
  header_title: string
  header_subtitle: string
  footer_text: string
  trust_badges: unknown
  allow_pix: boolean
  allow_boleto: boolean
  allow_credit_card: boolean
  installments_max: number
}

type PlanRow = {
  id: string
  codigo: string
  nome: string
  descricao: string | null
  beneficios: string[]
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?next=/checkout/${sessionId}`)
  }

  const { data: session } = await supabase
    .from('billing_checkout_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session) {
    redirect('/planos?status=session_not_found')
  }

  const sess = session as CheckoutSessionRow
  if (sess.user_id !== user.id) {
    redirect('/planos?status=forbidden')
  }
  if (sess.status === 'paid') {
    redirect('/perfil?tab=assinatura&status=success')
  }
  if (sess.status === 'expired' || sess.status === 'canceled') {
    redirect('/planos?status=expired')
  }
  // Server Component renderiza uma vez por request — Date.now é determinístico
  // pra essa execução. Lint genérica não distingue server de client.
  // eslint-disable-next-line react-hooks/purity
  if (new Date(sess.expira_em).getTime() < Date.now()) {
    redirect('/planos?status=expired')
  }

  const [settingsRes, planRes] = await Promise.all([
    supabase
      .from('billing_checkout_settings')
      .select('*')
      .eq('id', 'global')
      .maybeSingle(),
    supabase
      .from('billing_plans')
      .select('id, codigo, nome, descricao, beneficios')
      .eq('id', sess.plan_id)
      .maybeSingle(),
  ])

  const settings = (settingsRes.data ?? {
    logo_url: null,
    primary_color: '#C9A84C',
    accent_color: '#0F0E0C',
    background_color: '#0F0E0C',
    text_color: '#F2EDE4',
    header_title: 'Finalize sua assinatura',
    header_subtitle: 'Pagamento seguro processado pela Asaas.',
    footer_text: 'Você pode cancelar quando quiser pelo seu perfil.',
    trust_badges: [],
    allow_pix: true,
    allow_boleto: false,
    allow_credit_card: true,
    installments_max: 12,
  }) as SettingsRow

  const plan = planRes.data as PlanRow | null
  if (!plan) {
    redirect('/planos?status=plan_not_found')
  }

  const profile = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <CheckoutClient
      sessionId={sess.id}
      amountCents={sess.amount_cents}
      intervalo={sess.intervalo}
      plan={{
        codigo: plan.codigo,
        nome: plan.nome,
        descricao: plan.descricao,
        beneficios: plan.beneficios ?? [],
      }}
      settings={{
        logoUrl: settings.logo_url,
        primaryColor: settings.primary_color,
        accentColor: settings.accent_color,
        backgroundColor: settings.background_color,
        textColor: settings.text_color,
        headerTitle: settings.header_title,
        headerSubtitle: settings.header_subtitle,
        footerText: settings.footer_text,
        allowPix: settings.allow_pix,
        allowBoleto: settings.allow_boleto,
        allowCreditCard: settings.allow_credit_card,
        installmentsMax: settings.installments_max,
      }}
      user={{
        email: user.email ?? '',
        name: (profile.data?.name as string | null) ?? '',
      }}
    />
  )
}
