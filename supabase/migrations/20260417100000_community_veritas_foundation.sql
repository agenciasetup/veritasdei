-- Comunidade Veritas (VD) — Foundation
-- Escopo: schema, constraints, metrics, RLS, funções de acesso e RPC pública

-- ==========================================================================
-- 0. Enums
-- ==========================================================================
DO $$ BEGIN
  CREATE TYPE public.vd_post_kind AS ENUM ('original', 'reply', 'repost', 'quote');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.vd_media_kind AS ENUM ('image', 'gif');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.vd_reaction_type AS ENUM ('like', 'share_cross');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.vd_report_status AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==========================================================================
-- 1. Profiles: public_handle
-- ==========================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS public_handle text;

CREATE OR REPLACE FUNCTION public.profiles_normalize_public_handle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.public_handle IS NOT NULL THEN
    NEW.public_handle := lower(btrim(NEW.public_handle));
    IF NEW.public_handle = '' THEN
      NEW.public_handle := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_normalize_public_handle ON public.profiles;
CREATE TRIGGER trg_profiles_normalize_public_handle
  BEFORE INSERT OR UPDATE OF public_handle
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_normalize_public_handle();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_public_handle_format_chk'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_public_handle_format_chk
      CHECK (
        public_handle IS NULL
        OR public_handle ~ '^[a-z0-9_]{3,20}$'
      );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_public_handle_ci
  ON public.profiles (lower(public_handle))
  WHERE public_handle IS NOT NULL;

-- ==========================================================================
-- 2. Tables
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.vd_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.vd_post_kind NOT NULL,
  body text NOT NULL DEFAULT '',
  parent_post_id uuid REFERENCES public.vd_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT vd_posts_body_len_chk CHECK (char_length(body) <= 1000),
  CONSTRAINT vd_posts_parent_required_chk CHECK (
    (kind = 'original' AND parent_post_id IS NULL)
    OR (kind <> 'original' AND parent_post_id IS NOT NULL)
  ),
  CONSTRAINT vd_posts_body_kind_chk CHECK (
    (kind IN ('original', 'reply', 'quote') AND char_length(btrim(body)) BETWEEN 1 AND 1000)
    OR (kind = 'repost' AND char_length(body) <= 1000)
  )
);

CREATE TABLE IF NOT EXISTS public.vd_media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_kind public.vd_media_kind NOT NULL,
  mime_type text NOT NULL,
  object_key text NOT NULL,
  original_bytes bigint NOT NULL CHECK (original_bytes > 0),
  width integer CHECK (width IS NULL OR width > 0),
  height integer CHECK (height IS NULL OR height > 0),
  variants jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vd_media_assets_object_key_uniq UNIQUE (object_key),
  CONSTRAINT vd_media_assets_gif_size_chk CHECK (
    media_kind <> 'gif' OR original_bytes <= (8 * 1024 * 1024)
  )
);

CREATE TABLE IF NOT EXISTS public.vd_post_media (
  post_id uuid NOT NULL REFERENCES public.vd_posts(id) ON DELETE CASCADE,
  media_asset_id uuid NOT NULL REFERENCES public.vd_media_assets(id) ON DELETE CASCADE,
  position smallint NOT NULL CHECK (position BETWEEN 1 AND 6),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, media_asset_id),
  CONSTRAINT vd_post_media_position_uniq UNIQUE (post_id, position)
);

CREATE TABLE IF NOT EXISTS public.vd_follows (
  follower_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_user_id, followed_user_id),
  CONSTRAINT vd_follows_self_chk CHECK (follower_user_id <> followed_user_id)
);

CREATE TABLE IF NOT EXISTS public.vd_reactions (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.vd_posts(id) ON DELETE CASCADE,
  type public.vd_reaction_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id, type)
);

CREATE TABLE IF NOT EXISTS public.vd_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.vd_posts(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  status public.vd_report_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vd_reports_reason_len_chk CHECK (char_length(btrim(reason)) BETWEEN 3 AND 160),
  CONSTRAINT vd_reports_details_len_chk CHECK (details IS NULL OR char_length(details) <= 1000),
  CONSTRAINT vd_reports_unique_per_user UNIQUE (reporter_user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.vd_blocks (
  blocker_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_user_id, blocked_user_id),
  CONSTRAINT vd_blocks_self_chk CHECK (blocker_user_id <> blocked_user_id)
);

CREATE TABLE IF NOT EXISTS public.vd_mutes (
  muter_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muted_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (muter_user_id, muted_user_id),
  CONSTRAINT vd_mutes_self_chk CHECK (muter_user_id <> muted_user_id)
);

CREATE TABLE IF NOT EXISTS public.vd_post_metrics (
  post_id uuid PRIMARY KEY REFERENCES public.vd_posts(id) ON DELETE CASCADE,
  like_count integer NOT NULL DEFAULT 0 CHECK (like_count >= 0),
  repost_count integer NOT NULL DEFAULT 0 CHECK (repost_count >= 0),
  quote_count integer NOT NULL DEFAULT 0 CHECK (quote_count >= 0),
  reply_count integer NOT NULL DEFAULT 0 CHECK (reply_count >= 0),
  share_cross_count integer NOT NULL DEFAULT 0 CHECK (share_cross_count >= 0),
  report_count integer NOT NULL DEFAULT 0 CHECK (report_count >= 0),
  score double precision NOT NULL DEFAULT 0,
  score_updated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================================================
-- 3. Indexes
-- ==========================================================================
CREATE INDEX IF NOT EXISTS idx_vd_posts_author_created
  ON public.vd_posts (author_user_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_vd_posts_created
  ON public.vd_posts (created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_vd_posts_parent_created
  ON public.vd_posts (parent_post_id, created_at ASC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_vd_reactions_post_type
  ON public.vd_reactions (post_id, type);

CREATE INDEX IF NOT EXISTS idx_vd_follows_followed_created
  ON public.vd_follows (followed_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vd_reports_status_created
  ON public.vd_reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vd_blocks_blocked
  ON public.vd_blocks (blocked_user_id, blocker_user_id);

CREATE INDEX IF NOT EXISTS idx_vd_mutes_muted
  ON public.vd_mutes (muted_user_id, muter_user_id);

CREATE INDEX IF NOT EXISTS idx_vd_media_owner_created
  ON public.vd_media_assets (owner_user_id, created_at DESC);

-- ==========================================================================
-- 4. Functions/triggers: updated_at + invariants + metrics
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.vd_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vd_posts_updated_at ON public.vd_posts;
CREATE TRIGGER trg_vd_posts_updated_at
  BEFORE UPDATE ON public.vd_posts
  FOR EACH ROW EXECUTE FUNCTION public.vd_set_updated_at();

DROP TRIGGER IF EXISTS trg_vd_reports_updated_at ON public.vd_reports;
CREATE TRIGGER trg_vd_reports_updated_at
  BEFORE UPDATE ON public.vd_reports
  FOR EACH ROW EXECUTE FUNCTION public.vd_set_updated_at();

DROP TRIGGER IF EXISTS trg_vd_post_metrics_updated_at ON public.vd_post_metrics;
CREATE TRIGGER trg_vd_post_metrics_updated_at
  BEFORE UPDATE ON public.vd_post_metrics
  FOR EACH ROW EXECUTE FUNCTION public.vd_set_updated_at();

CREATE OR REPLACE FUNCTION public.vd_posts_guard_parent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_parent_kind public.vd_post_kind;
  v_parent_parent uuid;
BEGIN
  IF NEW.kind = 'original' THEN
    RETURN NEW;
  END IF;

  SELECT kind, parent_post_id
    INTO v_parent_kind, v_parent_parent
  FROM public.vd_posts
  WHERE id = NEW.parent_post_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post pai inválido ou removido';
  END IF;

  IF NEW.kind = 'reply' THEN
    IF v_parent_kind = 'reply' OR v_parent_parent IS NOT NULL THEN
      RAISE EXCEPTION 'Reply aceita apenas 1 nível';
    END IF;
  END IF;

  IF NEW.kind IN ('repost', 'quote') AND v_parent_kind = 'reply' THEN
    RAISE EXCEPTION 'Não é permitido repost/quote de reply';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vd_posts_guard_parent ON public.vd_posts;
CREATE TRIGGER trg_vd_posts_guard_parent
  BEFORE INSERT OR UPDATE OF kind, parent_post_id
  ON public.vd_posts
  FOR EACH ROW EXECUTE FUNCTION public.vd_posts_guard_parent();

CREATE OR REPLACE FUNCTION public.vd_post_media_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing_total integer := 0;
  v_existing_gif integer := 0;
  v_existing_image integer := 0;
  v_new_kind public.vd_media_kind;
  v_total integer;
  v_gif integer;
  v_image integer;
BEGIN
  SELECT media_kind INTO v_new_kind
  FROM public.vd_media_assets
  WHERE id = NEW.media_asset_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Media asset inexistente';
  END IF;

  SELECT
    COUNT(*)::int,
    COALESCE(SUM(CASE WHEN ma.media_kind = 'gif' THEN 1 ELSE 0 END), 0)::int,
    COALESCE(SUM(CASE WHEN ma.media_kind = 'image' THEN 1 ELSE 0 END), 0)::int
  INTO v_existing_total, v_existing_gif, v_existing_image
  FROM public.vd_post_media pm
  JOIN public.vd_media_assets ma ON ma.id = pm.media_asset_id
  WHERE pm.post_id = NEW.post_id
    AND (TG_OP <> 'UPDATE' OR pm.media_asset_id <> OLD.media_asset_id);

  v_total := v_existing_total + 1;
  v_gif := v_existing_gif + CASE WHEN v_new_kind = 'gif' THEN 1 ELSE 0 END;
  v_image := v_existing_image + CASE WHEN v_new_kind = 'image' THEN 1 ELSE 0 END;

  IF v_total > 6 THEN
    RAISE EXCEPTION 'Limite máximo de 6 mídias por Veritas';
  END IF;

  IF v_gif > 1 THEN
    RAISE EXCEPTION 'Apenas 1 GIF por Veritas';
  END IF;

  IF v_gif > 0 AND v_image > 0 THEN
    RAISE EXCEPTION 'Não é permitido misturar GIF com imagens';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vd_post_media_guard ON public.vd_post_media;
CREATE TRIGGER trg_vd_post_media_guard
  BEFORE INSERT OR UPDATE OF media_asset_id, post_id
  ON public.vd_post_media
  FOR EACH ROW EXECUTE FUNCTION public.vd_post_media_guard();

CREATE OR REPLACE FUNCTION public.vd_recalc_post_score(p_post_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.vd_post_metrics
  SET score =
      like_count::double precision
      + (reply_count::double precision * 3)
      + (repost_count::double precision * 4)
      + (quote_count::double precision * 4)
      + (share_cross_count::double precision * 2)
      - (report_count::double precision * 3),
      score_updated_at = now(),
      updated_at = now()
  WHERE post_id = p_post_id;
$$;

CREATE OR REPLACE FUNCTION public.vd_posts_metrics_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.vd_post_metrics (post_id)
    VALUES (NEW.id)
    ON CONFLICT (post_id) DO NOTHING;

    IF NEW.parent_post_id IS NOT NULL THEN
      IF NEW.kind = 'reply' THEN
        UPDATE public.vd_post_metrics
        SET reply_count = reply_count + 1
        WHERE post_id = NEW.parent_post_id;
      ELSIF NEW.kind = 'repost' THEN
        UPDATE public.vd_post_metrics
        SET repost_count = repost_count + 1
        WHERE post_id = NEW.parent_post_id;
      ELSIF NEW.kind = 'quote' THEN
        UPDATE public.vd_post_metrics
        SET quote_count = quote_count + 1
        WHERE post_id = NEW.parent_post_id;
      END IF;
      PERFORM public.vd_recalc_post_score(NEW.parent_post_id);
    END IF;

    PERFORM public.vd_recalc_post_score(NEW.id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.parent_post_id IS NOT NULL THEN
      IF OLD.kind = 'reply' THEN
        UPDATE public.vd_post_metrics
        SET reply_count = GREATEST(reply_count - 1, 0)
        WHERE post_id = OLD.parent_post_id;
      ELSIF OLD.kind = 'repost' THEN
        UPDATE public.vd_post_metrics
        SET repost_count = GREATEST(repost_count - 1, 0)
        WHERE post_id = OLD.parent_post_id;
      ELSIF OLD.kind = 'quote' THEN
        UPDATE public.vd_post_metrics
        SET quote_count = GREATEST(quote_count - 1, 0)
        WHERE post_id = OLD.parent_post_id;
      END IF;
      PERFORM public.vd_recalc_post_score(OLD.parent_post_id);
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_vd_posts_metrics ON public.vd_posts;
CREATE TRIGGER trg_vd_posts_metrics
  AFTER INSERT OR DELETE ON public.vd_posts
  FOR EACH ROW EXECUTE FUNCTION public.vd_posts_metrics_trigger();

CREATE OR REPLACE FUNCTION public.vd_reactions_metrics_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_post_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_post_id := NEW.post_id;

    IF NEW.type = 'like' THEN
      UPDATE public.vd_post_metrics
      SET like_count = like_count + 1
      WHERE post_id = NEW.post_id;
    ELSIF NEW.type = 'share_cross' THEN
      UPDATE public.vd_post_metrics
      SET share_cross_count = share_cross_count + 1
      WHERE post_id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_post_id := OLD.post_id;

    IF OLD.type = 'like' THEN
      UPDATE public.vd_post_metrics
      SET like_count = GREATEST(like_count - 1, 0)
      WHERE post_id = OLD.post_id;
    ELSIF OLD.type = 'share_cross' THEN
      UPDATE public.vd_post_metrics
      SET share_cross_count = GREATEST(share_cross_count - 1, 0)
      WHERE post_id = OLD.post_id;
    END IF;
  END IF;

  PERFORM public.vd_recalc_post_score(v_post_id);

  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  ELSE
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_vd_reactions_metrics ON public.vd_reactions;
CREATE TRIGGER trg_vd_reactions_metrics
  AFTER INSERT OR DELETE ON public.vd_reactions
  FOR EACH ROW EXECUTE FUNCTION public.vd_reactions_metrics_trigger();

CREATE OR REPLACE FUNCTION public.vd_reports_metrics_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_old_countable boolean := false;
  v_new_countable boolean := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_new_countable := NEW.status IN ('open', 'reviewing');
    IF v_new_countable THEN
      UPDATE public.vd_post_metrics
      SET report_count = report_count + 1
      WHERE post_id = NEW.post_id;
      PERFORM public.vd_recalc_post_score(NEW.post_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_countable := OLD.status IN ('open', 'reviewing');
    v_new_countable := NEW.status IN ('open', 'reviewing');

    IF OLD.post_id <> NEW.post_id THEN
      IF v_old_countable THEN
        UPDATE public.vd_post_metrics
        SET report_count = GREATEST(report_count - 1, 0)
        WHERE post_id = OLD.post_id;
        PERFORM public.vd_recalc_post_score(OLD.post_id);
      END IF;

      IF v_new_countable THEN
        UPDATE public.vd_post_metrics
        SET report_count = report_count + 1
        WHERE post_id = NEW.post_id;
        PERFORM public.vd_recalc_post_score(NEW.post_id);
      END IF;
    ELSIF v_old_countable <> v_new_countable THEN
      UPDATE public.vd_post_metrics
      SET report_count = GREATEST(report_count + CASE WHEN v_new_countable THEN 1 ELSE -1 END, 0)
      WHERE post_id = NEW.post_id;
      PERFORM public.vd_recalc_post_score(NEW.post_id);
    END IF;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_old_countable := OLD.status IN ('open', 'reviewing');
    IF v_old_countable THEN
      UPDATE public.vd_post_metrics
      SET report_count = GREATEST(report_count - 1, 0)
      WHERE post_id = OLD.post_id;
      PERFORM public.vd_recalc_post_score(OLD.post_id);
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_vd_reports_metrics ON public.vd_reports;
CREATE TRIGGER trg_vd_reports_metrics
  AFTER INSERT OR UPDATE OR DELETE ON public.vd_reports
  FOR EACH ROW EXECUTE FUNCTION public.vd_reports_metrics_trigger();

-- ==========================================================================
-- 5. Entitlement helper
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.has_active_premium(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE((
    SELECT e.ativo
    FROM public.get_user_entitlement(uid) AS e
    LIMIT 1
  ), false);
$$;

GRANT EXECUTE ON FUNCTION public.has_active_premium(uuid) TO anon, authenticated, service_role;

-- ==========================================================================
-- 6. RPC pública: profile + 10 Veritas
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.get_public_profile_snapshot(identifier text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_identifier text := lower(btrim(COALESCE(identifier, '')));
  v_user_id uuid;
  v_profile jsonb;
  v_veritas jsonb;
BEGIN
  IF v_identifier = '' THEN
    RETURN jsonb_build_object('profile', NULL, 'veritas', '[]'::jsonb);
  END IF;

  IF left(v_identifier, 1) = '@' THEN
    v_identifier := substr(v_identifier, 2);
  END IF;

  IF v_identifier ~ '^[0-9]+$' THEN
    SELECT p.id
      INTO v_user_id
    FROM public.profiles p
    WHERE p.user_number = v_identifier::integer
    LIMIT 1;
  ELSE
    SELECT p.id
      INTO v_user_id
    FROM public.profiles p
    WHERE lower(p.public_handle) = v_identifier
    LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('profile', NULL, 'veritas', '[]'::jsonb);
  END IF;

  SELECT jsonb_build_object(
      'id', p.id,
      'public_handle', p.public_handle,
      'user_number', p.user_number,
      'name', p.name,
      'vocacao', p.vocacao,
      'verified', p.verified,
      'profile_image_url', p.profile_image_url,
      'cidade', p.cidade,
      'estado', p.estado,
      'paroquia', p.paroquia,
      'diocese', p.diocese,
      'comunidade', p.comunidade
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
    WHERE pm.post_id IN (SELECT id FROM top_posts)
    GROUP BY pm.post_id
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', tp.id,
        'kind', tp.kind,
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
    ),
    '[]'::jsonb
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

GRANT EXECUTE ON FUNCTION public.get_public_profile_snapshot(text)
  TO anon, authenticated, service_role;

-- ==========================================================================
-- 7. Permissions + RLS
-- ==========================================================================
ALTER TABLE public.vd_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vd_media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vd_post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vd_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vd_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vd_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vd_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vd_mutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vd_post_metrics ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.vd_posts FROM anon, authenticated;
REVOKE ALL ON public.vd_media_assets FROM anon, authenticated;
REVOKE ALL ON public.vd_post_media FROM anon, authenticated;
REVOKE ALL ON public.vd_follows FROM anon, authenticated;
REVOKE ALL ON public.vd_reactions FROM anon, authenticated;
REVOKE ALL ON public.vd_reports FROM anon, authenticated;
REVOKE ALL ON public.vd_blocks FROM anon, authenticated;
REVOKE ALL ON public.vd_mutes FROM anon, authenticated;
REVOKE ALL ON public.vd_post_metrics FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vd_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vd_media_assets TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.vd_post_media TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.vd_follows TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.vd_reactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.vd_reports TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.vd_blocks TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.vd_mutes TO authenticated;
GRANT SELECT ON public.vd_post_metrics TO authenticated;

DROP POLICY IF EXISTS vd_posts_select_premium ON public.vd_posts;
CREATE POLICY vd_posts_select_premium
  ON public.vd_posts
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND public.has_active_premium(auth.uid())
    AND deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.vd_blocks b
      WHERE (b.blocker_user_id = auth.uid() AND b.blocked_user_id = author_user_id)
         OR (b.blocker_user_id = author_user_id AND b.blocked_user_id = auth.uid())
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.vd_mutes m
      WHERE m.muter_user_id = auth.uid()
        AND m.muted_user_id = author_user_id
    )
  );

DROP POLICY IF EXISTS vd_posts_insert_own ON public.vd_posts;
CREATE POLICY vd_posts_insert_own
  ON public.vd_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_user_id
    AND public.has_active_premium(auth.uid())
  );

DROP POLICY IF EXISTS vd_posts_update_own ON public.vd_posts;
CREATE POLICY vd_posts_update_own
  ON public.vd_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_user_id)
  WITH CHECK (
    auth.uid() = author_user_id
    AND public.has_active_premium(auth.uid())
  );

DROP POLICY IF EXISTS vd_posts_delete_own ON public.vd_posts;
CREATE POLICY vd_posts_delete_own
  ON public.vd_posts
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_user_id
    AND public.has_active_premium(auth.uid())
  );

DROP POLICY IF EXISTS vd_media_assets_select_own ON public.vd_media_assets;
CREATE POLICY vd_media_assets_select_own
  ON public.vd_media_assets
  FOR SELECT
  TO authenticated
  USING (
    owner_user_id = auth.uid()
    AND public.has_active_premium(auth.uid())
  );

DROP POLICY IF EXISTS vd_media_assets_insert_own ON public.vd_media_assets;
CREATE POLICY vd_media_assets_insert_own
  ON public.vd_media_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_user_id = auth.uid()
    AND public.has_active_premium(auth.uid())
  );

DROP POLICY IF EXISTS vd_media_assets_update_own ON public.vd_media_assets;
CREATE POLICY vd_media_assets_update_own
  ON public.vd_media_assets
  FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (
    owner_user_id = auth.uid()
    AND public.has_active_premium(auth.uid())
  );

DROP POLICY IF EXISTS vd_media_assets_delete_own ON public.vd_media_assets;
CREATE POLICY vd_media_assets_delete_own
  ON public.vd_media_assets
  FOR DELETE
  TO authenticated
  USING (
    owner_user_id = auth.uid()
    AND public.has_active_premium(auth.uid())
  );

DROP POLICY IF EXISTS vd_post_media_select_premium ON public.vd_post_media;
CREATE POLICY vd_post_media_select_premium
  ON public.vd_post_media
  FOR SELECT
  TO authenticated
  USING (
    public.has_active_premium(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.vd_posts vp
      WHERE vp.id = post_id
        AND vp.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS vd_post_media_insert_owner ON public.vd_post_media;
CREATE POLICY vd_post_media_insert_owner
  ON public.vd_post_media
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_active_premium(auth.uid())
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
    public.has_active_premium(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.vd_posts vp
      WHERE vp.id = post_id
        AND vp.author_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS vd_follows_select_own ON public.vd_follows;
CREATE POLICY vd_follows_select_own
  ON public.vd_follows
  FOR SELECT
  TO authenticated
  USING (
    follower_user_id = auth.uid()
    AND public.has_active_premium(auth.uid())
  );

DROP POLICY IF EXISTS vd_follows_insert_own ON public.vd_follows;
CREATE POLICY vd_follows_insert_own
  ON public.vd_follows
  FOR INSERT
  TO authenticated
  WITH CHECK (
    follower_user_id = auth.uid()
    AND public.has_active_premium(auth.uid())
  );

DROP POLICY IF EXISTS vd_follows_delete_own ON public.vd_follows;
CREATE POLICY vd_follows_delete_own
  ON public.vd_follows
  FOR DELETE
  TO authenticated
  USING (
    follower_user_id = auth.uid()
    AND public.has_active_premium(auth.uid())
  );

DROP POLICY IF EXISTS vd_reactions_select_own ON public.vd_reactions;
CREATE POLICY vd_reactions_select_own
  ON public.vd_reactions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND public.has_active_premium(auth.uid())
  );

DROP POLICY IF EXISTS vd_reactions_insert_own ON public.vd_reactions;
CREATE POLICY vd_reactions_insert_own
  ON public.vd_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.has_active_premium(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.vd_posts vp
      WHERE vp.id = post_id
        AND vp.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS vd_reactions_delete_own ON public.vd_reactions;
CREATE POLICY vd_reactions_delete_own
  ON public.vd_reactions
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND public.has_active_premium(auth.uid())
  );

DROP POLICY IF EXISTS vd_reports_select_own ON public.vd_reports;
CREATE POLICY vd_reports_select_own
  ON public.vd_reports
  FOR SELECT
  TO authenticated
  USING (
    reporter_user_id = auth.uid()
    AND public.has_active_premium(auth.uid())
  );

DROP POLICY IF EXISTS vd_reports_insert_own ON public.vd_reports;
CREATE POLICY vd_reports_insert_own
  ON public.vd_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_user_id = auth.uid()
    AND public.has_active_premium(auth.uid())
  );

DROP POLICY IF EXISTS vd_reports_update_own ON public.vd_reports;
CREATE POLICY vd_reports_update_own
  ON public.vd_reports
  FOR UPDATE
  TO authenticated
  USING (reporter_user_id = auth.uid())
  WITH CHECK (
    reporter_user_id = auth.uid()
    AND public.has_active_premium(auth.uid())
  );

DROP POLICY IF EXISTS vd_blocks_select_own ON public.vd_blocks;
CREATE POLICY vd_blocks_select_own
  ON public.vd_blocks
  FOR SELECT
  TO authenticated
  USING (
    blocker_user_id = auth.uid()
    AND public.has_active_premium(auth.uid())
  );

DROP POLICY IF EXISTS vd_blocks_insert_own ON public.vd_blocks;
CREATE POLICY vd_blocks_insert_own
  ON public.vd_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    blocker_user_id = auth.uid()
    AND public.has_active_premium(auth.uid())
  );

DROP POLICY IF EXISTS vd_blocks_delete_own ON public.vd_blocks;
CREATE POLICY vd_blocks_delete_own
  ON public.vd_blocks
  FOR DELETE
  TO authenticated
  USING (
    blocker_user_id = auth.uid()
    AND public.has_active_premium(auth.uid())
  );

DROP POLICY IF EXISTS vd_mutes_select_own ON public.vd_mutes;
CREATE POLICY vd_mutes_select_own
  ON public.vd_mutes
  FOR SELECT
  TO authenticated
  USING (
    muter_user_id = auth.uid()
    AND public.has_active_premium(auth.uid())
  );

DROP POLICY IF EXISTS vd_mutes_insert_own ON public.vd_mutes;
CREATE POLICY vd_mutes_insert_own
  ON public.vd_mutes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    muter_user_id = auth.uid()
    AND public.has_active_premium(auth.uid())
  );

DROP POLICY IF EXISTS vd_mutes_delete_own ON public.vd_mutes;
CREATE POLICY vd_mutes_delete_own
  ON public.vd_mutes
  FOR DELETE
  TO authenticated
  USING (
    muter_user_id = auth.uid()
    AND public.has_active_premium(auth.uid())
  );

DROP POLICY IF EXISTS vd_post_metrics_select_premium ON public.vd_post_metrics;
CREATE POLICY vd_post_metrics_select_premium
  ON public.vd_post_metrics
  FOR SELECT
  TO authenticated
  USING (
    public.has_active_premium(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.vd_posts vp
      WHERE vp.id = post_id
        AND vp.deleted_at IS NULL
    )
  );

-- ==========================================================================
-- 8. Audit sanity
-- ==========================================================================
DO $$
DECLARE
  v_without_rls text[] := ARRAY[]::text[];
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'vd_posts',
    'vd_media_assets',
    'vd_post_media',
    'vd_follows',
    'vd_reactions',
    'vd_reports',
    'vd_blocks',
    'vd_mutes',
    'vd_post_metrics'
  ] LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = t
        AND c.relkind = 'r'
        AND c.relrowsecurity = false
    ) THEN
      v_without_rls := array_append(v_without_rls, t);
    END IF;
  END LOOP;

  IF array_length(v_without_rls, 1) > 0 THEN
    RAISE NOTICE '[vd audit] Tables without RLS: %', v_without_rls;
  ELSE
    RAISE NOTICE '[vd audit] RLS enabled on all VD tables. ✓';
  END IF;
END $$;
