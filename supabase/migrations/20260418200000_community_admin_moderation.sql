-- Comunidade Veritas — Sprint 7: Moderação por admin
--
-- Escopo:
--   - Policies RLS que permitem admin (is_vd_admin()) hide/delete
--     posts e gerenciar reports (update status) em qualquer linha.
--   - Função verify_profile: admin concede/revoga verified_at com
--     registro de quem verificou e motivo.
--   - Função moderate_hide_post: admin soft-delete.
--
-- Isola privilégios: apenas admins podem usar essas funções
-- (checked via is_vd_admin()).

-- ==========================================================================
-- 1. Policy de admin em vd_posts
-- ==========================================================================
DROP POLICY IF EXISTS vd_posts_admin_all ON public.vd_posts;
CREATE POLICY vd_posts_admin_all
  ON public.vd_posts
  FOR ALL
  TO authenticated
  USING (public.is_vd_admin(auth.uid()) OR public.is_vd_moderator(auth.uid()))
  WITH CHECK (public.is_vd_admin(auth.uid()) OR public.is_vd_moderator(auth.uid()));

-- Admin pode ler reports de qualquer post.
DROP POLICY IF EXISTS vd_reports_admin_all ON public.vd_reports;
CREATE POLICY vd_reports_admin_all
  ON public.vd_reports
  FOR ALL
  TO authenticated
  USING (public.is_vd_admin(auth.uid()) OR public.is_vd_moderator(auth.uid()))
  WITH CHECK (public.is_vd_admin(auth.uid()) OR public.is_vd_moderator(auth.uid()));

-- Admin pode editar qualquer profile (pra verificar).
DROP POLICY IF EXISTS profiles_admin_update ON public.profiles;
CREATE POLICY profiles_admin_update
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_vd_admin(auth.uid()))
  WITH CHECK (public.is_vd_admin(auth.uid()));

-- ==========================================================================
-- 2. RPC: listar reports abertos com contexto
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.admin_list_open_reports(
  cursor_created_at timestamptz DEFAULT NULL,
  page_size int DEFAULT 30
)
RETURNS TABLE (
  report_id uuid,
  report_reason text,
  report_details text,
  report_status public.vd_report_status,
  report_created_at timestamptz,
  reporter_id uuid,
  reporter_name text,
  reporter_handle text,
  post_id uuid,
  post_kind public.vd_post_kind,
  post_body text,
  post_created_at timestamptz,
  post_deleted_at timestamptz,
  post_report_count int,
  author_id uuid,
  author_name text,
  author_handle text,
  author_verified boolean,
  author_role public.vd_community_role
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit int := LEAST(GREATEST(page_size, 1), 60);
BEGIN
  IF NOT (public.is_vd_admin(auth.uid()) OR public.is_vd_moderator(auth.uid())) THEN
    RAISE EXCEPTION 'Acesso negado — apenas admin ou moderador';
  END IF;

  RETURN QUERY
    SELECT
      r.id,
      r.reason,
      r.details,
      r.status,
      r.created_at,
      reporter.id,
      reporter.name,
      reporter.public_handle,
      p.id,
      p.kind,
      p.body,
      p.created_at,
      p.deleted_at,
      COALESCE(pm.report_count, 0)::int,
      author.id,
      author.name,
      author.public_handle,
      author.verified,
      author.community_role
    FROM public.vd_reports r
    JOIN public.vd_posts p ON p.id = r.post_id
    LEFT JOIN public.profiles reporter ON reporter.id = r.reporter_user_id
    LEFT JOIN public.profiles author ON author.id = p.author_user_id
    LEFT JOIN public.vd_post_metrics pm ON pm.post_id = p.id
    WHERE r.status IN ('open', 'reviewing')
      AND (cursor_created_at IS NULL OR r.created_at < cursor_created_at)
    ORDER BY r.created_at DESC
    LIMIT v_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_open_reports(timestamptz, int) TO authenticated;

-- ==========================================================================
-- 3. RPC: resolver/dismiss report
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.admin_resolve_report(
  p_report_id uuid,
  p_resolution text -- 'resolved' | 'dismissed' | 'reviewing'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_status public.vd_report_status;
BEGIN
  IF NOT (public.is_vd_admin(auth.uid()) OR public.is_vd_moderator(auth.uid())) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF p_resolution NOT IN ('resolved', 'dismissed', 'reviewing') THEN
    RAISE EXCEPTION 'resolution inválido';
  END IF;

  v_status := p_resolution::public.vd_report_status;

  UPDATE public.vd_reports
  SET status = v_status, updated_at = now()
  WHERE id = p_report_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_resolve_report(uuid, text) TO authenticated;

-- ==========================================================================
-- 4. RPC: hide post (soft-delete por admin)
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.admin_hide_post(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT (public.is_vd_admin(auth.uid()) OR public.is_vd_moderator(auth.uid())) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  UPDATE public.vd_posts
  SET deleted_at = COALESCE(deleted_at, now()),
      updated_at = now()
  WHERE id = p_post_id;

  -- Marca reports abertos/reviewing sobre este post como resolved.
  UPDATE public.vd_reports
  SET status = 'resolved', updated_at = now()
  WHERE post_id = p_post_id
    AND status IN ('open', 'reviewing');
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_hide_post(uuid) TO authenticated;

-- ==========================================================================
-- 5. RPC: verify profile
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.admin_verify_profile(
  p_user_id uuid,
  p_reason text DEFAULT NULL,
  p_revoke boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_vd_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas admin pode verificar perfis';
  END IF;

  IF p_revoke THEN
    UPDATE public.profiles
    SET verified_at = NULL,
        verified_by = NULL,
        verified_reason = NULL
    WHERE id = p_user_id;
  ELSE
    UPDATE public.profiles
    SET verified_at = now(),
        verified_by = auth.uid(),
        verified_reason = p_reason
    WHERE id = p_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_verify_profile(uuid, text, boolean) TO authenticated;
