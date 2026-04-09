-- =============================================================
-- Veritas Dei - Database Setup & Performance Optimization
-- Execute this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================

-- 1. Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. HNSW index on biblia embeddings (critical for performance)
-- Without this, vector searches on 35K+ rows will timeout
CREATE INDEX IF NOT EXISTS biblia_embedding_hnsw_idx
  ON biblia
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 3. HNSW index on catecismo embeddings
CREATE INDEX IF NOT EXISTS catecismo_embedding_hnsw_idx
  ON catecismo
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 4. HNSW index on patristica embeddings
CREATE INDEX IF NOT EXISTS patristica_embedding_hnsw_idx
  ON patristica
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 5. HNSW index on magisterio embeddings
CREATE INDEX IF NOT EXISTS magisterio_embedding_hnsw_idx
  ON magisterio
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 6. Full-text search index on biblia for keyword fallback
ALTER TABLE biblia ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (to_tsvector('portuguese', coalesce(text_pt, ''))) STORED;

CREATE INDEX IF NOT EXISTS biblia_fts_idx ON biblia USING gin (fts);

-- 7. B-tree indexes for common filters
CREATE INDEX IF NOT EXISTS biblia_book_idx ON biblia (book);
CREATE INDEX IF NOT EXISTS biblia_testament_idx ON biblia (testament);
CREATE INDEX IF NOT EXISTS biblia_book_abbr_idx ON biblia (book_abbr);

-- 8. Optimized search_biblia function with index hint
CREATE OR REPLACE FUNCTION search_biblia(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.45,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  reference text,
  text_pt text,
  book text,
  chapter int,
  verse int,
  testament text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    b.id,
    b.reference,
    b.text_pt,
    b.book,
    b.chapter,
    b.verse,
    b.testament,
    1 - (b.embedding <=> query_embedding) AS similarity
  FROM biblia b
  WHERE 1 - (b.embedding <=> query_embedding) > match_threshold
  ORDER BY b.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 9. New: Full-text search function for keyword fallback
CREATE OR REPLACE FUNCTION search_biblia_text(
  search_query text,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  reference text,
  text_pt text,
  book text,
  chapter int,
  verse int,
  testament text,
  rank float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    b.id,
    b.reference,
    b.text_pt,
    b.book,
    b.chapter,
    b.verse,
    b.testament,
    ts_rank(b.fts, plainto_tsquery('portuguese', search_query)) AS rank
  FROM biblia b
  WHERE b.fts @@ plainto_tsquery('portuguese', search_query)
  ORDER BY rank DESC
  LIMIT match_count;
$$;

-- 10. New: Filtered Bible search (by book or testament)
CREATE OR REPLACE FUNCTION search_biblia_filtered(
  query_embedding vector(1536),
  filter_testament text DEFAULT NULL,
  filter_books text[] DEFAULT NULL,
  match_threshold float DEFAULT 0.40,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  reference text,
  text_pt text,
  book text,
  chapter int,
  verse int,
  testament text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    b.id,
    b.reference,
    b.text_pt,
    b.book,
    b.chapter,
    b.verse,
    b.testament,
    1 - (b.embedding <=> query_embedding) AS similarity
  FROM biblia b
  WHERE
    (filter_testament IS NULL OR b.testament = filter_testament)
    AND (filter_books IS NULL OR b.book = ANY(filter_books))
    AND 1 - (b.embedding <=> query_embedding) > match_threshold
  ORDER BY b.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 11. Ensure RLS policies allow anon reads on all content tables
ALTER TABLE biblia ENABLE ROW LEVEL SECURITY;
ALTER TABLE catecismo ENABLE ROW LEVEL SECURITY;
ALTER TABLE patristica ENABLE ROW LEVEL SECURITY;
ALTER TABLE magisterio ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'biblia' AND policyname = 'Allow public read biblia') THEN
    CREATE POLICY "Allow public read biblia" ON biblia FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'catecismo' AND policyname = 'Allow public read catecismo') THEN
    CREATE POLICY "Allow public read catecismo" ON catecismo FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patristica' AND policyname = 'Allow public read patristica') THEN
    CREATE POLICY "Allow public read patristica" ON patristica FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'magisterio' AND policyname = 'Allow public read magisterio') THEN
    CREATE POLICY "Allow public read magisterio" ON magisterio FOR SELECT USING (true);
  END IF;
END $$;

-- Grant execute on search functions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION search_biblia TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_biblia_text TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_biblia_filtered TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_catecismo TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_patristica TO anon, authenticated;

-- Done! The HNSW indexes may take a few minutes to build on 35K+ rows.
-- After running this, the vector search should respond in <1 second.
