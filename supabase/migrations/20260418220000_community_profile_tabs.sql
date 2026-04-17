-- Comunidade Veritas — tabs do perfil público + privacidade de curtidos
--
-- Escopo:
--   - Coluna profiles.show_likes_public: se false, aba Curtidos só pro
--     dono; se true, qualquer um vê.
--   - RPCs que alimentam as tabs do perfil:
--     - get_profile_replies(identifier, cursor, limit)
--     - get_profile_media(identifier, cursor, limit)
--     - get_profile_likes(identifier, cursor, limit) — só se
--       show_likes_public OU viewer é o dono.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_likes_public boolean NOT NULL DEFAULT false;

-- Backfill: ninguém tem curtidas públicas por padrão (privacidade-first).

-- ==========================================================================
-- RPC: respostas (kind='reply') do usuário
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.get_profile_replies(
  identifier text,
  cursor_created_at timestamptz DEFAULT NULL,
  page_size int DEFAULT 20
)
RETURNS TABLE (post_id uuid, created_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_identifier text := btrim(identifier);
  v_user_id uuid;
  v_limit int := LEAST(GREATEST(page_size, 1), 40);
BEGIN
  IF left(v_identifier, 1) = '@' THEN
    v_identifier := substr(v_identifier, 2);
  END IF;

  IF v_identifier ~ '^[0-9]+$' THEN
    SELECT id INTO v_user_id FROM public.profiles
    WHERE user_number = v_identifier::integer LIMIT 1;
  ELSE
    SELECT id INTO v_user_id FROM public.profiles
    WHERE lower(public_handle) = lower(v_identifier) LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
    SELECT p.id, p.created_at
    FROM public.vd_posts p
    WHERE p.author_user_id = v_user_id
      AND p.kind = 'reply'
      AND p.deleted_at IS NULL
      AND (cursor_created_at IS NULL OR p.created_at < cursor_created_at)
    ORDER BY p.created_at DESC
    LIMIT v_limit;
END;
$$;

-- ==========================================================================
-- RPC: posts do usuário com mídia
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.get_profile_media(
  identifier text,
  cursor_created_at timestamptz DEFAULT NULL,
  page_size int DEFAULT 20
)
RETURNS TABLE (post_id uuid, created_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_identifier text := btrim(identifier);
  v_user_id uuid;
  v_limit int := LEAST(GREATEST(page_size, 1), 40);
BEGIN
  IF left(v_identifier, 1) = '@' THEN
    v_identifier := substr(v_identifier, 2);
  END IF;

  IF v_identifier ~ '^[0-9]+$' THEN
    SELECT id INTO v_user_id FROM public.profiles
    WHERE user_number = v_identifier::integer LIMIT 1;
  ELSE
    SELECT id INTO v_user_id FROM public.profiles
    WHERE lower(public_handle) = lower(v_identifier) LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
    SELECT DISTINCT p.id, p.created_at
    FROM public.vd_posts p
    JOIN public.vd_post_media pm ON pm.post_id = p.id
    WHERE p.author_user_id = v_user_id
      AND p.kind <> 'reply'
      AND p.deleted_at IS NULL
      AND (cursor_created_at IS NULL OR p.created_at < cursor_created_at)
    ORDER BY p.created_at DESC
    LIMIT v_limit;
END;
$$;

-- ==========================================================================
-- RPC: posts curtidos pelo usuário (respeita show_likes_public)
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.get_profile_likes(
  identifier text,
  cursor_created_at timestamptz DEFAULT NULL,
  page_size int DEFAULT 20
)
RETURNS TABLE (post_id uuid, created_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_identifier text := btrim(identifier);
  v_user_id uuid;
  v_show_likes boolean;
  v_limit int := LEAST(GREATEST(page_size, 1), 40);
BEGIN
  IF left(v_identifier, 1) = '@' THEN
    v_identifier := substr(v_identifier, 2);
  END IF;

  IF v_identifier ~ '^[0-9]+$' THEN
    SELECT id, show_likes_public INTO v_user_id, v_show_likes
    FROM public.profiles
    WHERE user_number = v_identifier::integer LIMIT 1;
  ELSE
    SELECT id, show_likes_public INTO v_user_id, v_show_likes
    FROM public.profiles
    WHERE lower(public_handle) = lower(v_identifier) LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN RETURN; END IF;

  -- Privacidade: só o próprio dono vê se show_likes_public = false.
  IF NOT COALESCE(v_show_likes, false) AND auth.uid() IS DISTINCT FROM v_user_id THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT r.post_id, r.created_at
    FROM public.vd_reactions r
    JOIN public.vd_posts p ON p.id = r.post_id
    WHERE r.user_id = v_user_id
      AND r.type = 'like'
      AND p.deleted_at IS NULL
      AND (cursor_created_at IS NULL OR r.created_at < cursor_created_at)
    ORDER BY r.created_at DESC
    LIMIT v_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_replies(text, timestamptz, int) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_profile_media(text, timestamptz, int) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_profile_likes(text, timestamptz, int) TO authenticated, anon;
