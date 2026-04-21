-- Tabela de junção santo_oracoes — vincula santos a orações (content_items).
--
-- tipos:
--   devocao_principal — a oração central de devoção ao santo (1 por santo)
--   litania            — litanias de invocação
--   novena             — novenas específicas
--   oracao_secundaria  — demais orações relacionadas
--
-- Trigger mantém santos.oracao_principal_item_id denormalizado para joins rápidos.

begin;

create table if not exists public.santo_oracoes (
  santo_id        uuid not null references public.santos(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  tipo            text not null check (tipo in ('devocao_principal','litania','novena','oracao_secundaria')),
  sort_order      smallint not null default 0,
  created_at      timestamptz not null default now(),
  primary key (santo_id, content_item_id, tipo)
);

create index if not exists santo_oracoes_santo_idx
  on public.santo_oracoes (santo_id, tipo, sort_order);

create index if not exists santo_oracoes_item_idx
  on public.santo_oracoes (content_item_id);

alter table public.santo_oracoes enable row level security;

drop policy if exists "santo_oracoes public read" on public.santo_oracoes;
create policy "santo_oracoes public read"
  on public.santo_oracoes for select
  to anon, authenticated
  using (true);

grant select on public.santo_oracoes to anon, authenticated;
grant select, insert, update, delete on public.santo_oracoes to service_role;

-- Trigger: sincroniza santos.oracao_principal_item_id quando tipo='devocao_principal'
create or replace function public.santo_oracoes_sync_principal()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'DELETE') then
    if old.tipo = 'devocao_principal' then
      update public.santos
      set oracao_principal_item_id = null
      where id = old.santo_id
        and oracao_principal_item_id = old.content_item_id;
    end if;
    return old;
  end if;

  if new.tipo = 'devocao_principal' then
    update public.santos
    set oracao_principal_item_id = new.content_item_id
    where id = new.santo_id;
  end if;
  return new;
end;
$$;

drop trigger if exists santo_oracoes_sync_principal_trigger on public.santo_oracoes;
create trigger santo_oracoes_sync_principal_trigger
  after insert or update or delete on public.santo_oracoes
  for each row execute function public.santo_oracoes_sync_principal();

commit;
