-- Comunidade Veritas — Sprint "4": recursos por papel
--
-- Escopo:
--   - Enum vd_post_variant adicionado ao schema de vd_posts: um kind
--     'original' pode ter variant 'default' ou 'reflection' (padre+).
--   - Enum vd_media_kind ganha 'audio' (artista+).
--   - Gate de criação enforcement via trigger:
--       - variant='reflection' exige community_role IN
--         (padre, diacono, bispo, religioso, admin).
--       - media_kind='audio' exige community_role IN (artista, admin).
--   - Campos extras em vd_posts: variant + (futuramente) duration_seconds
--     pra áudio (guardado em vd_media_assets).

-- ==========================================================================
-- 1. Enum para variantes de post
-- ==========================================================================
DO $$ BEGIN
  CREATE TYPE public.vd_post_variant AS ENUM ('default', 'reflection');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.vd_posts
  ADD COLUMN IF NOT EXISTS variant public.vd_post_variant NOT NULL DEFAULT 'default';

CREATE INDEX IF NOT EXISTS idx_vd_posts_variant_created
  ON public.vd_posts (variant, created_at DESC)
  WHERE variant <> 'default' AND deleted_at IS NULL;

-- ==========================================================================
-- 2. Novo tipo de mídia: audio
-- ==========================================================================
-- pg não permite ADD VALUE se já está em uso; usar DO block com check.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'audio'
      AND enumtypid = 'public.vd_media_kind'::regtype
  ) THEN
    ALTER TYPE public.vd_media_kind ADD VALUE 'audio';
  END IF;
END $$;

-- duration_seconds em vd_media_assets para áudios (NULL em imagens).
ALTER TABLE public.vd_media_assets
  ADD COLUMN IF NOT EXISTS duration_seconds int;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'vd_media_assets_audio_duration_chk'
      AND conrelid = 'public.vd_media_assets'::regclass
  ) THEN
    ALTER TABLE public.vd_media_assets
      ADD CONSTRAINT vd_media_assets_audio_duration_chk
      CHECK (
        media_kind <> 'audio'
        OR (duration_seconds IS NOT NULL AND duration_seconds BETWEEN 1 AND 1800)
      );
  END IF;
END $$;

-- ==========================================================================
-- 3. Trigger guards de role
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.vd_posts_guard_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role public.vd_community_role;
BEGIN
  IF NEW.variant = 'default' THEN
    RETURN NEW;
  END IF;

  SELECT community_role INTO v_role
  FROM public.profiles
  WHERE id = NEW.author_user_id;

  IF NEW.variant = 'reflection' THEN
    IF v_role IS NULL OR v_role NOT IN ('padre', 'diacono', 'bispo', 'religioso', 'admin') THEN
      RAISE EXCEPTION 'Apenas clero ou admin pode criar Reflexão';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vd_posts_guard_role ON public.vd_posts;
CREATE TRIGGER trg_vd_posts_guard_role
  BEFORE INSERT OR UPDATE OF variant, author_user_id
  ON public.vd_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.vd_posts_guard_role();

-- Guard de áudio no asset: apenas artistas e admins.
CREATE OR REPLACE FUNCTION public.vd_media_assets_guard_audio()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role public.vd_community_role;
BEGIN
  IF NEW.media_kind <> 'audio' THEN
    RETURN NEW;
  END IF;

  SELECT community_role INTO v_role
  FROM public.profiles
  WHERE id = NEW.owner_user_id;

  IF v_role IS NULL OR v_role NOT IN ('artista', 'admin') THEN
    RAISE EXCEPTION 'Apenas artistas ou admins podem publicar áudio';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vd_media_assets_guard_audio ON public.vd_media_assets;
CREATE TRIGGER trg_vd_media_assets_guard_audio
  BEFORE INSERT OR UPDATE OF media_kind, owner_user_id
  ON public.vd_media_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.vd_media_assets_guard_audio();

-- ==========================================================================
-- 4. Atualiza get_public_profile_snapshot pra incluir variant nos posts
-- ==========================================================================
-- O RPC já busca vp.kind etc; só precisa expor variant no JSON.
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
      vp.variant,
      vp.body,
      vp.parent_post_id,
      vp.created_at,
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
          'duration_seconds', ma.duration_seconds,
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
      'variant', tp.variant,
      'body', tp.body,
      'parent_post_id', tp.parent_post_id,
      'created_at', tp.created_at,
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
