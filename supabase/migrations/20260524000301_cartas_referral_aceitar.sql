-- ============================================================================
-- Códex Veritas — Referral: função "aceitar" (registrar + ativar)
-- ============================================================================
-- A separação registrar/ativar exige um caminho server-side (service role)
-- pra ativar — o que complica o front. Esta função expõe um único RPC
-- AUTHENTICATED que faz ambos atomicamente:
--   1. Resolve o código (não pode ser o próprio do user).
--   2. Insere o vínculo (unique invitee_id evita duplicar).
--   3. Marca ativou_em e incrementa o contador do referrer.
--
-- A unicidade de invitee_id na tabela garante que cada usuário ativa
-- exatamente um referrer (o primeiro `?ref` que ele aceitar prevalece —
-- impede swap pra outro código depois).
-- ============================================================================

begin;

create or replace function public.fn_referral_aceitar(p_codigo text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id  uuid := auth.uid();
  v_referrer uuid;
  v_inserted boolean := false;
begin
  if v_user_id is null or p_codigo is null then return; end if;

  select id into v_referrer
    from public.profiles
   where codigo_convite = upper(trim(p_codigo))
     and id <> v_user_id;

  if v_referrer is null then return; end if;

  -- Tenta inserir o vínculo. ON CONFLICT DO NOTHING: se já existe um
  -- referral para este invitee, ignora (não troca de referrer).
  with ins as (
    insert into public.user_referrals (referrer_id, invitee_id, codigo, ativou_em)
    values (v_referrer, v_user_id, upper(trim(p_codigo)), now())
    on conflict (invitee_id) do nothing
    returning referrer_id
  )
  select true into v_inserted from ins limit 1;

  if v_inserted then
    perform public.fn_registrar_evento_carta(v_referrer, 'convites_ativos', 1);
  end if;
end; $$;

grant execute on function public.fn_referral_aceitar(text) to authenticated, service_role;

comment on function public.fn_referral_aceitar(text) is
  'RPC authenticated chamado pelo front após o usuário se autenticar (primeiro login). Resolve um código de convite, cria o vínculo e ativa atomicamente. Idempotente: chamadas seguintes não fazem nada.';

commit;
