-- ============================================================================
-- Códex Veritas — Sistema de Cartas Colecionáveis (Fundação / Sprint 1)
-- ============================================================================
-- Evolução do sistema de relíquias (selos). Estrutura em três níveis:
--
--   personagens  → a entidade-mãe ("Jesus", "Pedro", "Maria")
--     cartas     → cada variação ("Cristo Pantocrator", "Pedro Negou")
--       regras   → JSONB estruturado que o motor de desbloqueio interpreta
--   user_cartas  → o que cada usuário desbloqueou (a coleção)
--   user_carta_progresso → contadores p/ regras que acumulam (debate, grupo…)
--
-- O motor (fn_avaliar_cartas) é chamado por triggers nos eventos de estudo
-- e também pode ser invocado explicitamente via RPC pelos modos especiais
-- (debate, grupo de estudo, micro-eventos) — Sprint 4.
--
-- Surpresa: a RLS de `cartas` só revela uma carta depois de desbloqueada.
-- O catálogo permanece oculto; `personagens.total_cartas` informa quantas
-- variações existem para renderizar silhuetas, sem spoiler.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. personagens — agrupa as variações de carta
-- ----------------------------------------------------------------------------
create table if not exists public.personagens (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  nome          text not null,
  subtitulo     text,
  descricao     text,
  icone_url     text,
  total_cartas  int not null default 0,   -- desnormalizado (cartas publicadas)
  ordem         int not null default 0,
  visivel       boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists personagens_visivel_ordem_idx
  on public.personagens (visivel, ordem);

-- ----------------------------------------------------------------------------
-- 2. cartas — cada variação colecionável
-- ----------------------------------------------------------------------------
-- `regras` (JSONB) — formato interpretado por fn_avaliar_cartas:
--   { "operador": "todas" | "qualquer",
--     "condicoes": [ { "tipo": "...", "ref": "...", "valor": N }, ... ] }
-- Tipos de condição suportados nesta fase:
--   subtopico_concluido | grupo_concluido | topico_concluido |
--   nivel | streak | quiz_gabaritado | contador
-- (eventos especiais — nota_contem_frase, evento_debate… — entram via
--  `contador` alimentado por fn_registrar_evento_carta; Sprint 4 adiciona
--  os tipos dedicados.)
-- ----------------------------------------------------------------------------
create table if not exists public.cartas (
  id                     uuid primary key default gen_random_uuid(),
  personagem_id          uuid not null references public.personagens(id) on delete cascade,
  slug                   text unique not null,
  numero                 int unique,
  nome                   text not null,
  subtitulo              text,
  categoria              text,
  raridade               text not null default 'comum'
                           check (raridade in ('comum','rara','epica','lendaria','suprema')),
  estrelas               int not null default 1 check (estrelas between 1 and 5),
  -- conteúdo temático
  frase_central          text,
  frase_referencia       text,
  autoridade_doutrinaria text,
  efeito_simbolico       text,
  recompensa             jsonb not null default '[]'::jsonb,   -- text[]
  concilio               text,
  virtude                text,
  simbolo                text,
  lore                   text,
  -- visual
  ilustracao_url         text,
  ilustracao_mobile_url  text,
  moldura                text not null default 'classica',
  cor_accent             text,
  -- desbloqueio
  dica_desbloqueio       text,                                  -- null = surpresa total
  regras                 jsonb not null default '{"operador":"todas","condicoes":[]}'::jsonb,
  -- workflow / ordenação
  status                 text not null default 'rascunho'
                           check (status in ('rascunho','revisao','publicado','arquivado')),
  visivel                boolean not null default true,
  ordem                  int not null default 0,
  created_by             uuid references public.profiles(id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists cartas_personagem_idx
  on public.cartas (personagem_id, ordem);

create index if not exists cartas_status_idx
  on public.cartas (status, visivel);

-- ----------------------------------------------------------------------------
-- 3. user_cartas — a coleção de cada usuário
-- ----------------------------------------------------------------------------
create table if not exists public.user_cartas (
  user_id         uuid not null references public.profiles(id) on delete cascade,
  carta_id        uuid not null references public.cartas(id) on delete cascade,
  desbloqueada_em timestamptz not null default now(),
  vista           boolean not null default false,   -- p/ badge "NOVA"
  favorita        boolean not null default false,   -- vitrine do perfil
  primary key (user_id, carta_id)
);

create index if not exists user_cartas_user_idx
  on public.user_cartas (user_id, desbloqueada_em desc);

-- ----------------------------------------------------------------------------
-- 4. user_carta_progresso — contadores para regras que acumulam
-- ----------------------------------------------------------------------------
-- Escrito SOMENTE por fn_registrar_evento_carta (security definer) — o
-- usuário não pode forjar contadores ("debates_vencidos", "grupo_tamanho"…).
-- ----------------------------------------------------------------------------
create table if not exists public.user_carta_progresso (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  chave      text not null,
  valor      int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, chave)
);

-- ============================================================================
-- Triggers utilitários: updated_at
-- ============================================================================
-- public.touch_updated_at() já existe (sprint_1_1_study_foundation).

drop trigger if exists tg_personagens_touch on public.personagens;
create trigger tg_personagens_touch
  before update on public.personagens
  for each row execute function public.touch_updated_at();

drop trigger if exists tg_cartas_touch on public.cartas;
create trigger tg_cartas_touch
  before update on public.cartas
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- personagens.total_cartas — recalcula a contagem de cartas publicadas
-- ----------------------------------------------------------------------------
create or replace function public.fn_recalc_personagem_total(p_personagem_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.personagens p
    set total_cartas = (
      select count(*) from public.cartas c
      where c.personagem_id = p_personagem_id
        and c.status = 'publicado'
        and c.visivel = true
    )
    where p.id = p_personagem_id;
end; $$;

create or replace function public.trg_cartas_recalc_personagem()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    perform public.fn_recalc_personagem_total(old.personagem_id);
    return old;
  end if;
  perform public.fn_recalc_personagem_total(new.personagem_id);
  if tg_op = 'UPDATE' and new.personagem_id <> old.personagem_id then
    perform public.fn_recalc_personagem_total(old.personagem_id);
  end if;
  return new;
end; $$;

drop trigger if exists tg_cartas_recalc_personagem on public.cartas;
create trigger tg_cartas_recalc_personagem
  after insert or update or delete on public.cartas
  for each row execute function public.trg_cartas_recalc_personagem();

-- ============================================================================
-- Motor de regras
-- ============================================================================

-- ----------------------------------------------------------------------------
-- fn_avaliar_condicao_carta: avalia UMA condição do JSON de regras.
-- Catálogo fechado de tipos — o que não reconhece retorna false.
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

    else
      return false;
  end case;
end; $$;

-- ----------------------------------------------------------------------------
-- fn_avaliar_cartas: percorre as cartas publicadas que o usuário ainda não
-- tem, avalia as regras e desbloqueia o que passou. Idempotente.
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
    select c.id, c.regras
    from public.cartas c
    where c.status = 'publicado'
      and c.visivel = true
      and not exists (
        select 1 from public.user_cartas uc
        where uc.user_id = p_user_id and uc.carta_id = c.id
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

    -- Sem condições => nunca desbloqueia automaticamente (evita carta
    -- "grátis" por engano). Admin que quiser dar de graça usa um contador.
    if v_total > 0 and (
         (v_operador = 'todas'    and v_ok = v_total) or
         (v_operador = 'qualquer' and v_ok >= 1)
       ) then
      insert into public.user_cartas (user_id, carta_id)
      values (p_user_id, v_carta.id)
      on conflict do nothing;
    end if;
  end loop;
end; $$;

-- ----------------------------------------------------------------------------
-- fn_registrar_evento_carta: incrementa um contador e reavalia as cartas.
-- Único caminho de escrita em user_carta_progresso — usado pelos modos
-- especiais (debate, grupo, micro-eventos). Security definer: o usuário
-- não consegue forjar contadores chamando direto a tabela.
-- ----------------------------------------------------------------------------
create or replace function public.fn_registrar_evento_carta(
  p_user_id    uuid,
  p_chave      text,
  p_incremento int default 1,
  p_modo       text default 'incrementar'   -- 'incrementar' | 'definir'
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user_id is null or p_chave is null then return; end if;

  insert into public.user_carta_progresso (user_id, chave, valor, updated_at)
  values (p_user_id, p_chave, greatest(p_incremento, 0), now())
  on conflict (user_id, chave) do update
    set valor = case
                  when p_modo = 'definir' then greatest(p_incremento, 0)
                  else public.user_carta_progresso.valor + p_incremento
                end,
        updated_at = now();

  perform public.fn_avaliar_cartas(p_user_id);
end; $$;

-- ============================================================================
-- Triggers de desbloqueio automático (eventos de estudo)
-- ============================================================================

create or replace function public.trg_cartas_after_progress()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.fn_avaliar_cartas(new.user_id);
  return new;
end; $$;

drop trigger if exists tg_cartas_after_progress on public.user_content_progress;
create trigger tg_cartas_after_progress
  after insert on public.user_content_progress
  for each row execute function public.trg_cartas_after_progress();

create or replace function public.trg_cartas_after_quiz()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.fn_avaliar_cartas(new.user_id);
  return new;
end; $$;

drop trigger if exists tg_cartas_after_quiz on public.user_quiz_attempts;
create trigger tg_cartas_after_quiz
  after insert on public.user_quiz_attempts
  for each row execute function public.trg_cartas_after_quiz();

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.personagens          enable row level security;
alter table public.cartas               enable row level security;
alter table public.user_cartas          enable row level security;
alter table public.user_carta_progresso enable row level security;

-- personagens: catálogo público (somente visíveis); admin escreve tudo
drop policy if exists "personagens_public_read" on public.personagens;
create policy "personagens_public_read"
  on public.personagens for select
  to anon, authenticated
  using (visivel = true or public.is_vd_admin());

drop policy if exists "personagens_admin_all" on public.personagens;
create policy "personagens_admin_all"
  on public.personagens for all
  to authenticated
  using (public.is_vd_admin())
  with check (public.is_vd_admin());

-- cartas: SURPRESA — o usuário só enxerga uma carta depois de desbloqueá-la.
-- Admin enxerga tudo (precisa pro painel).
drop policy if exists "cartas_unlocked_read" on public.cartas;
create policy "cartas_unlocked_read"
  on public.cartas for select
  to authenticated
  using (
    public.is_vd_admin()
    or exists (
      select 1 from public.user_cartas uc
      where uc.carta_id = cartas.id and uc.user_id = auth.uid()
    )
  );

drop policy if exists "cartas_admin_all" on public.cartas;
create policy "cartas_admin_all"
  on public.cartas for all
  to authenticated
  using (public.is_vd_admin())
  with check (public.is_vd_admin());

-- user_cartas: leitura pública (coleção aparece no perfil). O dono pode
-- atualizar apenas vista/favorita. Inserções vêm do motor (security definer).
drop policy if exists "user_cartas_public_read" on public.user_cartas;
create policy "user_cartas_public_read"
  on public.user_cartas for select
  to anon, authenticated
  using (true);

drop policy if exists "user_cartas_self_update" on public.user_cartas;
create policy "user_cartas_self_update"
  on public.user_cartas for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_cartas_admin_all" on public.user_cartas;
create policy "user_cartas_admin_all"
  on public.user_cartas for all
  to authenticated
  using (public.is_vd_admin())
  with check (public.is_vd_admin());

-- user_carta_progresso: privado do dono (leitura); escrita só via função
drop policy if exists "user_carta_progresso_self_read" on public.user_carta_progresso;
create policy "user_carta_progresso_self_read"
  on public.user_carta_progresso for select
  to authenticated
  using (auth.uid() = user_id or public.is_vd_admin());

-- ============================================================================
-- Grants
-- ============================================================================
grant select on public.personagens to anon, authenticated;
grant select, insert, update, delete on public.personagens to service_role;

grant select on public.cartas to authenticated;
grant select, insert, update, delete on public.cartas to service_role;

grant select on public.user_cartas to anon, authenticated;
grant update on public.user_cartas to authenticated;
grant select, insert, update, delete on public.user_cartas to service_role;

grant select on public.user_carta_progresso to authenticated;
grant select, insert, update, delete on public.user_carta_progresso to service_role;

grant execute on function public.fn_avaliar_cartas(uuid) to authenticated, service_role;
grant execute on function public.fn_avaliar_condicao_carta(uuid, jsonb) to authenticated, service_role;
grant execute on function public.fn_registrar_evento_carta(uuid, text, int, text) to authenticated, service_role;
grant execute on function public.fn_recalc_personagem_total(uuid) to authenticated, service_role;

-- ============================================================================
-- Comentários
-- ============================================================================
comment on table public.personagens is
  'Códex Veritas — entidade-mãe que agrupa as variações de carta (Jesus, Pedro…).';
comment on table public.cartas is
  'Códex Veritas — cada carta colecionável (variação de um personagem). RLS de surpresa: só visível após desbloqueio.';
comment on table public.user_cartas is
  'Códex Veritas — coleção de cada usuário (cartas desbloqueadas).';
comment on table public.user_carta_progresso is
  'Códex Veritas — contadores para regras que acumulam (debate, grupo, micro-eventos). Escrito só por fn_registrar_evento_carta.';
comment on column public.cartas.regras is
  'JSON do motor de desbloqueio: {"operador":"todas|qualquer","condicoes":[{"tipo","ref","valor"}]}.';

commit;
