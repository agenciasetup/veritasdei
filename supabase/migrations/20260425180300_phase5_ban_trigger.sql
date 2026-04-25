-- Fase 5 / Item 2: trigger que popula banned_identifiers quando profile vira banned.
-- Hash SHA-256 hex lowercase do email — espelha src/lib/auth/identifier-guard.ts
-- para que /api/auth/signup-check bloqueie reentrada do mesmo email.

begin;

create or replace function public.sync_banned_identifier_on_ban()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
  v_hash  text;
begin
  if (tg_op = 'UPDATE')
     and new.account_status = 'banned'
     and (old.account_status is distinct from 'banned') then

    select email into v_email from auth.users where id = new.id;

    if v_email is not null and length(v_email) > 0 then
      v_hash := encode(digest(lower(trim(v_email)), 'sha256'), 'hex');

      insert into public.banned_identifiers (kind, value_hash, reason, expires_at)
      values ('email', v_hash, coalesce(new.ban_reason, 'manual'), null)
      on conflict do nothing;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_sync_banned_identifier on public.profiles;

create trigger profiles_sync_banned_identifier
  after update of account_status on public.profiles
  for each row
  execute function public.sync_banned_identifier_on_ban();

commit;
