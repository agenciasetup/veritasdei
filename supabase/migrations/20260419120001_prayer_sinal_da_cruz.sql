-- Seed: Sinal da Cruz (Essenciais / capitales)
-- Idempotente: deleta pelo slug antes de inserir.

begin;

delete from public.content_items where slug = 'sinal-da-cruz';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'sinal-da-cruz',
  'Sinal da Cruz',
  'Signum Crucis',
  E'Gesto que abre e sela toda oração católica, professando a fé na Santíssima Trindade.\n\n```verse\nEm nome do Pai,\ne do Filho,\ne do Espírito Santo.\nAmém.\n```',
  E'In nómine Patris,\net Fílii,\net Spíritus Sancti.\nAmen.',
  'Sinal da Cruz · Signum Crucis',
  array['essencial','sinal','cruz','trindade','abertura','dominical','signum crucis'],
  'O Sinal da Cruz: gesto que abre e sela toda oração católica, professando a fé na Santíssima Trindade. Texto em português e latim.',
  array['Mt 28:19'],
  'Cross',
  10,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'essenciais' and s.slug = 'capitales';

commit;
