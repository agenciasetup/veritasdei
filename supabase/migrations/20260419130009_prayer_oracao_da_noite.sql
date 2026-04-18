-- Seed: Oração da Noite (Dia a dia / noite)
-- Sequência guiada: Sinal da Cruz + Exame + Ato de Contrição + Pai-Nosso +
-- Ave-Maria + Salve Rainha + Sob Vossa Proteção + Anjo da Guarda.

begin;

delete from public.content_items where slug = 'oracao-da-noite';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'oracao-da-noite',
  'Oração da Noite',
  null,
  E'Sequência tradicional antes de dormir. Fecha o dia em paz — reconhece pecados, pede perdão e se confia à proteção de Deus, de Maria e do Anjo Custódio.\n\n## 1. Sinal da Cruz\n\n```verse\nEm nome do Pai, e do Filho, e do Espírito Santo. Amém.\n```\n\n## 2. Exame breve de consciência\n\nPergunte diante de Deus:\n\n- O que fiz de bom hoje?\n- Onde falhei em amor ou verdade?\n- Onde Deus esteve presente e eu não notei?\n\nUm minuto de silêncio é suficiente.\n\n## 3. Ato de Contrição\n\n```verse\nMeu Deus, eu me arrependo de todo coração\nde todos os meus pecados,\ne os detesto, porque pecando\nvos ofendo, a Vós, sumo bem\ne digno de ser amado sobre todas as coisas.\nPor isso, firmemente proponho,\ncom o auxílio da vossa graça,\nnão tornar a pecar\ne fugir das ocasiões próximas de pecado.\nSenhor, misericórdia,\nperdoai-me, por Jesus Cristo.\nAmém.\n```\n\n## 4. Pai-Nosso\n\n```verse\nPai-Nosso, que estais nos céus,\nsantificado seja o vosso nome;\nvenha a nós o vosso reino;\nseja feita a vossa vontade, assim na terra como no céu.\nO pão nosso de cada dia nos dai hoje;\nperdoai-nos as nossas ofensas,\nassim como nós perdoamos a quem nos tem ofendido;\ne não nos deixeis cair em tentação,\nmas livrai-nos do mal. Amém.\n```\n\n## 5. Ave-Maria\n\n```verse\nAve-Maria, cheia de graça,\no Senhor é convosco;\nbendita sois vós entre as mulheres\ne bendito é o fruto do vosso ventre, Jesus.\nSanta Maria, Mãe de Deus,\nrogai por nós, pecadores,\nagora e na hora da nossa morte. Amém.\n```\n\n## 6. Salve Rainha\n\n```verse\nSalve, Rainha, Mãe de misericórdia,\nvida, doçura e esperança nossa, salve!\nA vós bradamos, os degredados filhos de Eva.\nA vós suspiramos, gemendo e chorando\nneste vale de lágrimas.\nEia, pois, advogada nossa,\nesses vossos olhos misericordiosos\na nós volvei;\ne depois deste desterro, mostrai-nos Jesus,\nbendito fruto do vosso ventre.\nÓ clemente, ó piedosa,\nó doce sempre Virgem Maria. Amém.\n```\n\n## 7. Sob Vossa Proteção\n\n```verse\nSob vossa proteção buscamos refúgio,\nSanta Mãe de Deus.\nNão desprezeis as nossas súplicas\nem nossas necessidades,\nmas livrai-nos sempre de todos os perigos,\nó Virgem gloriosa e bendita. Amém.\n```\n\n## 8. Ao Anjo da Guarda\n\n```verse\nSanto Anjo do Senhor, meu zeloso guardador,\nse a ti me confiou a piedade divina,\nsempre me rege, me guarda,\nme governa e me ilumina. Amém.\n```\n\n## Fechamento\n\nSinal da Cruz. Durma em paz — Deus velará por você.',
  null,
  'Sequência noturna católica',
  array['noite','sequência','rotina','dormir','exame','contrição','salve rainha','sub tuum','anjo da guarda'],
  'Oração da Noite: sequência tradicional antes de dormir — Sinal da Cruz, Exame, Contrição, Pai-Nosso, Ave-Maria, Salve Rainha, Sob Vossa Proteção, Anjo da Guarda.',
  null,
  'Moon',
  30,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'dia-a-dia' and s.slug = 'noite';

commit;
