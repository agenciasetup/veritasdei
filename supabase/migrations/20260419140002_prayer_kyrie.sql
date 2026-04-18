-- Seed: Kyrie / Senhor, tende piedade (Missa / ordinário)

begin;

delete from public.content_items where slug = 'kyrie';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'kyrie',
  'Senhor, tende piedade',
  'Kyrie Eleison',
  E'Invocação de misericórdia que fecha o Ato Penitencial. As três invocações — ao Pai, ao Filho e ao Espírito — são o único resquício litúrgico do grego no Rito Romano.\n\n```verse\nSenhor, tende piedade de nós.\nSenhor, tende piedade de nós.\n\nCristo, tende piedade de nós.\nCristo, tende piedade de nós.\n\nSenhor, tende piedade de nós.\nSenhor, tende piedade de nós.\n```',
  E'Kýrie, eléison.\nKýrie, eléison.\n\nChriste, eléison.\nChriste, eléison.\n\nKýrie, eléison.\nKýrie, eléison.',
  'Kyrie · Senhor, tende piedade',
  array['missa','kyrie','eleison','piedade','misericórdia','ato penitencial','grego','ordinário'],
  'Kyrie Eleison: invocação tripla de misericórdia na Missa, único resquício do grego no Rito Romano. Texto em português, latim (transliterado) e sentido do grego Κύριε ἐλέησον.',
  null,
  'Droplets',
  20,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'missa' and s.slug = 'ordinario';

commit;
