-- Sprint 1 (parte 3) — Esconder coluna `embedding` do REST público.
--
-- Column-level REVOKE não funciona quando existe table-level GRANT: Postgres
-- OR-combina. Padrão: REVOKE table + GRANT apenas colunas desejadas.
--
-- Motivação: vetores de 1.536 floats custaram tempo e dinheiro (OpenAI
-- embeddings). Expor no REST anon/authenticated dá ao competidor um download
-- literal do corpus embedado — ~60 MB prontos.
--
-- Matching semântico continua via RPC server-side com service_role.

-- =============================================================================
-- biblia
-- =============================================================================
REVOKE SELECT ON public.biblia FROM anon, authenticated;
GRANT  SELECT (id, book, book_abbr, chapter, verse, reference, text_pt, text_latin, testament, created_at)
       ON public.biblia TO anon, authenticated;

-- =============================================================================
-- catecismo
-- =============================================================================
REVOKE SELECT ON public.catecismo FROM anon, authenticated;
GRANT  SELECT (id, paragraph, section, part, text, source, created_at)
       ON public.catecismo TO anon, authenticated;

-- =============================================================================
-- patristica
-- =============================================================================
REVOKE SELECT ON public.patristica FROM anon, authenticated;
GRANT  SELECT (id, author, author_years, work, chapter, reference, text, verified, created_at)
       ON public.patristica TO anon, authenticated;

-- =============================================================================
-- magisterio
-- =============================================================================
REVOKE SELECT ON public.magisterio FROM anon, authenticated;
GRANT  SELECT (id, document, document_abbr, paragraph, reference, text, pope, year, created_at)
       ON public.magisterio TO anon, authenticated;
