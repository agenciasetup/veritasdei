-- Intenções — substituto honesto da "vela virtual".
--
-- O usuário oferece uma intenção a Deus pela intercessão do santo
-- escolhido. Registro privado (RLS), revisitável e marcável como
-- "graça recebida" (com disclaimer em UI).
--
-- status:
--   aberta        — em curso, usuário reza por ela periodicamente
--   graca_recebida — usuário sente que Deus atendeu (disclaimer obrigatório)
--   arquivada     — user encerra sem marcar como graça
--
-- Doutrinalmente: intenção é oferecimento livre, não transação. Equivalente
-- moderno ao ex-voto. Ver docs/copy-catolica.md §1 P3 e P4.

begin;

create table if not exists public.intencoes (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  santo_id         uuid references public.santos(id) on delete set null,
  texto            text not null check (length(texto) between 3 and 500),
  status           text not null default 'aberta'
                     check (status in ('aberta','graca_recebida','arquivada')),
  reflexao_graca   text check (reflexao_graca is null or length(reflexao_graca) <= 500),
  lembrete_semanal boolean not null default false,
  encerrada_em     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists intencoes_user_idx
  on public.intencoes (user_id, created_at desc);

create index if not exists intencoes_user_status_idx
  on public.intencoes (user_id, status);

create index if not exists intencoes_lembrete_idx
  on public.intencoes (user_id)
  where lembrete_semanal = true and status = 'aberta';

alter table public.intencoes enable row level security;

drop policy if exists "intencoes user select" on public.intencoes;
create policy "intencoes user select"
  on public.intencoes for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "intencoes user insert" on public.intencoes;
create policy "intencoes user insert"
  on public.intencoes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "intencoes user update" on public.intencoes;
create policy "intencoes user update"
  on public.intencoes for update
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "intencoes user delete" on public.intencoes;
create policy "intencoes user delete"
  on public.intencoes for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.intencoes to authenticated;
grant select, insert, update, delete on public.intencoes to service_role;

-- updated_at trigger
create or replace function public.intencoes_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  if new.status in ('graca_recebida','arquivada')
     and old.status = 'aberta'
     and new.encerrada_em is null then
    new.encerrada_em = now();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_intencoes_updated_at on public.intencoes;
create trigger trg_intencoes_updated_at
before update on public.intencoes
for each row execute function public.intencoes_set_updated_at();

comment on table public.intencoes is
  'Intenções oferecidas pelo usuário pela intercessão de um santo. Substitui "vela virtual" — honestidade material. Ver docs/copy-catolica.md P4.';
comment on column public.intencoes.reflexao_graca is
  'Reflexão escrita quando o usuário marca como graça recebida. Testemunho pessoal, não pronunciamento eclesiástico.';

commit;
