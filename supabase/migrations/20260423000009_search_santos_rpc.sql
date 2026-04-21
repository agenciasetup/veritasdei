-- RPC search_santos — busca FTS com rank, tolerante a acentos via unaccent.
--
-- Parâmetros:
--   q           — termo de busca (min 2 chars)
--   max_results — default 20, cap em 50
--
-- Ordena por rank FTS desc, popularidade_rank asc (top 30 primeiro em empate).

begin;

create or replace function public.search_santos(q text, max_results int default 20)
returns table(
  id uuid,
  slug text,
  nome text,
  invocacao text,
  patronatos text[],
  imagem_url text,
  popularidade_rank smallint,
  festa_texto text,
  tipo_culto text,
  rank real
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    s.id,
    s.slug,
    s.nome,
    s.invocacao,
    s.patronatos,
    s.imagem_url,
    s.popularidade_rank,
    s.festa_texto,
    s.tipo_culto,
    ts_rank(s.search_tsv, websearch_to_tsquery('portuguese', extensions.unaccent(q))) as rank
  from public.santos s
  where s.search_tsv @@ websearch_to_tsquery('portuguese', extensions.unaccent(q))
    and s.slug is not null
  order by rank desc, s.popularidade_rank asc nulls last, s.nome asc
  limit least(coalesce(max_results, 20), 50);
$$;

grant execute on function public.search_santos(text, int) to anon, authenticated;

commit;
