-- Novenas — oração em companhia de um santo por 9 dias.
--
-- Cada registro é uma novena única (um user pode rezar várias novenas
-- ao mesmo santo ao longo do tempo — história preservada).
--
-- dia_atual vai de 1 a 9. completed_at é setado quando dia_atual=9
-- e o usuário marcou como rezado. Nenhum shame se o user pular um
-- dia — cron respeita (não "quebra").
--
-- Doutrinalmente: novena é devoção aprovada (origem: 9 dias entre
-- Ascensão e Pentecostes). Ver docs/copy-catolica.md §1 P3.

begin;

create table if not exists public.novenas (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  santo_id       uuid not null references public.santos(id) on delete cascade,
  iniciada_em    timestamptz not null default now(),
  concluida_em   timestamptz,
  dia_atual      smallint not null default 1 check (dia_atual between 1 and 9),
  progresso      jsonb not null default '[]'::jsonb, -- array de timestamps quando cada dia foi rezado
  disparo_auto   boolean not null default false,     -- true se foi iniciada pelo cron 9 dias antes da festa
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists novenas_user_idx
  on public.novenas (user_id, iniciada_em desc);

create index if not exists novenas_ativas_idx
  on public.novenas (user_id, santo_id)
  where concluida_em is null;

alter table public.novenas enable row level security;

drop policy if exists "novenas user select" on public.novenas;
create policy "novenas user select"
  on public.novenas for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "novenas user insert" on public.novenas;
create policy "novenas user insert"
  on public.novenas for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "novenas user update" on public.novenas;
create policy "novenas user update"
  on public.novenas for update
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "novenas user delete" on public.novenas;
create policy "novenas user delete"
  on public.novenas for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.novenas to authenticated;
grant select, insert, update, delete on public.novenas to service_role;

-- Trigger updated_at
create or replace function public.novenas_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_novenas_updated_at on public.novenas;
create trigger trg_novenas_updated_at
before update on public.novenas
for each row execute function public.novenas_set_updated_at();

comment on table public.novenas is
  'Novenas rezadas pelos usuários. Ver docs/copy-catolica.md — P3 intenção ≠ transação: novena é devoção, não contrato.';

commit;
