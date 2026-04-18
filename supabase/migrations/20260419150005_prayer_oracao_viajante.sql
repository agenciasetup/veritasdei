-- Seed: Oração do Viajante (Ocasiões / viagem)

begin;

delete from public.content_items where slug = 'oracao-do-viajante';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'oracao-do-viajante',
  'Oração do Viajante',
  'Itinerarium',
  E'Tradição do rito romano para benção antes de partir em viagem — inspirada em Tobias, que foi acompanhado pelo Arcanjo Rafael no seu caminho (Tb 5-12). Reza-se na porta de casa, ao entrar no carro, ou antes de embarcar.\n\n```verse\nSenhor Deus,\nque conduzistes os filhos de Israel\npelo meio do mar em pé enxuto,\ne que, por meio da estrela,\nguiastes os Reis Magos até Vós:\nconcedei a nós, servos vossos,\numa feliz jornada e um tempo tranquilo.\n\nEnviai diante de nós o vosso Santo Anjo,\ncomo enviastes junto a Tobias,\npara que nos traga de volta,\npela vossa graça,\nsãos e salvos a nossas casas.\n\nQue o Senhor esteja ao nosso lado,\nque Ele proteja o nosso caminho,\nque Ele seja o nosso refúgio.\nAmém.\n\n*Sinal da Cruz sobre si e sobre o caminho.*\n```',
  E'Dómine Deus, qui fílios Israel\nper maris médium sicco vestígio\nire fecísti, quique tribus Magis\nitiner ad te stella duce pandísti:\ntríbue nobis, quǽsumus,\niter prósperum tempúsque tranquíllum;\nut, Angelo tuo sancto cómite,\nad eum quo pérgimus locum,\nac demum ad ætérnæ salútis portum\nperveníre felíciter valeámus.\nAmen.',
  'Itinerarium · Oração do Viajante',
  array['viagem','viajante','itinerarium','tobias','anjo rafael','jornada','proteção','partida'],
  'Oração do Viajante (Itinerarium): benção da tradição romana para antes da viagem. Inspirada em Tobias acompanhado pelo Arcanjo Rafael.',
  array['Tb 5:4','Tb 12:15','Sl 91:11'],
  'Compass',
  10,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'ocasioes' and s.slug = 'viagem';

commit;
