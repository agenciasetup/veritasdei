-- Church Profile (Perfil de Igreja) — extends paroquias to become a public,
-- ownable church profile with verification badge and a posts feed.
--
-- Applied via Supabase Management API. This file records the migration for
-- future environments.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Enum: tipo_igreja
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE tipo_igreja AS ENUM (
    'capela','igreja','matriz','catedral','basilica','santuario'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Extend paroquias with new columns
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.paroquias
  ADD COLUMN IF NOT EXISTS cnpj                       text,
  ADD COLUMN IF NOT EXISTS tipo_igreja                tipo_igreja,
  ADD COLUMN IF NOT EXISTS horarios_confissao         jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS fotos                      jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS verificado                 boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verificacao_solicitada_em  timestamptz,
  ADD COLUMN IF NOT EXISTS verificacao_documento_path text,
  ADD COLUMN IF NOT EXISTS verificacao_notas          text,
  ADD COLUMN IF NOT EXISTS verificado_por             uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS verificado_em              timestamptz,
  ADD COLUMN IF NOT EXISTS owner_user_id              uuid REFERENCES auth.users(id);

-- Unique CNPJ (when present)
CREATE UNIQUE INDEX IF NOT EXISTS idx_paroquias_cnpj
  ON public.paroquias(cnpj) WHERE cnpj IS NOT NULL;

-- Query indexes
CREATE INDEX IF NOT EXISTS idx_paroquias_cidade_estado
  ON public.paroquias (lower(cidade), estado);
CREATE INDEX IF NOT EXISTS idx_paroquias_owner
  ON public.paroquias (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_paroquias_verificado
  ON public.paroquias (verificado);
CREATE INDEX IF NOT EXISTS idx_paroquias_verif_pendente
  ON public.paroquias (verificacao_solicitada_em)
  WHERE verificacao_solicitada_em IS NOT NULL AND verificado = false;

-- Backfill owner_user_id from criado_por for existing rows (one-time safe)
UPDATE public.paroquias
  SET owner_user_id = criado_por
  WHERE owner_user_id IS NULL AND criado_por IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Update paroquias RLS policies
--    Goals:
--      SELECT: public for approved churches, owner/admin see own/all
--      INSERT: any authed user, must own (auth.uid = owner_user_id = criado_por)
--      UPDATE: owner can edit most fields EXCEPT verification flags;
--              admins can edit everything (including verification).
-- ─────────────────────────────────────────────────────────────────────────────
-- Public browse: anyone can SELECT approved churches; owner/admin see own too.
DROP POLICY IF EXISTS paroquias_select ON public.paroquias;
CREATE POLICY paroquias_select ON public.paroquias
  FOR SELECT
  USING (
    status = 'aprovada'
    OR auth.uid() = owner_user_id
    OR auth.uid() = criado_por
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS paroquias_insert ON public.paroquias;
CREATE POLICY paroquias_insert ON public.paroquias
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = criado_por
    AND auth.uid() = owner_user_id
    AND verificado = false
  );

DROP POLICY IF EXISTS paroquias_update ON public.paroquias;
CREATE POLICY paroquias_update ON public.paroquias
  FOR UPDATE
  USING (
    auth.uid() = owner_user_id
    OR auth.uid() = criado_por
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
    )
  )
  WITH CHECK (
    auth.uid() = owner_user_id
    OR auth.uid() = criado_por
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
    )
  );

-- Trigger: prevent non-admin owner from flipping verification flags or owner.
CREATE OR REPLACE FUNCTION public.paroquias_guard_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
  ) INTO is_admin;

  IF NOT is_admin THEN
    -- Block changes to verification-related fields by non-admins
    IF NEW.verificado IS DISTINCT FROM OLD.verificado THEN
      RAISE EXCEPTION 'Somente administradores podem alterar o status de verificação.';
    END IF;
    IF NEW.verificado_por IS DISTINCT FROM OLD.verificado_por THEN
      RAISE EXCEPTION 'Somente administradores podem alterar verificado_por.';
    END IF;
    IF NEW.verificado_em IS DISTINCT FROM OLD.verificado_em THEN
      RAISE EXCEPTION 'Somente administradores podem alterar verificado_em.';
    END IF;
    -- Block re-owning
    IF NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id THEN
      RAISE EXCEPTION 'Somente administradores podem transferir a titularidade.';
    END IF;
    -- Block moderation status changes
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Somente administradores podem alterar o status de moderação.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_paroquias_guard_verification ON public.paroquias;
CREATE TRIGGER trg_paroquias_guard_verification
  BEFORE UPDATE ON public.paroquias
  FOR EACH ROW EXECUTE FUNCTION public.paroquias_guard_verification();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. paroquia_posts (feed)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.paroquia_posts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paroquia_id    uuid NOT NULL REFERENCES public.paroquias(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES auth.users(id),
  titulo         text NOT NULL,
  conteudo       text NOT NULL,
  imagem_url     text,
  published_at   timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paroquia_posts_parish_pub
  ON public.paroquia_posts (paroquia_id, published_at DESC);

ALTER TABLE public.paroquia_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS paroquia_posts_select ON public.paroquia_posts;
CREATE POLICY paroquia_posts_select ON public.paroquia_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS paroquia_posts_insert ON public.paroquia_posts;
CREATE POLICY paroquia_posts_insert ON public.paroquia_posts
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = author_user_id
    AND EXISTS (
      SELECT 1 FROM public.paroquias p
      WHERE p.id = paroquia_id
        AND p.owner_user_id = auth.uid()
        AND p.verificado = true
    )
  );

DROP POLICY IF EXISTS paroquia_posts_update ON public.paroquia_posts;
CREATE POLICY paroquia_posts_update ON public.paroquia_posts
  FOR UPDATE
  USING (auth.uid() = author_user_id)
  WITH CHECK (auth.uid() = author_user_id);

DROP POLICY IF EXISTS paroquia_posts_delete ON public.paroquia_posts;
CREATE POLICY paroquia_posts_delete ON public.paroquia_posts
  FOR DELETE
  USING (
    auth.uid() = author_user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
    )
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.paroquia_posts_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_paroquia_posts_updated_at ON public.paroquia_posts;
CREATE TRIGGER trg_paroquia_posts_updated_at
  BEFORE UPDATE ON public.paroquia_posts
  FOR EACH ROW EXECUTE FUNCTION public.paroquia_posts_set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Private storage bucket: paroquia-documentos (verification docs)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('paroquia-documentos', 'paroquia-documentos', false)
ON CONFLICT (id) DO NOTHING;

-- Authed users can upload docs for paroquias they own; path prefix = owner uuid
DROP POLICY IF EXISTS "paroquia-documentos owner upload" ON storage.objects;
CREATE POLICY "paroquia-documentos owner upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'paroquia-documentos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "paroquia-documentos owner read" ON storage.objects;
CREATE POLICY "paroquia-documentos owner read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'paroquia-documentos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
      )
    )
  );

DROP POLICY IF EXISTS "paroquia-documentos owner delete" ON storage.objects;
CREATE POLICY "paroquia-documentos owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'paroquia-documentos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
      )
    )
  );
