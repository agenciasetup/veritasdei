-- Seed de orações de devoção aos santos (top 30).
--
-- 1. Cria topic "Aos Santos" + subtopic "devocao-aos-santos" no group 'oracoes'.
-- 2. Para cada top 30 com oracao_curta preenchida, cria content_items (kind='prayer')
--    com o texto da oração.
-- 3. Vincula em santo_oracoes com tipo='devocao_principal' (trigger sincroniza
--    santos.oracao_principal_item_id automaticamente).
--
-- Idempotente via on conflict + upserts.

begin;

-- 1. Estrutura topic + subtopic -----------------------------------------
do $seed$
declare
  v_group_id uuid;
  v_topic_id uuid;
  v_subtopic_id uuid;
begin
  select id into v_group_id from public.content_groups where slug = 'oracoes';

  insert into public.content_topics (group_id, slug, title, subtitle, icon, sort_order, visible)
  values (v_group_id, 'aos-santos', 'Aos Santos', 'Devoção aos santos do Brasil e do mundo', 'Heart', 50, true)
  on conflict (group_id, slug) do update set
    title = excluded.title, subtitle = excluded.subtitle, icon = excluded.icon,
    sort_order = excluded.sort_order, visible = true
  returning id into v_topic_id;

  insert into public.content_subtopics (topic_id, slug, title, subtitle, sort_order, visible)
  values (v_topic_id, 'devocao', 'Orações de devoção', 'Invocações e orações aos santos mais conhecidos', 10, true)
  on conflict (topic_id, slug) do update set
    title = excluded.title, subtitle = excluded.subtitle, sort_order = excluded.sort_order, visible = true
  returning id into v_subtopic_id;
end $seed$;

-- 2. Cria content_items das orações dos top 30 ---------------------------
-- Cada santo com oracao_curta gera um content_items (kind='prayer') + vínculo.

with sub as (
  select cs.id as subtopic_id
  from public.content_subtopics cs
  join public.content_topics ct on ct.id = cs.topic_id
  join public.content_groups cg on cg.id = ct.group_id
  where cg.slug = 'oracoes' and ct.slug = 'aos-santos' and cs.slug = 'devocao'
),
top_santos as (
  select id, slug, nome, invocacao, oracao_curta, patronatos, popularidade_rank
  from public.santos
  where popularidade_rank is not null
    and oracao_curta is not null
),
upserted as (
  insert into public.content_items (
    subtopic_id, kind, slug, title, body, keywords, meta_description,
    icon_name, sort_order, visible, reference
  )
  select
    (select subtopic_id from sub),
    'prayer',
    'oracao-a-' || ts.slug,
    'Oração a ' || ts.nome,
    ts.oracao_curta,
    array[ts.nome, 'devoção', 'oração aos santos'] || coalesce(ts.patronatos, '{}'::text[]),
    'Oração de devoção a ' || ts.nome || '. ' || coalesce(ts.invocacao, ''),
    'Heart',
    ts.popularidade_rank,
    true,
    'Tradição católica · devoção popular pt-BR'
  from top_santos ts
  on conflict (slug) where slug is not null do update set
    title = excluded.title,
    body = excluded.body,
    keywords = excluded.keywords,
    meta_description = excluded.meta_description,
    sort_order = excluded.sort_order,
    visible = excluded.visible
  returning id, slug
)
-- 3. Vincula em santo_oracoes (tipo devocao_principal)
insert into public.santo_oracoes (santo_id, content_item_id, tipo, sort_order)
select s.id, u.id, 'devocao_principal', 0
from upserted u
join public.santos s on s.slug = replace(u.slug, 'oracao-a-', '')
on conflict (santo_id, content_item_id, tipo) do update set
  sort_order = excluded.sort_order;

-- Log final
do $$
declare
  total_items int;
  total_vinc int;
begin
  select count(*) into total_items from public.content_items ci
  where ci.slug like 'oracao-a-%' and ci.visible = true;
  select count(*) into total_vinc from public.santo_oracoes where tipo = 'devocao_principal';
  raise notice 'Orações criadas: % | Vínculos devocao_principal: %', total_items, total_vinc;
end $$;

commit;
