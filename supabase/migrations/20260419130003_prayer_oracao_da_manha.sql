-- Seed: Oração da Manhã (Dia a dia / manhã)
-- Sequência guiada: Sinal da Cruz + Oferecimento + Pai-Nosso + Ave-Maria +
-- Glória + Santo Anjo. Página multi-bloco que une as essenciais em ordem.

begin;

delete from public.content_items where slug = 'oracao-da-manha';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'oracao-da-manha',
  'Oração da Manhã',
  null,
  E'Sequência tradicional para começar o dia. Faça sem pressa, de joelhos ou em pé diante de uma imagem. Poucos minutos — mas mudam o tom do dia inteiro.\n\n## 1. Sinal da Cruz\n\n```verse\nEm nome do Pai, e do Filho, e do Espírito Santo. Amém.\n```\n\n## 2. Oferecimento do Dia\n\n```verse\nÓ Jesus, pelo Coração Imaculado de Maria,\neu Vos ofereço as orações, os trabalhos,\nas alegrias e as penas deste dia,\nem reparação dos nossos pecados\ne pelas intenções por que se oferece,\nem todas as Missas,\no vosso Divino Coração.\nAmém.\n```\n\n## 3. Pai-Nosso\n\n```verse\nPai-Nosso, que estais nos céus,\nsantificado seja o vosso nome;\nvenha a nós o vosso reino;\nseja feita a vossa vontade, assim na terra como no céu.\nO pão nosso de cada dia nos dai hoje;\nperdoai-nos as nossas ofensas,\nassim como nós perdoamos a quem nos tem ofendido;\ne não nos deixeis cair em tentação,\nmas livrai-nos do mal. Amém.\n```\n\n## 4. Ave-Maria\n\n```verse\nAve-Maria, cheia de graça,\no Senhor é convosco;\nbendita sois vós entre as mulheres\ne bendito é o fruto do vosso ventre, Jesus.\nSanta Maria, Mãe de Deus,\nrogai por nós, pecadores,\nagora e na hora da nossa morte. Amém.\n```\n\n## 5. Glória ao Pai\n\n```verse\nGlória ao Pai, e ao Filho, e ao Espírito Santo.\nAssim como era no princípio, agora e sempre,\npelos séculos dos séculos. Amém.\n```\n\n## 6. Ao Anjo da Guarda\n\n```verse\nSanto Anjo do Senhor, meu zeloso guardador,\nse a ti me confiou a piedade divina,\nsempre me rege, me guarda,\nme governa e me ilumina. Amém.\n```\n\n## Fechamento\n\nSinal da Cruz.',
  null,
  'Sequência matinal católica',
  array['manhã','sequência','rotina','oferecimento','pai-nosso','ave-maria','glória','anjo da guarda'],
  'Oração da Manhã: sequência tradicional para começar o dia — Sinal da Cruz, Oferecimento, Pai-Nosso, Ave-Maria, Glória e Anjo da Guarda.',
  null,
  'Sunrise',
  30,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'dia-a-dia' and s.slug = 'manha';

commit;
