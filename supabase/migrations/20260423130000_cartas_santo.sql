-- Cartas ao santo — espaço de escrita contemplativa privada.
--
-- Inspiração: Santa Teresinha do Menino Jesus escrevia literalmente
-- cartas a Jesus e aos santos (tradição carmelita). Este recurso é
-- privado (RLS per-user) — sem incentivo a postar, sem analytics.
--
-- Doutrinalmente seguro: é diálogo unilateral de devoção (não
-- canalização, não resposta simulada por IA). Ver docs/copy-catolica.md
-- §2 — proibido "canalizar" ou "espírito de X".

begin;

create table if not exists public.cartas_santo (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  santo_id    uuid references public.santos(id) on delete set null,
  texto       text not null check (length(texto) between 10 and 4000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists cartas_santo_user_idx
  on public.cartas_santo (user_id, created_at desc);

alter table public.cartas_santo enable row level security;

drop policy if exists "cartas_santo user select" on public.cartas_santo;
create policy "cartas_santo user select"
  on public.cartas_santo for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "cartas_santo user insert" on public.cartas_santo;
create policy "cartas_santo user insert"
  on public.cartas_santo for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "cartas_santo user update" on public.cartas_santo;
create policy "cartas_santo user update"
  on public.cartas_santo for update to authenticated
  using (auth.uid() = user_id);

drop policy if exists "cartas_santo user delete" on public.cartas_santo;
create policy "cartas_santo user delete"
  on public.cartas_santo for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.cartas_santo to authenticated;
grant select, insert, update, delete on public.cartas_santo to service_role;

create or replace function public.cartas_santo_set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_cartas_santo_updated_at on public.cartas_santo;
create trigger trg_cartas_santo_updated_at
before update on public.cartas_santo
for each row execute function public.cartas_santo_set_updated_at();

comment on table public.cartas_santo is
  'Cartas privadas escritas pelo usuário a um santo (tradição carmelita — Teresinha). RLS per-user, sem exposição pública.';

commit;
