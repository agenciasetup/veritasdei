-- Adds the missing full-text-search RPC function for Bible keyword search.
-- The RAG pipeline in src/lib/rag/search.ts calls this via
-- `supabase.rpc('search_biblia_text', { search_query, match_count })` as
-- a fast fallback when the vector search does not return good results.
-- Previously the function did not exist and the call silently fell through
-- to a pure ILIKE search, which was the main cause of "nonsense verses"
-- appearing in responses (ILIKE matches single words regardless of context).
--
-- This implementation uses PostgreSQL's Portuguese full-text configuration
-- with ts_rank_cd scoring so results are ranked by lexical relevance.

-- Ensure the FTS GIN index exists on biblia.text_pt (idempotent).
CREATE INDEX IF NOT EXISTS biblia_text_pt_fts_idx
  ON biblia
  USING gin (to_tsvector('portuguese', text_pt));

CREATE OR REPLACE FUNCTION public.search_biblia_text(
  search_query text,
  match_count integer DEFAULT 8
)
RETURNS TABLE (
  id uuid,
  reference text,
  text_pt text,
  book text,
  chapter integer,
  verse integer,
  testament text,
  rank real
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Build a permissive OR-query from the caller's whitespace-separated
  -- keywords so any match contributes to ranking (plainto_tsquery would
  -- AND them, which is too strict for a fallback).
  WITH q AS (
    SELECT to_tsquery(
      'portuguese',
      regexp_replace(
        trim(regexp_replace(search_query, '[^[:alnum:][:space:]áàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ]', ' ', 'g')),
        '\s+', ' | ', 'g'
      )
    ) AS tsq
  )
  SELECT
    b.id,
    b.reference,
    b.text_pt,
    b.book,
    b.chapter,
    b.verse,
    b.testament,
    ts_rank_cd(to_tsvector('portuguese', b.text_pt), q.tsq) AS rank
  FROM biblia b, q
  WHERE to_tsvector('portuguese', b.text_pt) @@ q.tsq
  ORDER BY rank DESC
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.search_biblia_text(text, integer) TO anon, authenticated, service_role;
