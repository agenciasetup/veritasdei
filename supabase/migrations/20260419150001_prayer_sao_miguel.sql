-- Seed: Oração a São Miguel Arcanjo (Ocasiões / protecao)

begin;

delete from public.content_items where slug = 'oracao-sao-miguel';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible,
  indulgence_note
)
select
  s.id,
  'prayer',
  'oracao-sao-miguel',
  'Oração a São Miguel Arcanjo',
  'Oratio ad Sanctum Michaëlem',
  E'Composta pelo Papa Leão XIII em 1886 após uma visão sobre a luta espiritual que assolaria a Igreja. Rezada por muito tempo ao final de toda Missa rezada — é a grande oração de exorcismo simples da espiritualidade católica.\n\n```verse\nSão Miguel Arcanjo,\ndefendei-nos no combate,\nsede o nosso refúgio\ncontra a maldade e as ciladas do demônio.\n\nOrdene-lhe Deus,\nsuplicantes pedimos;\ne vós, Príncipe da milícia celeste,\npelo poder divino,\nprecipitai no inferno\na Satanás e os outros espíritos malignos\nque andam pelo mundo\npara perder as almas.\nAmém.\n```',
  E'Sancte Míchael Archángele,\ndefénde nos in prǽlio;\ncontra nequítiam et insídias diáboli\nesto præsídium.\n\nÍmperet illi Deus,\nsúpplices deprecámur:\ntuque, Princeps milítiæ cæléstis,\nSátanam aliósque spíritus malígnos,\nqui ad perditiónem animárum pervagántur in mundo,\ndivína virtúte in inférnum detrúde.\nAmen.',
  'Oratio ad Sanctum Michaëlem · Papa Leão XIII, 1886',
  array['proteção','são miguel','arcanjo','demônio','exorcismo','leão xiii','combate','milícia celeste'],
  'Oração a São Miguel Arcanjo do Papa Leão XIII (1886): proteção contra ciladas do demônio. Texto em português e latim (Oratio ad Sanctum Michaëlem).',
  array['Ap 12:7-9','Jd 1:9'],
  'Shield',
  10,
  true,
  'Indulgência parcial concedida a quem a reza devotamente (Enchiridion Indulgentiarum, conc. 22).'
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'ocasioes' and s.slug = 'protecao';

commit;
