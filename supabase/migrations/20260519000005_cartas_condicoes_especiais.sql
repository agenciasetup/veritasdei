-- ============================================================================
-- Códex Veritas — Condições especiais (Sprint 4)
-- ============================================================================
-- Amplia o motor de regras com duas condições verificáveis direto no banco
-- (sem contador, sem vetor de fraude):
--
--   nota_contem_frase    — o usuário escreveu uma frase específica numa
--                          anotação de estudo (cartas-segredo)
--   grupo_estudo_tamanho — o usuário pertence a um grupo de estudo que
--                          atingiu N membros (ex.: "Os Doze Apóstolos")
--
-- Eventos que NÃO são verificáveis no banco (debate vencido, micro-eventos)
-- continuam via `contador` + fn_registrar_evento_carta, alimentado pela rota
-- interna /api/codex/eventos (server-to-server).
--
-- Triggers novos: user_study_notes e study_group_members disparam a
-- reavaliação. Ao entrar um membro num grupo, TODOS os membros são
-- reavaliados (quando o 12º entra, os 12 ganham a carta).
-- ============================================================================

begin;

-- Recria fn_avaliar_condicao_carta com os dois tipos novos.
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

    -- NOVO: frase contida em qualquer anotação de estudo do usuário.
    -- position() evita problemas com metacaracteres de LIKE.
    when 'nota_contem_frase' then
      if v_ref is null or length(trim(v_ref)) = 0 then
        return false;
      end if;
      return exists (
        select 1 from public.user_study_notes
        where user_id = p_user_id
          and position(lower(trim(v_ref)) in lower(coalesce(body, ''))) > 0
      );

    -- NOVO: pertencer a um grupo de estudo que atingiu N membros.
    when 'grupo_estudo_tamanho' then
      return exists (
        select 1
        from public.study_group_members m
        join public.study_groups g on g.id = m.group_id
        where m.user_id = p_user_id
          and g.member_count >= coalesce(v_valor, 999999)
      );

    else
      return false;
  end case;
end; $$;

-- Trigger: anotação de estudo criada/editada → reavalia o autor.
create or replace function public.trg_cartas_after_nota()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.fn_avaliar_cartas(new.user_id);
  return new;
end; $$;

drop trigger if exists tg_cartas_after_nota on public.user_study_notes;
create trigger tg_cartas_after_nota
  after insert or update of body on public.user_study_notes
  for each row execute function public.trg_cartas_after_nota();

-- Trigger: novo membro num grupo → reavalia TODOS os membros do grupo
-- (quando o 12º entra, os 12 ganham a carta "Os Doze Apóstolos").
create or replace function public.trg_cartas_after_grupo_membro()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_membro uuid;
begin
  for v_membro in
    select user_id from public.study_group_members where group_id = new.group_id
  loop
    perform public.fn_avaliar_cartas(v_membro);
  end loop;
  return new;
end; $$;

drop trigger if exists tg_cartas_after_grupo_membro on public.study_group_members;
create trigger tg_cartas_after_grupo_membro
  after insert on public.study_group_members
  for each row execute function public.trg_cartas_after_grupo_membro();

-- Endurecimento: trigger functions fora do alcance de anon/authenticated.
revoke all on function public.trg_cartas_after_nota()          from public, anon, authenticated;
revoke all on function public.trg_cartas_after_grupo_membro()  from public, anon, authenticated;
revoke all on function public.fn_avaliar_condicao_carta(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.fn_avaliar_condicao_carta(uuid, jsonb) to service_role;

commit;
