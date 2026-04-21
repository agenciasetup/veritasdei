create table if not exists public.santos (
  id uuid primary key default gen_random_uuid(),
  gcatholic_uid text not null unique,
  gcatholic_person_id bigint,
  gcatholic_path text not null,
  gcatholic_anchor_id text,
  gcatholic_url text not null,
  pagina_tipo text not null,
  titulo text not null check (titulo in ('Saint', 'Blessed')),
  tipo_culto text not null check (tipo_culto in ('santo', 'beato')),
  nome text not null,
  nomes_alternativos text[] not null default '{}',
  nome_secular text,
  pais_referencia text,
  nascimento_texto text,
  nascimento_data date,
  nascimento_local text,
  nascimento_pais text,
  morte_texto text,
  morte_data date,
  morte_local text,
  morte_pais text,
  festa_texto text,
  beatificacao_texto text,
  beatificacao_data date,
  beatificacao_local text,
  beatificacao_pais text,
  beatificado_por text,
  canonizacao_texto text,
  canonizacao_data date,
  canonizacao_local text,
  canonizacao_pais text,
  canonizado_por text,
  martir boolean not null default false,
  descricao text,
  detalhes jsonb not null default '{}'::jsonb,
  scraped_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.santos is
  'Catalogo de santos e beatos extraido da secao de santos do GCatholic, com campos principais e detalhes em JSONB.';

comment on column public.santos.gcatholic_uid is
  'Identificador estavel do registro no GCatholic (preferencialmente /p/<id>, com fallback para o path canonico).';

comment on column public.santos.detalhes is
  'Campos extras, alias, paragrafos e metadados de origem preservados do GCatholic.';

create index if not exists santos_tipo_nome_idx
  on public.santos (tipo_culto, nome);

create index if not exists santos_gcatholic_person_id_idx
  on public.santos (gcatholic_person_id);

create index if not exists santos_canonizacao_data_idx
  on public.santos (canonizacao_data);

create index if not exists santos_beatificacao_data_idx
  on public.santos (beatificacao_data);

create index if not exists santos_morte_data_idx
  on public.santos (morte_data);

create index if not exists santos_nomes_alternativos_gin_idx
  on public.santos
  using gin (nomes_alternativos);

create or replace function public.santos_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_santos_updated_at on public.santos;
create trigger trg_santos_updated_at
before update on public.santos
for each row execute function public.santos_set_updated_at();

alter table public.santos enable row level security;

drop policy if exists "santos public read" on public.santos;
create policy "santos public read"
on public.santos
for select
to anon, authenticated
using (true);

grant select on public.santos to anon, authenticated;
grant select, insert, update, delete on public.santos to service_role;
