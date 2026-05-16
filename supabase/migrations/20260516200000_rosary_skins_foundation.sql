-- ============================================================================
-- Códex Veritas — Sistema de Skins de Terço (Loja interna)
-- ============================================================================
-- Espelho do sistema de cartas (20260519000000_cartas_foundation), aplicado
-- a "skins" do rosário: variações visuais + temáticas que o usuário desbloqueia
-- por conteúdo, código de resgate (terço físico) ou direto.
--
-- Tabelas:
--   rosary_skins              — catálogo (theme JSONB, mysteries JSONB, regras).
--   user_rosary_skins         — coleção do usuário.
--   rosary_redemption_codes   — códigos de terço físico → skin virtual.
--   profiles.active_rosary_skin_id — qual skin o usuário está usando.
--
-- Funções:
--   fn_avaliar_rosary_skins(user_id)  — reusa fn_avaliar_condicao_carta,
--     destrava skins cujas regras o user já cumpre.
--   fn_redimir_rosary_code(codigo)    — consome código físico → INSERT.
--   fn_grant_initial_skins(user_id)   — dá as skins canônicas (devocional
--     clássico + missal tridentino) gratuitamente.
--
-- Hook: fn_avaliar_cartas é estendida pra chamar fn_avaliar_rosary_skins
-- no final — todo evento que reavalia cartas também reavalia skins.
-- Single source of truth, sem duplicar triggers.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. rosary_skins — catálogo de skins
-- ----------------------------------------------------------------------------
create table if not exists public.rosary_skins (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null
                        check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nome                text not null check (char_length(nome) <= 80),
  subtitulo           text check (subtitulo is null or char_length(subtitulo) <= 120),
  descricao           text check (descricao is null or char_length(descricao) <= 600),
  epigraph            text check (epigraph is null or char_length(epigraph) <= 240),

  -- Categorização
  categoria           text not null default 'devocional'
                        check (categoria in ('canonico','devocional','santo','doutrina','comemorativo','exclusivo')),
  raridade            text not null default 'comum'
                        check (raridade in ('comum','rara','epica','lendaria','suprema')),

  -- Visual: theme tokens (paleta + variantes de glyph)
  -- Shape esperado:
  --   { pageBg, pageBgAmbient, accent, accentLight, accentDeep,
  --     textPrimary, textSecondary, textMuted, border, borderStrong,
  --     cardBg, cardBorder, buttonGradient: [c1, c2], buttonText,
  --     beadCurrentStops: [c1,c2,c3], beadFutureStops: [c1,c2],
  --     beadCompletedStops: [c1,c2], cordStroke,
  --     crucifixVariant: 'classic'|'benedictine'|'budded'|'celtic'|'pio',
  --     introBeadVariant: 'classic'|'medal-bento'|'medal-divine-mercy'|'rose',
  --     beadShape: 'sphere'|'rose'|'cube'|'oval' }
  theme               jsonb not null default '{}'::jsonb,

  -- Mistérios: array de 5 itens (number, title, fruit, scripture, reflection,
  -- latinTitle?, latinFruit?, latinScripture?, latinReflection?). Quando NULL,
  -- a sessão usa o set canônico do dia (gozosos/dolorosos/...).
  mysteries           jsonb,

  -- Quando mysteries é NULL e a skin força um set específico, este campo
  -- indica qual. Útil pra skin "Devocional Clássico - Gloriosos" e similares.
  -- NULL = engine escolhe pelo dia da semana.
  base_mystery_set    rosary_mystery_set,

  -- Preview / cover
  preview_url         text check (preview_url is null or char_length(preview_url) <= 1000),
  glyph               text not null default '✦' check (char_length(glyph) <= 4),

  -- Unlock
  unlock_tipo         text not null default 'free'
                        check (unlock_tipo in ('free','rules','commerce','admin_only','coming_soon')),
  -- Mesma gramática de cartas.regras:
  --   { "operador": "todas"|"qualquer", "condicoes": [ {tipo,ref,valor}, ... ] }
  unlock_regras       jsonb not null default '{"operador":"todas","condicoes":[]}'::jsonb,
  -- Texto humano que aparece quando bloqueado ("Conclua a trilha de Mariologia")
  unlock_label        text check (unlock_label is null or char_length(unlock_label) <= 200),

  -- Commerce
  sku                 text unique check (sku is null or sku ~ '^[A-Z0-9_-]{3,40}$'),
  preco_cents         integer not null default 0 check (preco_cents >= 0),

  -- Meta
  ordem               int not null default 0,
  visivel             boolean not null default true,
  status              text not null default 'draft'
                        check (status in ('draft','published','archived')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists rosary_skins_visivel_ordem_idx
  on public.rosary_skins (status, visivel, ordem)
  where status = 'published' and visivel = true;

create index if not exists rosary_skins_categoria_idx
  on public.rosary_skins (categoria, ordem)
  where status = 'published';

-- ----------------------------------------------------------------------------
-- 2. user_rosary_skins — coleção do usuário
-- ----------------------------------------------------------------------------
create table if not exists public.user_rosary_skins (
  user_id      uuid not null references auth.users(id) on delete cascade,
  skin_id      uuid not null references public.rosary_skins(id) on delete cascade,
  unlocked_at  timestamptz not null default now(),
  fonte        text not null
                  check (fonte in ('initial','auto','commerce','redemption','admin_grant')),
  primary key (user_id, skin_id)
);

create index if not exists user_rosary_skins_user_unlocked_idx
  on public.user_rosary_skins (user_id, unlocked_at desc);

-- ----------------------------------------------------------------------------
-- 3. rosary_redemption_codes — códigos físicos → skins
-- ----------------------------------------------------------------------------
create table if not exists public.rosary_redemption_codes (
  codigo               text primary key
                         check (codigo ~ '^[A-Z0-9]{6,16}$'),
  skin_id              uuid not null references public.rosary_skins(id) on delete cascade,
  -- Lote (pra rastrear "fabriquei 500 medalhas do Padre Pio em junho/2026").
  lote                 text check (lote is null or char_length(lote) <= 60),
  used_by_user_id      uuid references auth.users(id) on delete set null,
  used_at              timestamptz,
  notes                text check (notes is null or char_length(notes) <= 400),
  created_at           timestamptz not null default now(),
  created_by_admin_id  uuid references auth.users(id) on delete set null
);

create index if not exists rosary_redemption_codes_skin_idx
  on public.rosary_redemption_codes (skin_id)
  where used_at is null;

create index if not exists rosary_redemption_codes_lote_idx
  on public.rosary_redemption_codes (lote)
  where lote is not null;

-- ----------------------------------------------------------------------------
-- 4. profiles.active_rosary_skin_id — skin equipada
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists active_rosary_skin_id uuid
    references public.rosary_skins(id) on delete set null;

-- ----------------------------------------------------------------------------
-- 5. updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function public.rosary_skins_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists trg_rosary_skins_updated_at on public.rosary_skins;
create trigger trg_rosary_skins_updated_at
  before update on public.rosary_skins
  for each row execute function public.rosary_skins_set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. RLS
-- ----------------------------------------------------------------------------
alter table public.rosary_skins enable row level security;
alter table public.user_rosary_skins enable row level security;
alter table public.rosary_redemption_codes enable row level security;

-- rosary_skins: SELECT pra todos (catálogo). Visíveis publicadas.
drop policy if exists rosary_skins_select_public on public.rosary_skins;
create policy rosary_skins_select_public on public.rosary_skins
  for select using (status = 'published' and visivel = true);

-- Admin pode tudo
drop policy if exists rosary_skins_admin_all on public.rosary_skins;
create policy rosary_skins_admin_all on public.rosary_skins
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- user_rosary_skins: SELECT só do próprio
drop policy if exists user_rosary_skins_select_own on public.user_rosary_skins;
create policy user_rosary_skins_select_own on public.user_rosary_skins
  for select using (user_id = auth.uid());

-- INSERT: pelo próprio user via RPC (security definer). Sem policy de INSERT
-- direto = deny by default. Apenas SECURITY DEFINER functions inserem.

-- rosary_redemption_codes: admin lê tudo. Usuário comum não lê (mas usa RPC
-- pra redimir).
drop policy if exists rosary_redemption_codes_admin on public.rosary_redemption_codes;
create policy rosary_redemption_codes_admin on public.rosary_redemption_codes
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ----------------------------------------------------------------------------
-- 7. fn_avaliar_rosary_skins — motor de unlock
-- Reusa fn_avaliar_condicao_carta (mesma gramática). Skins com
-- unlock_tipo='rules' avaliam regras. Outras (free, commerce, admin_only,
-- coming_soon) são ignoradas aqui — free vai pelo grant inicial, commerce
-- pela RPC de resgate, admin_only e coming_soon pela admin.
-- ----------------------------------------------------------------------------
create or replace function public.fn_avaliar_rosary_skins(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_skin     record;
  v_cond     jsonb;
  v_operador text;
  v_total    int;
  v_ok       int;
begin
  if p_user_id is null then return; end if;

  for v_skin in
    select s.id, s.unlock_regras
    from public.rosary_skins s
    where s.status = 'published'
      and s.visivel = true
      and s.unlock_tipo = 'rules'
      and not exists (
        select 1 from public.user_rosary_skins us
        where us.user_id = p_user_id and us.skin_id = s.id
      )
  loop
    v_operador := coalesce(v_skin.unlock_regras->>'operador', 'todas');
    v_total := 0;
    v_ok := 0;

    for v_cond in
      select * from jsonb_array_elements(
        coalesce(v_skin.unlock_regras->'condicoes', '[]'::jsonb)
      )
    loop
      v_total := v_total + 1;
      -- Reusa o avaliador de cartas — mesma DSL exata.
      if public.fn_avaliar_condicao_carta(p_user_id, v_cond) then
        v_ok := v_ok + 1;
      end if;
    end loop;

    if v_total > 0 and (
         (v_operador = 'todas'    and v_ok = v_total) or
         (v_operador = 'qualquer' and v_ok >= 1)
       ) then
      insert into public.user_rosary_skins (user_id, skin_id, fonte)
      values (p_user_id, v_skin.id, 'auto')
      on conflict do nothing;
    end if;
  end loop;
end; $$;

revoke all on function public.fn_avaliar_rosary_skins(uuid) from public, anon, authenticated;
grant execute on function public.fn_avaliar_rosary_skins(uuid) to service_role;

-- ----------------------------------------------------------------------------
-- 8. fn_grant_initial_skins — concede skins canônicas (free + categoria=canonico)
-- Chamado na criação do profile e backfill. Idempotente.
-- ----------------------------------------------------------------------------
create or replace function public.fn_grant_initial_skins(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user_id is null then return; end if;

  insert into public.user_rosary_skins (user_id, skin_id, fonte)
  select p_user_id, s.id, 'initial'
  from public.rosary_skins s
  where s.status = 'published'
    and s.visivel = true
    and s.unlock_tipo = 'free'
  on conflict do nothing;
end; $$;

revoke all on function public.fn_grant_initial_skins(uuid) from public, anon, authenticated;
grant execute on function public.fn_grant_initial_skins(uuid) to service_role;

-- ----------------------------------------------------------------------------
-- 9. fn_redimir_rosary_code — usa um código físico, libera a skin.
-- ----------------------------------------------------------------------------
create or replace function public.fn_redimir_rosary_code(p_codigo text)
returns public.rosary_skins
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_code    record;
  v_skin    public.rosary_skins;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- Lock pra evitar dois resgates simultâneos do mesmo código
  select * into v_code
  from public.rosary_redemption_codes
  where codigo = upper(p_codigo)
  for update;

  if not found then
    raise exception 'code_not_found' using errcode = 'P0002';
  end if;

  if v_code.used_at is not null then
    -- Se já usou o mesmo user (refresh), retorna a skin como sucesso idempotente
    if v_code.used_by_user_id = v_user_id then
      select * into v_skin from public.rosary_skins where id = v_code.skin_id;
      return v_skin;
    end if;
    raise exception 'code_already_used' using errcode = 'P0003';
  end if;

  -- Marca como usado
  update public.rosary_redemption_codes
  set used_by_user_id = v_user_id,
      used_at = now()
  where codigo = v_code.codigo;

  -- Concede a skin (idempotente)
  insert into public.user_rosary_skins (user_id, skin_id, fonte)
  values (v_user_id, v_code.skin_id, 'redemption')
  on conflict do nothing;

  select * into v_skin from public.rosary_skins where id = v_code.skin_id;
  return v_skin;
end; $$;

revoke all on function public.fn_redimir_rosary_code(text) from public, anon;
grant execute on function public.fn_redimir_rosary_code(text) to authenticated;

-- ----------------------------------------------------------------------------
-- 10. Hook em fn_avaliar_cartas — chama fn_avaliar_rosary_skins no final.
-- Re-cria a função preservando a lógica original, adicionando o perform
-- no fim. Todos os triggers que já invocavam fn_avaliar_cartas agora
-- também reavaliam skins automaticamente.
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

    if v_total > 0 and (
         (v_operador = 'todas'    and v_ok = v_total) or
         (v_operador = 'qualquer' and v_ok >= 1)
       ) then
      insert into public.user_cartas (user_id, carta_id)
      values (p_user_id, v_carta.id)
      on conflict do nothing;
    end if;
  end loop;

  -- HOOK: reavalia skins de terço também (mesma DSL).
  perform public.fn_avaliar_rosary_skins(p_user_id);
end; $$;

revoke all on function public.fn_avaliar_cartas(uuid) from public, anon, authenticated;
grant execute on function public.fn_avaliar_cartas(uuid) to service_role;

-- ----------------------------------------------------------------------------
-- 11. Trigger: novo profile → grant initial + avaliar rules
-- ----------------------------------------------------------------------------
create or replace function public.fn_rosary_skins_on_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.fn_grant_initial_skins(new.id);
  perform public.fn_avaliar_rosary_skins(new.id);
  return new;
end; $$;

revoke all on function public.fn_rosary_skins_on_new_profile() from public, anon, authenticated;

drop trigger if exists trg_rosary_skins_grant_on_new_profile on public.profiles;
create trigger trg_rosary_skins_grant_on_new_profile
  after insert on public.profiles
  for each row execute function public.fn_rosary_skins_on_new_profile();

commit;
