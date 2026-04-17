-- Comunidade Veritas — Sprint 1.4: Busca Full-Text
--
-- Escopo:
--   - Coluna gerada body_tsv em vd_posts (to_tsvector portuguese).
--   - Coluna gerada search_tsv em profiles (name + handle + bio_short).
--   - GIN indexes em ambas.
--   - 3 RPCs: search_community_posts / _people / _hashtags.
--     Permitem: buscar, paginar, e respeitar blocks/mutes.
--
-- Decisões:
--   - Config `portuguese` para body/bio (stemming PT-BR).
--   - Config `simple` para handle (não stemar — handle é identificador).
--   - Weights A > B > C > D — name=A, handle=A, bio=B no profile.
--   - Cursor: (rank DESC, created_at DESC, id) encoded via created_at para
--     simplicidade. Se dois posts tiverem mesmo rank, created_at desempata.
--   - Hashtags: prefix + trigram similarity. Sem cursor (lista pequena).
--   - Premium check: embutido nas RPCs (não via RLS) porque RLS em colunas
--     geradas + joins fica caro em FTS.
--   - Blocks/mutes: filtrados na RPC usando auth.uid().

-- ==========================================================================
-- 1. Coluna tsvector em vd_posts
-- ==========================================================================
-- Remove primeiro se existir (idempotente em re-run).
ALTER TABLE public.vd_posts
  DROP COLUMN IF EXISTS body_tsv;

ALTER TABLE public.vd_posts
  ADD COLUMN body_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('portuguese', coalesce(body, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_vd_posts_body_tsv
  ON public.vd_posts
  USING gin (body_tsv);

-- ==========================================================================
-- 2. Coluna tsvector em profiles
-- ==========================================================================
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS search_tsv;

ALTER TABLE public.profiles
  ADD COLUMN search_tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce(name, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(public_handle, '')), 'A')
    || setweight(to_tsvector('portuguese', coalesce(bio_short, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_profiles_search_tsv
  ON public.profiles
  USING gin (search_tsv);

-- ==========================================================================
-- 3. RPC: search_community_posts
-- ==========================================================================
-- Retorna posts que casam com a query, ordenados por ts_rank + recência.
-- Respeita blocks/mutes do usuário autenticado.
-- Exige premium (igual ao feed).
CREATE OR REPLACE FUNCTION public.search_community_posts(
  q text,
  cursor_created_at timestamptz DEFAULT NULL,
  cursor_id uuid DEFAULT NULL,
  page_size int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  author_user_id uuid,
  kind public.vd_post_kind,
  body text,
  parent_post_id uuid,
  created_at timestamptz,
  rank real,
  like_count int,
  reply_count int,
  repost_count int
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tsq tsquery;
  v_limit int := LEAST(GREATEST(page_size, 1), 40);
BEGIN
  IF v_uid IS NULL OR NOT public.has_active_premium(v_uid) THEN
    RAISE EXCEPTION 'Premium required';
  END IF;

  IF q IS NULL OR btrim(q) = '' THEN
    RETURN;
  END IF;

  -- websearch_to_tsquery entende aspas, OR, -termo. Muito amigável para UI.
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

-- ==========================================================================
-- 4. RPC: search_community_people
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.search_community_people(
  q text,
  cursor_rank real DEFAULT NULL,
  cursor_id uuid DEFAULT NULL,
  page_size int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  name text,
  public_handle text,
  user_number integer,
  profile_image_url text,
  cover_image_url text,
  bio_short text,
  community_role public.vd_community_role,
  verified boolean,
  rank real
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tsq tsquery;
  v_tsq_simple tsquery;
  v_limit int := LEAST(GREATEST(page_size, 1), 40);
  v_trim text;
BEGIN
  IF v_uid IS NULL OR NOT public.has_active_premium(v_uid) THEN
    RAISE EXCEPTION 'Premium required';
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

-- ==========================================================================
-- 5. RPC: search_community_hashtags
-- ==========================================================================
-- Busca por prefix + trigram similarity. Sem paginação (lista curta).
CREATE OR REPLACE FUNCTION public.search_community_hashtags(
  q text,
  page_size int DEFAULT 10
)
RETURNS TABLE (
  slug text,
  display text,
  usage_count bigint,
  last_used_at timestamptz,
  similarity real
)
LANGUAGE plpgsql
STABLE
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_limit int := LEAST(GREATEST(page_size, 1), 30);
  v_norm text;
BEGIN
  v_norm := public.vd_normalize_hashtag(coalesce(q, ''));
  IF v_norm = '' THEN
    RETURN;
  END IF;

  -- Remove o # se veio do cliente.
  v_norm := regexp_replace(v_norm, '^#+', '');
  IF v_norm = '' THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT
      h.slug,
      h.display,
      h.usage_count,
      h.last_used_at,
      extensions.similarity(h.slug, v_norm) AS similarity
    FROM public.vd_hashtags h
    WHERE h.slug LIKE v_norm || '%'
       OR h.slug % v_norm                  -- trigram match para typos
    ORDER BY
      (h.slug = v_norm) DESC,              -- match exato no topo
      (h.slug LIKE v_norm || '%') DESC,    -- prefix match antes de fuzzy
      h.usage_count DESC,
      extensions.similarity(h.slug, v_norm) DESC
    LIMIT v_limit;
END;
$$;

-- ==========================================================================
-- 6. Grants
-- ==========================================================================
GRANT EXECUTE ON FUNCTION public.search_community_posts(text, timestamptz, uuid, int) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_community_people(text, real, uuid, int) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_community_hashtags(text, int) TO authenticated, anon, service_role;
