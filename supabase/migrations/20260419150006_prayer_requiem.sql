-- Seed: Réquiem Aeternam (Ocasiões / defuntos)

begin;

delete from public.content_items where slug = 'requiem';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'requiem',
  'Réquiem Aeternam',
  'Requiem æternam',
  E'Sufrágio pelos fiéis defuntos. Tradicionalmente rezado em velórios, missas de corpo presente, aniversários de falecimento e sempre que se passa por um cemitério. A Igreja pede para eles o que mais precisam: luz perpétua e descanso.\n\n```verse\nV. Dai-lhes, Senhor, o eterno descanso.\nR. E que a luz perpétua os ilumine.\n\nV. Descansem em paz.\nR. Amém.\n```',
  E'V. Réquiem ætérnam dona eis, Dómine.\nR. Et lux perpétua lúceat eis.\n\nV. Requiéscant in pace.\nR. Amen.',
  'Requiem æternam · Descanso eterno',
  array['defuntos','réquiem','requiem','fiéis defuntos','sufrágio','luz perpétua','cemitério','velório'],
  'Réquiem Aeternam: sufrágio pelos fiéis defuntos. Rezado em velórios, aniversários de falecimento e ao passar por um cemitério. PT e latim.',
  array['2Mc 12:44-46','4Esd 2:34-35'],
  'Cross',
  10,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'ocasioes' and s.slug = 'defuntos';

commit;
