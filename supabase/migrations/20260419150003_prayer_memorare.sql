-- Seed: Memorare / Lembrai-Vos (Ocasiões / sofrimento)

begin;

delete from public.content_items where slug = 'memorare';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'memorare',
  'Lembrai-Vos (Memorare)',
  'Memorare',
  E'Atribuída a São Bernardo de Claraval (séc. XII) e amplamente divulgada por São Francisco de Sales. Súplica de total confiança à piedade maternal de Maria em qualquer momento de aflição.\n\n```verse\nLembrai-Vos, ó piíssima Virgem Maria,\nque nunca se ouviu dizer\nque algum daqueles que recorreram à vossa proteção,\nimploraram a vossa assistência\ne reclamaram o vosso socorro,\nfosse por Vós desamparado.\n\nAnimado eu, pois, com igual confiança,\na Vós, ó Virgem entre todas singular,\ncomo a Mãe recorro;\nde Vós me valho e, gemendo sob o peso de meus pecados,\nme prostro a vossos pés.\n\nNão desprezeis as minhas súplicas,\nó Mãe do Verbo Divino,\nmas ouvi-as propícia e atendei-me.\nAmém.\n```',
  E'Memoráre, o piíssima Virgo María,\nnon esse audítum a sǽculo,\nquemquam ad tua curréntem præsídia,\ntua implorántem auxília,\ntua peténtem suffrágia esse derelíctum.\n\nEgo tali animátus confidéntia\nad te, Virgo Vírginum, Mater, curro,\nad te vénio, coram te gémens peccátor assísto.\n\nNoli, Mater Verbi, verba mea despícere,\nsed áudi propítia et exáudi.\nAmen.',
  'Memorare · Lembrai-Vos, ó piíssima Virgem Maria',
  array['sofrimento','memorare','maria','são bernardo','confiança','súplica','lembrai-vos','francisco de sales'],
  'Memorare (Lembrai-Vos): súplica de confiança a Maria, atribuída a São Bernardo e popularizada por São Francisco de Sales. PT e latim.',
  null,
  'Heart',
  10,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'ocasioes' and s.slug = 'sofrimento';

commit;
