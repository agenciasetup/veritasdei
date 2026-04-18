-- Seed: Ângelus (Dia a dia / durante-o-dia)

begin;

delete from public.content_items where slug = 'angelus';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'angelus',
  'Ângelus',
  'Angelus Domini',
  E'Meditação da Encarnação, rezada às 6h, 12h e 18h ao som do sino. Popularizada pelos franciscanos no séc. XIII. Fora do Tempo Pascal (quando dá lugar ao Regina Caeli).\n\n## Versículos e responsos\n\n```verse\nV. O Anjo do Senhor anunciou a Maria.\nR. E Ela concebeu do Espírito Santo.\n```\n\n*(Ave-Maria)*\n\n```verse\nV. Eis aqui a serva do Senhor.\nR. Faça-se em mim segundo a vossa palavra.\n```\n\n*(Ave-Maria)*\n\n```verse\nV. E o Verbo se fez carne.\nR. E habitou entre nós.\n```\n\n*(Ave-Maria)*\n\n```verse\nV. Rogai por nós, Santa Mãe de Deus.\nR. Para que sejamos dignos das promessas de Cristo.\n```\n\n## Oração final\n\n```verse\nInfundi, Senhor, a vossa graça\nem nossos corações,\npara que, conhecendo pela anunciação do Anjo\na Encarnação do vosso Filho, Jesus Cristo,\ncheguemos, por sua Paixão e Cruz,\nà glória da Ressurreição.\nPelo mesmo Cristo nosso Senhor.\nAmém.\n```',
  E'V. Angelus Domini nuntiavit Mariae.\nR. Et concepit de Spiritu Sancto.\n\n(Ave Maria)\n\nV. Ecce ancilla Domini.\nR. Fiat mihi secundum Verbum tuum.\n\n(Ave Maria)\n\nV. Et Verbum caro factum est.\nR. Et habitavit in nobis.\n\n(Ave Maria)\n\nV. Ora pro nobis, Sancta Dei Genetrix.\nR. Ut digni efficiamur promissionibus Christi.\n\nOremus. Gratiam tuam, quǽsumus, Domine,\nmentibus nostris infunde;\nut qui, Angelo nuntiante,\nChristi Filii tui incarnationem cognovimus,\nper passionem eius et crucem,\nad resurrectionis gloriam perducamur.\nPer eundem Christum Dominum nostrum.\nAmen.',
  'Ângelus · Angelus Domini',
  array['ângelus','angelus','meio-dia','encarnação','anjo','maria','6h','12h','18h','franciscano'],
  'Ângelus: meditação tradicional da Encarnação, rezada 3 vezes ao dia (6h, 12h, 18h). Texto em português e latim. Dá lugar ao Regina Caeli no Tempo Pascal.',
  array['Lc 1:28','Lc 1:38','Jo 1:14'],
  'Bell',
  10,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'dia-a-dia' and s.slug = 'durante-o-dia';

commit;
