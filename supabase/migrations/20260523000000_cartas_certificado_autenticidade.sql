-- ============================================================================
-- Códex Veritas — Certificado de Autenticidade (NFT-style off-chain)
-- ============================================================================
-- Cada carta desbloqueada (`user_cartas`) ganha:
--   serial_number  — número de série sequencial POR carta ("#042")
--   token          — chave URL-safe pra rota pública /c/<token> (lookup)
--   signature      — HMAC-SHA256(secret, user_id|carta_id|serial|minted_at)
--   minted_at      — timestamp definitivo da cunhagem
--
-- O segredo HMAC vive em `private.app_secrets` (schema sem grants — só
-- security-definer functions leem). Sem o segredo é impossível forjar uma
-- assinatura: o servidor (e qualquer um com acesso ao banco) pode VERIFICAR
-- recomputando o HMAC, mas só quem tem o segredo CONSEGUE ASSINAR.
--
-- Verificação pública:
--   public.fn_verificar_carta(token) — anon-callable, retorna o "certificado"
--   (dono, carta, série, hash, data) se o token existir e a assinatura
--   recalculada bater. Usada pela página /c/<token>.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 0. extensão pgcrypto (hmac, gen_random_bytes, encode/decode)
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;

-- ----------------------------------------------------------------------------
-- 1. schema privado pra segredos do app
-- ----------------------------------------------------------------------------
create schema if not exists private;

-- Garante que NINGUÉM lê o schema (nem authenticated, nem anon, nem
-- service_role via PostgREST). Apenas funções SECURITY DEFINER que tenham
-- `private` no search_path conseguem ver o conteúdo.
revoke all on schema private from public;
revoke all on schema private from anon, authenticated, service_role;
grant usage on schema private to postgres;

create table if not exists private.app_secrets (
  key        text primary key,
  value      text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

revoke all on private.app_secrets from public;
revoke all on private.app_secrets from anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. seed do segredo HMAC (idempotente — só cria se ainda não existe)
-- ----------------------------------------------------------------------------
-- gen_random_bytes(32) → 256 bits de entropia, codificados em hex (64 chars).
-- Pra rotacionar manualmente: UPDATE private.app_secrets SET value = ...
-- (mas as cartas existentes deixam de verificar — só faça em rollover total).
do $$
begin
  if not exists (select 1 from private.app_secrets where key = 'cartas_hmac_v1') then
    insert into private.app_secrets (key, value)
    values ('cartas_hmac_v1', encode(extensions.gen_random_bytes(32), 'hex'));
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 3. colunas novas em user_cartas
-- ----------------------------------------------------------------------------
alter table public.user_cartas
  add column if not exists serial_number int,
  add column if not exists token         text,
  add column if not exists signature     text,
  add column if not exists minted_at     timestamptz;

-- token único globalmente (lookup por URL pública)
create unique index if not exists user_cartas_token_uq
  on public.user_cartas (token)
  where token is not null;

-- série única POR carta (#042 só existe uma vez por personagem-variação)
create unique index if not exists user_cartas_carta_serial_uq
  on public.user_cartas (carta_id, serial_number)
  where serial_number is not null;

-- ----------------------------------------------------------------------------
-- 4. contador de tiragem POR carta (centralizado pra evitar race em concorrência)
-- ----------------------------------------------------------------------------
-- Atualizado pelo trigger `tg_user_cartas_assinar`. Atomico via UPSERT.
create table if not exists public.cartas_serial_counter (
  carta_id     uuid primary key references public.cartas(id) on delete cascade,
  last_serial  int  not null default 0,
  updated_at   timestamptz not null default now()
);

alter table public.cartas_serial_counter enable row level security;

drop policy if exists "cartas_serial_counter_public_read" on public.cartas_serial_counter;
create policy "cartas_serial_counter_public_read"
  on public.cartas_serial_counter for select
  to anon, authenticated
  using (true);

grant select on public.cartas_serial_counter to anon, authenticated;
grant select, insert, update, delete on public.cartas_serial_counter to service_role;

-- ----------------------------------------------------------------------------
-- 5. fn_assinar_user_carta — calcula serial + token + signature
-- ----------------------------------------------------------------------------
-- Chamada pelo trigger BEFORE INSERT/UPDATE em user_cartas. Idempotente:
-- se a linha já tem serial/signature, mantém (não re-mintar).
-- ----------------------------------------------------------------------------
create or replace function public.fn_assinar_user_carta()
returns trigger
language plpgsql
security definer
set search_path = public, private, extensions, pg_temp
as $$
declare
  v_serial    int;
  v_secret    text;
  v_payload   text;
  v_sig_bytes bytea;
  v_sig_hex   text;
  v_token     text;
  v_minted    timestamptz;
  v_attempt   int := 0;
begin
  -- minted_at sempre coalesce com desbloqueada_em (que tem default now())
  v_minted := coalesce(new.minted_at, new.desbloqueada_em, now());
  new.minted_at := v_minted;

  -- Se já tem serial+signature (re-update sem re-mintar), respeita.
  if new.serial_number is not null and new.signature is not null then
    return new;
  end if;

  -- Aloca próximo serial atomicamente (UPSERT com RETURNING).
  insert into public.cartas_serial_counter (carta_id, last_serial, updated_at)
  values (new.carta_id, 1, now())
  on conflict (carta_id) do update
    set last_serial = public.cartas_serial_counter.last_serial + 1,
        updated_at  = now()
  returning last_serial into v_serial;

  new.serial_number := v_serial;

  -- Lê o segredo (nunca exposto a authenticated/anon — apenas via SECURITY DEFINER).
  select value into v_secret
    from private.app_secrets
   where key = 'cartas_hmac_v1';

  if v_secret is null then
    raise exception 'cartas: segredo HMAC ausente em private.app_secrets';
  end if;

  -- Payload canônico: campos em ordem fixa, separador "|".
  v_payload := new.user_id::text
            || '|' || new.carta_id::text
            || '|' || v_serial::text
            || '|' || extract(epoch from v_minted)::bigint::text;

  v_sig_bytes := extensions.hmac(v_payload, v_secret, 'sha256');
  v_sig_hex   := encode(v_sig_bytes, 'hex');
  new.signature := v_sig_hex;

  -- Token público: 16 chars hex do início da assinatura, prefixado com `vd-`.
  -- Em colisão (raríssima), incrementa um sufixo até achar livre.
  v_token := 'vd-' || substring(v_sig_hex from 1 for 16);
  while exists (select 1 from public.user_cartas uc where uc.token = v_token) loop
    v_attempt := v_attempt + 1;
    v_token := 'vd-' || substring(v_sig_hex from 1 for 16) || lpad(v_attempt::text, 2, '0');
    if v_attempt > 99 then
      raise exception 'cartas: não consegui gerar token único (% tentativas)', v_attempt;
    end if;
  end loop;
  new.token := v_token;

  return new;
end; $$;

drop trigger if exists tg_user_cartas_assinar on public.user_cartas;
create trigger tg_user_cartas_assinar
  before insert on public.user_cartas
  for each row execute function public.fn_assinar_user_carta();

-- Trigger interno — usuário NÃO pode chamar diretamente.
revoke execute on function public.fn_assinar_user_carta() from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 6. backfill — assina linhas antigas que ainda não têm certificado
-- ----------------------------------------------------------------------------
do $$
declare
  v_row     record;
  v_serial  int;
  v_secret  text;
  v_sig_hex text;
  v_token   text;
  v_minted  timestamptz;
  v_attempt int;
begin
  select value into v_secret from private.app_secrets where key = 'cartas_hmac_v1';
  if v_secret is null then return; end if;

  for v_row in
    select user_id, carta_id, desbloqueada_em
      from public.user_cartas
     where serial_number is null or signature is null
     order by desbloqueada_em asc
  loop
    v_minted := coalesce(v_row.desbloqueada_em, now());

    insert into public.cartas_serial_counter (carta_id, last_serial, updated_at)
    values (v_row.carta_id, 1, now())
    on conflict (carta_id) do update
      set last_serial = public.cartas_serial_counter.last_serial + 1,
          updated_at  = now()
    returning last_serial into v_serial;

    v_sig_hex := encode(
      extensions.hmac(
        v_row.user_id::text
        || '|' || v_row.carta_id::text
        || '|' || v_serial::text
        || '|' || extract(epoch from v_minted)::bigint::text,
        v_secret,
        'sha256'
      ),
      'hex'
    );

    v_attempt := 0;
    v_token := 'vd-' || substring(v_sig_hex from 1 for 16);
    while exists (select 1 from public.user_cartas uc where uc.token = v_token) loop
      v_attempt := v_attempt + 1;
      v_token := 'vd-' || substring(v_sig_hex from 1 for 16) || lpad(v_attempt::text, 2, '0');
      exit when v_attempt > 99;
    end loop;

    update public.user_cartas
       set serial_number = v_serial,
           token         = v_token,
           signature     = v_sig_hex,
           minted_at     = v_minted
     where user_id  = v_row.user_id
       and carta_id = v_row.carta_id;
  end loop;
end $$;

-- Agora exigimos NOT NULL — qualquer carta nova já passa pelo trigger.
alter table public.user_cartas
  alter column serial_number set not null,
  alter column token         set not null,
  alter column signature     set not null,
  alter column minted_at     set not null;

-- ----------------------------------------------------------------------------
-- 7. fn_verificar_carta — endpoint público de verificação
-- ----------------------------------------------------------------------------
-- Recebe um token, recalcula a assinatura e — se bater — retorna o
-- "certificado" público (sem expor uuids internos do sistema).
-- Devolve NULL se o token não existe ou se a assinatura armazenada não
-- corresponde ao recálculo (indicando adulteração).
-- ----------------------------------------------------------------------------
create or replace function public.fn_verificar_carta(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, private, extensions, pg_temp
as $$
declare
  v_uc       record;
  v_carta    record;
  v_perso    record;
  v_owner    record;
  v_secret   text;
  v_recalc   text;
begin
  if p_token is null or length(p_token) < 6 then
    return null;
  end if;

  select uc.user_id, uc.carta_id, uc.serial_number, uc.signature,
         uc.minted_at, uc.desbloqueada_em
    into v_uc
    from public.user_cartas uc
   where uc.token = p_token;

  if not found then
    return null;
  end if;

  select value into v_secret from private.app_secrets where key = 'cartas_hmac_v1';
  if v_secret is null then
    return null;
  end if;

  v_recalc := encode(
    extensions.hmac(
      v_uc.user_id::text
      || '|' || v_uc.carta_id::text
      || '|' || v_uc.serial_number::text
      || '|' || extract(epoch from v_uc.minted_at)::bigint::text,
      v_secret,
      'sha256'
    ),
    'hex'
  );

  -- Comparação constant-time-ish: usa = sobre strings de mesmo tamanho.
  if v_recalc <> v_uc.signature then
    return jsonb_build_object('valid', false, 'reason', 'assinatura_invalida');
  end if;

  select c.id, c.slug, c.nome, c.subtitulo, c.numero, c.raridade, c.estrelas,
         c.frase_central, c.frase_referencia, c.simbolo, c.cor_accent,
         c.ilustracao_url, c.moldura, c.escala_fonte, c.categoria,
         c.personagem_id, c.lore, c.recompensa, c.autoridade_doutrinaria,
         c.efeito_simbolico, c.concilio, c.virtude
    into v_carta
    from public.cartas c where c.id = v_uc.carta_id;

  select p.slug, p.nome into v_perso
    from public.personagens p where p.id = v_carta.personagem_id;

  select pr.user_number, pr.public_handle, pr.name, pr.profile_image_url,
         pr.verified
    into v_owner
    from public.profiles pr where pr.id = v_uc.user_id;

  return jsonb_build_object(
    'valid', true,
    'token', p_token,
    'serial_number', v_uc.serial_number,
    'tiragem_atual', (
      select last_serial from public.cartas_serial_counter
       where carta_id = v_uc.carta_id
    ),
    'minted_at', v_uc.minted_at,
    'signature_hex', v_uc.signature,
    'owner', jsonb_build_object(
      'user_number',         v_owner.user_number,
      'public_handle',       v_owner.public_handle,
      'name',                v_owner.name,
      'profile_image_url',   v_owner.profile_image_url,
      'verified',            coalesce(v_owner.verified, false)
    ),
    'carta', jsonb_build_object(
      'id',                     v_carta.id,
      'slug',                   v_carta.slug,
      'numero',                 v_carta.numero,
      'nome',                   v_carta.nome,
      'subtitulo',              v_carta.subtitulo,
      'categoria',              v_carta.categoria,
      'raridade',               v_carta.raridade,
      'estrelas',               v_carta.estrelas,
      'frase_central',          v_carta.frase_central,
      'frase_referencia',       v_carta.frase_referencia,
      'simbolo',                v_carta.simbolo,
      'cor_accent',             v_carta.cor_accent,
      'ilustracao_url',         v_carta.ilustracao_url,
      'moldura',                v_carta.moldura,
      'escala_fonte',           v_carta.escala_fonte,
      'lore',                   v_carta.lore,
      'autoridade_doutrinaria', v_carta.autoridade_doutrinaria,
      'efeito_simbolico',       v_carta.efeito_simbolico,
      'recompensa',             v_carta.recompensa,
      'concilio',               v_carta.concilio,
      'virtude',                v_carta.virtude
    ),
    'personagem', jsonb_build_object(
      'slug', v_perso.slug,
      'nome', v_perso.nome
    )
  );
end; $$;

grant execute on function public.fn_verificar_carta(text) to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 8. equipped_carta_id em user_gamification (vitrine ao lado do nome)
-- ----------------------------------------------------------------------------
alter table public.user_gamification
  add column if not exists equipped_carta_id uuid;

-- FK soft (set null se a carta sumir do catálogo).
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'user_gamification_equipped_carta_fk'
  ) then
    alter table public.user_gamification
      add constraint user_gamification_equipped_carta_fk
      foreign key (equipped_carta_id) references public.cartas(id) on delete set null;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 9. fn_equipar_carta — RPC pra trocar a carta-vitrine
-- ----------------------------------------------------------------------------
-- Valida que o usuário desbloqueou a carta antes de equipar (impede equipar
-- carta que não é sua via REST direto).
-- ----------------------------------------------------------------------------
create or replace function public.fn_equipar_carta(p_carta_id uuid)
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

  if p_carta_id is null then
    update public.user_gamification
       set equipped_carta_id = null, updated_at = now()
     where user_id = v_user_id;
    return;
  end if;

  if not exists (
    select 1 from public.user_cartas
     where user_id = v_user_id and carta_id = p_carta_id
  ) then
    raise exception 'carta não desbloqueada por este usuário';
  end if;

  insert into public.user_gamification (user_id, equipped_carta_id, updated_at)
  values (v_user_id, p_carta_id, now())
  on conflict (user_id) do update
    set equipped_carta_id = excluded.equipped_carta_id,
        updated_at        = now();
end; $$;

grant execute on function public.fn_equipar_carta(uuid) to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 10. Atualiza get_public_profile_snapshot — agora também devolve a carta
--     equipada (vitrine pública, ao lado do nome no perfil).
-- ----------------------------------------------------------------------------
create or replace function public.get_public_profile_snapshot(identifier text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_identifier      text := btrim(identifier);
  v_user_id         uuid;
  v_profile         jsonb;
  v_veritas         jsonb;
  v_follower_count  int;
  v_following_count int;
  v_veritas_count   int;
  v_gami            record;
  v_equipped_rel    jsonb;
  v_equipped_carta  jsonb;
begin
  if v_identifier = '' then
    return jsonb_build_object('profile', null, 'veritas', '[]'::jsonb);
  end if;

  if left(v_identifier, 1) = '@' then
    v_identifier := substr(v_identifier, 2);
  end if;

  if v_identifier ~ '^[0-9]+$' then
    select p.id into v_user_id
      from public.profiles p
     where p.user_number = v_identifier::integer
     limit 1;
  else
    select p.id into v_user_id
      from public.profiles p
     where lower(p.public_handle) = lower(v_identifier)
     limit 1;
  end if;

  if v_user_id is null then
    return jsonb_build_object('profile', null, 'veritas', '[]'::jsonb);
  end if;

  select count(*) into v_follower_count
    from public.vd_follows where followed_user_id = v_user_id;

  select count(*) into v_following_count
    from public.vd_follows where follower_user_id = v_user_id;

  select count(*) into v_veritas_count
    from public.vd_posts
   where author_user_id = v_user_id
     and deleted_at is null
     and kind <> 'reply';

  select total_xp, current_level, current_streak, longest_streak,
         equipped_reliquia_id, equipped_carta_id
    into v_gami
    from public.user_gamification
   where user_id = v_user_id;

  if v_gami.equipped_reliquia_id is not null then
    select jsonb_build_object(
      'id', r.id, 'slug', r.slug, 'name', r.name,
      'description', r.description, 'image_url', r.image_url,
      'rarity', r.rarity
    )
    into v_equipped_rel
    from public.reliquias r
    where r.id = v_gami.equipped_reliquia_id;
  end if;

  if v_gami.equipped_carta_id is not null then
    select jsonb_build_object(
      'id',              c.id,
      'slug',            c.slug,
      'nome',            c.nome,
      'subtitulo',       c.subtitulo,
      'numero',          c.numero,
      'raridade',        c.raridade,
      'estrelas',        c.estrelas,
      'simbolo',         c.simbolo,
      'cor_accent',      c.cor_accent,
      'ilustracao_url',  c.ilustracao_url,
      'moldura',         c.moldura,
      'serial_number',   uc.serial_number,
      'token',           uc.token,
      'minted_at',       uc.minted_at
    )
    into v_equipped_carta
    from public.cartas c
    join public.user_cartas uc
      on uc.carta_id = c.id and uc.user_id = v_user_id
    where c.id = v_gami.equipped_carta_id;
  end if;

  select jsonb_build_object(
      'id', p.id,
      'public_handle', p.public_handle,
      'user_number', p.user_number,
      'name', p.name,
      'vocacao', p.vocacao,
      'community_role', p.community_role,
      'verified', p.verified,
      'verified_at', p.verified_at,
      'profile_image_url', p.profile_image_url,
      'cover_image_url', p.cover_image_url,
      'bio_short', p.bio_short,
      'external_links', coalesce(p.external_links, '[]'::jsonb),
      'cidade', p.cidade,
      'estado', p.estado,
      'paroquia', p.paroquia,
      'diocese', p.diocese,
      'comunidade', p.comunidade,
      'relationship_status', p.relationship_status,
      'instagram', p.instagram,
      'whatsapp', p.whatsapp,
      'tiktok', p.tiktok,
      'youtube', p.youtube,
      'follower_count', v_follower_count,
      'following_count', v_following_count,
      'veritas_count', v_veritas_count,
      'created_at', p.created_at,
      'level', coalesce(v_gami.current_level, 1),
      'total_xp', coalesce(v_gami.total_xp, 0),
      'current_streak', coalesce(v_gami.current_streak, 0),
      'longest_streak', coalesce(v_gami.longest_streak, 0),
      'equipped_reliquia', v_equipped_rel,
      'equipped_carta',    v_equipped_carta
    )
    into v_profile
  from public.profiles p
  where p.id = v_user_id;

  with top_posts as (
    select
      vp.id, vp.kind, vp.body, vp.parent_post_id, vp.created_at,
      vp.city, vp.state,
      coalesce(vm.like_count, 0)        as like_count,
      coalesce(vm.repost_count, 0)      as repost_count,
      coalesce(vm.quote_count, 0)       as quote_count,
      coalesce(vm.reply_count, 0)       as reply_count,
      coalesce(vm.report_count, 0)      as report_count,
      coalesce(vm.share_cross_count, 0) as share_cross_count
    from public.vd_posts vp
    left join public.vd_post_metrics vm on vm.post_id = vp.id
    where vp.author_user_id = v_user_id
      and vp.deleted_at is null
      and vp.kind <> 'reply'
    order by vp.created_at desc
    limit 10
  ),
  media_by_post as (
    select pm.post_id,
      jsonb_agg(
        jsonb_build_object(
          'id', ma.id, 'kind', ma.media_kind, 'mime_type', ma.mime_type,
          'object_key', ma.object_key, 'width', ma.width, 'height', ma.height,
          'variants', ma.variants, 'position', pm.position
        ) order by pm.position asc
      ) as media
    from public.vd_post_media pm
    join public.vd_media_assets ma on ma.id = pm.media_asset_id
    group by pm.post_id
  )
  select jsonb_agg(
    jsonb_build_object(
      'id', tp.id, 'kind', tp.kind, 'body', tp.body,
      'parent_post_id', tp.parent_post_id, 'created_at', tp.created_at,
      'city', tp.city, 'state', tp.state,
      'metrics', jsonb_build_object(
        'like_count', tp.like_count,
        'repost_count', tp.repost_count,
        'quote_count', tp.quote_count,
        'reply_count', tp.reply_count,
        'report_count', tp.report_count,
        'share_cross_count', tp.share_cross_count
      ),
      'media', coalesce(mbp.media, '[]'::jsonb)
    ) order by tp.created_at desc
  )
  into v_veritas
  from top_posts tp
  left join media_by_post mbp on mbp.post_id = tp.id;

  return jsonb_build_object(
    'profile', v_profile,
    'veritas', coalesce(v_veritas, '[]'::jsonb)
  );
end; $$;

grant execute on function public.get_public_profile_snapshot(text) to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 11. comentários documentais
-- ----------------------------------------------------------------------------
comment on column public.user_cartas.serial_number is
  'Número de série sequencial POR carta (#042 etc). Único por (carta_id, serial_number).';
comment on column public.user_cartas.token is
  'Token URL-safe pra rota pública de verificação /c/<token>. Único globalmente.';
comment on column public.user_cartas.signature is
  'HMAC-SHA256(secret, user_id|carta_id|serial|minted_at_epoch). Verificável via fn_verificar_carta.';
comment on column public.user_cartas.minted_at is
  'Timestamp definitivo da cunhagem — entra na assinatura, então não muda.';
comment on table public.cartas_serial_counter is
  'Contador atômico do próximo serial por carta. Cresce monotonicamente.';
comment on function public.fn_verificar_carta(text) is
  'Verifica autenticidade de uma carta pelo token público. Retorna o certificado completo se a assinatura bater, NULL se token inexistente, ou {valid:false} se adulterada.';
comment on function public.fn_equipar_carta(uuid) is
  'Equipa uma carta como vitrine no perfil do usuário. Valida ownership.';

commit;
