-- Comunidade Veritas — Ajuste da tab "Próximo"
--
-- Remove o filtro "author_user_id <> viewer" do RPC get_nearby_veritas.
-- Motivo: quando só o viewer tem localização aprovada, o feed ficava
-- vazio. Faz mais sentido a tab "Próximo" mostrar tudo na região,
-- incluindo os próprios posts do usuário (comportamento de "descoberta
-- geográfica" em vez de "descoberta de autores").

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
      AND (p_cursor IS NULL OR vp.created_at < p_cursor)
      AND NOT EXISTS (
        SELECT 1 FROM public.vd_blocks b
        WHERE b.blocker_user_id = p_viewer_id
          AND b.blocked_user_id = vp.author_user_id
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.vd_blocks b
        WHERE b.blocker_user_id = vp.author_user_id
          AND b.blocked_user_id = p_viewer_id
      )
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
