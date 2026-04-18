-- Seed: Cordeiro de Deus / Agnus Dei (Missa / ordinário)

begin;

delete from public.content_items where slug = 'agnus-dei';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'agnus-dei',
  'Cordeiro de Deus',
  'Agnus Dei',
  E'Rezado durante a fração do pão, antes da Comunhão. Ecoa a saudação de João Batista diante de Jesus no Jordão (Jo 1:29) — reconhece o Cristo imolado que tira o pecado do mundo.\n\n```verse\nCordeiro de Deus, que tirais o pecado do mundo,\ntende piedade de nós.\n\nCordeiro de Deus, que tirais o pecado do mundo,\ntende piedade de nós.\n\nCordeiro de Deus, que tirais o pecado do mundo,\ndai-nos a paz.\n```',
  E'Agnus Dei, qui tollis peccáta mundi,\nmiserére nobis.\n\nAgnus Dei, qui tollis peccáta mundi,\nmiserére nobis.\n\nAgnus Dei, qui tollis peccáta mundi,\ndona nobis pacem.',
  'Agnus Dei · Cordeiro de Deus',
  array['missa','agnus dei','cordeiro','fração do pão','comunhão','joão batista','ordinário','dona nobis pacem'],
  'Agnus Dei: invocação ao Cordeiro de Deus na fração do pão, ecoando João Batista no Jordão (Jo 1:29). Dona nobis pacem / dai-nos a paz.',
  array['Jo 1:29'],
  'Flame',
  50,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'missa' and s.slug = 'ordinario';

commit;
