-- Comunidade Veritas — Sprint 3.3: trending hashtags
--
-- RPC que retorna hashtags em alta nos últimos N dias. "Alta" combina:
--   - uso recente (last_used_at)
--   - frequência (usage_count no período)
--   - score simples com decay exponencial
--
-- Usada na home da comunidade (seção "Em alta") e na página de busca
-- (quando query está vazia).

CREATE OR REPLACE FUNCTION public.get_trending_hashtags(
  window_days int DEFAULT 7,
  page_size int DEFAULT 10
)
RETURNS TABLE (
  slug text,
  display text,
  usage_count bigint,
  recent_usage bigint,
  last_used_at timestamptz,
  score double precision
)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit int := LEAST(GREATEST(page_size, 1), 30);
  v_days int := LEAST(GREATEST(window_days, 1), 30);
  v_since timestamptz := now() - make_interval(days => v_days);
BEGIN
  RETURN QUERY
    WITH recent AS (
      SELECT
        ph.hashtag_id,
        COUNT(*) AS recent_count,
        MAX(ph.created_at) AS last_recent_use
      FROM public.vd_post_hashtags ph
      JOIN public.vd_posts vp ON vp.id = ph.post_id
      WHERE ph.created_at >= v_since
        AND vp.deleted_at IS NULL
      GROUP BY ph.hashtag_id
    )
    SELECT
      h.slug,
      h.display,
      h.usage_count,
      COALESCE(r.recent_count, 0) AS recent_usage,
      h.last_used_at,
      -- Score: uso recente pesa mais que uso total. Decay por hora.
      (
        COALESCE(r.recent_count, 0) * 4.0
        + LEAST(h.usage_count, 1000) * 0.1
      ) * exp(
        -GREATEST(
          EXTRACT(EPOCH FROM (now() - COALESCE(r.last_recent_use, h.last_used_at, now()))) / 3600.0,
          0
        ) / (24.0 * v_days)
      )::double precision AS score
    FROM public.vd_hashtags h
    LEFT JOIN recent r ON r.hashtag_id = h.id
    WHERE h.usage_count > 0
      AND (r.recent_count > 0 OR h.last_used_at >= v_since)
    ORDER BY score DESC, h.usage_count DESC
    LIMIT v_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_trending_hashtags(int, int) TO anon, authenticated, service_role;
