-- Educa — variantes mobile e reposicionamento de imagens.
--
-- Antes:
--   - educa_banners.image_url  (única, web e mobile usavam a mesma)
--   - content_groups.cover_url (única)
--   - trails.cover_url         (única)
--
-- Banner em 21:9 desktop fica ilegível ao ser recortado pra 9:16 mobile:
-- o título migra pra fora do safe area e o foco da imagem perde sentido.
-- Resolvemos guardando uma variante mobile dedicada, mais um par de
-- `image_position` / `cover_position` (object-position armazenado como
-- "50% 30%") pra ajustar o foco sem reencodar o asset.

-- ── educa_banners ───────────────────────────────────────────────────────────
ALTER TABLE public.educa_banners
  ADD COLUMN IF NOT EXISTS image_url_mobile text,
  ADD COLUMN IF NOT EXISTS image_position   text,
  ADD COLUMN IF NOT EXISTS image_position_mobile text;

COMMENT ON COLUMN public.educa_banners.image_url_mobile IS
  'URL da variante mobile (9:16 ou 4:5). Quando NULL, mobile usa image_url com object-position.';
COMMENT ON COLUMN public.educa_banners.image_position IS
  'object-position desktop como "x% y%". NULL = "50% 50%".';
COMMENT ON COLUMN public.educa_banners.image_position_mobile IS
  'object-position mobile como "x% y%". NULL = "50% 50%".';

-- ── content_groups (pilares) ────────────────────────────────────────────────
ALTER TABLE public.content_groups
  ADD COLUMN IF NOT EXISTS cover_url_mobile text,
  ADD COLUMN IF NOT EXISTS cover_position   text,
  ADD COLUMN IF NOT EXISTS cover_position_mobile text;

-- ── content_topics ──────────────────────────────────────────────────────────
ALTER TABLE public.content_topics
  ADD COLUMN IF NOT EXISTS cover_url_mobile text,
  ADD COLUMN IF NOT EXISTS cover_position   text,
  ADD COLUMN IF NOT EXISTS cover_position_mobile text;

-- ── content_subtopics ───────────────────────────────────────────────────────
ALTER TABLE public.content_subtopics
  ADD COLUMN IF NOT EXISTS cover_url_mobile text,
  ADD COLUMN IF NOT EXISTS cover_position   text,
  ADD COLUMN IF NOT EXISTS cover_position_mobile text;

-- ── trails ──────────────────────────────────────────────────────────────────
ALTER TABLE public.trails
  ADD COLUMN IF NOT EXISTS cover_url_mobile text,
  ADD COLUMN IF NOT EXISTS cover_position   text,
  ADD COLUMN IF NOT EXISTS cover_position_mobile text;

-- ── RPC: totais de subtópicos por pilar (Veritas Educa) ────────────────────
-- Antes do hook `useMyStudyRecent` puxava o JOIN aninhado completo
-- (content_groups → content_topics → content_subtopics) só pra contar
-- subtópicos por pilar. Devolvia o produto cartesiano e somava em JS.
-- Substituído por uma RPC com COUNT(*) agregada — uma linha por pilar,
-- ordem de magnitude mais rápido.
CREATE OR REPLACE FUNCTION public.educa_pillar_totals()
RETURNS TABLE (slug text, title text, total bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    g.slug,
    g.title,
    COUNT(s.id) AS total
  FROM public.content_groups g
  LEFT JOIN public.content_topics t
    ON t.group_id = g.id AND COALESCE(t.visible, true) = true
  LEFT JOIN public.content_subtopics s
    ON s.topic_id = t.id AND COALESCE(s.visible, true) = true
  WHERE COALESCE(g.visible, true) = true
  GROUP BY g.slug, g.title, g.sort_order
  ORDER BY g.sort_order NULLS LAST, g.title;
$$;

GRANT EXECUTE ON FUNCTION public.educa_pillar_totals() TO anon, authenticated;
