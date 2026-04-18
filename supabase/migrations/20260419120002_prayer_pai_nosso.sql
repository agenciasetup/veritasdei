-- Seed: Pai-Nosso (Essenciais / capitales)

begin;

delete from public.content_items where slug = 'pai-nosso';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'pai-nosso',
  'Pai-Nosso',
  'Pater Noster',
  E'Oração do Senhor, ensinada por Jesus aos discípulos. É a oração mais perfeita, porque vem do próprio Cristo.\n\n```verse\nPai-Nosso, que estais nos céus,\nsantificado seja o vosso nome;\nvenha a nós o vosso reino;\nseja feita a vossa vontade,\nassim na terra como no céu.\n\nO pão nosso de cada dia nos dai hoje;\nperdoai-nos as nossas ofensas,\nassim como nós perdoamos a quem nos tem ofendido;\ne não nos deixeis cair em tentação,\nmas livrai-nos do mal.\n\nAmém.\n```',
  E'Pater noster, qui es in cælis,\nsanctificétur nomen tuum;\nadvéniat regnum tuum;\nfiat volúntas tua, sicut in cælo, et in terra.\n\nPanem nostrum quotidiánum da nobis hódie;\net dimítte nobis débita nostra,\nsicut et nos dimíttimus debitóribus nostris;\net ne nos indúcas in tentatiónem;\nsed líbera nos a malo.\n\nAmen.',
  'Oração do Senhor · Pater Noster',
  array['essencial','pai','nosso','pater','dominical','oração do senhor','catecismo'],
  'Pai-Nosso: a oração que Jesus ensinou aos discípulos. Texto em português tradicional e em latim litúrgico (Pater Noster).',
  array['Mt 6:9-13','Lc 11:2-4'],
  'Heart',
  20,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'essenciais' and s.slug = 'capitales';

commit;
