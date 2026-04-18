-- Seed: Oração de Santo Tomás antes dos estudos (Ocasiões / estudo)

begin;

delete from public.content_items where slug = 'oracao-santo-tomas-estudos';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'oracao-santo-tomas-estudos',
  'Oração de Santo Tomás antes do estudo',
  'Ante studium',
  E'Atribuída a Santo Tomás de Aquino (séc. XIII), rezava-a antes de escrever a Suma Teológica. Pede ao Espírito Santo a luz que dissipa a ignorância — oração de quem leva os livros a sério.\n\n```verse\nCriador inefável,\nque, dos tesouros da vossa sabedoria,\nformastes as hierarquias dos anjos,\ne os dispusestes em ordem admirável sobre os céus empíreos,\ne que com tanta beleza ordenastes as partes do universo:\n\nVós, Vos peço, que sois a verdadeira fonte da luz e da sabedoria,\nderramai sobre a escuridão do meu entendimento\nos raios da vossa claridade,\nafastando de mim a dupla treva\nem que nasci: o pecado e a ignorância.\n\nVós, que dais sabedoria às crianças,\ninstruí a minha linguagem\ne derramai sobre os meus lábios\na graça da vossa bênção.\n\nConcedei-me agudeza para entender,\ncapacidade para reter,\nmétodo e facilidade para aprender,\nsutileza para interpretar,\ngraça copiosa para falar.\n\nDai-me o acerto ao começar,\ndirecção ao progredir,\ne conclusão perfeita no concluir.\nVós, que sois verdadeiro Deus e verdadeiro homem,\nvivo e reinais pelos séculos dos séculos.\nAmém.\n```',
  E'Ineffábilis Creátor,\nqui de thesáuris sapiéntiæ tuæ\ntres Angelórum hierárchias designásti\net eas super cælum empýreum\nmíro órdine collocásti\natque univérsi partes elegantíssime distribuísti:\n\nTu, inquam, qui verus fons\nlúminis et sapiéntiæ díceris ac supérnum princípium,\ninfúndere dignéris super intelléctus mei ténebras\ntuæ rádium claritátis,\ndúplices, in quibus natus sum,\na me rémovens ténebras,\npeccátum scílicet et ignorántiam.\n\nTu, qui linguas infántium facis disértas,\nlinguam meam erúdias\natque in lábiis meis grátiam tuæ benedictiónis infúndas.\n\nDa mihi intelligéndi acúmen,\nretinéndi capacitátem,\naddiscéndi modum et facilitátem,\ninterpretándi subtilitátem,\nloquéndi grátiam copiósam.\n\nIngréssum ínstruas,\nprogréssum dírigas,\negréssum cómpleas.\nTu, qui es verus Deus et homo,\nqui vivis et regnas in sǽcula sæculórum.\nAmen.',
  'Ante studium · Santo Tomás de Aquino',
  array['estudo','santo tomás','aquino','sabedoria','ignorância','suma teológica','antes do estudo','ante studium'],
  'Oração de Santo Tomás de Aquino antes do estudo (Ante studium): pede ao Espírito Santo a luz que dissipa a ignorância. Texto em português e latim.',
  array['Sab 7:7','Tg 1:5'],
  'Flame',
  10,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'ocasioes' and s.slug = 'estudo';

commit;
