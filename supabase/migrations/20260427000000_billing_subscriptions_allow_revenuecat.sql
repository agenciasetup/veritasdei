-- Allow 'revenuecat' como valor válido em billing_subscriptions.provider.
--
-- Necessário para Onda C do mobile (Capacitor + RevenueCat). RevenueCat
-- atua como agregador de Google Play Billing (Android) e StoreKit (iOS);
-- escreve no Supabase via webhook usando provider='revenuecat'.
--
-- Mudança aditiva: nenhuma linha existente é alterada. Stripe e os outros
-- providers continuam aceitos. Caso a constraint já tenha sido ampliada
-- manualmente no Studio, o IF EXISTS garante idempotência.
--
-- IMPORTANTE: as migrations originais de billing_* nunca foram versionadas
-- no repo (foram criadas via Studio). Esta é a primeira migration do
-- domínio billing a entrar no controle de versão. Fica aqui também como
-- registro do estado da check constraint em 2026-04-27.

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
    'revenuecat'
  ));
