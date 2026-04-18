-- Seed: Ave-Maria (Essenciais / capitales)

begin;

delete from public.content_items where slug = 'ave-maria';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'ave-maria',
  'Ave-Maria',
  'Ave Maria',
  E'A saudação do Anjo Gabriel unida à louvação de Santa Isabel e ao pedido final da Igreja: é a oração mariana por excelência, repetida no Rosário, no Angelus e em inúmeras devoções.\n\n```verse\nAve-Maria, cheia de graça,\no Senhor é convosco;\nbendita sois vós entre as mulheres\ne bendito é o fruto do vosso ventre, Jesus.\n\nSanta Maria, Mãe de Deus,\nrogai por nós, pecadores,\nagora e na hora da nossa morte.\nAmém.\n```',
  E'Ave María, grátia plena,\nDóminus tecum;\nbenedícta tu in muliéribus,\net benedíctus fructus ventris tui, Iesus.\n\nSancta María, Mater Dei,\nora pro nobis peccatóribus,\nnunc et in hora mortis nostræ.\nAmen.',
  'Ave-Maria · Ave Maria',
  array['essencial','ave','maria','rosário','mariana','angelus','cheia de graça'],
  'Ave-Maria: a oração mariana por excelência, junção da saudação do anjo Gabriel e da louvação de Santa Isabel. Texto em português e latim.',
  array['Lc 1:28','Lc 1:42'],
  'Heart',
  30,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'essenciais' and s.slug = 'capitales';

commit;
