-- Sprint 11 — AI daily budget.
--
-- Auditoria (M14): os endpoints /api/verbum/explain, /api/verbum/research,
-- /api/search, /api/catechism têm rate limit por minuto mas nenhum cap
-- diário. 20 req/min × 60 × 24 = ~28.800 calls/dia/user. Cada verbum/explain
-- gasta ~1.500 + 1.500 tokens em GPT-4o ≈ R$0,10. Uma conta abusiva custa
-- R$2.880/dia. Cem contas = insolvência.
--
-- Solução: tabela ai_usage rastreando uso diário por user+feature. Função
-- SECURITY DEFINER consome orçamento atomicamente. Rotas chamam antes de
-- executar a chamada ao modelo.

CREATE TABLE IF NOT EXISTS public.ai_usage (
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day          date        NOT NULL,
  feature      text        NOT NULL,
  tokens_in    bigint      NOT NULL DEFAULT 0,
  tokens_out   bigint      NOT NULL DEFAULT 0,
  calls        integer     NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day, feature)
);

CREATE INDEX IF NOT EXISTS ix_ai_usage_day ON public.ai_usage (day);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- User lê só o próprio consumo (dashboards futuros). Nada de escrita via
-- RLS — só service_role ou a função abaixo gravam.
DROP POLICY IF EXISTS "ai_usage_self_read" ON public.ai_usage;
CREATE POLICY "ai_usage_self_read" ON public.ai_usage
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.ai_usage FROM anon, authenticated;

-- =============================================================================
-- Função atômica: incrementa uso e verifica budget num passo só.
-- Retorna { allowed: bool, calls_today: int, cap: int }.
--
-- `cap_calls` vem do caller (diferente por feature). Se o user ultrapassou,
-- allowed=false e o caller retorna 429 sem chamar o modelo.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.ai_budget_check_and_consume(
  p_user_id uuid,
  p_feature text,
  p_cap_calls integer,
  p_cap_tokens_out bigint DEFAULT NULL,
  p_tokens_in bigint DEFAULT 0,
  p_tokens_out bigint DEFAULT 0
)
RETURNS TABLE (allowed boolean, calls_today integer, tokens_out_today bigint, cap_calls integer, cap_tokens_out bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_today date := (now() at time zone 'UTC')::date;
  v_row   public.ai_usage%ROWTYPE;
BEGIN
  -- Upsert vazio pra garantir row — simplifica o WHERE depois.
  INSERT INTO public.ai_usage(user_id, day, feature, calls, tokens_in, tokens_out)
  VALUES (p_user_id, v_today, p_feature, 0, 0, 0)
  ON CONFLICT (user_id, day, feature) DO NOTHING;

  -- Lock da linha para a janela de check-and-update.
  SELECT * INTO v_row
  FROM public.ai_usage
  WHERE user_id = p_user_id AND day = v_today AND feature = p_feature
  FOR UPDATE;

  -- Se já estourou, não incrementa nada.
  IF v_row.calls >= p_cap_calls THEN
    RETURN QUERY SELECT false, v_row.calls, v_row.tokens_out, p_cap_calls, p_cap_tokens_out;
    RETURN;
  END IF;

  IF p_cap_tokens_out IS NOT NULL AND v_row.tokens_out >= p_cap_tokens_out THEN
    RETURN QUERY SELECT false, v_row.calls, v_row.tokens_out, p_cap_calls, p_cap_tokens_out;
    RETURN;
  END IF;

  -- Consome.
  UPDATE public.ai_usage
  SET calls      = calls + 1,
      tokens_in  = tokens_in + COALESCE(p_tokens_in, 0),
      tokens_out = tokens_out + COALESCE(p_tokens_out, 0),
      updated_at = now()
  WHERE user_id = p_user_id AND day = v_today AND feature = p_feature
  RETURNING * INTO v_row;

  RETURN QUERY SELECT true, v_row.calls, v_row.tokens_out, p_cap_calls, p_cap_tokens_out;
END;
$$;

-- Só service_role executa (rotas usam admin client).
REVOKE EXECUTE ON FUNCTION public.ai_budget_check_and_consume(uuid, text, integer, bigint, bigint, bigint) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.ai_budget_check_and_consume(uuid, text, integer, bigint, bigint, bigint) TO service_role;
