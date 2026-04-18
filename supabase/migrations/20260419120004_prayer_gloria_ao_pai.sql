-- Seed: Glória ao Pai (Essenciais / capitales)

begin;

delete from public.content_items where slug = 'gloria-ao-pai';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'gloria-ao-pai',
  'Glória ao Pai',
  'Gloria Patri',
  E'Doxologia trinitária. Sela dezenas do Rosário, salmos e ofícios — é a oração curta que proclama a glória eterna da Santíssima Trindade.\n\n```verse\nGlória ao Pai, e ao Filho, e ao Espírito Santo.\n\nAssim como era no princípio,\nagora e sempre,\npelos séculos dos séculos.\nAmém.\n```',
  E'Glória Patri, et Fílio, et Spirítui Sancto.\n\nSicut erat in princípio,\net nunc, et semper,\net in sǽcula sæculórum.\nAmen.',
  'Glória ao Pai · Gloria Patri',
  array['essencial','glória','doxologia','trindade','rosário','gloria patri','sicut erat'],
  'Glória ao Pai: doxologia trinitária que sela dezenas do Rosário e ofícios da Igreja. Texto em português e latim (Gloria Patri).',
  array['Mt 28:19'],
  'Sparkles',
  40,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'essenciais' and s.slug = 'capitales';

commit;
