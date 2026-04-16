-- Sprint 1 — RLS Lockdown (Security Audit C1, C6, C7, M9 + corpus poisoning)
--
-- Auditoria revelou que 11 tabelas de conteúdo/referência estavam:
--   • Sem RLS habilitada
--   • Com GRANT INSERT/UPDATE/DELETE para anon
-- → Qualquer pessoa podia reescrever Bíblia, catecismo, corpus RAG (ai_knowledge_base)
--   e envenenar as respostas da IA.
--
-- Este migration:
--   1. Revoga escrita em todas as tabelas de conteúdo para anon e authenticated.
--   2. Habilita RLS em todas (defense in depth).
--   3. Policies de SELECT adequadas por tabela.
--   4. Esconde coluna embedding do REST público.
--   5. Esconde PII (owner_user_id, cnpj, email, author_user_id) do anon em
--      paroquias / paroquia_posts.
--
-- Idempotente: pode rodar múltiplas vezes sem efeito colateral.

-- =============================================================================
-- 1. Tabelas de conteúdo read-only (lidas pelo app, escritas só por ingest)
-- =============================================================================
--
-- Para estas tabelas:
--   • anon/authenticated: só SELECT (conteúdo público), nada de write.
--   • service_role: mantém tudo (scripts de ingest).

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'biblia',
    'catecismo',
    'patristica',
    'magisterio',
    'doctrine_links',
    'etymo_terms',
    'sacramentos_ref',
    'verbum_canonical_entities',
    'verbum_typology_registry'
  ] LOOP
    IF EXISTS (SELECT 1 FROM pg_class c
               JOIN pg_namespace n ON n.oid=c.relnamespace
               WHERE n.nspname='public' AND c.relname=t AND c.relkind='r') THEN
      -- Habilita RLS
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      -- Revoga escrita
      EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.%I FROM anon, authenticated', t);
      -- Garante SELECT público via policy (drop + create para idempotência)
      EXECUTE format('DROP POLICY IF EXISTS "%I_public_read" ON public.%I', t, t);
      EXECUTE format('CREATE POLICY "%I_public_read" ON public.%I FOR SELECT USING (true)', t, t);
    END IF;
  END LOOP;
END $$;


-- =============================================================================
-- 2. ai_knowledge_base — authenticated only, sem escrita pelo app
-- =============================================================================

ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Remove policies antigas caso existam (nomes variados já vistos em produção)
DROP POLICY IF EXISTS "Public read ai_knowledge_base"    ON public.ai_knowledge_base;
DROP POLICY IF EXISTS "public_read_ai_knowledge_base"    ON public.ai_knowledge_base;
DROP POLICY IF EXISTS "ai_knowledge_base_select_all"     ON public.ai_knowledge_base;
DROP POLICY IF EXISTS "Allow public read"                ON public.ai_knowledge_base;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.ai_knowledge_base;
DROP POLICY IF EXISTS "ai_kb_read"                       ON public.ai_knowledge_base;
DROP POLICY IF EXISTS "ai_kb_authenticated_read_active"  ON public.ai_knowledge_base;

-- Authenticated lê apenas rows ativas (admins leem tudo via service_role).
CREATE POLICY "ai_kb_authenticated_read_active"
  ON public.ai_knowledge_base
  FOR SELECT TO authenticated
  USING (status = 'active');

-- Sem SELECT / INSERT / UPDATE / DELETE para anon.
REVOKE ALL ON public.ai_knowledge_base FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.ai_knowledge_base FROM authenticated;


-- =============================================================================
-- 3. sensitive_topics — dados internos do sistema, não público
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
             WHERE n.nspname='public' AND c.relname='sensitive_topics') THEN
    EXECUTE 'ALTER TABLE public.sensitive_topics ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON public.sensitive_topics FROM anon';
    EXECUTE 'REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.sensitive_topics FROM authenticated';
    EXECUTE 'DROP POLICY IF EXISTS "sensitive_topics_authed_read" ON public.sensitive_topics';
    EXECUTE 'CREATE POLICY "sensitive_topics_authed_read" ON public.sensitive_topics
             FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;


-- =============================================================================
-- 4. Coluna embedding — esconder do REST público
-- =============================================================================
--
-- Match semântico é feito server-side via RPC com service_role. Não há razão
-- para exportar vetores de 1536 floats no REST público.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['biblia','catecismo','patristica','magisterio'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name=t
                 AND column_name='embedding') THEN
      EXECUTE format('REVOKE SELECT (embedding) ON public.%I FROM anon, authenticated', t);
    END IF;
  END LOOP;
END $$;


-- =============================================================================
-- 5. paroquias — column-level REVOKE de PII para anon
-- =============================================================================
--
-- Anon continua lendo nome, endereço, fotos, horários (necessário para landing
-- pública). Mas perde acesso a owner_user_id, cnpj, email, etc.
-- Authenticated mantém tudo (dashboard admin + detecção "minha paróquia").

DO $$
DECLARE
  col text;
BEGIN
  FOREACH col IN ARRAY ARRAY[
    'owner_user_id',
    'criado_por',
    'aprovado_por',
    'cnpj',
    'email',
    'verificacao_documento_path',
    'verificacao_notas',
    'verificacao_solicitada_em'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='paroquias'
                 AND column_name=col) THEN
      EXECUTE format('REVOKE SELECT (%I) ON public.paroquias FROM anon', col);
    END IF;
  END LOOP;
END $$;


-- =============================================================================
-- 6. paroquia_posts — esconder author_user_id do anon
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='paroquia_posts'
               AND column_name='author_user_id') THEN
    EXECUTE 'REVOKE SELECT (author_user_id) ON public.paroquia_posts FROM anon';
  END IF;
END $$;


-- =============================================================================
-- 7. Sanity check — listar tabelas públicas sem RLS (para auditoria futura)
-- =============================================================================
--
-- Roda como NOTICE para ficar visível no log da migration. Se aparecer alguma
-- tabela aqui, é sinal de que uma nova tabela foi criada sem RLS e precisa
-- revisão.
DO $$
DECLARE
  t text;
  offenders text[] := ARRAY[]::text[];
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity=false
    ORDER BY c.relname
  LOOP
    offenders := offenders || t;
  END LOOP;
  IF array_length(offenders, 1) > 0 THEN
    RAISE NOTICE '[sprint1 audit] Tables still without RLS: %', offenders;
  ELSE
    RAISE NOTICE '[sprint1 audit] All public tables have RLS enabled. ✓';
  END IF;
END $$;
