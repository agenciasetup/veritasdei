-- Hubla provider + plano Veritas Educa.
--
-- 1. Amplia billing_subscriptions.provider para aceitar 'hubla'.
-- 2. Cria o plano `veritas-educa` (subproduto vendido via Hubla).
--
-- Tudo idempotente: pode rodar em qualquer ambiente sem dano.
-- Preços do plano são cadastrados separadamente (admin/Studio), porque
-- a Hubla é a fonte da verdade sobre valores e ciclos — o webhook traz
-- billingCycleMonths e nós mapeamos pro intervalo correspondente.

-- ==========================================================================
-- 1. Provider 'hubla' no check constraint
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
    'hubla'
  ));

-- ==========================================================================
-- 2. Plano Veritas Educa
-- ==========================================================================
-- Subproduto focado em estudo. Comprador do Educa também tem acesso ao
-- Veritas Dei completo, exceto a comunidade — a separação acontece em
-- runtime por hostname (educa.veritasdei.com.br esconde a comunidade) e
-- por feature flag de UI. O entitlement (has_active_premium) já libera
-- todas as features premium pra qualquer plano ativo, então não muda RLS.
INSERT INTO public.billing_plans (codigo, nome, descricao, beneficios, destaque, ativo, ordem)
VALUES (
  'veritas-educa',
  'Veritas Educa',
  'Aprofunde sua fé católica com trilhas de estudo guiadas, quizzes e IA católica.',
  ARRAY[
    'Trilhas de estudo: Bíblia, Magistério, Patrística',
    'Pergunte ao Magistério (IA com fontes oficiais)',
    'Quizzes com XP e conquistas',
    'Progresso, sequência diária e relíquias',
    'Acesso completo ao app Veritas Dei (exceto comunidade)'
  ],
  'Estudo guiado da fé católica',
  true,
  10
)
ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  beneficios = EXCLUDED.beneficios,
  destaque = EXCLUDED.destaque,
  ativo = EXCLUDED.ativo;
