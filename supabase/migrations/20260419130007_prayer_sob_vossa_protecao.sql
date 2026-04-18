-- Seed: Sob Vossa Proteção (Dia a dia / noite)

begin;

delete from public.content_items where slug = 'sob-vossa-protecao';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'sob-vossa-protecao',
  'Sob Vossa Proteção',
  'Sub tuum præsidium',
  E'A mais antiga oração mariana conhecida — papiro grego do séc. III (antes do Credo, antes do Rosário). Rezada à noite e em tempos de perseguição ou perigo.\n\n```verse\nSob vossa proteção buscamos refúgio,\nSanta Mãe de Deus.\nNão desprezeis as nossas súplicas\nem nossas necessidades,\nmas livrai-nos sempre de todos os perigos,\nó Virgem gloriosa e bendita.\nAmém.\n```',
  E'Sub tuum præsídium confúgimus,\nsancta Dei Génetrix.\nNostras deprecatiónes ne despícias\nin necessitátibus nostris,\nsed a perículis cunctis\nlíbera nos semper,\nVirgo gloriósa et benedícta.\nAmen.',
  'Sub tuum præsidium · Sob vossa proteção',
  array['noite','mariana','sub tuum','proteção','refúgio','perigo','papiro','antiga','perseguição'],
  'Sob Vossa Proteção (Sub tuum præsidium): a mais antiga oração mariana conhecida, do séc. III. Texto em português e latim.',
  null,
  'Shield',
  10,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'dia-a-dia' and s.slug = 'noite';

commit;
