-- Seed: Salve Rainha (Essenciais / capitales)

begin;

delete from public.content_items where slug = 'salve-rainha';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'salve-rainha',
  'Salve Rainha',
  'Salve Regina',
  E'Antífona mariana da Igreja latina, atribuída ao monge Hermano Contracto (séc. XI). Fecha o Santo Rosário e é cantada ao final das Completas no Tempo Comum.\n\n```verse\nSalve, Rainha,\nMãe de misericórdia,\nvida, doçura e esperança nossa, salve!\n\nA vós bradamos,\nos degredados filhos de Eva.\nA vós suspiramos,\ngemendo e chorando\nneste vale de lágrimas.\n\nEia, pois, advogada nossa,\nesses vossos olhos misericordiosos\na nós volvei;\ne depois deste desterro,\nmostrai-nos Jesus,\nbendito fruto do vosso ventre.\n\nÓ clemente, ó piedosa,\nó doce sempre Virgem Maria.\n\n— Rogai por nós, Santa Mãe de Deus.\n— Para que sejamos dignos das promessas de Cristo. Amém.\n```',
  E'Salve, Regína,\nMater misericórdiæ,\nvita, dulcédo et spes nostra, salve.\n\nAd te clamámus,\néxsules fílii Hevæ.\nAd te suspirámus,\ngeméntes et flentes\nin hac lacrimárum valle.\n\nEia ergo, Advocáta nostra,\nillos tuos misericórdes óculos\nad nos convérte.\nEt Iesum, benedíctum fructum ventris tui,\nnobis post hoc exsílium osténde.\n\nO clemens, o pia,\no dulcis Virgo María.\n\n— Ora pro nobis, Sancta Dei Génetrix.\n— Ut digni efficiámur promissiónibus Christi. Amen.',
  'Salve Rainha · Salve Regina',
  array['essencial','salve','rainha','mariana','antífona','rosário','completas','regina'],
  'Salve Rainha: antífona mariana do séc. XI que encerra o Santo Rosário e as Completas. Texto em português e latim (Salve Regina).',
  null,
  'Crown',
  70,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'essenciais' and s.slug = 'capitales';

commit;
