-- ============================================================================
-- Códex Veritas — Domínio: rosário / terço
-- ============================================================================
-- Hoje rosary_sessions.completed_at marca o fim de UM mistério rezado. As
-- cartas de "N terços rezados" e "Rosário completo" usam contadores:
--
--   tercos_rezados      — +1 por rosary_sessions.completed_at preenchido.
--   rosarios_completos  — +1 quando, num mesmo dia (TZ Sao Paulo), o usuário
--                          completou os 4 conjuntos (gozosos+luminosos+
--                          dolorosos+gloriosos).
--   tercos_em_sala      — +1 quando rezou em rosary_room com ≥2 participantes
--                          além de si.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. trigger pós-completed em rosary_sessions: incrementa tercos_rezados +
--    verifica se fechou o ciclo do rosário completo no dia.
-- ----------------------------------------------------------------------------
create or replace function public.trg_cartas_after_rosario_completo()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_dia       date;
  v_count_dia int;
begin
  if new.completed_at is null then return new; end if;
  if tg_op = 'UPDATE' and old.completed_at is not null then
    -- já tinha completado antes; não conta de novo
    return new;
  end if;

  -- 1) terço rezado
  perform public.fn_registrar_evento_carta(new.user_id, 'tercos_rezados', 1);

  -- 2) rosário completo (4 conjuntos distintos no mesmo dia)
  v_dia := (new.completed_at at time zone 'America/Sao_Paulo')::date;
  select count(distinct mystery_set) into v_count_dia
    from public.rosary_sessions
   where user_id = new.user_id
     and completed_at is not null
     and (completed_at at time zone 'America/Sao_Paulo')::date = v_dia;

  if v_count_dia >= 4 then
    -- Para não incrementar 4 vezes (uma por mistério no dia), só incrementa
    -- quando passou exatamente de 3 pra 4 ou ao chegar em 4 pela 1ª vez.
    -- Estratégia: usa um contador idempotente por dia.
    perform public.fn_registrar_evento_carta(
      new.user_id,
      'rosario_completo_' || to_char(v_dia, 'YYYYMMDD'),
      1, 'definir'
    );
    -- Conta UM "rosarios_completos" por dia (mesmo idempotente):
    -- só incrementa se o flag do dia ainda não estava em 1.
    if not exists (
      select 1 from public.user_carta_progresso
       where user_id = new.user_id
         and chave = 'rosario_completo_marcado_' || to_char(v_dia, 'YYYYMMDD')
    ) then
      perform public.fn_registrar_evento_carta(new.user_id, 'rosarios_completos', 1);
      perform public.fn_registrar_evento_carta(
        new.user_id,
        'rosario_completo_marcado_' || to_char(v_dia, 'YYYYMMDD'),
        1, 'definir'
      );
    end if;
  end if;

  return new;
end; $$;

drop trigger if exists tg_cartas_after_rosario_completo on public.rosary_sessions;
create trigger tg_cartas_after_rosario_completo
  after insert or update of completed_at on public.rosary_sessions
  for each row execute function public.trg_cartas_after_rosario_completo();

revoke all on function public.trg_cartas_after_rosario_completo()
  from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. fn_rosario_marcar_sala_completa — chamada quando uma sala finaliza
-- ----------------------------------------------------------------------------
-- O host (ou um trigger ao mudar state pra 'finalizada' em rosary_rooms) chama
-- esta função pra incrementar tercos_em_sala em cada participante presente.
-- ----------------------------------------------------------------------------
create or replace function public.fn_rosario_sala_finalizar(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_part uuid;
  v_n    int;
begin
  if p_room_id is null then return; end if;

  -- precisa ter pelo menos 3 participantes (o usuário + 2 outros)
  select count(*) into v_n
    from public.rosary_room_participants
   where room_id = p_room_id
     and left_at is null;
  if v_n < 3 then return; end if;

  for v_part in
    select user_id from public.rosary_room_participants
     where room_id = p_room_id and left_at is null and user_id is not null
  loop
    perform public.fn_registrar_evento_carta(v_part, 'tercos_em_sala', 1);
  end loop;
end; $$;

grant execute on function public.fn_rosario_sala_finalizar(uuid) to authenticated, service_role;

commit;
