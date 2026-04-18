-- Seed: Glória / Hino Gloria (Missa / ordinário)

begin;

delete from public.content_items where slug = 'gloria-missa';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'gloria-missa',
  'Glória (hino)',
  'Gloria in excelsis Deo',
  E'Grande doxologia da Igreja primitiva, abre com o cântico dos anjos em Belém (Lc 2:14). Cantada nas Missas dominicais e solenidades (exceto Advento e Quaresma).\n\n```verse\nGlória a Deus nas alturas,\ne paz na terra aos homens por Ele amados.\n\nSenhor Deus, Rei dos céus,\nDeus Pai todo-poderoso,\nnós Vos louvamos, nós Vos bendizemos,\nnós Vos adoramos, nós Vos glorificamos,\nnós Vos damos graças por vossa imensa glória.\n\nSenhor Jesus Cristo, Filho Unigênito,\nSenhor Deus, Cordeiro de Deus, Filho de Deus Pai.\nVós que tirais o pecado do mundo,\ntende piedade de nós.\nVós que tirais o pecado do mundo,\nacolhei a nossa súplica.\nVós que estais à direita do Pai,\ntende piedade de nós.\n\nSó Vós sois o Santo,\nsó Vós, o Senhor,\nsó Vós, o Altíssimo, Jesus Cristo,\ncom o Espírito Santo, na glória de Deus Pai.\nAmém.\n```',
  E'Glória in excélsis Deo\net in terra pax homínibus bonæ voluntátis.\n\nLaudámus te, benedícimus te,\nadorámus te, glorificámus te,\ngrátias ágimus tibi propter magnam glóriam tuam,\nDómine Deus, Rex cæléstis,\nDeus Pater omnípotens.\n\nDómine Fili Unigénite, Iesu Christe,\nDómine Deus, Agnus Dei, Fílius Patris,\nqui tollis peccáta mundi, miserére nobis;\nqui tollis peccáta mundi, súscipe deprecatiónem nostram.\nQui sedes ad déxteram Patris, miserére nobis.\n\nQuóniam tu solus Sanctus, tu solus Dóminus,\ntu solus Altíssimus, Iesu Christe,\ncum Sancto Spíritu: in glória Dei Patris. Amen.',
  'Gloria in excelsis Deo · Hino da Missa',
  array['missa','glória','gloria','hino','excelsis','anjos','belém','ordinário','dominical'],
  'Glória / Gloria in excelsis Deo: grande doxologia cantada nas Missas dominicais e solenidades. Abre com o cântico dos anjos (Lc 2:14).',
  array['Lc 2:14'],
  'Sparkles',
  30,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'missa' and s.slug = 'ordinario';

commit;
