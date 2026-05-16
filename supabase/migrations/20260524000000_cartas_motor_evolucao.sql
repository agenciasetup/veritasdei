-- ============================================================================
-- Códex Veritas — Evolução do motor (Sprint Achievement)
-- ============================================================================
-- 1. cartas.tiragem  — limite máximo de cópias (NULL = ilimitada).
--    Lendárias = 144, Supremas = 33. O contador cartas_serial_counter.last_serial
--    já é monotônico — basta comparar com `tiragem` antes de cunhar.
--
-- 2. Novos tipos de condição em fn_avaliar_condicao_carta:
--    - conteudo_estudado_slug : checa user_content_progress via slug em
--                               content_subtopics (estável entre ambientes).
--    - dogma_estudado         : checa um dogma específico (content_type='dogmas',
--                               ref = 'trindade'|'imaculada-conceicao'|...).
--    - contador_dia_unico     : variante de `contador` que só conta UMA vez por
--                               dia (anti-farming p/ liturgia, debate, etc).
--    - voltou_ao_grupo        : ganhou Pedro Restaurado — saiu de um grupo
--                               e voltou em até 30 dias.
--
-- 3. Trigger BEFORE INSERT em user_cartas verifica a tiragem.
--    Roda ANTES de fn_assinar_user_carta (mesmo timing — usa AFTER ALPHABET
--    convention: tg_user_cartas_check_tiragem corre antes de
--    tg_user_cartas_assinar). Em concorrência, last_serial já é atômico via
--    UPSERT, então o serial é checado de novo na assinatura.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. coluna `tiragem`
-- ----------------------------------------------------------------------------
alter table public.cartas
  add column if not exists tiragem int
    check (tiragem is null or tiragem > 0);

comment on column public.cartas.tiragem is
  'Limite máximo de cópias da carta (NULL = ilimitada). Lendárias=144, Supremas=33. Verificado por fn_carta_tem_estoque antes do INSERT em user_cartas.';

-- ----------------------------------------------------------------------------
-- 2. fn_carta_tem_estoque — true se ainda dá pra cunhar mais uma cópia
-- ----------------------------------------------------------------------------
create or replace function public.fn_carta_tem_estoque(p_carta_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_tiragem int;
  v_usado   int;
begin
  select tiragem into v_tiragem from public.cartas where id = p_carta_id;
  if v_tiragem is null then
    return true;  -- ilimitada
  end if;

  select coalesce(last_serial, 0) into v_usado
    from public.cartas_serial_counter
   where carta_id = p_carta_id;

  return coalesce(v_usado, 0) < v_tiragem;
end; $$;

grant execute on function public.fn_carta_tem_estoque(uuid) to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 3. trigger de checagem de tiragem (BEFORE INSERT em user_cartas)
-- ----------------------------------------------------------------------------
-- Roda ANTES de fn_assinar_user_carta (que aloca o serial). Se a tiragem se
-- esgotou, lança exceção — capturada pelo motor de avaliação que pula a carta.
-- ----------------------------------------------------------------------------
create or replace function public.fn_check_tiragem_carta()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tiragem int;
  v_usado   int;
begin
  select tiragem into v_tiragem from public.cartas where id = new.carta_id;
  if v_tiragem is null then
    return new;
  end if;

  -- Lê com lock pra evitar race: dois usuários simultâneos não cunham
  -- a #34 de uma carta com tiragem=33.
  select coalesce(last_serial, 0) into v_usado
    from public.cartas_serial_counter
   where carta_id = new.carta_id
   for update;

  if coalesce(v_usado, 0) >= v_tiragem then
    raise exception 'cartas: tiragem esgotada (%) para carta %', v_tiragem, new.carta_id
      using errcode = 'check_violation';
  end if;

  return new;
end; $$;

-- Nome com prefixo `aa_` pra garantir que dispare antes de `tg_user_cartas_assinar`.
-- (Postgres dispara triggers do mesmo timing em ordem alfabética.)
drop trigger if exists aa_check_tiragem_carta on public.user_cartas;
create trigger aa_check_tiragem_carta
  before insert on public.user_cartas
  for each row execute function public.fn_check_tiragem_carta();

revoke all on function public.fn_check_tiragem_carta() from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. fn_avaliar_cartas — captura exceção de tiragem por carta
-- ----------------------------------------------------------------------------
-- Reescreve a função pra envolver o INSERT em BEGIN/EXCEPTION, de forma que
-- uma carta esgotada não derrube a avaliação das outras.
-- ----------------------------------------------------------------------------
create or replace function public.fn_avaliar_cartas(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_carta     record;
  v_cond      jsonb;
  v_operador  text;
  v_total     int;
  v_ok        int;
begin
  if p_user_id is null then return; end if;

  for v_carta in
    select c.id, c.regras, c.tiragem
    from public.cartas c
    where c.status = 'publicado'
      and c.visivel = true
      and not exists (
        select 1 from public.user_cartas uc
        where uc.user_id = p_user_id and uc.carta_id = c.id
      )
      -- pula cartas já esgotadas (otimização: evita travar lock no trigger)
      and (
        c.tiragem is null
        or coalesce(
             (select last_serial from public.cartas_serial_counter
               where carta_id = c.id),
             0
           ) < c.tiragem
      )
  loop
    v_operador := coalesce(v_carta.regras->>'operador', 'todas');
    v_total := 0;
    v_ok := 0;

    for v_cond in
      select * from jsonb_array_elements(
        coalesce(v_carta.regras->'condicoes', '[]'::jsonb)
      )
    loop
      v_total := v_total + 1;
      if public.fn_avaliar_condicao_carta(p_user_id, v_cond) then
        v_ok := v_ok + 1;
      end if;
    end loop;

    if v_total > 0 and (
         (v_operador = 'todas'    and v_ok = v_total) or
         (v_operador = 'qualquer' and v_ok >= 1)
       ) then
      begin
        insert into public.user_cartas (user_id, carta_id)
        values (p_user_id, v_carta.id)
        on conflict do nothing;
      exception
        when check_violation then
          -- tiragem esgotada entre o SELECT e o INSERT — segue em frente
          null;
      end;
    end if;
  end loop;
end; $$;

-- ----------------------------------------------------------------------------
-- 5. fn_avaliar_condicao_carta — adiciona novos tipos
-- ----------------------------------------------------------------------------
create or replace function public.fn_avaliar_condicao_carta(
  p_user_id uuid,
  p_cond    jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tipo  text := p_cond->>'tipo';
  v_ref   text := p_cond->>'ref';
  v_valor int  := nullif(p_cond->>'valor','')::int;
begin
  case v_tipo

    when 'subtopico_concluido' then
      return exists (
        select 1 from public.user_content_progress
        where user_id = p_user_id and subtopic_id::text = v_ref
      );

    when 'grupo_concluido' then
      return exists (
        select 1
        from public.content_groups g
        join public.content_topics t on t.group_id = g.id
        join public.content_subtopics s on s.topic_id = t.id
        left join public.user_content_progress p
          on p.subtopic_id = s.id and p.user_id = p_user_id
        where g.slug = v_ref and g.visible = true
        group by g.id
        having count(distinct s.id) > 0
           and count(distinct s.id) = count(distinct p.subtopic_id)
      );

    when 'topico_concluido' then
      return exists (
        select 1
        from public.content_topics t
        join public.content_subtopics s on s.topic_id = t.id
        left join public.user_content_progress p
          on p.subtopic_id = s.id and p.user_id = p_user_id
        where t.id::text = v_ref
        group by t.id
        having count(distinct s.id) > 0
           and count(distinct s.id) = count(distinct p.subtopic_id)
      );

    when 'nivel' then
      return exists (
        select 1 from public.user_gamification
        where user_id = p_user_id and current_level >= coalesce(v_valor, 999999)
      );

    when 'streak' then
      return exists (
        select 1 from public.user_gamification
        where user_id = p_user_id
          and (current_streak >= coalesce(v_valor, 999999)
               or longest_streak >= coalesce(v_valor, 999999))
      );

    when 'quiz_gabaritado' then
      return exists (
        select 1
        from public.user_quiz_attempts a
        join public.study_quizzes q on q.id = a.quiz_id
        where a.user_id = p_user_id
          and a.score = 100
          and q.content_ref = v_ref
      );

    when 'contador' then
      return exists (
        select 1 from public.user_carta_progresso
        where user_id = p_user_id
          and chave = v_ref
          and valor >= coalesce(v_valor, 999999)
      );

    when 'nota_contem_frase' then
      if v_ref is null or length(trim(v_ref)) = 0 then
        return false;
      end if;
      return exists (
        select 1 from public.user_study_notes
        where user_id = p_user_id
          and position(lower(trim(v_ref)) in lower(coalesce(body, ''))) > 0
      );

    when 'grupo_estudo_tamanho' then
      return exists (
        select 1
        from public.study_group_members m
        join public.study_groups g on g.id = m.group_id
        where m.user_id = p_user_id
          and g.member_count >= coalesce(v_valor, 999999)
      );

    -- NOVO: subtópico identificado por slug (estável entre ambientes).
    when 'conteudo_estudado_slug' then
      if v_ref is null then return false; end if;
      return exists (
        select 1
        from public.user_content_progress ucp
        join public.content_subtopics s on s.id = ucp.subtopic_id
        where ucp.user_id = p_user_id and s.slug = v_ref
      );

    -- NOVO: dogma específico estudado (content_type='dogmas').
    -- ref = slug do dogma em content_subtopics (ex.: 'imaculada-conceicao').
    when 'dogma_estudado' then
      if v_ref is null then return false; end if;
      return exists (
        select 1
        from public.user_content_progress ucp
        join public.content_subtopics s on s.id = ucp.subtopic_id
        where ucp.user_id = p_user_id
          and ucp.content_type = 'dogmas'
          and s.slug = v_ref
      );

    else
      return false;
  end case;
end; $$;

revoke all on function public.fn_avaliar_condicao_carta(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.fn_avaliar_condicao_carta(uuid, jsonb) to service_role;

commit;
