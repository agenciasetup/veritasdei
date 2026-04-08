-- Habilitar extensão de vetores
create extension if not exists vector;

-- ─── BÍBLIA ──────────────────────────────────────────────────────────────────
create table if not exists biblia (
  id uuid primary key default gen_random_uuid(),
  book text not null,                    -- ex: "João"
  book_abbr text not null,               -- ex: "Jo"
  chapter integer not null,
  verse integer not null,
  reference text not null,               -- ex: "Jo 11,25"
  text_pt text not null,                 -- tradução portuguesa (Matos Soares 1927)
  text_latin text,                       -- Vulgata latina (opcional)
  testament text not null check (testament in ('AT', 'NT')),
  embedding vector(1536),
  created_at timestamptz default now()
);

create index if not exists biblia_embedding_idx
  on biblia using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ─── CATECISMO ───────────────────────────────────────────────────────────────
create table if not exists catecismo (
  id uuid primary key default gen_random_uuid(),
  paragraph integer not null unique,     -- ex: 988
  section text,                          -- ex: "Os sacramentos da iniciação cristã"
  part text,                             -- ex: "Primeira Parte — A Profissão da Fé"
  text text not null,
  source text not null default 'CIC',    -- Catecismo da Igreja Católica
  embedding vector(1536),
  created_at timestamptz default now()
);

create index if not exists catecismo_embedding_idx
  on catecismo using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ─── MAGISTÉRIO (documentos conciliares, encíclicas) ────────────────────────
create table if not exists magisterio (
  id uuid primary key default gen_random_uuid(),
  document text not null,                -- ex: "Lumen Gentium"
  document_abbr text,                    -- ex: "LG"
  paragraph text,                        -- ex: "49" ou "III,2"
  reference text not null,               -- ex: "LG 49"
  text text not null,
  pope text,                             -- ex: "Paulo VI" (null para documentos conciliares)
  year integer,
  embedding vector(1536),
  created_at timestamptz default now()
);

create index if not exists magisterio_embedding_idx
  on magisterio using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ─── PATRÍSTICA ──────────────────────────────────────────────────────────────
create table if not exists patristica (
  id uuid primary key default gen_random_uuid(),
  author text not null,                  -- ex: "Santo Agostinho"
  author_years text,                     -- ex: "354–430"
  work text not null,                    -- ex: "Confissões"
  chapter text,                          -- ex: "X,27"
  reference text not null,               -- ex: "Santo Agostinho — Confissões, X,27"
  text text not null,
  verified boolean default false,        -- true = revisado por teólogo
  embedding vector(1536),
  created_at timestamptz default now()
);

create index if not exists patristica_embedding_idx
  on patristica using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ─── DICIONÁRIO ETIMOLÓGICO ───────────────────────────────────────────────────
create table if not exists etymo_terms (
  id uuid primary key default gen_random_uuid(),
  term_pt text not null,
  term_original text not null,
  original_language text not null check (original_language in ('grego', 'hebraico', 'latim', 'aramaico')),
  transliteration text,
  original_meaning text not null,
  modern_difference text not null,
  examples text[],                       -- array de referências no corpus
  created_at timestamptz default now()
);

-- ─── CONEXÕES DOUTRINÁRIAS (Mapa de Conexões) ────────────────────────────────
create table if not exists doctrine_links (
  id uuid primary key default gen_random_uuid(),
  topic_from text not null,
  topic_to text not null,
  relation_type text not null check (relation_type in ('fundamenta', 'pressupoe', 'complementa', 'contrasta')),
  strength integer default 3 check (strength between 1 and 5),
  created_at timestamptz default now()
);

-- ─── TEMAS SENSÍVEIS (ativa disclaimer pastoral) ─────────────────────────────
create table if not exists sensitive_topics (
  id uuid primary key default gen_random_uuid(),
  keyword text not null unique,
  category text not null               -- ex: "matrimonial", "consciencia", "moral"
);

-- Inserir temas sensíveis padrão
insert into sensitive_topics (keyword, category) values
  ('nulidade', 'matrimonial'),
  ('divórcio', 'matrimonial'),
  ('separação conjugal', 'matrimonial'),
  ('aborto', 'moral'),
  ('anticoncepção', 'moral'),
  ('homossexualidade', 'moral'),
  ('suicídio', 'consciencia'),
  ('pecado grave', 'consciencia'),
  ('confissão pessoal', 'pastoral'),
  ('excomunhão', 'pastoral')
on conflict (keyword) do nothing;

-- ─── FUNÇÃO DE BUSCA SEMÂNTICA ────────────────────────────────────────────────
-- Busca na Bíblia
create or replace function search_biblia(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 5
)
returns table (
  id uuid, reference text, text_pt text, book text, chapter integer, verse integer, similarity float
)
language sql stable
as $$
  select id, reference, text_pt, book, chapter, verse,
    1 - (embedding <=> query_embedding) as similarity
  from biblia
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- Busca no Catecismo
create or replace function search_catecismo(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 4
)
returns table (
  id uuid, reference text, text text, paragraph integer, section text, similarity float
)
language sql stable
as $$
  select id, 'CIC § ' || paragraph::text as reference, text, paragraph, section,
    1 - (embedding <=> query_embedding) as similarity
  from catecismo
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- Busca no Magistério
create or replace function search_magisterio(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 3
)
returns table (
  id uuid, reference text, text text, document text, similarity float
)
language sql stable
as $$
  select id, reference, text, document,
    1 - (embedding <=> query_embedding) as similarity
  from magisterio
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- Busca na Patrística
create or replace function search_patristica(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 4
)
returns table (
  id uuid, reference text, text text, author text, work text, verified boolean, similarity float
)
language sql stable
as $$
  select id, reference, text, author, work, verified,
    1 - (embedding <=> query_embedding) as similarity
  from patristica
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
