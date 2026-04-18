-- Seed: Oferecimento do Dia (Dia a dia / manhã)

begin;

delete from public.content_items where slug = 'oferecimento-do-dia';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'oferecimento-do-dia',
  'Oferecimento do Dia',
  null,
  E'Primeira oração do dia cristão: oferece a Deus, pelas mãos de Maria, todas as ações, orações, pequenas tristezas e alegrias que virão. Tradição do Apostolado da Oração (séc. XIX).\n\n```verse\nÓ Jesus, pelo Coração Imaculado de Maria,\neu Vos ofereço as orações, os trabalhos,\nas alegrias e as penas deste dia,\nem reparação dos nossos pecados\ne pelas intenções por que se oferece,\nem todas as Missas,\no vosso Divino Coração.\n\nEu Vos ofereço particularmente\na intenção do Santo Padre recomendada\npara este mês.\nAmém.\n```',
  null,
  'Oferecimento do Dia ao Sagrado Coração',
  array['manhã','oferecimento','coração','imaculado','apostolado da oração','papa','sagrado coração'],
  'Oferecimento do Dia: primeira oração da manhã cristã, do Apostolado da Oração. Oferece ao Sagrado Coração de Jesus, pelo Imaculado Coração de Maria, todas as ações do dia.',
  null,
  'Sunrise',
  10,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'dia-a-dia' and s.slug = 'manha';

commit;
