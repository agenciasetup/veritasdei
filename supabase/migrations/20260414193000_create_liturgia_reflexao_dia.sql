create table if not exists public.liturgia_reflexao_dia (
  data date primary key,
  status text not null default 'generating'
    check (status in ('generating','ready','error')),
  titulo_liturgia text,
  tempo_liturgico text,
  modelo text,
  prompt_version integer not null default 1,
  reflexao jsonb,
  generated_at timestamptz,
  lock_expires_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.liturgia_reflexao_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_liturgia_reflexao_updated_at on public.liturgia_reflexao_dia;
create trigger trg_liturgia_reflexao_updated_at
before update on public.liturgia_reflexao_dia
for each row execute function public.liturgia_reflexao_set_updated_at();

alter table public.liturgia_reflexao_dia enable row level security;

drop policy if exists "liturgia_reflexao public read ready" on public.liturgia_reflexao_dia;
create policy "liturgia_reflexao public read ready"
on public.liturgia_reflexao_dia
for select
to public
using (status = 'ready');

create index if not exists idx_liturgia_reflexao_status_data
  on public.liturgia_reflexao_dia (status, data desc);
