-- Seed: Oração ao Anjo da Guarda (Dia a dia / manhã)

begin;

delete from public.content_items where slug = 'oracao-anjo-da-guarda';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'oracao-anjo-da-guarda',
  'Santo Anjo do Senhor',
  'Angele Dei',
  E'Oração tradicional ao Anjo da Guarda, rezada pela manhã e antes de viagens. Tão antiga que São Bernardo a comentava no séc. XII.\n\n```verse\nSanto Anjo do Senhor,\nmeu zeloso guardador,\nse a ti me confiou a piedade divina,\nsempre me rege, me guarda,\nme governa e me ilumina.\nAmém.\n```',
  E'Angele Dei, qui custos es mei,\nme, tibi commíssum pietáte supérna,\nillúmina, custódi, rege et gubérna.\nAmen.',
  'Santo Anjo do Senhor · Angele Dei',
  array['manhã','anjo','guarda','custódio','angele dei','proteção','manhã'],
  'Oração ao Anjo da Guarda: oração matinal tradicional (Angele Dei) ao anjo custódio, pedindo guarda, governo e iluminação para o dia.',
  array['Mt 18:10','Sl 91:11'],
  'Sparkles',
  20,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'dia-a-dia' and s.slug = 'manha';

commit;
