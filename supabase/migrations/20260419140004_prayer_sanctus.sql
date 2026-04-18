-- Seed: Santo / Sanctus (Missa / ordinário)

begin;

delete from public.content_items where slug = 'sanctus';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'sanctus',
  'Santo (Sanctus)',
  'Sanctus',
  E'Aclamação que encerra o Prefácio e abre a Oração Eucarística. Une o "três vezes santo" dos Serafins (Is 6:3) ao "Bendito o que vem" da entrada messiânica (Mt 21:9).\n\n```verse\nSanto, Santo, Santo,\nSenhor Deus do universo!\nO céu e a terra proclamam a vossa glória.\nHosana nas alturas!\n\nBendito o que vem em nome do Senhor!\nHosana nas alturas!\n```',
  E'Sanctus, Sanctus, Sanctus\nDóminus Deus Sábaoth.\nPleni sunt cæli et terra glória tua.\nHosánna in excélsis.\n\nBenedíctus qui venit in nómine Dómini.\nHosánna in excélsis.',
  'Sanctus · Santo, Santo, Santo',
  array['missa','sanctus','santo','prefácio','oração eucarística','serafins','hosana','ordinário'],
  'Sanctus: aclamação tríplice "Santo, Santo, Santo" que abre a Oração Eucarística na Missa. Une Isaías 6:3 ao Hosana da entrada em Jerusalém.',
  array['Is 6:3','Mt 21:9'],
  'Sparkles',
  40,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'missa' and s.slug = 'ordinario';

commit;
