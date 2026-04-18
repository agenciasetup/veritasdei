-- Seed: Confesso a Deus / Ato Penitencial (Missa / ordinário)

begin;

delete from public.content_items where slug = 'confesso-a-deus';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'confesso-a-deus',
  'Confesso a Deus',
  'Confiteor',
  E'Ato Penitencial, uma das fórmulas do início da Missa. O fiel reconhece sua condição de pecador na presença de Deus e dos irmãos, pedindo a intercessão de toda a Igreja.\n\n```verse\nConfesso a Deus todo-poderoso\ne a vós, irmãos e irmãs,\nque pequei muitas vezes,\npor pensamentos e palavras,\natos e omissões,\n\n*(batendo no peito três vezes)*\n\npor minha culpa, minha culpa, minha tão grande culpa.\n\nE peço à Virgem Maria,\naos Anjos e Santos\ne a vós, irmãos e irmãs,\nque rogueis por mim a Deus, nosso Senhor.\nAmém.\n```',
  E'Confíteor Deo omnipoténti\net vobis, fratres,\nquia peccávi nimis cogitatióne, verbo,\nópere et omissióne:\n\n*(percutiens sibi pectus ter)*\n\nmea culpa, mea culpa, mea máxima culpa.\n\nÍdeo precor beátam Maríam semper Vírginem,\nomnes Angelos et Sanctos,\net vos, fratres,\noráre pro me ad Dóminum Deum nostrum.\nAmen.',
  'Confiteor · Ato Penitencial da Missa',
  array['missa','confiteor','ato penitencial','mea culpa','pecado','início da missa','ordinário'],
  'Confesso a Deus (Confiteor): fórmula do Ato Penitencial na abertura da Missa, com o "mea culpa" batendo no peito três vezes. PT e latim.',
  array['Tg 5:16'],
  'Droplets',
  10,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'missa' and s.slug = 'ordinario';

commit;
