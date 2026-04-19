-- Paroquia Team & Claims — modelo "página do Facebook" para igrejas.
--
-- Objetivos:
--   1. Substituir ownership singular (owner_user_id) por equipe
--      (paroquia_members) com role admin|moderator. Múltiplos admins,
--      sempre ≥ 1 admin ativo.
--   2. Fluxo formal de reivindicação (paroquia_claims) com documento e
--      aprovação por system-admin ou admin da igreja.
--   3. Notificações in-app (notifications) para avisar solicitantes.
--   4. Log de submissões públicas (public_submissions_log) para
--      auditoria/abuse do cadastro anônimo.
--
-- owner_user_id continua existindo para não quebrar leitura no código
-- em uma única migração; próximas fases podem remover quando toda
-- leitura for via paroquia_members.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Enums
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE paroquia_member_role AS ENUM ('admin', 'moderator');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE paroquia_claim_status AS ENUM ('pendente', 'aprovado', 'rejeitado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. paroquia_members — equipe de cada igreja
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.paroquia_members (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paroquia_id   uuid NOT NULL REFERENCES public.paroquias(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          paroquia_member_role NOT NULL,
  added_by      uuid REFERENCES auth.users(id),
  added_at      timestamptz NOT NULL DEFAULT now(),
  revoked_at    timestamptz,
  revoked_by    uuid REFERENCES auth.users(id),
  revoke_reason text
);

-- Unique: um (paroquia, user) ativo por vez; múltiplos registros revogados OK
CREATE UNIQUE INDEX IF NOT EXISTS idx_paroquia_members_active_unique
  ON public.paroquia_members (paroquia_id, user_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_paroquia_members_paroquia_role_active
  ON public.paroquia_members (paroquia_id, role)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_paroquia_members_user_active
  ON public.paroquia_members (user_id)
  WHERE revoked_at IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. paroquia_claims — pedidos "Sou representante desta igreja"
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.paroquia_claims (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paroquia_id        uuid NOT NULL REFERENCES public.paroquias(id) ON DELETE CASCADE,
  user_id            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nome_solicitante   text NOT NULL,
  email_solicitante  text NOT NULL,
  whatsapp           text,
  relacao            text,
  role_solicitada    paroquia_member_role NOT NULL DEFAULT 'admin',
  mensagem           text,
  documento_path     text,
  status             paroquia_claim_status NOT NULL DEFAULT 'pendente',
  admin_notas        text,
  revisado_por       uuid REFERENCES auth.users(id),
  revisado_em        timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Máximo 1 claim pendente por (paroquia, user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_paroquia_claims_pending_unique
  ON public.paroquia_claims (paroquia_id, user_id)
  WHERE status = 'pendente' AND user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_paroquia_claims_paroquia_status
  ON public.paroquia_claims (paroquia_id, status);

CREATE INDEX IF NOT EXISTS idx_paroquia_claims_user_status
  ON public.paroquia_claims (user_id, status);

CREATE INDEX IF NOT EXISTS idx_paroquia_claims_status_created
  ON public.paroquia_claims (status, created_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.paroquia_claims_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_paroquia_claims_updated_at ON public.paroquia_claims;
CREATE TRIGGER trg_paroquia_claims_updated_at
  BEFORE UPDATE ON public.paroquia_claims
  FOR EACH ROW EXECUTE FUNCTION public.paroquia_claims_set_updated_at();

-- Notificações in-app reutilizam a tabela `user_notificacoes_feed`
-- (criada em 20260415120000). Nenhuma tabela nova aqui.

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. public_submissions_log — trilha de cadastros anônimos
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.public_submissions_log (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paroquia_id         uuid REFERENCES public.paroquias(id) ON DELETE SET NULL,
  submitter_email     text,
  submitter_name      text,
  submitter_whatsapp  text,
  ip                  inet,
  user_agent          text,
  turnstile_ok        boolean,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_public_submissions_log_created
  ON public.public_submissions_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_public_submissions_log_ip
  ON public.public_submissions_log (ip, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Helpers — permissões
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_paroquia_admin(p_paroquia uuid, p_user uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.paroquia_members
    WHERE paroquia_id = p_paroquia
      AND user_id = p_user
      AND role = 'admin'
      AND revoked_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_paroquia_moderator(p_paroquia uuid, p_user uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.paroquia_members
    WHERE paroquia_id = p_paroquia
      AND user_id = p_user
      AND role = 'moderator'
      AND revoked_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_paroquia(p_paroquia uuid, p_user uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.paroquia_members
    WHERE paroquia_id = p_paroquia
      AND user_id = p_user
      AND revoked_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.paroquia_admin_count(p_paroquia uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.paroquia_members
  WHERE paroquia_id = p_paroquia
    AND role = 'admin'
    AND revoked_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.is_vd_system_admin(p_user uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user AND role = 'admin'::user_role
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Trigger — não permitir remover/revogar o último admin
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.paroquia_members_guard_last_admin()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  actor uuid := auth.uid();
  is_sys_admin boolean := false;
  remaining_admins int;
BEGIN
  -- System admin bypassa (usa o mecanismo normal de admin_audit_log)
  IF actor IS NULL THEN
    -- Service role / SQL direto: bypassa (backfills e triggers internos)
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT public.is_vd_system_admin(actor) INTO is_sys_admin;
  IF is_sys_admin THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Revogando um admin ativo (UPDATE setando revoked_at)?
  IF TG_OP = 'UPDATE'
     AND OLD.role = 'admin'
     AND OLD.revoked_at IS NULL
     AND (NEW.revoked_at IS NOT NULL OR NEW.role <> 'admin')
  THEN
    SELECT COUNT(*) INTO remaining_admins
    FROM public.paroquia_members
    WHERE paroquia_id = OLD.paroquia_id
      AND role = 'admin'
      AND revoked_at IS NULL
      AND id <> OLD.id;

    IF remaining_admins = 0 THEN
      RAISE EXCEPTION 'Não é possível remover o último administrador. Promova outro membro antes.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- DELETE em admin ativo
  IF TG_OP = 'DELETE'
     AND OLD.role = 'admin'
     AND OLD.revoked_at IS NULL
  THEN
    SELECT COUNT(*) INTO remaining_admins
    FROM public.paroquia_members
    WHERE paroquia_id = OLD.paroquia_id
      AND role = 'admin'
      AND revoked_at IS NULL
      AND id <> OLD.id;

    IF remaining_admins = 0 THEN
      RAISE EXCEPTION 'Não é possível remover o último administrador. Promova outro membro antes.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_paroquia_members_guard_last_admin ON public.paroquia_members;
CREATE TRIGGER trg_paroquia_members_guard_last_admin
  BEFORE UPDATE OR DELETE ON public.paroquia_members
  FOR EACH ROW EXECUTE FUNCTION public.paroquia_members_guard_last_admin();

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Trigger — órfã: quando último admin sai, verificado volta pra false
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.paroquia_members_unverify_on_orphan()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  remaining_admins int;
BEGIN
  -- Só dispara quando um admin ativo perde status (revogação ou change de role)
  IF TG_OP = 'UPDATE'
     AND OLD.role = 'admin'
     AND OLD.revoked_at IS NULL
     AND (NEW.revoked_at IS NOT NULL OR NEW.role <> 'admin')
  THEN
    SELECT COUNT(*) INTO remaining_admins
    FROM public.paroquia_members
    WHERE paroquia_id = OLD.paroquia_id
      AND role = 'admin'
      AND revoked_at IS NULL
      AND id <> OLD.id;

    IF remaining_admins = 0 THEN
      UPDATE public.paroquias
      SET verificado = false,
          verificado_por = NULL,
          verificado_em = NULL
      WHERE id = OLD.paroquia_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_paroquia_members_unverify_on_orphan ON public.paroquia_members;
CREATE TRIGGER trg_paroquia_members_unverify_on_orphan
  AFTER UPDATE ON public.paroquia_members
  FOR EACH ROW EXECUTE FUNCTION public.paroquia_members_unverify_on_orphan();

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. RLS — paroquia_members
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.paroquia_members ENABLE ROW LEVEL SECURITY;

-- SELECT: membros ativos de igrejas aprovadas são públicos (para exibir equipe);
--         o próprio membro sempre vê; system-admin tudo.
DROP POLICY IF EXISTS paroquia_members_select ON public.paroquia_members;
CREATE POLICY paroquia_members_select ON public.paroquia_members
  FOR SELECT
  USING (
    (revoked_at IS NULL AND EXISTS (
      SELECT 1 FROM public.paroquias p
      WHERE p.id = paroquia_id AND p.status = 'aprovada'
    ))
    OR user_id = auth.uid()
    OR public.is_vd_system_admin(auth.uid())
    OR public.is_paroquia_admin(paroquia_id, auth.uid())
  );

-- INSERT: apenas admin da igreja OU system-admin.
DROP POLICY IF EXISTS paroquia_members_insert ON public.paroquia_members;
CREATE POLICY paroquia_members_insert ON public.paroquia_members
  FOR INSERT
  WITH CHECK (
    public.is_vd_system_admin(auth.uid())
    OR public.is_paroquia_admin(paroquia_id, auth.uid())
  );

-- UPDATE: admin da igreja OU system-admin; própria pessoa pode se revogar
--         (mas o guard trigger ainda valida "não é último admin").
DROP POLICY IF EXISTS paroquia_members_update ON public.paroquia_members;
CREATE POLICY paroquia_members_update ON public.paroquia_members
  FOR UPDATE
  USING (
    public.is_vd_system_admin(auth.uid())
    OR public.is_paroquia_admin(paroquia_id, auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    public.is_vd_system_admin(auth.uid())
    OR public.is_paroquia_admin(paroquia_id, auth.uid())
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS paroquia_members_delete ON public.paroquia_members;
CREATE POLICY paroquia_members_delete ON public.paroquia_members
  FOR DELETE
  USING (
    public.is_vd_system_admin(auth.uid())
    OR public.is_paroquia_admin(paroquia_id, auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. RLS — paroquia_claims
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.paroquia_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS paroquia_claims_select ON public.paroquia_claims;
CREATE POLICY paroquia_claims_select ON public.paroquia_claims
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_paroquia_admin(paroquia_id, auth.uid())
    OR public.is_vd_system_admin(auth.uid())
  );

DROP POLICY IF EXISTS paroquia_claims_insert ON public.paroquia_claims;
CREATE POLICY paroquia_claims_insert ON public.paroquia_claims
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    -- Não permite claim em igreja rejeitada/pendente (só aprovadas)
    AND EXISTS (
      SELECT 1 FROM public.paroquias p
      WHERE p.id = paroquia_id AND p.status = 'aprovada'
    )
  );

-- UPDATE apenas por admin da igreja (aprovar/rejeitar claims locais de
-- moderador) OU system-admin (aprovar qualquer). Solicitante pode cancelar
-- o próprio claim pendente.
DROP POLICY IF EXISTS paroquia_claims_update ON public.paroquia_claims;
CREATE POLICY paroquia_claims_update ON public.paroquia_claims
  FOR UPDATE
  USING (
    public.is_vd_system_admin(auth.uid())
    OR public.is_paroquia_admin(paroquia_id, auth.uid())
    OR (user_id = auth.uid() AND status = 'pendente')
  )
  WITH CHECK (
    public.is_vd_system_admin(auth.uid())
    OR public.is_paroquia_admin(paroquia_id, auth.uid())
    OR (user_id = auth.uid() AND status IN ('pendente', 'cancelado'))
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. RLS — public_submissions_log
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.public_submissions_log ENABLE ROW LEVEL SECURITY;

-- Só system-admin lê. Inserts via service role (rota pública anônima).
DROP POLICY IF EXISTS public_submissions_log_select ON public.public_submissions_log;
CREATE POLICY public_submissions_log_select ON public.public_submissions_log
  FOR SELECT
  USING (public.is_vd_system_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. Atualizar policies de paroquia_posts — usar can_manage_paroquia
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS paroquia_posts_insert ON public.paroquia_posts;
CREATE POLICY paroquia_posts_insert ON public.paroquia_posts
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = author_user_id
    AND public.can_manage_paroquia(paroquia_id, auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.paroquias p
      WHERE p.id = paroquia_id AND p.verificado = true
    )
  );

DROP POLICY IF EXISTS paroquia_posts_update ON public.paroquia_posts;
CREATE POLICY paroquia_posts_update ON public.paroquia_posts
  FOR UPDATE
  USING (
    auth.uid() = author_user_id
    OR public.is_paroquia_admin(paroquia_id, auth.uid())
    OR public.is_vd_system_admin(auth.uid())
  )
  WITH CHECK (
    auth.uid() = author_user_id
    OR public.is_paroquia_admin(paroquia_id, auth.uid())
    OR public.is_vd_system_admin(auth.uid())
  );

DROP POLICY IF EXISTS paroquia_posts_delete ON public.paroquia_posts;
CREATE POLICY paroquia_posts_delete ON public.paroquia_posts
  FOR DELETE
  USING (
    auth.uid() = author_user_id
    OR public.is_paroquia_admin(paroquia_id, auth.uid())
    OR public.is_vd_system_admin(auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. Backfill — owner_user_id existente → paroquia_members(role='admin')
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.paroquia_members (paroquia_id, user_id, role, added_by, added_at)
SELECT p.id, p.owner_user_id, 'admin', p.owner_user_id, COALESCE(p.created_at, now())
FROM public.paroquias p
WHERE p.owner_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.paroquia_members m
    WHERE m.paroquia_id = p.id
      AND m.user_id = p.owner_user_id
      AND m.revoked_at IS NULL
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. Storage — claims também usam bucket paroquia-documentos
--     Permitir INSERT pelo próprio solicitante (user_id = auth.uid),
--     mantendo prefixo claims/{user_uuid}/.
-- ─────────────────────────────────────────────────────────────────────────────
-- Já existem policies de owner upload/read/delete no bucket para prefixo
-- {auth.uid()}/*. Para claims usamos prefixo 'claims/{auth.uid()}/...'
-- então adicionamos policies específicas.

DROP POLICY IF EXISTS "paroquia-documentos claim upload" ON storage.objects;
CREATE POLICY "paroquia-documentos claim upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'paroquia-documentos'
    AND (storage.foldername(name))[1] = 'claims'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS "paroquia-documentos claim read" ON storage.objects;
CREATE POLICY "paroquia-documentos claim read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'paroquia-documentos'
    AND (storage.foldername(name))[1] = 'claims'
    AND (
      (storage.foldername(name))[2] = auth.uid()::text
      OR public.is_vd_system_admin(auth.uid())
    )
  );
