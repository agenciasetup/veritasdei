-- Seed: Três Ave-Marias antes de dormir (Dia a dia / noite)

begin;

delete from public.content_items where slug = 'tres-ave-marias';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'tres-ave-marias',
  'Três Ave-Marias',
  null,
  E'Devoção popularizada por Santo Afonso de Ligório e São João Bosco. Três Ave-Marias — uma para cada pessoa da Santíssima Trindade, implorando a graça da pureza e a preservação do pecado mortal durante o sono.\n\n## Intenção\n\nAs três Ave-Marias são oferecidas:\n\n- **1ª** — pela pureza do pensamento\n- **2ª** — pela pureza da palavra\n- **3ª** — pela pureza das ações\n\nAo final, acrescenta-se a invocação: **"Ó Maria, concebida sem pecado, rogai por nós que recorremos a vós."**\n\n## Oração\n\n```verse\nAve-Maria, cheia de graça,\no Senhor é convosco;\nbendita sois vós entre as mulheres\ne bendito é o fruto do vosso ventre, Jesus.\nSanta Maria, Mãe de Deus,\nrogai por nós, pecadores,\nagora e na hora da nossa morte.\nAmém.\n\n(Repetir 3 vezes)\n```\n\n## Invocação final\n\n```verse\nÓ Maria, concebida sem pecado,\nrogai por nós que recorremos a vós.\n```',
  null,
  'Três Ave-Marias pela pureza',
  array['noite','três ave-marias','santo afonso','dom bosco','pureza','imaculada','antes de dormir'],
  'Três Ave-Marias antes de dormir: devoção de Santo Afonso e Dom Bosco pela graça da pureza. Uma Ave-Maria para cada pessoa da Trindade.',
  null,
  'Moon',
  20,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'dia-a-dia' and s.slug = 'noite';

commit;
