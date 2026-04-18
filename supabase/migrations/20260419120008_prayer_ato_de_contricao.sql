-- Seed: Ato de Contrição (Essenciais / capitales)

begin;

delete from public.content_items where slug = 'ato-de-contricao';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'ato-de-contricao',
  'Ato de Contrição',
  'Actus Contritionis',
  E'Expressão da dor pelos pecados cometidos e do propósito firme de emenda. É rezado antes e depois da Confissão, no exame de consciência da noite, e diante do perigo de morte.\n\n```verse\nMeu Deus,\neu me arrependo de todo coração\nde todos os meus pecados,\ne os detesto,\nporque pecando\nnão só mereço as penas estabelecidas por Vós, justamente,\nmas principalmente porque Vos ofendo,\na Vós, sumo bem\ne digno de ser amado sobre todas as coisas.\n\nPor isso, firmemente proponho,\ncom o auxílio da vossa graça,\nnão tornar a pecar\ne fugir das ocasiões próximas de pecado.\n\nSenhor, misericórdia,\nperdoai-me, por Jesus Cristo.\nAmém.\n```',
  E'Deus meus, ex toto corde pǽnitet me\nómnium meórum peccatórum,\neáque detéstor,\nquia peccándo,\nnon solum pœnas a Te iuste statútas proméritus sum,\nsed præsértim quia offéndi Te,\nsummum bonum,\nac dignum qui super ómnia diligáris.\n\nÍdeo fírmiter propóno,\nadiuvánte grátia tua,\nde cétero me non peccatúrum\npeccandíque occasiónes próximas fugitúrum.\n\nAmen.',
  'Ato de Contrição · Actus Contritionis',
  array['essencial','contrição','arrependimento','confissão','exame','penitência','perdão'],
  'Ato de Contrição: oração de arrependimento rezada antes e depois da Confissão e no exame de consciência. Texto em português e latim.',
  array['Sl 51:3','1Jo 1:9'],
  'Droplets',
  80,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'essenciais' and s.slug = 'capitales';

commit;
