-- ============================================================================
-- Códex Veritas — Domínio: saída e retorno em grupos de estudo
-- ============================================================================
-- Sustenta três cartas:
--   * "Iscariotes" (lendária)        — primeiro a sair de um grupo que já teve
--                                       12+ membros.
--   * "Matias, o Eleito" (lendária)  — 13º a entrar num grupo após o "Iscariotes".
--   * "Pedro Restaurado" (épica)     — quem sai e VOLTA em até 30 dias.
--
-- Como NÃO existe DELETE no fluxo (membros são soft-removidos via `left_at`),
-- toda a contabilidade vive em colunas no próprio `study_group_members` +
-- `study_groups`. Nenhum DELETE — preserva histórico/auditoria.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. study_group_members: left_at + rejoined_at
-- ----------------------------------------------------------------------------
alter table public.study_group_members
  add column if not exists left_at      timestamptz null,
  add column if not exists rejoined_at  timestamptz null;

create index if not exists study_group_members_active_idx
  on public.study_group_members (group_id, user_id)
  where left_at is null;

comment on column public.study_group_members.left_at is
  'Quando o membro saiu (soft-leave). NULL = ativo.';
comment on column public.study_group_members.rejoined_at is
  'Quando o membro voltou após left_at. Habilita carta "Pedro Restaurado".';

-- ----------------------------------------------------------------------------
-- 2. study_groups: peak_member_count + judas_user_id
-- ----------------------------------------------------------------------------
-- `peak_member_count` = maior valor histórico de membros ativos. Necessário
-- pra saber se o grupo "passou pelos 12" mesmo que hoje tenha menos.
--
-- `judas_user_id` = primeiro usuário a sair quando peak já era ≥ 12.
-- Aponta a "marca" do grupo — usada pra liberar o Matias quando o 13º entra.
-- ----------------------------------------------------------------------------
alter table public.study_groups
  add column if not exists peak_member_count int not null default 0,
  add column if not exists judas_user_id     uuid null
    references public.profiles(id) on delete set null,
  add column if not exists judas_left_at     timestamptz null;

-- backfill: peak = member_count atual (se já há grupos populados)
update public.study_groups
   set peak_member_count = greatest(peak_member_count, coalesce(member_count, 0))
 where peak_member_count < coalesce(member_count, 0);

comment on column public.study_groups.peak_member_count is
  'Maior contagem histórica de membros ativos. Usado pra liberar a carta Iscariotes/Matias mesmo após saídas.';
comment on column public.study_groups.judas_user_id is
  'Primeiro membro a sair quando peak_member_count já era ≥ 12. NULL até acontecer.';

-- ----------------------------------------------------------------------------
-- 3. trigger: recalcula member_count + peak ao entrar membro
-- ----------------------------------------------------------------------------
-- O member_count desnormalizado era mantido por `tg_study_groups_recount`
-- (sprint social, +1/-1 via INSERT/DELETE). Esse trigger não enxerga left_at,
-- então no nosso fluxo de soft-leave ele ficaria errado. Desligamos ele e
-- assumimos a contabilidade nesta migration via fn_recalc_member_count
-- (chamada pelo trigger BR-novo logo abaixo).
-- ----------------------------------------------------------------------------
drop trigger if exists tg_study_groups_recount on public.study_group_members;

create or replace function public.fn_recalc_member_count(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count int;
begin
  select count(*) into v_count
    from public.study_group_members
   where group_id = p_group_id and left_at is null;

  update public.study_groups
     set member_count = v_count,
         peak_member_count = greatest(peak_member_count, v_count)
   where id = p_group_id;
end; $$;

revoke all on function public.fn_recalc_member_count(uuid) from public, anon, authenticated;
grant execute on function public.fn_recalc_member_count(uuid) to service_role;

-- ----------------------------------------------------------------------------
-- 4. RPC: sair de um grupo (soft-leave)
-- ----------------------------------------------------------------------------
-- Marca left_at + recalcula member_count. Se for o PRIMEIRO leave de um grupo
-- com peak >= 12, marca o usuário como `judas` no grupo (e registra contador
-- 'foi_o_judas' pra carta lendária).
-- ----------------------------------------------------------------------------
create or replace function public.fn_grupo_estudo_sair(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id        uuid := auth.uid();
  v_peak           int;
  v_judas_existente uuid;
  v_left_at        timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'não autenticado';
  end if;

  -- só sai se for membro ativo
  update public.study_group_members
     set left_at = v_left_at
   where group_id = p_group_id
     and user_id  = v_user_id
     and left_at is null;

  if not found then
    return;  -- não era membro ativo, nada a fazer
  end if;

  perform public.fn_recalc_member_count(p_group_id);

  -- Quem sai sempre fica com a chance de voltar e ganhar "Pedro Restaurado".
  -- Marca contador 'saiu_do_grupo_em_<group_id>' (chave única por grupo) com
  -- timestamp epoch — quando voltar, comparamos a diferença pra ver se < 30 dias.
  perform public.fn_registrar_evento_carta(
    v_user_id,
    'saiu_grupo_' || p_group_id::text,
    extract(epoch from v_left_at)::int,
    'definir'
  );

  -- Verifica peak do grupo e se já tem Judas registrado.
  select peak_member_count, judas_user_id
    into v_peak, v_judas_existente
    from public.study_groups
   where id = p_group_id;

  -- Primeira saída de um grupo que já teve 12+ membros → marca o Judas.
  if v_peak >= 12 and v_judas_existente is null then
    update public.study_groups
       set judas_user_id = v_user_id,
           judas_left_at = v_left_at
     where id = p_group_id
       and judas_user_id is null;

    if found then
      -- Carta "Iscariotes" para esse usuário (contador 'foi_o_judas' = 1).
      perform public.fn_registrar_evento_carta(v_user_id, 'foi_o_judas', 1);
    end if;
  end if;
end; $$;

grant execute on function public.fn_grupo_estudo_sair(uuid) to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 5. trigger pós-INSERT/UPDATE em study_group_members
-- ----------------------------------------------------------------------------
-- Sucessor de trg_cartas_after_grupo_membro: agora trata:
--   * INSERT (entrada nova)
--   * UPDATE (volta de quem saiu)
-- Em UPDATE com rejoined_at populado dentro de 30 dias de left_at,
-- registra contador 'pedro_restaurado'.
-- Quando entra um 13º membro num grupo com Judas marcado, registra
-- contador 'foi_o_matias' pra esse novo membro.
-- ----------------------------------------------------------------------------
create or replace function public.trg_cartas_after_grupo_membro_v2()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_membro       uuid;
  v_active_count int;
  v_judas        uuid;
  v_left_epoch   int;
  v_voltou       boolean := false;
  v_target_user  uuid;
begin
  if tg_op = 'INSERT' then
    -- recalcula member_count/peak
    perform public.fn_recalc_member_count(new.group_id);

    -- Se entrou em grupo com Judas e o grupo voltou a ter 13 ativos, este é o Matias.
    select judas_user_id into v_judas from public.study_groups where id = new.group_id;
    select count(*) into v_active_count
      from public.study_group_members
     where group_id = new.group_id and left_at is null;

    if v_judas is not null and v_active_count = 13 and new.user_id <> v_judas then
      perform public.fn_registrar_evento_carta(new.user_id, 'foi_o_matias', 1);
    end if;

    -- Reavalia todos os membros ativos (carta "Os Doze Apóstolos" depende de
    -- grupo_estudo_tamanho).
    for v_membro in
      select user_id from public.study_group_members
       where group_id = new.group_id and left_at is null
    loop
      perform public.fn_avaliar_cartas(v_membro);
    end loop;

  elsif tg_op = 'UPDATE' then
    -- Volta: left_at era NOT NULL e agora foi setado rejoined_at, OU left_at→null.
    if (old.left_at is not null) and (
         new.rejoined_at is not null and old.rejoined_at is null
         or new.left_at is null
       )
    then
      v_voltou := true;
    end if;

    if v_voltou then
      -- Recalcula
      perform public.fn_recalc_member_count(new.group_id);

      -- Diferença entre saída e volta. Se < 30 dias, Pedro Restaurado.
      select valor into v_left_epoch
        from public.user_carta_progresso
       where user_id = new.user_id
         and chave   = 'saiu_grupo_' || new.group_id::text;

      if v_left_epoch is not null
         and (extract(epoch from now())::int - v_left_epoch) <= 30 * 86400
      then
        perform public.fn_registrar_evento_carta(new.user_id, 'pedro_restaurado', 1);
      end if;

      -- Reavalia ele
      perform public.fn_avaliar_cartas(new.user_id);
    end if;
  end if;

  return new;
end; $$;

drop trigger if exists tg_cartas_after_grupo_membro on public.study_group_members;
drop trigger if exists tg_cartas_after_grupo_membro_v2 on public.study_group_members;
create trigger tg_cartas_after_grupo_membro_v2
  after insert or update on public.study_group_members
  for each row execute function public.trg_cartas_after_grupo_membro_v2();

revoke all on function public.trg_cartas_after_grupo_membro_v2() from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 6. RPC: voltar a um grupo (rejoin)
-- ----------------------------------------------------------------------------
-- Marca rejoined_at + zera left_at. Trigger acima cuida do contador.
-- ----------------------------------------------------------------------------
create or replace function public.fn_grupo_estudo_voltar(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'não autenticado';
  end if;

  update public.study_group_members
     set rejoined_at = now(),
         left_at     = null
   where group_id = p_group_id
     and user_id  = v_user_id
     and left_at is not null;
end; $$;

grant execute on function public.fn_grupo_estudo_voltar(uuid) to authenticated, service_role;

commit;
