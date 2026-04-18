-- Seed: Jesus, eu confio em Vós (Ocasiões / sofrimento)

begin;

delete from public.content_items where slug = 'jesus-eu-confio-em-vos';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'jesus-eu-confio-em-vos',
  'Jesus, eu confio em Vós',
  'Iesu, in te confído',
  E'Jaculatória inscrita pela própria Santa Faustina Kowalska na imagem da Divina Misericórdia (1931), por expressa ordem de Jesus. Pequenina na forma, mas o único ato de fé que o Senhor pedia: um abandono total à Sua bondade.\n\n```verse\nJesus, eu confio em Vós.\n```\n\n## Quando repetir\n\n- Ao acordar e adormecer\n- Diante do sofrimento, da dúvida ou do medo\n- Antes de decisões difíceis\n- Em silêncio, dentro do peito, durante o dia\n\nNão precisa ser longa para ser profunda. É o suspiro da alma que se entrega.',
  E'Iesu, in te confído.',
  'Jesus, eu confio em Vós · Santa Faustina',
  array['sofrimento','divina misericórdia','faustina','jaculatória','confiança','iesu in te confido','abandono'],
  'Jesus, eu confio em Vós: jaculatória da Divina Misericórdia inscrita por Jesus a Santa Faustina (1931). Pequena no formato, abandono total na substância.',
  null,
  'HandHeart',
  20,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'ocasioes' and s.slug = 'sofrimento';

commit;
