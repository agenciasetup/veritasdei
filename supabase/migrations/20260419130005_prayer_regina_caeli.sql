-- Seed: Regina Caeli (Dia a dia / durante-o-dia)

begin;

delete from public.content_items where slug = 'regina-caeli';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'regina-caeli',
  'Rainha do Céu',
  'Regina Cæli',
  E'Antífona pascal substitui o Ângelus do Sábado Santo ao Sábado depois de Pentecostes. Reza-se de pé — tradição desde o séc. XII (atribuída ao Papa S. Gregório Magno). "Aleluia" seis vezes: marca a alegria da Ressurreição.\n\n```verse\nRainha do Céu, alegrai-vos, aleluia!\nPorque quem merecestes trazer em vosso seio, aleluia!\nRessuscitou como disse, aleluia!\nRogai a Deus por nós, aleluia!\n```\n\n```verse\nV. Alegrai-vos e exultai, ó Virgem Maria, aleluia.\nR. Porque o Senhor ressuscitou verdadeiramente, aleluia.\n```\n\n## Oração final\n\n```verse\nÓ Deus, que Vos dignastes alegrar o mundo\ncom a Ressurreição do vosso Filho, nosso Senhor Jesus Cristo,\nconcedei-nos, Vos pedimos,\nque, por intercessão da Virgem Maria, sua Mãe,\nalcancemos as alegrias da vida eterna.\nPelo mesmo Cristo nosso Senhor.\nAmém.\n```',
  E'Regina cæli, lætare, allelúia.\nQuia quem meruísti portáre, allelúia.\nResurréxit, sicut dixit, allelúia.\nOra pro nobis Deum, allelúia.\n\nV. Gaude et lætáre, Virgo María, allelúia.\nR. Quia surréxit Dóminus vere, allelúia.\n\nOrémus. Deus, qui per resurrectiónem\nFílii tui Dómini nostri Iesu Christi\nmundum lætificáre dignátus es:\npræsta, quǽsumus,\nut per eius Genetrícem Vírginem Maríam\nperpétuæ capiámus gáudia vitæ.\nPer eúndem Christum Dóminum nostrum.\nAmen.',
  'Regina Cæli · Rainha do Céu, Alegrai-vos',
  array['regina caeli','rainha do céu','páscoa','pascal','aleluia','ressurreição','substitui ângelus'],
  'Regina Cæli: antífona pascal que substitui o Ângelus do Sábado Santo até Pentecostes. Texto em português e latim.',
  null,
  'Bell',
  20,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'dia-a-dia' and s.slug = 'durante-o-dia';

commit;
