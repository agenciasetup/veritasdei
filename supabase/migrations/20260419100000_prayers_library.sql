-- Prayers library: extend content_items to host prayer pages with
-- slug-based URLs, Latin translation, audio/video, keywords, FTS.
-- Plus: prayer_favorites (per-user heart) and search_prayers RPC.
--
-- FTS uses a trigger-maintained tsvector (Postgres generated columns
-- refuse to_tsvector with a named regconfig as "not immutable"; the
-- trigger approach is the stable idiom for Postgres FTS).

begin;

-- 1. Extra columns on content_items ---------------------------------------
alter table public.content_items
  add column if not exists slug              text,
  add column if not exists latin_title       text,
  add column if not exists latin_body        text,
  add column if not exists audio_url         text,
  add column if not exists video_url         text,
  add column if not exists keywords          text[] default '{}'::text[],
  add column if not exists meta_description  text,
  add column if not exists indulgence_note   text,
  add column if not exists scripture_refs    text[] default '{}'::text[],
  add column if not exists icon_name         text,
  add column if not exists search_tsv        tsvector;

create unique index if not exists content_items_slug_unique
  on public.content_items(slug) where slug is not null;

create index if not exists content_items_search_idx
  on public.content_items using gin(search_tsv);

create index if not exists content_items_keywords_idx
  on public.content_items using gin(keywords);

-- Trigger maintains search_tsv
create or replace function public.prayer_update_search_tsv()
returns trigger
language plpgsql
as $$
begin
  new.search_tsv :=
    setweight(to_tsvector('portuguese', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(new.body, '')), 'B') ||
    setweight(
      to_tsvector('portuguese', array_to_string(coalesce(new.keywords, '{}'::text[]), ' ')),
      'A'
    ) ||
    setweight(
      to_tsvector('simple', coalesce(new.latin_title, '') || ' ' || coalesce(new.latin_body, '')),
      'C'
    );
  return new;
end;
$$;

drop trigger if exists content_items_search_tsv_trigger on public.content_items;
create trigger content_items_search_tsv_trigger
  before insert or update of title, body, keywords, latin_title, latin_body
  on public.content_items
  for each row execute function public.prayer_update_search_tsv();

-- Backfill existing rows
update public.content_items set title = title;

-- 2. Prayer favorites -----------------------------------------------------
create table if not exists public.prayer_favorites (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  item_id    uuid not null references public.content_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create index if not exists prayer_favorites_user_idx
  on public.prayer_favorites(user_id, created_at desc);

alter table public.prayer_favorites enable row level security;

drop policy if exists "users select own favorites" on public.prayer_favorites;
create policy "users select own favorites" on public.prayer_favorites
  for select using (auth.uid() = user_id);

drop policy if exists "users insert own favorites" on public.prayer_favorites;
create policy "users insert own favorites" on public.prayer_favorites
  for insert with check (auth.uid() = user_id);

drop policy if exists "users delete own favorites" on public.prayer_favorites;
create policy "users delete own favorites" on public.prayer_favorites
  for delete using (auth.uid() = user_id);

-- 3. Search RPC -----------------------------------------------------------
create or replace function public.search_prayers(q text, group_slug text default 'oracoes')
returns table(
  id uuid,
  slug text,
  title text,
  subtitle text,
  snippet text,
  rank real,
  icon_name text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    ci.id,
    ci.slug,
    ci.title,
    cs.title as subtitle,
    ts_headline(
      'portuguese',
      coalesce(ci.body, ''),
      plainto_tsquery('portuguese', q),
      'MaxWords=18, MinWords=6, MaxFragments=1, StartSel=<mark>, StopSel=</mark>'
    ) as snippet,
    ts_rank(ci.search_tsv, plainto_tsquery('portuguese', q)) as rank,
    ci.icon_name
  from public.content_items ci
  join public.content_subtopics cs on cs.id = ci.subtopic_id
  join public.content_topics ct on ct.id = cs.topic_id
  join public.content_groups cg on cg.id = ct.group_id
  where cg.slug = group_slug
    and ci.visible = true
    and ci.slug is not null
    and ci.search_tsv @@ plainto_tsquery('portuguese', q)
  order by rank desc
  limit 30;
$$;

grant execute on function public.search_prayers(text, text) to anon, authenticated;

commit;
