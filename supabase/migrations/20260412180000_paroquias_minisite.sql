-- Mini-site da Igreja: capa, perfil, história (blocks), santo, curiosidades,
-- informações úteis e SEO. Também adiciona uma função/opcional para busca por
-- raio geográfico (usando distância haversine em SQL, sem PostGIS).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Novas colunas em paroquias
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.paroquias
  ADD COLUMN IF NOT EXISTS foto_capa_url        text,
  ADD COLUMN IF NOT EXISTS foto_perfil_url      text,
  ADD COLUMN IF NOT EXISTS historia_blocks      jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS santo_nome           text,
  ADD COLUMN IF NOT EXISTS santo_descricao      text,
  ADD COLUMN IF NOT EXISTS santo_imagem_url     text,
  ADD COLUMN IF NOT EXISTS santo_data_festa     text,
  ADD COLUMN IF NOT EXISTS curiosidades         jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS informacoes_uteis    jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS seo_title            text,
  ADD COLUMN IF NOT EXISTS seo_description      text,
  ADD COLUMN IF NOT EXISTS seo_keywords         text;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RPC: igrejas próximas (haversine, sem PostGIS)
--    Retorna as paróquias aprovadas ordenadas por distância até (lat, lng).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.paroquias_nearby(
  p_lat      double precision,
  p_lng      double precision,
  p_radius_km double precision DEFAULT 50,
  p_limit    int DEFAULT 30
)
RETURNS TABLE (
  id uuid,
  nome text,
  tipo_igreja tipo_igreja,
  diocese text,
  cidade text,
  estado text,
  padre_responsavel text,
  foto_url text,
  foto_capa_url text,
  foto_perfil_url text,
  fotos jsonb,
  horarios_missa jsonb,
  horarios_confissao jsonb,
  verificado boolean,
  latitude double precision,
  longitude double precision,
  distancia_km double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id,
    p.nome,
    p.tipo_igreja,
    p.diocese,
    p.cidade,
    p.estado,
    p.padre_responsavel,
    p.foto_url,
    p.foto_capa_url,
    p.foto_perfil_url,
    p.fotos,
    p.horarios_missa,
    p.horarios_confissao,
    p.verificado,
    p.latitude,
    p.longitude,
    (
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(p_lat)) * cos(radians(p.latitude))
          * cos(radians(p.longitude) - radians(p_lng))
          + sin(radians(p_lat)) * sin(radians(p.latitude))
        ))
      )
    ) AS distancia_km
  FROM public.paroquias p
  WHERE p.status = 'aprovada'
    AND p.latitude  IS NOT NULL
    AND p.longitude IS NOT NULL
    AND (
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(p_lat)) * cos(radians(p.latitude))
          * cos(radians(p.longitude) - radians(p_lng))
          + sin(radians(p_lat)) * sin(radians(p.latitude))
        ))
      )
    ) <= p_radius_km
  ORDER BY distancia_km ASC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.paroquias_nearby(double precision, double precision, double precision, int)
  TO anon, authenticated;
