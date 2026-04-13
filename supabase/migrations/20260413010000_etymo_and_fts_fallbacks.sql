-- Adds embedding + full-text-search infrastructure for etymo_terms, magisterio
-- and patristica so the RAG pipeline can actually use these sources.
--
-- Context: on 2026-04-13 we audited the AI retrieval and found that:
--   * magisterio had 40 rows but 0 embeddings -> vector search returned nothing
--   * patristica had 58 rows but only 10 embeddings -> 48 rows invisible
--   * etymo_terms had 95 rows with rich Greek/Latin content but no embedding
--     column at all, and no code path referenced it
--
-- This migration is the *infrastructure* step. Backfilling the embeddings is
-- handled by a separate admin endpoint (/api/admin/embeddings/backfill).
-- Until the backfill runs, the FTS fallback RPCs below keep the pipeline
-- honest on magisterio/patristica/etymo_terms.
--
-- IMPORTANT: the pgvector extension lives in the `extensions` schema on
-- Supabase, so all vector types/operators must be fully qualified
-- (`extensions.vector`, `extensions.vector_cosine_ops`). Functions are
-- created WITHOUT an explicit search_path override so the default
-- `public, extensions` is picked up by pg_catalog.

-- =========================================================================
-- 1. etymo_terms: add embedding + indexes
-- =========================================================================

ALTER TABLE public.etymo_terms
  ADD COLUMN IF NOT EXISTS embedding extensions.vector(1536);

-- HNSW for fast approximate nearest-neighbor (same strategy as biblia/catecismo).
CREATE INDEX IF NOT EXISTS etymo_terms_embedding_hnsw_idx
  ON public.etymo_terms
  USING hnsw (embedding extensions.vector_cosine_ops);

-- FTS index on the concatenated searchable fields for lexical fallback.
CREATE INDEX IF NOT EXISTS etymo_terms_fts_idx
  ON public.etymo_terms
  USING gin (to_tsvector(
    'portuguese',
    coalesce(term_pt, '') || ' ' ||
    coalesce(term_original, '') || ' ' ||
    coalesce(transliteration, '') || ' ' ||
    coalesce(original_meaning, '') || ' ' ||
    coalesce(modern_difference, '')
  ));

-- =========================================================================
-- 2. magisterio + patristica: ensure FTS indexes exist
-- =========================================================================

CREATE INDEX IF NOT EXISTS magisterio_text_fts_idx
  ON public.magisterio
  USING gin (to_tsvector('portuguese', coalesce(text, '')));

CREATE INDEX IF NOT EXISTS patristica_text_fts_idx
  ON public.patristica
  USING gin (to_tsvector('portuguese', coalesce(text, '')));

-- =========================================================================
-- 3. search_etymo_terms (vector) RPC
-- =========================================================================

CREATE OR REPLACE FUNCTION public.search_etymo_terms(
  query_embedding extensions.vector,
  match_threshold float DEFAULT 0.35,
  match_count integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  term_pt text,
  term_original text,
  original_language text,
  transliteration text,
  original_meaning text,
  modern_difference text,
  examples text[],
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    e.id,
    e.term_pt,
    e.term_original,
    e.original_language,
    e.transliteration,
    e.original_meaning,
    e.modern_difference,
    e.examples,
    (1 - (e.embedding <=> query_embedding))::float AS similarity
  FROM public.etymo_terms e
  WHERE e.embedding IS NOT NULL
    AND (1 - (e.embedding <=> query_embedding)) >= match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.search_etymo_terms(extensions.vector, float, integer)
  TO anon, authenticated, service_role;

-- =========================================================================
-- 4. FTS fallback RPCs — search_*_text
-- =========================================================================
-- Same OR-style tsquery pattern as search_biblia_text: caller's
-- whitespace-separated keywords become `a | b | c` so any match
-- contributes. plainto_tsquery would AND them (too strict for fallback).

CREATE OR REPLACE FUNCTION public.search_etymo_terms_text(
  search_query text,
  match_count integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  term_pt text,
  term_original text,
  original_language text,
  transliteration text,
  original_meaning text,
  modern_difference text,
  examples text[],
  rank real
)
LANGUAGE sql STABLE
AS $$
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
    e.id,
    e.term_pt,
    e.term_original,
    e.original_language,
    e.transliteration,
    e.original_meaning,
    e.modern_difference,
    e.examples,
    ts_rank_cd(
      to_tsvector('portuguese',
        coalesce(e.term_pt, '') || ' ' ||
        coalesce(e.term_original, '') || ' ' ||
        coalesce(e.transliteration, '') || ' ' ||
        coalesce(e.original_meaning, '') || ' ' ||
        coalesce(e.modern_difference, '')),
      q.tsq
    ) AS rank
  FROM public.etymo_terms e, q
  WHERE to_tsvector('portuguese',
      coalesce(e.term_pt, '') || ' ' ||
      coalesce(e.term_original, '') || ' ' ||
      coalesce(e.transliteration, '') || ' ' ||
      coalesce(e.original_meaning, '') || ' ' ||
      coalesce(e.modern_difference, '')
    ) @@ q.tsq
  ORDER BY rank DESC
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.search_etymo_terms_text(text, integer)
  TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.search_magisterio_text(
  search_query text,
  match_count integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  reference text,
  text text,
  document text,
  pope text,
  year integer,
  rank real
)
LANGUAGE sql STABLE
AS $$
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
    m.id,
    m.reference,
    m.text,
    m.document,
    m.pope,
    m.year,
    ts_rank_cd(to_tsvector('portuguese', coalesce(m.text, '')), q.tsq) AS rank
  FROM public.magisterio m, q
  WHERE to_tsvector('portuguese', coalesce(m.text, '')) @@ q.tsq
  ORDER BY rank DESC
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.search_magisterio_text(text, integer)
  TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.search_patristica_text(
  search_query text,
  match_count integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  reference text,
  text text,
  author text,
  work text,
  rank real
)
LANGUAGE sql STABLE
AS $$
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
    p.id,
    p.reference,
    p.text,
    p.author,
    p.work,
    ts_rank_cd(to_tsvector('portuguese', coalesce(p.text, '')), q.tsq) AS rank
  FROM public.patristica p, q
  WHERE to_tsvector('portuguese', coalesce(p.text, '')) @@ q.tsq
  ORDER BY rank DESC
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.search_patristica_text(text, integer)
  TO anon, authenticated, service_role;
