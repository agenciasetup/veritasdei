-- Entitlements por feature (Fase 2 do Veritas Educa).
--
-- Antes: qualquer plano ativo liberava todas as features premium (via
-- `has_active_premium`). Bom enquanto havia 1 plano. Agora que existe
-- o `veritas-educa` (subproduto sem comunidade), precisamos distinguir.
--
-- Solução: nova função `user_has_feature(uid, feature)` que aplica um
-- mapping plano → features. As policies da comunidade migram pra ela;
-- `has_active_premium` continua existindo para checks de "tem qualquer
-- pago ativo" (usado em outras partes do app).
--
-- Mapping atual:
--   premium        → todas features (comunidade inclusa)
--   veritas-educa  → todas features EXCETO 'community'
--
-- Para adicionar features novas, basta listar em `get_user_features`
-- e (opcionalmente) gateá-las com `user_has_feature` no front/RLS.

-- ==========================================================================
-- 1. user_has_feature(uid, feature) — usado em RLS e RPCs
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.user_has_feature(uid uuid, feature text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plano text;
  v_ativo boolean;
BEGIN
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT e.plano, e.ativo
  INTO v_plano, v_ativo
  FROM public.get_user_entitlement(uid) AS e
  LIMIT 1;

  IF NOT COALESCE(v_ativo, false) THEN
    RETURN false;
  END IF;

  -- Exclusões explícitas por plano. Default = libera (para não bloquear
  -- features novas adicionadas no front antes de cair aqui).
  IF v_plano = 'veritas-educa' AND feature = 'community' THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_has_feature(uuid, text)
  TO anon, authenticated, service_role;

-- ==========================================================================
-- 2. get_user_features(uid) — usado pelo client (SubscriptionContext)
-- ==========================================================================
-- Retorna o conjunto de features ativas pro usuário. Client pode chamar
-- uma vez e cachear localmente em vez de fazer N round-trips de
-- user_has_feature.
CREATE OR REPLACE FUNCTION public.get_user_features(uid uuid)
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plano text;
  v_ativo boolean;
  v_features text[];
BEGIN
  IF uid IS NULL THEN
    RETURN ARRAY[]::text[];
  END IF;

  SELECT e.plano, e.ativo
  INTO v_plano, v_ativo
  FROM public.get_user_entitlement(uid) AS e
  LIMIT 1;

  IF NOT COALESCE(v_ativo, false) THEN
    RETURN ARRAY[]::text[];
  END IF;

  -- Features base liberadas pra todo plano pago.
  v_features := ARRAY[
    'estudo',
    'novenas',
    'rosario',
    'verbum',
    'santos',
    'paroquias'
  ];

  -- Community: liberada para todos os planos exceto veritas-educa.
  IF v_plano <> 'veritas-educa' THEN
    v_features := v_features || ARRAY['community']::text[];
  END IF;

  RETURN v_features;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_features(uuid)
  TO anon, authenticated, service_role;

-- ==========================================================================
-- 3. RLS da comunidade — migra has_active_premium → user_has_feature
-- ==========================================================================
-- Todas as policies abaixo trocam o gate. O `has_active_premium`
-- continua funcionando em outros lugares; só removemos a dependência
-- nas tabelas vd_*.

-- vd_posts — postar original/reply/quote exige feature 'community'.
-- Repost continua aberto a qualquer autenticado (definido em migração anterior).
DROP POLICY IF EXISTS vd_posts_insert_own ON public.vd_posts;
CREATE POLICY vd_posts_insert_own
  ON public.vd_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_user_id
    AND (
      kind = 'repost'
      OR public.user_has_feature(auth.uid(), 'community')
    )
  );

-- vd_follows — seguir/desseguir exige feature 'community'
DROP POLICY IF EXISTS vd_follows_insert_own ON public.vd_follows;
CREATE POLICY vd_follows_insert_own
  ON public.vd_follows
  FOR INSERT
  TO authenticated
  WITH CHECK (
    follower_user_id = auth.uid()
    AND public.user_has_feature(auth.uid(), 'community')
  );

DROP POLICY IF EXISTS vd_follows_delete_own ON public.vd_follows;
CREATE POLICY vd_follows_delete_own
  ON public.vd_follows
  FOR DELETE
  TO authenticated
  USING (
    follower_user_id = auth.uid()
    AND public.user_has_feature(auth.uid(), 'community')
  );

-- vd_media_assets — upload de mídia pra post exige feature 'community'.
-- Drop da policy redundante de select_premium (vd_media_assets_select_own
-- já cobre — dono pode ler seus próprios uploads sempre).
DROP POLICY IF EXISTS vd_media_assets_select_premium ON public.vd_media_assets;

DROP POLICY IF EXISTS vd_media_assets_insert_own ON public.vd_media_assets;
CREATE POLICY vd_media_assets_insert_own
  ON public.vd_media_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_user_id = auth.uid()
    AND public.user_has_feature(auth.uid(), 'community')
  );

-- vd_post_media — ligar mídia ao post exige feature 'community'
DROP POLICY IF EXISTS vd_post_media_insert_owner ON public.vd_post_media;
CREATE POLICY vd_post_media_insert_owner
  ON public.vd_post_media
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_has_feature(auth.uid(), 'community')
    AND EXISTS (
      SELECT 1 FROM public.vd_posts vp
      WHERE vp.id = post_id
        AND vp.author_user_id = auth.uid()
        AND vp.deleted_at IS NULL
    )
    AND EXISTS (
      SELECT 1 FROM public.vd_media_assets ma
      WHERE ma.id = media_asset_id
        AND ma.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS vd_post_media_delete_owner ON public.vd_post_media;
CREATE POLICY vd_post_media_delete_owner
  ON public.vd_post_media
  FOR DELETE
  TO authenticated
  USING (
    public.user_has_feature(auth.uid(), 'community')
    AND EXISTS (
      SELECT 1 FROM public.vd_posts vp
      WHERE vp.id = post_id
        AND vp.author_user_id = auth.uid()
    )
  );

-- ==========================================================================
-- 4. RPCs de busca da comunidade — também migram pra user_has_feature
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.search_community_posts(
  q text,
  cursor_created_at timestamp with time zone DEFAULT NULL,
  cursor_id uuid DEFAULT NULL,
  page_size integer DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  author_user_id uuid,
  kind vd_post_kind,
  body text,
  parent_post_id uuid,
  created_at timestamp with time zone,
  rank real,
  like_count integer,
  reply_count integer,
  repost_count integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tsq tsquery;
  v_limit int := LEAST(GREATEST(page_size, 1), 40);
BEGIN
  IF v_uid IS NULL OR NOT public.user_has_feature(v_uid, 'community') THEN
    RAISE EXCEPTION 'Community feature required';
  END IF;

  IF q IS NULL OR btrim(q) = '' THEN
    RETURN;
  END IF;

  v_tsq := websearch_to_tsquery('portuguese', q);

  RETURN QUERY
    SELECT
      vp.id,
      vp.author_user_id,
      vp.kind,
      vp.body,
      vp.parent_post_id,
      vp.created_at,
      ts_rank(vp.body_tsv, v_tsq) AS rank,
      COALESCE(vm.like_count, 0)::int AS like_count,
      COALESCE(vm.reply_count, 0)::int AS reply_count,
      COALESCE(vm.repost_count, 0)::int AS repost_count
    FROM public.vd_posts vp
    LEFT JOIN public.vd_post_metrics vm ON vm.post_id = vp.id
    WHERE vp.deleted_at IS NULL
      AND vp.body_tsv @@ v_tsq
      AND NOT EXISTS (
        SELECT 1 FROM public.vd_blocks b
        WHERE (b.blocker_user_id = v_uid AND b.blocked_user_id = vp.author_user_id)
           OR (b.blocker_user_id = vp.author_user_id AND b.blocked_user_id = v_uid)
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.vd_mutes m
        WHERE m.muter_user_id = v_uid AND m.muted_user_id = vp.author_user_id
      )
      AND (
        cursor_created_at IS NULL
        OR vp.created_at < cursor_created_at
        OR (vp.created_at = cursor_created_at AND vp.id < cursor_id)
      )
    ORDER BY ts_rank(vp.body_tsv, v_tsq) DESC, vp.created_at DESC, vp.id DESC
    LIMIT v_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_community_people(
  q text,
  cursor_rank real DEFAULT NULL,
  cursor_id uuid DEFAULT NULL,
  page_size integer DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  name text,
  public_handle text,
  user_number integer,
  profile_image_url text,
  cover_image_url text,
  bio_short text,
  community_role vd_community_role,
  verified boolean,
  rank real
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tsq tsquery;
  v_tsq_simple tsquery;
  v_limit int := LEAST(GREATEST(page_size, 1), 40);
  v_trim text;
BEGIN
  IF v_uid IS NULL OR NOT public.user_has_feature(v_uid, 'community') THEN
    RAISE EXCEPTION 'Community feature required';
  END IF;

  v_trim := btrim(coalesce(q, ''));
  IF v_trim = '' THEN
    RETURN;
  END IF;

  v_tsq := websearch_to_tsquery('portuguese', v_trim);
  v_tsq_simple := websearch_to_tsquery('simple', v_trim);

  RETURN QUERY
    SELECT
      p.id,
      p.name,
      p.public_handle,
      p.user_number,
      p.profile_image_url,
      p.cover_image_url,
      p.bio_short,
      p.community_role,
      p.verified,
      GREATEST(
        ts_rank(p.search_tsv, v_tsq),
        ts_rank(p.search_tsv, v_tsq_simple)
      ) AS rank
    FROM public.profiles p
    WHERE (p.search_tsv @@ v_tsq OR p.search_tsv @@ v_tsq_simple)
      AND NOT EXISTS (
        SELECT 1 FROM public.vd_blocks b
        WHERE (b.blocker_user_id = v_uid AND b.blocked_user_id = p.id)
           OR (b.blocker_user_id = p.id AND b.blocked_user_id = v_uid)
      )
      AND (
        cursor_rank IS NULL
        OR GREATEST(
             ts_rank(p.search_tsv, v_tsq),
             ts_rank(p.search_tsv, v_tsq_simple)
           ) < cursor_rank
        OR (
          GREATEST(
            ts_rank(p.search_tsv, v_tsq),
            ts_rank(p.search_tsv, v_tsq_simple)
          ) = cursor_rank
          AND p.id < cursor_id
        )
      )
    ORDER BY rank DESC, p.verified DESC, p.id DESC
    LIMIT v_limit;
END;
$$;
