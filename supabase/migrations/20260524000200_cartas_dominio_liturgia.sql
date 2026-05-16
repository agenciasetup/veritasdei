-- ============================================================================
-- Códex Veritas — Domínio: liturgia dominical / ano litúrgico
-- ============================================================================
-- Sustenta as ~52 cartas comuns (uma por domingo do ano litúrgico) + ~6 raras
-- (festas solenes). Cada carta usa contador 'liturgia_<slug>' (ex.:
-- 'liturgia_advento-1', 'liturgia_pentecostes').
--
-- Tabelas:
--   liturgia_calendario      — calendário do ano (data → slug-do-domingo).
--   user_liturgia_aberturas  — registro idempotente de "usuário abriu hoje".
--
-- Quando o usuário abre /educa/liturgia/hoje (cliente chama
-- fn_liturgia_marcar_abertura), o registro é inserido (UPSERT por user×dia) e,
-- se aquele dia está no calendário, o contador correspondente vai pra 1.
--
-- Anti-bug do ano novo: o slug do domingo é fixo (advento-1, advento-2, ...).
-- Quem já tem o contador =1 não ganha de novo; quem nunca abriu nesse domingo
-- ainda pode ganhar quando o calendário avança pro próximo ano e a data troca.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. liturgia_calendario — qual é o "slug" de cada data
-- ----------------------------------------------------------------------------
-- Populado por ano via script `scripts/liturgia/seed-ano-NNNN.ts`.
-- Não é PK em (data) porque pode haver festa móvel coincidindo com domingo:
-- guardamos uma linha por ocorrência. A primeira (de maior prioridade) é a
-- que vale pra carta principal; festas secundárias geram cartas extras.
-- ----------------------------------------------------------------------------
create table if not exists public.liturgia_calendario (
  data            date not null,
  slug            text not null,
  -- 'domingo' | 'festa-solene' | 'memoria'
  tipo            text not null default 'domingo'
                    check (tipo in ('domingo','festa-solene','memoria')),
  tempo_liturgico text,                       -- 'advento','natal','quaresma','pascal','comum'
  titulo          text not null,
  prioridade      int not null default 0,     -- maior prioridade vence
  created_at      timestamptz not null default now(),
  primary key (data, slug)
);

create index if not exists liturgia_calendario_data_idx
  on public.liturgia_calendario (data, prioridade desc);

alter table public.liturgia_calendario enable row level security;

drop policy if exists "liturgia_calendario_public_read" on public.liturgia_calendario;
create policy "liturgia_calendario_public_read"
  on public.liturgia_calendario for select
  to anon, authenticated
  using (true);

drop policy if exists "liturgia_calendario_admin_all" on public.liturgia_calendario;
create policy "liturgia_calendario_admin_all"
  on public.liturgia_calendario for all
  to authenticated
  using (public.is_vd_admin())
  with check (public.is_vd_admin());

grant select on public.liturgia_calendario to anon, authenticated;
grant select, insert, update, delete on public.liturgia_calendario to service_role;

-- ----------------------------------------------------------------------------
-- 2. user_liturgia_aberturas — quem abriu a liturgia em qual dia
-- ----------------------------------------------------------------------------
create table if not exists public.user_liturgia_aberturas (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  data       date not null,
  aberta_em  timestamptz not null default now(),
  primary key (user_id, data)
);

alter table public.user_liturgia_aberturas enable row level security;

drop policy if exists "user_liturgia_aberturas_self_read" on public.user_liturgia_aberturas;
create policy "user_liturgia_aberturas_self_read"
  on public.user_liturgia_aberturas for select
  to authenticated
  using (auth.uid() = user_id or public.is_vd_admin());

-- Inserção é só via função SECURITY DEFINER (anti-fraude).
grant select on public.user_liturgia_aberturas to authenticated;
grant select, insert, update, delete on public.user_liturgia_aberturas to service_role;

-- ----------------------------------------------------------------------------
-- 3. fn_liturgia_marcar_abertura — RPC chamada pelo cliente
-- ----------------------------------------------------------------------------
-- Idempotente: chamar duas vezes no mesmo dia não faz nada.
-- Se o dia (em America/Sao_Paulo) tiver entry no calendário, registra os
-- contadores `liturgia_<slug>` correspondentes e chama fn_avaliar_cartas.
-- ----------------------------------------------------------------------------
create or replace function public.fn_liturgia_marcar_abertura()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_hoje    date;
  v_row     record;
begin
  if v_user_id is null then return; end if;

  v_hoje := (now() at time zone 'America/Sao_Paulo')::date;

  insert into public.user_liturgia_aberturas (user_id, data, aberta_em)
  values (v_user_id, v_hoje, now())
  on conflict (user_id, data) do nothing;

  if not found then
    -- já tinha aberto hoje; reavalia mesmo assim (idempotente)
    perform public.fn_avaliar_cartas(v_user_id);
    return;
  end if;

  -- Marca contador por slug do calendário (pode haver mais de uma linha p/ a data).
  for v_row in
    select slug from public.liturgia_calendario where data = v_hoje
  loop
    perform public.fn_registrar_evento_carta(
      v_user_id, 'liturgia_' || v_row.slug, 1
    );
  end loop;

  -- Reavalia (caso o dia não esteja no calendário mas alguma carta dependa
  -- de outro contador).
  perform public.fn_avaliar_cartas(v_user_id);
end; $$;

grant execute on function public.fn_liturgia_marcar_abertura() to authenticated, service_role;

comment on function public.fn_liturgia_marcar_abertura() is
  'Cliente chama uma vez por sessão ao abrir /educa/liturgia/hoje. Registra a abertura e dispara avaliação das cartas litúrgicas.';

commit;
