-- Sprint 14 — Admin audit log + retention policy helper.
--
-- Auditoria Sprint 5 introduziu console.warn() pra rastrear admins que
-- disparavam seeds destrutivos. Logs Vercel são pesquisáveis mas têm
-- retenção variável (7 dias no plano atual) e não são consultáveis via
-- SQL. Tabela dedicada resolve.
--
-- Escopo desta tabela:
--   • Ações admin destrutivas (seed wipe, delete em lote, promoção de
--     role, revogação de acesso)
--   • Auth-critical (login admin, elevação de privilégio)
--   • Suporte a grep por ator ou ação ao longo de 90 dias+

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id          bigserial    PRIMARY KEY,
  occurred_at timestamptz  NOT NULL DEFAULT now(),
  actor_id    uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,                                      -- snapshot no momento da ação
  action      text         NOT NULL,                     -- ex.: 'seed.wipe_content', 'seed.wipe_trails'
  target      text,                                      -- livre: tabela/entidade afetada
  payload     jsonb        NOT NULL DEFAULT '{}'::jsonb, -- contexto extra
  ip          inet,
  user_agent  text
);

CREATE INDEX IF NOT EXISTS ix_admin_audit_occurred
  ON public.admin_audit_log (occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_admin_audit_actor
  ON public.admin_audit_log (actor_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_admin_audit_action
  ON public.admin_audit_log (action, occurred_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Só admins leem o log (via service_role sempre passa por bypass, mas
-- UI admin usa SSR client com cookie do admin logado, então precisa
-- policy explícita).
DROP POLICY IF EXISTS "admin_audit_read" ON public.admin_audit_log;
CREATE POLICY "admin_audit_read" ON public.admin_audit_log
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Ninguém escreve direto — só via service_role (rotas admin) ou RPC.
-- Bloqueia qualquer INSERT/UPDATE/DELETE de anon/authenticated.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.admin_audit_log FROM anon, authenticated;

-- Retention: trim >180 dias via cron futuro. Por ora, função manual
-- que o admin pode chamar quando a tabela crescer demais.
CREATE OR REPLACE FUNCTION public.admin_audit_log_prune(p_days integer DEFAULT 180)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  rows_deleted integer;
BEGIN
  DELETE FROM public.admin_audit_log
  WHERE occurred_at < now() - (p_days || ' days')::interval;
  GET DIAGNOSTICS rows_deleted = ROW_COUNT;
  RETURN rows_deleted;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_audit_log_prune(integer) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_audit_log_prune(integer) TO service_role;
