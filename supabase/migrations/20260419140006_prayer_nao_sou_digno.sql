-- Seed: Senhor, eu não sou digno (Missa / ordinário)

begin;

delete from public.content_items where slug = 'nao-sou-digno';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'nao-sou-digno',
  'Senhor, eu não sou digno',
  'Domine, non sum dignus',
  E'Aclamação imediatamente antes da Comunhão, após o "Eis o Cordeiro de Deus". É a resposta literal do centurião romano a Jesus (Mt 8:8) — ato de humildade e fé de quem se reconhece indigno mas confia na palavra que cura.\n\n```verse\nSenhor, eu não sou digno\nde que entreis em minha morada,\nmas dizei uma palavra\ne serei salvo.\n```',
  E'Dómine, non sum dignus\nut intres sub tectum meum,\nsed tantum dic verbo\net sanábitur ánima mea.',
  'Domine, non sum dignus · Antes da Comunhão',
  array['missa','comunhão','não sou digno','domine non sum dignus','centurião','humildade','ordinário'],
  'Senhor, eu não sou digno: resposta do centurião romano a Jesus (Mt 8:8), rezada imediatamente antes da Comunhão. PT e Domine non sum dignus em latim.',
  array['Mt 8:8','Lc 7:6-7'],
  'Heart',
  60,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'missa' and s.slug = 'ordinario';

commit;
