-- Seed: Credo Apostólico (Essenciais / capitales)

begin;

delete from public.content_items where slug = 'credo-apostolico';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'credo-apostolico',
  'Credo Apostólico',
  'Symbolum Apostolorum',
  E'Profissão de fé batismal da Igreja romana, resumo dos artigos que os Apóstolos pregaram. É o Credo usado no início do Rosário e no Ofício.\n\n```verse\nCreio em Deus Pai todo-poderoso,\nCriador do céu e da terra;\ne em Jesus Cristo, seu único Filho, nosso Senhor,\nque foi concebido pelo poder do Espírito Santo;\nnasceu da Virgem Maria;\npadeceu sob Pôncio Pilatos,\nfoi crucificado, morto e sepultado;\ndesceu à mansão dos mortos;\nressuscitou ao terceiro dia;\nsubiu aos céus;\nestá sentado à direita de Deus Pai todo-poderoso,\ndonde há de vir a julgar os vivos e os mortos.\n\nCreio no Espírito Santo,\nna Santa Igreja Católica,\nna comunhão dos Santos,\nna remissão dos pecados,\nna ressurreição da carne,\nna vida eterna.\nAmém.\n```',
  E'Credo in Deum Patrem omnipoténtem,\nCreatórem cæli et terræ.\nEt in Iesum Christum, Fílium eius únicum, Dóminum nostrum,\nqui concéptus est de Spíritu Sancto,\nnatus ex María Vírgine,\npassus sub Póntio Piláto,\ncrucifíxus, mórtuus, et sepúltus,\ndescéndit ad ínferos,\ntértia die resurréxit a mórtuis,\nascéndit ad cælos,\nsedet ad déxteram Dei Patris omnipoténtis,\ninde ventúrus est iudicáre vivos et mórtuos.\n\nCredo in Spíritum Sanctum,\nsanctam Ecclésiam cathólicam,\nsanctórum communiónem,\nremissiónem peccatórum,\ncarnis resurrectiónem,\nvitam ætérnam.\nAmen.',
  'Credo Apostólico · Symbolum Apostolorum',
  array['essencial','credo','apostólico','profissão','fé','batismal','símbolo','rosário'],
  'Credo Apostólico: profissão de fé batismal da Igreja romana, usada no início do Rosário. Texto em português e latim (Symbolum Apostolorum).',
  array['1Cor 15:3-5','Ef 4:5'],
  'ShieldCheck',
  50,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'essenciais' and s.slug = 'capitales';

commit;
