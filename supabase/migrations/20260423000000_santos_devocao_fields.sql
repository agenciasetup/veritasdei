-- Sistema de devoção aos santos — campos novos em public.santos.
--
-- Adiciona: slug amigável, ranking de popularidade (top 30), patronatos,
-- invocação tradicional, oração curta e biografia curta em pt-BR, imagem
-- de capa, FK denormalizada para oração principal e search_tsv FTS.
--
-- Também expande tipo_culto/titulo para aceitar registros manuais
-- (marianos, arcanjos, santos brasileiros sem GCatholic).

begin;

create extension if not exists unaccent;

-- 1. Colunas novas --------------------------------------------------------
alter table public.santos
  add column if not exists slug                     text,
  add column if not exists popularidade_rank        smallint,
  add column if not exists patronatos               text[] not null default '{}'::text[],
  add column if not exists invocacao                text,
  add column if not exists oracao_curta             text,
  add column if not exists biografia_curta          text,
  add column if not exists imagem_url               text,
  add column if not exists imagem_storage_path      text,
  add column if not exists imagem_atualizada_em     timestamptz,
  add column if not exists oracao_principal_item_id uuid,
  add column if not exists search_tsv               tsvector;

-- FK para content_items (soft — content_items existe no mesmo banco)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'santos_oracao_principal_fk'
      and table_name = 'santos'
  ) then
    alter table public.santos
      add constraint santos_oracao_principal_fk
      foreign key (oracao_principal_item_id)
      references public.content_items(id)
      on delete set null;
  end if;
end $$;

comment on column public.santos.slug is
  'URL-amigável único (ex.: sao-francisco-de-assis). Backfill determinístico em migration posterior.';
comment on column public.santos.popularidade_rank is
  'Rank 1..30 para os santos mais conhecidos do catolicismo pt-BR. Null para os demais.';
comment on column public.santos.patronatos is
  'Lista de patronatos (ex.: {animais, ecologia, Itália}). Usada em chips na UI.';
comment on column public.santos.invocacao is
  'Invocação tradicional (ex.: "São Francisco, rogai por nós"). Fallback procedural se null.';
comment on column public.santos.oracao_curta is
  'Oração de devoção em pt-BR (3-5 linhas). Curada manualmente nos top 30.';
comment on column public.santos.biografia_curta is
  'Biografia em pt-BR (2-3 parágrafos). Curada manualmente nos top 30.';
comment on column public.santos.imagem_url is
  'URL pública da imagem de capa (bucket santos-imagens). Mesma imagem para todos os devotos.';
comment on column public.santos.imagem_storage_path is
  'Path interno no bucket, geralmente "{slug}.webp".';
comment on column public.santos.oracao_principal_item_id is
  'Denormalização do tipo=devocao_principal em santo_oracoes para join rápido.';

-- 2. Expandir check constraints ------------------------------------------
-- Permite registros manuais (marianos, arcanjos, títulos de Cristo).
alter table public.santos drop constraint if exists santos_tipo_culto_check;
alter table public.santos
  add constraint santos_tipo_culto_check
  check (tipo_culto in ('santo', 'beato', 'mariano', 'arcanjo', 'titulo'));

alter table public.santos drop constraint if exists santos_titulo_check;
alter table public.santos
  add constraint santos_titulo_check
  check (titulo in ('Saint', 'Blessed', 'Our Lady', 'Archangel', 'Title'));

-- 3. Relaxar NOT NULL em campos GCatholic para manuais --------------------
alter table public.santos alter column gcatholic_path drop not null;
alter table public.santos alter column gcatholic_url drop not null;

-- 4. Índices --------------------------------------------------------------
create unique index if not exists santos_slug_uk
  on public.santos (slug)
  where slug is not null;

create index if not exists santos_popularidade_rank_idx
  on public.santos (popularidade_rank)
  where popularidade_rank is not null;

create index if not exists santos_patronatos_gin
  on public.santos using gin (patronatos);

create index if not exists santos_search_tsv_idx
  on public.santos using gin (search_tsv);

-- 5. Função slug determinística ------------------------------------------
create or replace function public.santos_slugify(input text)
returns text
language sql
immutable
as $$
  select nullif(
    regexp_replace(
      regexp_replace(
        lower(unaccent(coalesce(input, ''))),
        '[^a-z0-9]+', '-', 'g'
      ),
      '(^-+|-+$)', '', 'g'
    ),
    ''
  );
$$;

comment on function public.santos_slugify(text) is
  'Converte nome em slug URL-amigável: unaccent + lower + replace não-alfanumérico por hífen.';

-- 6. Trigger FTS ----------------------------------------------------------
create or replace function public.santos_update_search_tsv()
returns trigger
language plpgsql
as $$
begin
  new.search_tsv :=
    setweight(to_tsvector('portuguese', unaccent(coalesce(new.nome, ''))), 'A') ||
    setweight(to_tsvector('portuguese', unaccent(coalesce(new.invocacao, ''))), 'A') ||
    setweight(
      to_tsvector(
        'portuguese',
        unaccent(array_to_string(coalesce(new.nomes_alternativos, '{}'::text[]), ' '))
      ),
      'B'
    ) ||
    setweight(
      to_tsvector(
        'portuguese',
        unaccent(array_to_string(coalesce(new.patronatos, '{}'::text[]), ' '))
      ),
      'B'
    ) ||
    setweight(to_tsvector('portuguese', unaccent(coalesce(new.biografia_curta, ''))), 'C') ||
    setweight(to_tsvector('portuguese', unaccent(coalesce(new.descricao, ''))), 'C');
  return new;
end;
$$;

drop trigger if exists santos_search_tsv_trigger on public.santos;
create trigger santos_search_tsv_trigger
  before insert or update of
    nome, invocacao, nomes_alternativos, patronatos, biografia_curta, descricao
  on public.santos
  for each row execute function public.santos_update_search_tsv();

-- Backfill search_tsv para registros existentes
update public.santos set nome = nome;

commit;
