-- Comunidade Veritas — Aba "Próximo", redes sociais e status de relacionamento
--
-- Escopo:
--   1. profiles
--      - relationship_status enum (solteiro, casado, namorando) — opcional,
--        bloqueado para clero.
--      - tiktok, youtube (colunas separadas). instagram/whatsapp já existem.
--      - location_lat/lng + city/state snapshot + location_updated_at para
--        localização aprovada uma vez e reutilizada.
--   2. vd_posts
--      - city, state, latitude, longitude (snapshot da localização do autor
--        no momento do post). Preenchidos por trigger BEFORE INSERT a partir
--        do profile do autor (sem exigir o client mandar).
--   3. RPC get_nearby_veritas(viewer_id, lat, lng, radius_km, limite, cursor)
--      - retorna IDs de posts dentro do raio via fórmula de Haversine
--        (não exige extensão earthdistance/PostGIS).
--   4. RPC get_public_profile_snapshot expondo redes sociais e status.

-- ==========================================================================
-- 1. Enum de status de relacionamento
-- ==========================================================================
DO $$ BEGIN
  CREATE TYPE public.vd_relationship_status AS ENUM (
    'solteiro',
    'casado',
    'namorando'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==========================================================================
-- 2. Novas colunas em profiles
-- ==========================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS relationship_status public.vd_relationship_status,
  ADD COLUMN IF NOT EXISTS tiktok text,
  ADD COLUMN IF NOT EXISTS youtube text,
  ADD COLUMN IF NOT EXISTS location_lat numeric(9, 6),
  ADD COLUMN IF NOT EXISTS location_lng numeric(9, 6),
  ADD COLUMN IF NOT EXISTS location_city text,
  ADD COLUMN IF NOT EXISTS location_state text,
  ADD COLUMN IF NOT EXISTS location_updated_at timestamptz;

-- Check: se relationship_status está setado, community_role não pode ser clero.
-- Clero e sacerdote ficam proibidos (padre, diacono, bispo, religioso).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_relationship_status_not_clergy_chk'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_relationship_status_not_clergy_chk
      CHECK (
        relationship_status IS NULL
        OR community_role NOT IN ('padre', 'diacono', 'bispo', 'religioso')
      );
  END IF;
END $$;

-- Check: latitude/longitude precisam vir juntos e dentro de limites.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_location_pair_chk'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_location_pair_chk
      CHECK (
        (location_lat IS NULL AND location_lng IS NULL)
        OR (
          location_lat IS NOT NULL AND location_lng IS NOT NULL
          AND location_lat BETWEEN -90 AND 90
          AND location_lng BETWEEN -180 AND 180
        )
      );
  END IF;
END $$;

-- Índice parcial — só perfis com localização (otimiza query "próximo").
CREATE INDEX IF NOT EXISTS idx_profiles_location
  ON public.profiles (location_lat, location_lng)
  WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;

-- ==========================================================================
-- 3. Novas colunas em vd_posts
-- ==========================================================================
ALTER TABLE public.vd_posts
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS latitude numeric(9, 6),
  ADD COLUMN IF NOT EXISTS longitude numeric(9, 6);

-- Check: mesma regra do profile (lat/lng andam juntos).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'vd_posts_location_pair_chk'
      AND conrelid = 'public.vd_posts'::regclass
  ) THEN
    ALTER TABLE public.vd_posts
      ADD CONSTRAINT vd_posts_location_pair_chk
      CHECK (
        (latitude IS NULL AND longitude IS NULL)
        OR (
          latitude IS NOT NULL AND longitude IS NOT NULL
          AND latitude BETWEEN -90 AND 90
          AND longitude BETWEEN -180 AND 180
        )
      );
  END IF;
END $$;

-- Índice parcial para lookup rápido no nearby.
CREATE INDEX IF NOT EXISTS idx_vd_posts_location_created
  ON public.vd_posts (created_at DESC)
  WHERE latitude IS NOT NULL
    AND longitude IS NOT NULL
    AND deleted_at IS NULL
    AND kind <> 'reply';

-- ==========================================================================
-- 4. Trigger — copia localização do autor pro post (snapshot)
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.vd_posts_fill_location_from_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_lat numeric(9, 6);
  v_lng numeric(9, 6);
  v_city text;
  v_state text;
BEGIN
  -- Só preenche se vier NULL. Permite o client sobrescrever se mandar.
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT location_lat, location_lng, location_city, location_state
    INTO v_lat, v_lng, v_city, v_state
  FROM public.profiles
  WHERE id = NEW.author_user_id;

  IF v_lat IS NOT NULL AND v_lng IS NOT NULL THEN
    NEW.latitude := v_lat;
    NEW.longitude := v_lng;
    NEW.city := COALESCE(NEW.city, v_city);
    NEW.state := COALESCE(NEW.state, v_state);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vd_posts_fill_location ON public.vd_posts;
CREATE TRIGGER trg_vd_posts_fill_location
  BEFORE INSERT ON public.vd_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.vd_posts_fill_location_from_author();

-- ==========================================================================
-- 5. RPC — feed "Próximo" (Haversine inline)
-- ==========================================================================
-- Retorna IDs de posts dentro do raio. A feed-loader do app hidrata o resto
-- via fetchPostsByIds (que já lida com mídia, métricas e viewer state).
CREATE OR REPLACE FUNCTION public.get_nearby_veritas(
  p_viewer_id uuid,
  p_lat numeric,
  p_lng numeric,
  p_radius_km numeric DEFAULT 60,
  p_limit integer DEFAULT 80,
  p_cursor timestamptz DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  distance_km numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH base AS (
    SELECT
      vp.id,
      vp.created_at,
      -- Haversine em km. 6371 = raio médio da Terra.
      2 * 6371 * asin(
        sqrt(
          sin(radians((vp.latitude::float8 - p_lat::float8) / 2)) ^ 2
          + cos(radians(p_lat::float8))
            * cos(radians(vp.latitude::float8))
            * sin(radians((vp.longitude::float8 - p_lng::float8) / 2)) ^ 2
        )
      )::numeric AS distance_km
    FROM public.vd_posts vp
    WHERE vp.deleted_at IS NULL
      AND vp.kind <> 'reply'
      AND vp.latitude IS NOT NULL
      AND vp.longitude IS NOT NULL
      AND vp.author_user_id <> p_viewer_id
      AND (p_cursor IS NULL OR vp.created_at < p_cursor)
      -- Exclui autores bloqueados pelo viewer.
      AND NOT EXISTS (
        SELECT 1 FROM public.vd_blocks b
        WHERE b.blocker_user_id = p_viewer_id
          AND b.blocked_user_id = vp.author_user_id
      )
      -- Exclui autores que bloquearam o viewer.
      AND NOT EXISTS (
        SELECT 1 FROM public.vd_blocks b
        WHERE b.blocker_user_id = vp.author_user_id
          AND b.blocked_user_id = p_viewer_id
      )
      -- Exclui autores mutados.
      AND NOT EXISTS (
        SELECT 1 FROM public.vd_mutes m
        WHERE m.muter_user_id = p_viewer_id
          AND m.muted_user_id = vp.author_user_id
      )
  )
  SELECT id, created_at, distance_km
  FROM base
  WHERE distance_km <= p_radius_km
  ORDER BY created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 120));
$$;

GRANT EXECUTE ON FUNCTION public.get_nearby_veritas(uuid, numeric, numeric, numeric, integer, timestamptz)
  TO authenticated, service_role;

-- ==========================================================================
-- 6. RPC get_public_profile_snapshot — adiciona socials + relationship
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.get_public_profile_snapshot(identifier text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_identifier text := btrim(identifier);
  v_user_id uuid;
  v_profile jsonb;
  v_veritas jsonb;
  v_follower_count int;
  v_following_count int;
  v_veritas_count int;
BEGIN
  IF v_identifier = '' THEN
    RETURN jsonb_build_object('profile', NULL, 'veritas', '[]'::jsonb);
  END IF;

  IF left(v_identifier, 1) = '@' THEN
    v_identifier := substr(v_identifier, 2);
  END IF;

  IF v_identifier ~ '^[0-9]+$' THEN
    SELECT p.id INTO v_user_id
    FROM public.profiles p
    WHERE p.user_number = v_identifier::integer
    LIMIT 1;
  ELSE
    SELECT p.id INTO v_user_id
    FROM public.profiles p
    WHERE lower(p.public_handle) = lower(v_identifier)
    LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('profile', NULL, 'veritas', '[]'::jsonb);
  END IF;

  SELECT COUNT(*) INTO v_follower_count
  FROM public.vd_follows WHERE followed_user_id = v_user_id;

  SELECT COUNT(*) INTO v_following_count
  FROM public.vd_follows WHERE follower_user_id = v_user_id;

  SELECT COUNT(*) INTO v_veritas_count
  FROM public.vd_posts
  WHERE author_user_id = v_user_id
    AND deleted_at IS NULL
    AND kind <> 'reply';

  SELECT jsonb_build_object(
      'id', p.id,
      'public_handle', p.public_handle,
      'user_number', p.user_number,
      'name', p.name,
      'vocacao', p.vocacao,
      'community_role', p.community_role,
      'verified', p.verified,
      'verified_at', p.verified_at,
      'profile_image_url', p.profile_image_url,
      'cover_image_url', p.cover_image_url,
      'bio_short', p.bio_short,
      'external_links', COALESCE(p.external_links, '[]'::jsonb),
      'cidade', p.cidade,
      'estado', p.estado,
      'paroquia', p.paroquia,
      'diocese', p.diocese,
      'comunidade', p.comunidade,
      'relationship_status', p.relationship_status,
      'instagram', p.instagram,
      'whatsapp', p.whatsapp,
      'tiktok', p.tiktok,
      'youtube', p.youtube,
      'follower_count', v_follower_count,
      'following_count', v_following_count,
      'veritas_count', v_veritas_count,
      'created_at', p.created_at
    )
    INTO v_profile
  FROM public.profiles p
  WHERE p.id = v_user_id;

  WITH top_posts AS (
    SELECT
      vp.id,
      vp.kind,
      vp.body,
      vp.parent_post_id,
      vp.created_at,
      vp.city,
      vp.state,
      COALESCE(vm.like_count, 0) AS like_count,
      COALESCE(vm.repost_count, 0) AS repost_count,
      COALESCE(vm.quote_count, 0) AS quote_count,
      COALESCE(vm.reply_count, 0) AS reply_count,
      COALESCE(vm.report_count, 0) AS report_count,
      COALESCE(vm.share_cross_count, 0) AS share_cross_count
    FROM public.vd_posts vp
    LEFT JOIN public.vd_post_metrics vm ON vm.post_id = vp.id
    WHERE vp.author_user_id = v_user_id
      AND vp.deleted_at IS NULL
      AND vp.kind <> 'reply'
    ORDER BY vp.created_at DESC
    LIMIT 10
  ),
  media_by_post AS (
    SELECT
      pm.post_id,
      jsonb_agg(
        jsonb_build_object(
          'id', ma.id,
          'kind', ma.media_kind,
          'mime_type', ma.mime_type,
          'object_key', ma.object_key,
          'width', ma.width,
          'height', ma.height,
          'variants', ma.variants,
          'position', pm.position
        )
        ORDER BY pm.position ASC
      ) AS media
    FROM public.vd_post_media pm
    JOIN public.vd_media_assets ma ON ma.id = pm.media_asset_id
    GROUP BY pm.post_id
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', tp.id,
      'kind', tp.kind,
      'body', tp.body,
      'parent_post_id', tp.parent_post_id,
      'created_at', tp.created_at,
      'city', tp.city,
      'state', tp.state,
      'metrics', jsonb_build_object(
        'like_count', tp.like_count,
        'repost_count', tp.repost_count,
        'quote_count', tp.quote_count,
        'reply_count', tp.reply_count,
        'report_count', tp.report_count,
        'share_cross_count', tp.share_cross_count
      ),
      'media', COALESCE(mbp.media, '[]'::jsonb)
    )
    ORDER BY tp.created_at DESC
  )
  INTO v_veritas
  FROM top_posts tp
  LEFT JOIN media_by_post mbp ON mbp.post_id = tp.id;

  RETURN jsonb_build_object(
    'profile', v_profile,
    'veritas', COALESCE(v_veritas, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile_snapshot(text) TO anon, authenticated, service_role;
