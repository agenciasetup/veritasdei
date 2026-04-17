-- Comunidade Veritas — Sprint 1.3: Hashtags
--
-- Escopo:
--   - Extensões pg_trgm e unaccent (autocompletar + normalização PT-BR).
--   - Tabela vd_hashtags (slug normalizado + display original + trending).
--   - Tabela vd_post_hashtags (junção).
--   - Funções: vd_extract_hashtags (regex), vd_normalize_hashtag (unaccent+lower).
--   - Trigger em vd_posts que mantém a junção em sync automaticamente.
--   - RLS: leitura pública (com premium), escrita só via trigger.
--
-- Decisões:
--   - Slug = lowercase + sem acentos + só [a-z0-9_]. Display = primeira
--     versão vista (preserva capitalização bonita, ex: #RosárioEmFamília).
--   - usage_count é mantido pelo trigger, NÃO por cron.
--   - Um post pode ter até 20 hashtags (limite no trigger).
--   - Tamanho da hashtag: 2-50 chars (após normalização).
--   - Reposts (kind='repost') NÃO contam hashtag nova do parent. Só replies
--     e quotes indexam suas próprias (mas reply podem amplificar hashtag).

-- ==========================================================================
-- 1. Extensões
-- ==========================================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

-- ==========================================================================
-- 2. Tabelas
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.vd_hashtags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,                                 -- normalizado
  display text NOT NULL,                                     -- 1ª ocorrência
  usage_count bigint NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vd_hashtags_slug_format_chk CHECK (slug ~ '^[a-z0-9_]{2,50}$'),
  CONSTRAINT vd_hashtags_display_len_chk CHECK (char_length(display) BETWEEN 2 AND 64)
);

CREATE TABLE IF NOT EXISTS public.vd_post_hashtags (
  post_id uuid NOT NULL REFERENCES public.vd_posts(id) ON DELETE CASCADE,
  hashtag_id uuid NOT NULL REFERENCES public.vd_hashtags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, hashtag_id)
);

-- ==========================================================================
-- 3. Índices
-- ==========================================================================
-- Autocomplete por prefix: "pa" → "paz", "papa", "paroquia"...
CREATE INDEX IF NOT EXISTS idx_vd_hashtags_slug_trgm
  ON public.vd_hashtags
  USING gin (slug extensions.gin_trgm_ops);

-- Trending: top por uso recente.
CREATE INDEX IF NOT EXISTS idx_vd_hashtags_usage
  ON public.vd_hashtags (usage_count DESC, last_used_at DESC NULLS LAST)
  WHERE usage_count > 0;

-- Junção: "quais posts usam esta hashtag?" (já tem PK, mas invertido ajuda).
CREATE INDEX IF NOT EXISTS idx_vd_post_hashtags_hashtag_created
  ON public.vd_post_hashtags (hashtag_id, created_at DESC);

-- ==========================================================================
-- 4. Funções utilitárias
-- ==========================================================================
-- Normaliza uma hashtag única: remove acentos, lowercase, mantém underscore.
CREATE OR REPLACE FUNCTION public.vd_normalize_hashtag(raw text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions, pg_temp
AS $$
  SELECT lower(extensions.unaccent(btrim(raw)));
$$;

-- Extrai todas as hashtags de um texto como array text[].
-- Regex aceita letras portuguesas, números e underscore. Mantém acentos
-- aqui — a normalização acontece depois em vd_normalize_hashtag.
-- Limite de 20 hashtags por post.
CREATE OR REPLACE FUNCTION public.vd_extract_hashtags(body text)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  matches text[];
  result text[] := ARRAY[]::text[];
  item text;
  normalized text;
  seen text[] := ARRAY[]::text[];
BEGIN
  IF body IS NULL OR body = '' THEN
    RETURN result;
  END IF;

  -- Captura #tag (tag = letras/acentos/números/underscore, 2-50 chars).
  -- A borda "\y" no início garante que #tag não casa "abc#tag".
  -- (?i) é case-insensitive.
  matches := ARRAY(
    SELECT (regexp_matches(
      body,
      '(?:^|[^\w])#([a-zA-Z0-9_áéíóúâêôãõüçÁÉÍÓÚÂÊÔÃÕÜÇ]{2,50})',
      'g'
    ))[1]
  );

  IF matches IS NULL THEN
    RETURN result;
  END IF;

  FOREACH item IN ARRAY matches LOOP
    normalized := public.vd_normalize_hashtag(item);
    -- Revalida após normalização: só [a-z0-9_], 2-50 chars.
    IF normalized ~ '^[a-z0-9_]{2,50}$' AND NOT (normalized = ANY(seen)) THEN
      seen := array_append(seen, normalized);
      result := array_append(result, item);        -- preserva display original
      EXIT WHEN array_length(seen, 1) >= 20;
    END IF;
  END LOOP;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.vd_normalize_hashtag(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vd_extract_hashtags(text) TO authenticated, service_role;

-- ==========================================================================
-- 5. Trigger de sincronização em vd_posts
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.vd_sync_post_hashtags()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_displays text[];
  v_display text;
  v_slug text;
  v_hashtag_id uuid;
BEGIN
  -- Reposts não têm body próprio (herdam visualmente do parent). Não indexa.
  IF NEW.kind = 'repost' THEN
    DELETE FROM public.vd_post_hashtags WHERE post_id = NEW.id;
    RETURN NEW;
  END IF;

  -- Soft-deleted: remove associações (mas não apaga vd_hashtags).
  IF NEW.deleted_at IS NOT NULL THEN
    DELETE FROM public.vd_post_hashtags WHERE post_id = NEW.id;
    RETURN NEW;
  END IF;

  v_displays := public.vd_extract_hashtags(NEW.body);

  -- Remove associações antigas (em UPDATE) — forma mais simples que diff.
  IF TG_OP = 'UPDATE' THEN
    DELETE FROM public.vd_post_hashtags WHERE post_id = NEW.id;
  END IF;

  IF v_displays IS NULL OR array_length(v_displays, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  FOREACH v_display IN ARRAY v_displays LOOP
    v_slug := public.vd_normalize_hashtag(v_display);

    -- Upsert em vd_hashtags. Se já existe, mantém display antigo
    -- (first-seen wins) e incrementa usage_count + atualiza last_used_at.
    INSERT INTO public.vd_hashtags AS h (slug, display, usage_count, last_used_at)
    VALUES (v_slug, v_display, 1, now())
    ON CONFLICT (slug) DO UPDATE
      SET usage_count = h.usage_count + 1,
          last_used_at = now()
    RETURNING h.id INTO v_hashtag_id;

    -- Junção (ignora se já existe — shouldn't, pois deletamos acima).
    INSERT INTO public.vd_post_hashtags (post_id, hashtag_id)
    VALUES (NEW.id, v_hashtag_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vd_posts_sync_hashtags ON public.vd_posts;
CREATE TRIGGER trg_vd_posts_sync_hashtags
  AFTER INSERT OR UPDATE OF body, deleted_at
  ON public.vd_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.vd_sync_post_hashtags();

-- Ao DELETE de post_hashtags (quando post é apagado), decrementa usage_count.
CREATE OR REPLACE FUNCTION public.vd_decrement_hashtag_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.vd_hashtags
  SET usage_count = GREATEST(usage_count - 1, 0)
  WHERE id = OLD.hashtag_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_vd_post_hashtags_decrement ON public.vd_post_hashtags;
CREATE TRIGGER trg_vd_post_hashtags_decrement
  AFTER DELETE ON public.vd_post_hashtags
  FOR EACH ROW
  EXECUTE FUNCTION public.vd_decrement_hashtag_usage();

-- ==========================================================================
-- 6. RLS
-- ==========================================================================
ALTER TABLE public.vd_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vd_post_hashtags ENABLE ROW LEVEL SECURITY;

-- Leitura: todo usuário autenticado com premium pode ler (igual ao resto).
-- Anon pode ler também para suportar trending em landing pages públicas
-- no futuro. Não vaza info sensível (é só contagem).
DROP POLICY IF EXISTS vd_hashtags_select_public ON public.vd_hashtags;
CREATE POLICY vd_hashtags_select_public
  ON public.vd_hashtags
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS vd_post_hashtags_select ON public.vd_post_hashtags;
CREATE POLICY vd_post_hashtags_select
  ON public.vd_post_hashtags
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vd_posts vp
      WHERE vp.id = vd_post_hashtags.post_id
        AND vp.deleted_at IS NULL
    )
  );

-- Escrita: só o trigger (SECURITY DEFINER) escreve. Usuários nunca.
-- (Sem policy de INSERT/UPDATE/DELETE para nenhum role.)

-- Service role bypassa RLS de qualquer forma (mas explicita segurança):
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vd_hashtags TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vd_post_hashtags TO service_role;
GRANT SELECT ON public.vd_hashtags TO authenticated, anon;
GRANT SELECT ON public.vd_post_hashtags TO authenticated;

-- ==========================================================================
-- 7. Backfill dos posts existentes
-- ==========================================================================
-- Reexecuta o trigger em todos os posts não-deletados que não sejam repost.
-- Usamos UPDATE no próprio body (sem mudar valor) para disparar o trigger.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT id, body
    FROM public.vd_posts
    WHERE deleted_at IS NULL
      AND kind <> 'repost'
      AND body IS NOT NULL
      AND body ~ '#[a-zA-Z0-9_áéíóúâêôãõüçÁÉÍÓÚÂÊÔÃÕÜÇ]{2,50}'
  LOOP
    -- Trick: touching body triggers the after-update trigger even with same
    -- value because we use "UPDATE OF body" which fires regardless of value.
    UPDATE public.vd_posts SET body = r.body WHERE id = r.id;
  END LOOP;
END $$;
