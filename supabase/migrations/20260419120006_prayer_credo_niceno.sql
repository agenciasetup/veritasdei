-- Seed: Credo Niceno-Constantinopolitano (Essenciais / capitales)

begin;

delete from public.content_items where slug = 'credo-niceno';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'credo-niceno',
  'Credo Niceno-Constantinopolitano',
  'Symbolum Nicænum Constantinopolitanum',
  E'Profissão de fé dos primeiros Concílios ecumênicos (Niceia 325 · Constantinopla 381). É o Credo rezado nas Missas dominicais e solenidades.\n\n```verse\nCreio em um só Deus, Pai todo-poderoso,\nCriador do céu e da terra,\nde todas as coisas visíveis e invisíveis.\n\nCreio em um só Senhor, Jesus Cristo,\nFilho Unigênito de Deus,\nnascido do Pai antes de todos os séculos:\nDeus de Deus, luz da luz,\nDeus verdadeiro de Deus verdadeiro,\ngerado, não criado, consubstancial ao Pai.\nPor Ele todas as coisas foram feitas.\nE por nós, homens, e para nossa salvação,\ndesceu dos céus:\ne se encarnou pelo Espírito Santo,\nno seio da Virgem Maria, e se fez homem.\nTambém por nós foi crucificado\nsob Pôncio Pilatos;\npadeceu e foi sepultado.\nRessuscitou ao terceiro dia,\nconforme as Escrituras,\ne subiu aos céus,\nonde está sentado à direita do Pai.\nE de novo há de vir, em sua glória,\npara julgar os vivos e os mortos;\ne o seu reino não terá fim.\n\nCreio no Espírito Santo, Senhor que dá a vida,\ne procede do Pai e do Filho;\ne com o Pai e o Filho é adorado e glorificado:\nEle que falou pelos Profetas.\nCreio na Igreja, una, santa, católica e apostólica.\nProfesso um só Batismo para a remissão dos pecados.\nE espero a ressurreição dos mortos\ne a vida do mundo que há de vir.\nAmém.\n```',
  E'Credo in unum Deum,\nPatrem omnipoténtem,\nfactórem cæli et terræ,\nvisibílium ómnium et invisibílium.\n\nEt in unum Dóminum Iesum Christum,\nFílium Dei Unigénitum,\net ex Patre natum ante ómnia sǽcula.\nDeum de Deo, lumen de lúmine,\nDeum verum de Deo vero,\ngénitum, non factum, consubstantiálem Patri:\nper quem ómnia facta sunt.\nQui propter nos hómines\net propter nostram salútem\ndescéndit de cælis.\nEt incarnátus est de Spíritu Sancto\nex María Vírgine, et homo factus est.\nCrucifíxus étiam pro nobis\nsub Póntio Piláto;\npassus et sepúltus est,\net resurréxit tértia die,\nsecúndum Scriptúras,\net ascéndit in cælum,\nsedet ad déxteram Patris.\nEt íterum ventúrus est cum glória,\niudicáre vivos et mórtuos,\ncuius regni non erit finis.\n\nEt in Spíritum Sanctum, Dóminum et vivificántem:\nqui ex Patre Filióque procédit.\nQui cum Patre et Fílio simul adorátur\net conglorificátur:\nqui locútus est per prophétas.\nEt unam, sanctam, cathólicam\net apostólicam Ecclésiam.\nConfíteor unum baptísma\nin remissiónem peccatórum.\nEt exspécto resurrectiónem mortuórum,\net vitam ventúri sǽculi. Amen.',
  'Credo Niceno-Constantinopolitano · Symbolum Nicænum Constantinopolitanum',
  array['essencial','credo','niceno','missa','concílio','profissão de fé','consubstancial','filioque'],
  'Credo Niceno-Constantinopolitano: profissão de fé dos Concílios de Niceia e Constantinopla, rezada nas Missas dominicais. Texto em português e latim.',
  array['Mt 28:19','1Cor 8:6'],
  'ShieldCheck',
  60,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'essenciais' and s.slug = 'capitales';

commit;
