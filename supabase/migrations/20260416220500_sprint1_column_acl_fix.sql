-- Sprint 1 (parte 2) — Fix column-level ACL para paroquias e paroquia_posts.
--
-- O migration anterior (20260416220000) fez REVOKE SELECT em colunas
-- específicas, mas isso é ineficaz quando a role tem GRANT SELECT
-- table-level: Postgres aditivo devolve a tabela inteira.
--
-- Correção: REVOKE SELECT no nível da tabela + GRANT SELECT apenas das
-- colunas públicas. Quem precisa de tudo (authenticated) mantém o GRANT
-- table-level.

-- =============================================================================
-- paroquias — anon vê apenas colunas não-sensíveis
-- =============================================================================

REVOKE SELECT ON public.paroquias FROM anon;

GRANT SELECT (
  id,
  nome,
  tipo_igreja,
  diocese,
  endereco,
  rua,
  numero,
  bairro,
  complemento,
  cidade,
  estado,
  pais,
  cep,
  latitude,
  longitude,
  horarios_missa,
  horarios_confissao,
  padre_responsavel,
  telefone,
  foto_url,
  fotos,
  foto_capa_url,
  foto_perfil_url,
  instagram,
  facebook,
  site,
  informacoes_extras,
  historia_blocks,
  santo_nome,
  santo_descricao,
  santo_imagem_url,
  santo_data_festa,
  curiosidades,
  informacoes_uteis,
  seo_title,
  seo_description,
  seo_keywords,
  status,
  verificado,
  verificado_em,
  created_at,
  updated_at
) ON public.paroquias TO anon;

-- Authenticated continua com SELECT table-level completo.
-- (Policy RLS paroquias_select já filtra por status='aprovada' para não-donos).

-- =============================================================================
-- paroquia_posts — anon não vê author_user_id
-- =============================================================================

REVOKE SELECT ON public.paroquia_posts FROM anon;

GRANT SELECT (
  id,
  paroquia_id,
  titulo,
  conteudo,
  imagem_url,
  published_at,
  created_at,
  updated_at
) ON public.paroquia_posts TO anon;
