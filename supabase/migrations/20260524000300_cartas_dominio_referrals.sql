-- ============================================================================
-- Códex Veritas — Domínio: convites (referrals)
-- ============================================================================
-- Sustenta a sequência das 12 lendárias dos Apóstolos + a suprema Paulo.
--
-- Modelo:
--   profiles.codigo_convite  — código curto único do usuário (?ref=ABC123).
--   user_referrals           — quem convidou quem; ativou_em = login do convidado.
--   contador 'convites_ativos' — incrementado quando ativou_em é populado.
--
-- O front (rota /signup ou similar) lê ?ref=... e popula o INSERT em
-- user_referrals via fn_referral_registrar. O login real do convidado dispara
-- fn_referral_ativar (trigger ou chamada no onboarding).
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. profiles.codigo_convite
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists codigo_convite text;

-- gen_random_string-ish: 8 chars hex
create or replace function public.fn_gen_codigo_convite()
returns text
language sql
volatile
as $$
  select upper(substring(encode(extensions.gen_random_bytes(6), 'hex') from 1 for 8));
$$;

-- Backfill: dá um código a quem ainda não tem.
do $$
declare
  v_row record;
  v_code text;
  v_attempt int;
begin
  for v_row in select id from public.profiles where codigo_convite is null
  loop
    v_attempt := 0;
    loop
      v_code := public.fn_gen_codigo_convite();
      begin
        update public.profiles set codigo_convite = v_code where id = v_row.id;
        exit;
      exception when unique_violation then
        v_attempt := v_attempt + 1;
        if v_attempt > 5 then
          raise exception 'codigo_convite: 5 colisões seguidas em backfill';
        end if;
      end;
    end loop;
  end loop;
end $$;

create unique index if not exists profiles_codigo_convite_uq
  on public.profiles (codigo_convite)
  where codigo_convite is not null;

-- Trigger BEFORE INSERT em profiles: garante um código novo.
create or replace function public.fn_set_codigo_convite()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_attempt int := 0;
begin
  if new.codigo_convite is not null then return new; end if;

  loop
    new.codigo_convite := public.fn_gen_codigo_convite();
    if not exists (
      select 1 from public.profiles where codigo_convite = new.codigo_convite
    ) then
      return new;
    end if;
    v_attempt := v_attempt + 1;
    if v_attempt > 5 then
      raise exception 'codigo_convite: 5 colisões seguidas em insert';
    end if;
  end loop;
end; $$;

drop trigger if exists tg_set_codigo_convite on public.profiles;
create trigger tg_set_codigo_convite
  before insert on public.profiles
  for each row execute function public.fn_set_codigo_convite();

revoke all on function public.fn_set_codigo_convite() from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. user_referrals
-- ----------------------------------------------------------------------------
create table if not exists public.user_referrals (
  id           uuid primary key default gen_random_uuid(),
  referrer_id  uuid not null references public.profiles(id) on delete cascade,
  invitee_id   uuid not null references public.profiles(id) on delete cascade,
  codigo       text not null,                  -- código no momento do convite
  criado_em    timestamptz not null default now(),
  ativou_em    timestamptz null,                -- primeiro login do convidado
  unique (invitee_id)                           -- cada usuário só pode ser convidado uma vez
);

create index if not exists user_referrals_referrer_idx
  on public.user_referrals (referrer_id, ativou_em);

alter table public.user_referrals enable row level security;

-- O dono do convite vê seus referrals; ninguém mais.
drop policy if exists "user_referrals_referrer_read" on public.user_referrals;
create policy "user_referrals_referrer_read"
  on public.user_referrals for select
  to authenticated
  using (auth.uid() = referrer_id or auth.uid() = invitee_id or public.is_vd_admin());

grant select on public.user_referrals to authenticated;
grant select, insert, update, delete on public.user_referrals to service_role;

-- ----------------------------------------------------------------------------
-- 3. fn_referral_registrar — cliente passa o código no signup
-- ----------------------------------------------------------------------------
-- Resolve o código pro referrer_id e cria o vínculo. NÃO ativa ainda — espera
-- o primeiro login real (fn_referral_ativar).
-- ----------------------------------------------------------------------------
create or replace function public.fn_referral_registrar(p_codigo text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id    uuid := auth.uid();
  v_referrer   uuid;
begin
  if v_user_id is null or p_codigo is null then return; end if;

  -- não pode convidar a si mesmo
  select id into v_referrer
    from public.profiles
   where codigo_convite = upper(trim(p_codigo))
     and id <> v_user_id;

  if v_referrer is null then return; end if;

  insert into public.user_referrals (referrer_id, invitee_id, codigo)
  values (v_referrer, v_user_id, upper(trim(p_codigo)))
  on conflict (invitee_id) do nothing;
end; $$;

grant execute on function public.fn_referral_registrar(text) to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. fn_referral_ativar — chamado no primeiro login confirmado do convidado
-- ----------------------------------------------------------------------------
-- Idempotente. Quando ativa, incrementa o contador do referrer.
-- ----------------------------------------------------------------------------
create or replace function public.fn_referral_ativar(p_invitee_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_referrer uuid;
begin
  if p_invitee_id is null then return; end if;

  update public.user_referrals
     set ativou_em = now()
   where invitee_id = p_invitee_id
     and ativou_em is null
   returning referrer_id into v_referrer;

  if v_referrer is not null then
    perform public.fn_registrar_evento_carta(v_referrer, 'convites_ativos', 1);
  end if;
end; $$;

grant execute on function public.fn_referral_ativar(uuid) to service_role;

commit;
