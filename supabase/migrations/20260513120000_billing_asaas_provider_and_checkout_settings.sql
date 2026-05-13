-- Provider Asaas + tabela de personalização do checkout.
--
-- Asaas (asaas.com) é o gateway brasileiro escolhido como default tanto
-- para Veritas Dei quanto para Veritas Educa. Suporta PIX, cartão (com
-- parcelamento) e Payment Links. Como temos checkout próprio nosso, o
-- Asaas é chamado server-side via REST API; clientes/assinaturas/cobranças
-- ficam refletidos em billing_subscriptions via webhook.
--
-- Esta migration é puramente aditiva — não altera dado existente.
--   1. Amplia billing_subscriptions.provider para aceitar 'asaas'.
--   2. Adiciona colunas auxiliares em billing_prices para o Asaas.
--   3. Adiciona `default_provider` em billing_plans (admin escolhe).
--   4. Cria billing_checkout_settings (singleton: id='global') com
--      logo/cores/copy/métodos habilitados/parcelamento máximo + JSONB
--      pra order_bump e upsell (estrutura pronta; UI básica por enquanto).

-- ==========================================================================
-- 1. Provider 'asaas' no check constraint
-- ==========================================================================
ALTER TABLE public.billing_subscriptions
  DROP CONSTRAINT IF EXISTS billing_subscriptions_provider_check;

ALTER TABLE public.billing_subscriptions
  ADD CONSTRAINT billing_subscriptions_provider_check
  CHECK (provider IN (
    'stripe',
    'kirvano',
    'hotmart',
    'eduzz',
    'manual',
    'revenuecat',
    'hubla',
    'asaas'
  ));

-- ==========================================================================
-- 2. billing_prices: refs Asaas
-- ==========================================================================
-- `asaas_value_cents` é redundante com amount_cents hoje, mas deixamos a
-- coluna pra permitir, no futuro, preço Asaas diferente do Stripe (ex.:
-- redondo em centavos pra PIX). Por enquanto fica null → usamos amount_cents.
ALTER TABLE public.billing_prices
  ADD COLUMN IF NOT EXISTS asaas_value_cents integer,
  ADD COLUMN IF NOT EXISTS asaas_cycle text
    CHECK (asaas_cycle IS NULL OR asaas_cycle IN (
      'WEEKLY','BIWEEKLY','MONTHLY','BIMONTHLY','QUARTERLY','SEMIANNUALLY','YEARLY'
    ));

COMMENT ON COLUMN public.billing_prices.asaas_value_cents IS
  'Valor em centavos pra cobrança Asaas. Se NULL, usa amount_cents.';
COMMENT ON COLUMN public.billing_prices.asaas_cycle IS
  'Ciclo Asaas (MONTHLY/SEMIANNUALLY/YEARLY). Se NULL, derivamos do intervalo.';

-- ==========================================================================
-- 3. billing_plans: default_provider
-- ==========================================================================
ALTER TABLE public.billing_plans
  ADD COLUMN IF NOT EXISTS default_provider text NOT NULL DEFAULT 'asaas'
    CHECK (default_provider IN ('asaas','stripe','hubla','manual'));

COMMENT ON COLUMN public.billing_plans.default_provider IS
  'Provedor padrão pra checkout deste plano. Asaas é o default global.';

-- Backfill: planos existentes ficam com 'asaas' (default da coluna).
-- Caso queira manter Stripe/Hubla pra algum plano específico, edite via
-- /admin/planos depois do deploy.

-- ==========================================================================
-- 4. billing_checkout_settings (singleton)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.billing_checkout_settings (
  id                    text PRIMARY KEY DEFAULT 'global',
  -- Identidade visual
  logo_url              text,
  primary_color         text NOT NULL DEFAULT '#C9A84C',
  accent_color          text NOT NULL DEFAULT '#0F0E0C',
  background_color      text NOT NULL DEFAULT '#0F0E0C',
  text_color            text NOT NULL DEFAULT '#F2EDE4',
  -- Copy
  header_title          text NOT NULL DEFAULT 'Finalize sua assinatura',
  header_subtitle       text NOT NULL DEFAULT 'Pagamento seguro processado pela Asaas.',
  footer_text           text NOT NULL DEFAULT
    'Você pode cancelar quando quiser pelo seu perfil.',
  trust_badges          jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Métodos habilitados
  allow_pix             boolean NOT NULL DEFAULT true,
  allow_boleto          boolean NOT NULL DEFAULT false,
  allow_credit_card     boolean NOT NULL DEFAULT true,
  installments_max      integer NOT NULL DEFAULT 12 CHECK (installments_max BETWEEN 1 AND 12),
  -- Order bump (estrutura pronta; v2)
  order_bump            jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Upsell pós-compra (estrutura pronta; v2)
  upsell                jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Audit
  atualizado_em         timestamptz NOT NULL DEFAULT now(),
  CHECK (id = 'global')
);

COMMENT ON TABLE public.billing_checkout_settings IS
  'Configuração visual e funcional do checkout customizado. Singleton id=global.';
COMMENT ON COLUMN public.billing_checkout_settings.order_bump IS
  'JSON { ativo: bool, titulo, descricao, price_id, image_url } — v2 expande.';
COMMENT ON COLUMN public.billing_checkout_settings.upsell IS
  'JSON { ativo: bool, titulo, descricao, price_id, image_url } — v2 expande.';

-- Insere a row global se ainda não existe
INSERT INTO public.billing_checkout_settings (id)
VALUES ('global')
ON CONFLICT (id) DO NOTHING;

-- RLS: leitura pública (logo/cores aparecem no /checkout pra usuário não
-- autenticado), escrita só admin.
ALTER TABLE public.billing_checkout_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS checkout_settings_select ON public.billing_checkout_settings;
CREATE POLICY checkout_settings_select
  ON public.billing_checkout_settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS checkout_settings_admin_write ON public.billing_checkout_settings;
CREATE POLICY checkout_settings_admin_write
  ON public.billing_checkout_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ==========================================================================
-- 5. billing_checkout_sessions — sessions efêmeras do checkout customizado
-- ==========================================================================
-- Quando o usuário clica em "Assinar" em /planos, criamos uma row aqui com
-- o snapshot do preço escolhido + customer Asaas criado. O id da row vai
-- no path /checkout/[sessionId]. Sessions expiram em 30min se não pagas.
CREATE TABLE IF NOT EXISTS public.billing_checkout_sessions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  price_id              uuid NOT NULL REFERENCES public.billing_prices(id),
  plan_id               uuid NOT NULL REFERENCES public.billing_plans(id),
  provider              text NOT NULL DEFAULT 'asaas',
  asaas_customer_id     text,
  asaas_payment_id      text,
  asaas_subscription_id text,
  status                text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','awaiting_payment','paid','expired','canceled')),
  amount_cents          integer NOT NULL,
  intervalo             text NOT NULL,
  metadata              jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em             timestamptz NOT NULL DEFAULT now(),
  atualizado_em         timestamptz NOT NULL DEFAULT now(),
  expira_em             timestamptz NOT NULL DEFAULT now() + interval '30 minutes'
);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user
  ON public.billing_checkout_sessions (user_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_asaas_payment
  ON public.billing_checkout_sessions (asaas_payment_id)
  WHERE asaas_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_asaas_sub
  ON public.billing_checkout_sessions (asaas_subscription_id)
  WHERE asaas_subscription_id IS NOT NULL;

COMMENT ON TABLE public.billing_checkout_sessions IS
  'Sessões do checkout customizado Asaas. Vinculam user→price→pagamento Asaas.';

ALTER TABLE public.billing_checkout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS checkout_sessions_owner_select ON public.billing_checkout_sessions;
CREATE POLICY checkout_sessions_owner_select
  ON public.billing_checkout_sessions
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS checkout_sessions_admin_select ON public.billing_checkout_sessions;
CREATE POLICY checkout_sessions_admin_select
  ON public.billing_checkout_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
-- Escrita só via service role (rotas server-side). Sem policy de INSERT/UPDATE
-- pro client = bloqueado.
