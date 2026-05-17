-- ============================================================================
-- Códex Veritas — Domínio: debate
-- ============================================================================
-- Hoje DebateRoom.tsx mantém o estado em localStorage. Esta migration cria a
-- contrapartida server-side mínima pra contadores de carta:
--
--   debate_sessions      — uma linha por debate finalizado, com 3 scores
--                          (biblico, magisterio, caridade).
--   fn_debate_finalizar  — RPC server-to-server (rota /api/codex/eventos/debate)
--                          que registra o resultado e incrementa contadores
--                          ('debates_iniciados', 'debates_vencidos',
--                          'debates_perfeitos').
--
-- Anti-fraude: a RPC só aceita ser chamada via service_role (não authenticated).
-- O front faz POST na API route, que valida a sessão IA e chama com service.
-- ============================================================================

begin;

create table if not exists public.debate_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  tema              text not null,
  -- 0..100 cada
  score_biblico     int not null default 0 check (score_biblico between 0 and 100),
  score_magisterio  int not null default 0 check (score_magisterio between 0 and 100),
  score_caridade    int not null default 0 check (score_caridade between 0 and 100),
  -- snapshot pra auditoria
  argumentos        jsonb not null default '[]'::jsonb,
  finalizado_em     timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index if not exists debate_sessions_user_idx
  on public.debate_sessions (user_id, finalizado_em desc);

alter table public.debate_sessions enable row level security;

-- O usuário vê o próprio histórico. Admin vê tudo. Ninguém escreve sem ser
-- via fn_debate_finalizar (service_role).
drop policy if exists "debate_sessions_self_read" on public.debate_sessions;
create policy "debate_sessions_self_read"
  on public.debate_sessions for select
  to authenticated
  using (auth.uid() = user_id or public.is_vd_admin());

grant select on public.debate_sessions to authenticated;
grant select, insert, update, delete on public.debate_sessions to service_role;

-- ----------------------------------------------------------------------------
-- fn_debate_finalizar — server-to-server
-- ----------------------------------------------------------------------------
-- Recebe o resultado (vindo da IA-juíza) e:
--   1. Insere em debate_sessions.
--   2. Incrementa 'debates_iniciados' sempre.
--   3. Se score médio >= 70 → +1 em 'debates_vencidos'.
--   4. Se os 3 scores = 100 → +1 em 'debates_perfeitos'.
--   5. Reavalia cartas do usuário.
-- ----------------------------------------------------------------------------
create or replace function public.fn_debate_finalizar(
  p_user_id          uuid,
  p_tema             text,
  p_score_biblico    int,
  p_score_magisterio int,
  p_score_caridade   int,
  p_argumentos       jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id     uuid;
  v_media  numeric;
begin
  if p_user_id is null then
    raise exception 'fn_debate_finalizar: user_id obrigatório';
  end if;

  insert into public.debate_sessions (
    user_id, tema, score_biblico, score_magisterio, score_caridade, argumentos
  )
  values (
    p_user_id,
    coalesce(p_tema, '(sem tema)'),
    greatest(0, least(100, coalesce(p_score_biblico, 0))),
    greatest(0, least(100, coalesce(p_score_magisterio, 0))),
    greatest(0, least(100, coalesce(p_score_caridade, 0))),
    coalesce(p_argumentos, '[]'::jsonb)
  )
  returning id into v_id;

  perform public.fn_registrar_evento_carta(p_user_id, 'debates_iniciados', 1);

  v_media := (
    coalesce(p_score_biblico, 0) +
    coalesce(p_score_magisterio, 0) +
    coalesce(p_score_caridade, 0)
  ) / 3.0;

  if v_media >= 70 then
    perform public.fn_registrar_evento_carta(p_user_id, 'debates_vencidos', 1);
  end if;

  if p_score_biblico = 100 and p_score_magisterio = 100 and p_score_caridade = 100 then
    perform public.fn_registrar_evento_carta(p_user_id, 'debates_perfeitos', 1);
  end if;

  return v_id;
end; $$;

-- Apenas service_role pode chamar (front faz via /api/codex/eventos/debate).
revoke all on function public.fn_debate_finalizar(uuid, text, int, int, int, jsonb)
  from public, anon, authenticated;
grant execute on function public.fn_debate_finalizar(uuid, text, int, int, int, jsonb)
  to service_role;

commit;
