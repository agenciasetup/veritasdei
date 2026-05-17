-- ============================================================================
-- Códex Veritas — Seed C (cartas-segredo) + D (debate)
-- ============================================================================
-- C usa tipo `nota_contem_frase` (frases curtas em anotações de estudo).
-- D usa contadores 'debates_vencidos' / 'debates_perfeitos' (server-side).
-- ============================================================================

begin;

-- ============================================================================
-- C — Cartas-segredo (sem dica_desbloqueio — surpresa total)
-- ============================================================================

-- C.1 — Épicas (sem tiragem)
insert into public.cartas (
  personagem_id, slug, nome, subtitulo, categoria, raridade, estrelas,
  frase_central, frase_referencia, autoridade_doutrinaria, efeito_simbolico,
  recompensa, simbolo, moldura, cor_accent, dica_desbloqueio, regras, status, ordem
) values
  ((select id from public.personagens where slug='jesus-cristo'),
   'o-verbo-se-fez-carne', 'O Verbo se Fez Carne', 'Et Verbum caro factum est',
   'Carta Secreta', 'epica', 4,
   'No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.',
   'João 1,1.14',
   'Concílio de Niceia (325) — homoousios; Calcedônia (451) — duas naturezas.',
   'Marca o portador como devoto da Encarnação.',
   '["Carta Secreta Épica","Selo: Encarnação"]'::jsonb,
   '☧', 'ornamentada', '#8B1E3F', null,
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','nota_contem_frase','ref','verbum caro factum est'))),
   'publicado', 50),

  ((select id from public.personagens where slug='a-igreja'),
   'lumen-gentium', 'Lumen Gentium', 'Luz das Nações',
   'Carta Secreta', 'epica', 4,
   'A Igreja é em Cristo como que o sacramento, ou seja, o sinal e o instrumento da íntima união com Deus e da unidade de todo o gênero humano.',
   'Lumen Gentium 1',
   'Vaticano II, Constituição Dogmática Lumen Gentium (1964).',
   'Aumenta a clareza eclesiológica em debates.',
   '["Carta Secreta Épica","Selo: Lumen Gentium"]'::jsonb,
   '✠', 'ornamentada', '#8B1E3F', null,
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','nota_contem_frase','ref','luz das nações'))),
   'publicado', 51),

  ((select id from public.personagens where slug='padres-da-igreja'),
   'extra-ecclesiam', 'Extra Ecclesiam Nulla Salus', 'Fora da Igreja não há salvação',
   'Carta Secreta', 'epica', 4,
   'Fora da Igreja não há salvação.',
   'Cipriano de Cartago, Epístola 73,21',
   'CIC 846 — frase interpretada à luz de Lumen Gentium 16: a salvação fora da Igreja visível só é possível pela invencível ignorância e por uma graça que ainda é dela.',
   'Aumenta a precisão histórica em apologética.',
   '["Carta Secreta Épica","Selo: Extra Ecclesiam"]'::jsonb,
   '☩', 'ornamentada', '#8B1E3F', null,
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','nota_contem_frase','ref','fora da igreja não há salvação'))),
   'publicado', 52),

  ((select id from public.personagens where slug='a-igreja'),
   'una-sancta', 'Una Sancta', 'Uma, Santa, Católica e Apostólica',
   'Carta Secreta', 'epica', 4,
   'Creio numa só Igreja santa católica e apostólica.',
   'Credo Niceno-Constantinopolitano (381)',
   'CIC 811–870 — as quatro notas da Igreja.',
   'Sela o portador na unidade dos batizados.',
   '["Carta Secreta Épica","Selo: Una Sancta"]'::jsonb,
   '✠', 'ornamentada', '#8B1E3F', null,
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','nota_contem_frase','ref','creio numa só igreja santa católica'))),
   'publicado', 53),

  ((select id from public.personagens where slug='doutores-da-igreja'),
   'cor-ad-cor-loquitur', 'Cor ad Cor Loquitur', 'Coração fala ao coração',
   'Carta Secreta', 'epica', 4,
   'Coração fala ao coração.',
   'Lema cardinalício de São John Henry Newman',
   'CIC 2700–2724 — formas da oração; oração mental e contemplação.',
   'Aprofunda a oração mental do portador.',
   '["Carta Secreta Épica","Selo: Cor ad Cor"]'::jsonb,
   '♥', 'ornamentada', '#8B1E3F', null,
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','nota_contem_frase','ref','coração fala ao coração'))),
   'publicado', 54),

  ((select id from public.personagens where slug='jose-de-nazare'),
   'ad-maiorem-dei-gloriam', 'Ad Maiorem Dei Gloriam', 'Para a maior glória de Deus',
   'Carta Secreta', 'epica', 4,
   'Tudo para a maior glória de Deus.',
   'Lema da Companhia de Jesus (Inácio de Loyola)',
   'José, "o Justo" (Mt 1,19) — modelo do silêncio operante.',
   'Conserva o esforço escondido como tesouro.',
   '["Carta Secreta Épica","Selo: AMDG"]'::jsonb,
   'AMDG', 'ornamentada', '#8B1E3F', null,
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','nota_contem_frase','ref','para a maior glória de deus'))),
   'publicado', 55),

-- C.2 — Lendárias (144 cópias)
  ((select id from public.personagens where slug='santos-do-rosario'),
   'anima-christi', 'Anima Christi', 'Alma de Cristo, santifica-me',
   'Carta Secreta Lendária', 'lendaria', 5,
   'Alma de Cristo, santifica-me. Corpo de Cristo, salva-me. Sangue de Cristo, inebria-me.',
   'Oração medieval (séc. XIV); promovida por Inácio de Loyola.',
   'Oração após a Comunhão eucarística — Roteiro nos Exercícios Espirituais.',
   'Bênção eucarística sobre o portador.',
   '["Carta Lendária","Selo: Anima Christi"]'::jsonb,
   '✠', 'vitral', '#E8C766', null,
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','nota_contem_frase','ref','alma de cristo, santifica-me'))),
   'publicado', 60),

  ((select id from public.personagens where slug='doutores-da-igreja'),
   'tantum-ergo', 'Tantum Ergo', 'O grande sacramento veneramos',
   'Carta Secreta Lendária', 'lendaria', 5,
   'Tantum ergo Sacramentum veneremur cernui.',
   'Tomás de Aquino, hino Pange Lingua (1264) — Corpus Christi',
   'Bênção do Santíssimo: as duas últimas estrofes do Pange Lingua.',
   'Eleva a devoção eucarística do portador.',
   '["Carta Lendária","Selo: Tantum Ergo"]'::jsonb,
   '✠', 'vitral', '#E8C766', null,
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','nota_contem_frase','ref','tantum ergo sacramentum veneremur cernui'))),
   'publicado', 61),

  ((select id from public.personagens where slug='doutores-da-igreja'),
   'pange-lingua', 'Pange Lingua', 'Canta, língua, o mistério',
   'Carta Secreta Lendária', 'lendaria', 5,
   'Pange, lingua, gloriosi Corporis mysterium.',
   'Tomás de Aquino, Pange Lingua (1264)',
   'Hino composto a pedido do Papa Urbano IV para a festa de Corpus Christi.',
   'Acompanha procissões eucarísticas com poder simbólico.',
   '["Carta Lendária","Selo: Pange Lingua"]'::jsonb,
   '☩', 'vitral', '#E8C766', null,
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','nota_contem_frase','ref','pange lingua gloriosi corporis mysterium'))),
   'publicado', 62),

  ((select id from public.personagens where slug='padres-da-igreja'),
   'te-deum', 'Te Deum', 'A Vós, Deus, louvamos',
   'Carta Secreta Lendária', 'lendaria', 5,
   'Te Deum laudamus, te Dominum confitemur.',
   'Hino atribuído a Niceta de Remesiana (séc. IV)',
   'Rezado em todas as solenidades; concede indulgência plenária em 31 de dezembro e 1° de janeiro.',
   'Marca o portador como devoto da ação de graças.',
   '["Carta Lendária","Selo: Te Deum"]'::jsonb,
   '☩', 'vitral', '#E8C766', null,
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','nota_contem_frase','ref','te deum laudamus, te dominum confitemur'))),
   'publicado', 63),

-- C.3 — Supremas (33 cópias)
  ((select id from public.personagens where slug='a-igreja'),
   'sigillum-confessionis', 'Sigillum Confessionis', 'O Selo Inviolável',
   'Carta Secreta Suprema', 'suprema', 5,
   'O sigilo sacramental é inviolável.',
   'CIC, cân. 983 §1 (1983)',
   'Pe. João Nepomuceno, padroeiro do sigilo confessional, mártir do segredo (1393).',
   'Defesa absoluta do segredo confessional.',
   '["Carta Suprema (33 cópias)","Selo Inviolável"]'::jsonb,
   '🔒', 'vitral', '#F4DE96', null,
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','nota_contem_frase','ref','o sigilo sacramental é inviolável'))),
   'publicado', 70),

  ((select id from public.personagens where slug='doutores-da-igreja'),
   'lex-orandi-lex-credendi', 'Lex Orandi, Lex Credendi', 'A lei da oração é a lei da fé',
   'Carta Secreta Suprema', 'suprema', 5,
   'A lei da oração é a lei da fé.',
   'Prosper de Aquitânia, Indiculus de gratia Dei (séc. V)',
   'CIC 1124 — a fé da Igreja precede a fé do crente; a liturgia é fonte e ápice (Sacrosanctum Concilium 10).',
   'Une ortodoxia e ortopráxis numa só carteirinha.',
   '["Carta Suprema (33 cópias)","Selo: Lex Orandi"]'::jsonb,
   '⚖', 'vitral', '#F4DE96', null,
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','nota_contem_frase','ref','a lei da oração é a lei da fé'))),
   'publicado', 71)
on conflict (slug) do update set
  nome = excluded.nome, raridade = excluded.raridade,
  frase_central = excluded.frase_central, regras = excluded.regras,
  status = excluded.status, ordem = excluded.ordem;

-- Cartas lendárias têm tiragem 144; supremas 33.
update public.cartas set tiragem = 144 where slug in (
  'anima-christi','tantum-ergo','pange-lingua','te-deum'
) and (tiragem is null or tiragem <> 144);

update public.cartas set tiragem = 33 where slug in (
  'sigillum-confessionis','lex-orandi-lex-credendi'
) and (tiragem is null or tiragem <> 33);

-- ============================================================================
-- D — Debate
-- ============================================================================

insert into public.cartas (
  personagem_id, slug, nome, subtitulo, categoria, raridade, estrelas, tiragem,
  frase_central, frase_referencia, autoridade_doutrinaria, efeito_simbolico,
  recompensa, concilio, simbolo, moldura, cor_accent, dica_desbloqueio,
  regras, status, ordem
) values
  ((select id from public.personagens where slug='padres-da-igreja'),
   'mestre-da-apologia', 'Mestre da Apologia', 'Primeira vitória de debate',
   'Debate', 'epica', 4, null,
   'Estai sempre prontos a dar resposta a todo o que vos pedir contas da esperança que há em vós, mas fazei-o com mansidão e respeito.',
   '1 Pedro 3,15',
   'Justino Mártir — Primeira Apologia (séc. II).',
   'Aumenta a confiança em diálogos sobre a fé.',
   '["Carta Épica","Selo: Apologia"]'::jsonb,
   null, '☩', 'ornamentada', '#8B1E3F',
   'Vença seu primeiro debate.',
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','contador','ref','debates_vencidos','valor',1))),
   'publicado', 80),

  ((select id from public.personagens where slug='padres-da-igreja'),
   'espada-do-espirito', 'Espada do Espírito', 'Primeira vitória perfeita',
   'Debate', 'epica', 4, null,
   'A palavra de Deus é viva e eficaz, e mais cortante que qualquer espada de dois gumes.',
   'Hebreus 4,12',
   'Efésios 6,17 — "espada do Espírito, que é a Palavra de Deus".',
   'Cita Escritura, Magistério e caridade com a mesma precisão.',
   '["Carta Épica","Selo: Espada do Espírito"]'::jsonb,
   null, '⚔', 'ornamentada', '#8B1E3F',
   'Vença um debate com 100% nos três critérios (Bíblia, Magistério, Caridade).',
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','contador','ref','debates_perfeitos','valor',1))),
   'publicado', 81),

  ((select id from public.personagens where slug='jesus-cristo'),
   'sal-da-terra', 'Sal da Terra', 'Sete vitórias de debate',
   'Debate', 'epica', 4, null,
   'Vós sois o sal da terra; se, porém, o sal se tornar insípido…',
   'Mateus 5,13',
   'CIC 2473–2474 — testemunho cristão e martírio.',
   'Aumenta a persuasão sem perder a caridade.',
   '["Carta Épica","Selo: Sal da Terra"]'::jsonb,
   null, '✠', 'ornamentada', '#8B1E3F',
   'Vença sete debates.',
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','contador','ref','debates_vencidos','valor',7))),
   'publicado', 82),

  ((select id from public.personagens where slug='doutores-da-igreja'),
   'doctor-angelicus', 'Doctor Angelicus', 'Tomás de Aquino',
   'Debate Lendário', 'lendaria', 5, 144,
   'Concedei-me, Senhor, inteligência para compreender-Vos, sentimento para perceber-Vos, razão para conhecer-Vos.',
   'Oração de S. Tomás antes do estudo',
   'Leão XIII, Aeterni Patris (1879) — Tomás como mestre comum.',
   'Argumentos racionais com poder dobrado.',
   '["Carta Lendária","Selo: Doctor Angelicus"]'::jsonb,
   'Vaticano I (1869–70)', '✦', 'vitral', '#E8C766',
   'Vença 33 debates após concluir o pilar "Dogmas".',
   jsonb_build_object('operador','todas','condicoes', jsonb_build_array(
     jsonb_build_object('tipo','contador','ref','debates_vencidos','valor',33),
     jsonb_build_object('tipo','grupo_concluido','ref','dogmas')
   )),
   'publicado', 83),

  ((select id from public.personagens where slug='doutores-da-igreja'),
   'doctor-gratiae', 'Doctor Gratiae', 'Agostinho de Hipona',
   'Debate Lendário', 'lendaria', 5, 144,
   'Tarde te amei, formosura tão antiga e tão nova, tarde te amei.',
   'Confissões X,27',
   'Doutor da Graça — controvérsia pelagiana (Concílio de Cartago, 418).',
   'Argumentos sobre graça e livre-arbítrio com clareza extraordinária.',
   '["Carta Lendária","Selo: Doctor Gratiae"]'::jsonb,
   'Cartago (418)', '✠', 'vitral', '#E8C766',
   'Vença 10 debates perfeitos (100% nos três critérios).',
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','contador','ref','debates_perfeitos','valor',10))),
   'publicado', 84),

  ((select id from public.personagens where slug='padres-da-igreja'),
   'athanasius-contra-mundum', 'Athanasius Contra Mundum',
   'Atanásio contra o mundo', 'Debate Supremo', 'suprema', 5, 33,
   'Se o mundo está contra Atanásio, Atanásio está contra o mundo.',
   'Atanásio de Alexandria — De Decretis (séc. IV)',
   'Concílio de Niceia (325) e a luta antiariana de meio século.',
   'Sustenta a ortodoxia mesmo contra a maioria visível.',
   '["Carta Suprema (33 cópias)","Selo: Contra Mundum"]'::jsonb,
   'Niceia (325)', '☩', 'vitral', '#F4DE96',
   'Vença 33 debates perfeitos.',
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','contador','ref','debates_perfeitos','valor',33))),
   'publicado', 85)
on conflict (slug) do update set
  nome = excluded.nome, raridade = excluded.raridade, tiragem = excluded.tiragem,
  regras = excluded.regras, status = excluded.status, ordem = excluded.ordem;

select public.fn_recalc_personagem_total(p.id)
  from public.personagens p
 where p.slug in (
   'jesus-cristo','a-igreja','padres-da-igreja','doutores-da-igreja',
   'maria-mae-de-deus','jose-de-nazare','santos-do-rosario'
 );

commit;
