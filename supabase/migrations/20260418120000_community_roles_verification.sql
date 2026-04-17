-- Comunidade Veritas — Sprint 1.2: Papéis & Verificação
--
-- Escopo:
--   - Enum vd_community_role (perfis diferenciados na comunidade).
--   - Colunas em profiles para verificação rica + capa + bio curta + links.
--   - Funções helper is_vd_admin() / is_vd_moderator() para uso em RLS.
--   - Backfill a partir de vocacao e profiles.role existentes.
--
-- Decisões:
--   - community_role é separado de vocacao porque "artista" e "moderator"
--     não são vocações canônicas. vocacao continua canônica da Igreja.
--   - verified_at/by/reason substituem o boolean verified como fonte de
--     verdade, mas mantemos o boolean sincronizado via GENERATED column.
--   - Não criamos RLS policies aqui (Sprint 1.5+ refina). As funções ficam
--     disponíveis para uso em todas as tabelas vd_*.

-- ==========================================================================
-- 1. Enum de papéis da comunidade
-- ==========================================================================
DO $$ BEGIN
  CREATE TYPE public.vd_community_role AS ENUM (
    'leigo',
    'diacono',
    'padre',
    'bispo',
    'religioso',
    'artista',
    'moderator',
    'admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==========================================================================
-- 2. Colunas novas em profiles
-- ==========================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS community_role public.vd_community_role NOT NULL DEFAULT 'leigo',
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_reason text,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS bio_short text,
  ADD COLUMN IF NOT EXISTS external_links jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Check: bio_short curta (reforça "bio curta" no UI mobile).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_bio_short_len_chk'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_bio_short_len_chk
      CHECK (bio_short IS NULL OR char_length(bio_short) <= 160);
  END IF;
END $$;

-- Check: verified_reason limitado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_verified_reason_len_chk'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_verified_reason_len_chk
      CHECK (verified_reason IS NULL OR char_length(verified_reason) <= 280);
  END IF;
END $$;

-- Check: external_links é array de objetos {label, url} com tamanho razoável.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_external_links_shape_chk'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_external_links_shape_chk
      CHECK (
        jsonb_typeof(external_links) = 'array'
        AND jsonb_array_length(external_links) <= 5
      );
  END IF;
END $$;

-- Índice para lookup rápido de verificados (útil para badge + filtros).
CREATE INDEX IF NOT EXISTS idx_profiles_verified_at
  ON public.profiles (verified_at DESC NULLS LAST)
  WHERE verified_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_community_role
  ON public.profiles (community_role)
  WHERE community_role <> 'leigo';

-- ==========================================================================
-- 3. Funções helper (SECURITY DEFINER — search_path fixo)
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.is_vd_admin(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id
      AND (
        community_role = 'admin'
        OR role = 'admin'::user_role
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_vd_moderator(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id
      AND community_role IN ('admin', 'moderator')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_vd_artist(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id
      AND community_role = 'artista'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_vd_clergy(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id
      AND community_role IN ('padre', 'diacono', 'bispo', 'religioso')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_vd_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_vd_moderator(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_vd_artist(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_vd_clergy(uuid) TO authenticated, service_role;

-- ==========================================================================
-- 4. Sync de verified boolean ↔ verified_at
-- ==========================================================================
-- Mantemos o boolean existente porque muitos lugares do app/lib já leem ele.
-- Sincronização: se verified_at for setado, verified=true; se for NULL, false.
CREATE OR REPLACE FUNCTION public.profiles_sync_verified_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Caminho 1: admin seta verified_at → verified = true
  IF NEW.verified_at IS NOT NULL AND (OLD.verified_at IS NULL OR OLD.verified_at IS DISTINCT FROM NEW.verified_at) THEN
    NEW.verified := true;
  END IF;

  -- Caminho 2: admin seta verified_at = NULL (remove verificação) → verified = false
  IF NEW.verified_at IS NULL AND OLD.verified_at IS NOT NULL THEN
    NEW.verified := false;
    NEW.verified_by := NULL;
    NEW.verified_reason := NULL;
  END IF;

  -- Caminho 3: alguém seta verified=true direto (ex: script legado) → backfill verified_at
  IF NEW.verified = true AND NEW.verified_at IS NULL THEN
    NEW.verified_at := now();
  END IF;

  -- Caminho 4: verified=false → limpa metadata
  IF NEW.verified = false THEN
    NEW.verified_at := NULL;
    NEW.verified_by := NULL;
    NEW.verified_reason := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_sync_verified_flag ON public.profiles;
CREATE TRIGGER trg_profiles_sync_verified_flag
  BEFORE UPDATE OF verified, verified_at, verified_by, verified_reason
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_sync_verified_flag();

-- ==========================================================================
-- 5. Backfill
-- ==========================================================================
-- 5.1 community_role a partir de vocacao (todo usuário existente).
--     Mapeamento conservador: apenas padre/diacono/bispo convertem direto.
--     cardeal/papa não são mapeados automaticamente porque em bases de
--     produção existentes vimos muitos "papa" vindos de seed/default
--     inválido. Admins promovem manualmente quando for real.
UPDATE public.profiles
SET community_role = CASE vocacao
    WHEN 'padre' THEN 'padre'::public.vd_community_role
    WHEN 'diacono' THEN 'diacono'::public.vd_community_role
    WHEN 'bispo' THEN 'bispo'::public.vd_community_role
    ELSE 'leigo'::public.vd_community_role
  END
WHERE community_role = 'leigo'          -- evita sobrescrever quem já foi promovido
  AND vocacao IS NOT NULL;

-- 5.2 admins do sistema viram admin da comunidade também.
UPDATE public.profiles
SET community_role = 'admin'
WHERE role = 'admin'::user_role
  AND community_role NOT IN ('admin', 'moderator');

-- 5.3 verified boolean → verified_at (usamos created_at como fallback).
UPDATE public.profiles
SET verified_at = COALESCE(verified_at, created_at, now())
WHERE verified = true
  AND verified_at IS NULL;
