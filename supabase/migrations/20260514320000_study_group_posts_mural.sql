-- Mural de reflexões coletivas do grupo de estudo.
-- Posts curtos que qualquer membro escreve; autor ou dono podem apagar;
-- dono pode fixar (pin) uma reflexão no topo.

create table if not exists public.study_group_posts (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.study_groups(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  body        text not null check (char_length(btrim(body)) between 1 and 2000),
  pinned      boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_study_group_posts_group_created
  on public.study_group_posts (group_id, pinned desc, created_at desc);

alter table public.study_group_posts enable row level security;

revoke all on public.study_group_posts from anon, authenticated;
grant select, insert, update, delete on public.study_group_posts to authenticated;

drop policy if exists study_group_posts_select_member on public.study_group_posts;
create policy study_group_posts_select_member
  on public.study_group_posts for select
  using (public.is_study_group_member(group_id));

drop policy if exists study_group_posts_insert_member on public.study_group_posts;
create policy study_group_posts_insert_member
  on public.study_group_posts for insert
  with check (
    user_id = auth.uid()
    and public.is_study_group_member(group_id)
  );

-- autor pode editar/apagar o próprio; dono pode editar/apagar qualquer (pin/moderação)
drop policy if exists study_group_posts_update on public.study_group_posts;
create policy study_group_posts_update
  on public.study_group_posts for update
  using (user_id = auth.uid() or public.is_study_group_owner(group_id))
  with check (user_id = auth.uid() or public.is_study_group_owner(group_id));

drop policy if exists study_group_posts_delete on public.study_group_posts;
create policy study_group_posts_delete
  on public.study_group_posts for delete
  using (user_id = auth.uid() or public.is_study_group_owner(group_id));

-- ──────────────────────────────────────────────────────────────────────
-- RPC: study_group_posts_list — mural com autor hidratado
-- ──────────────────────────────────────────────────────────────────────
create or replace function public.study_group_posts_list(p_group_id uuid, p_limit int default 30)
returns table (
  id uuid,
  user_id uuid,
  name text,
  profile_image_url text,
  public_handle text,
  body text,
  pinned boolean,
  created_at timestamptz,
  can_delete boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit int := least(greatest(p_limit, 1), 100);
  v_is_owner boolean;
begin
  if not public.is_study_group_member(p_group_id) then
    raise exception 'Not a member of the group';
  end if;
  v_is_owner := public.is_study_group_owner(p_group_id);

  return query
  select
    sp.id,
    sp.user_id,
    pr.name,
    pr.profile_image_url,
    pr.public_handle,
    sp.body,
    sp.pinned,
    sp.created_at,
    (sp.user_id = auth.uid() or v_is_owner) as can_delete
  from public.study_group_posts sp
  left join public.profiles pr on pr.id = sp.user_id
  where sp.group_id = p_group_id
  order by sp.pinned desc, sp.created_at desc
  limit v_limit;
end;
$$;

revoke execute on function public.study_group_posts_list(uuid, int) from anon, public;
grant execute on function public.study_group_posts_list(uuid, int) to authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────
-- RPC: study_group_posts_create
-- ──────────────────────────────────────────────────────────────────────
create or replace function public.study_group_posts_create(p_group_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_clean text := btrim(coalesce(p_body, ''));
begin
  if not public.is_study_group_member(p_group_id) then
    raise exception 'Not a member of the group';
  end if;
  if char_length(v_clean) < 1 or char_length(v_clean) > 2000 then
    raise exception 'Reflection must have between 1 and 2000 chars';
  end if;

  insert into public.study_group_posts (group_id, user_id, body)
  values (p_group_id, auth.uid(), v_clean)
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.study_group_posts_create(uuid, text) from anon, public;
grant execute on function public.study_group_posts_create(uuid, text) to authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────
-- RPC: study_group_posts_delete — autor ou dono
-- ──────────────────────────────────────────────────────────────────────
create or replace function public.study_group_posts_delete(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group uuid;
  v_author uuid;
begin
  select group_id, user_id into v_group, v_author
    from public.study_group_posts where id = p_post_id;
  if v_group is null then
    raise exception 'Post not found';
  end if;
  if v_author <> auth.uid() and not public.is_study_group_owner(v_group) then
    raise exception 'Not allowed';
  end if;
  delete from public.study_group_posts where id = p_post_id;
end;
$$;

revoke execute on function public.study_group_posts_delete(uuid) from anon, public;
grant execute on function public.study_group_posts_delete(uuid) to authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────
-- RPC: study_group_posts_toggle_pin — só dono
-- ──────────────────────────────────────────────────────────────────────
create or replace function public.study_group_posts_toggle_pin(p_post_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group uuid;
  v_pinned boolean;
begin
  select group_id, pinned into v_group, v_pinned
    from public.study_group_posts where id = p_post_id;
  if v_group is null then
    raise exception 'Post not found';
  end if;
  if not public.is_study_group_owner(v_group) then
    raise exception 'Only the group owner can pin';
  end if;
  update public.study_group_posts set pinned = not v_pinned where id = p_post_id;
  return not v_pinned;
end;
$$;

revoke execute on function public.study_group_posts_toggle_pin(uuid) from anon, public;
grant execute on function public.study_group_posts_toggle_pin(uuid) to authenticated, service_role;
