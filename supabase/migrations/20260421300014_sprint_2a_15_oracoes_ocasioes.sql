-- ============================================================================
-- Sprint 2A.15 — Orações para Ocasiões: 5 deepdives + quiz
-- ============================================================================
-- Fecha o Bloco A (pilares em content_groups). Orações para situações
-- específicas: proteção, estudo, sofrimento, viagem, defuntos.
-- ============================================================================


-- 1. Proteção espiritual
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'oracoes',
  '15aff830-b59f-4e5e-977b-cd6494968736',
  $json$[
    {
      "slug": "contexto_historico",
      "title": "Contexto histórico",
      "body": "A tradição cristã reconhece a realidade do combate espiritual (Ef 6,10-18). Satanás e os anjos caídos agem no mundo, buscando afastar almas de Deus. As orações de proteção são armas espirituais poderosas, sancionadas por séculos de prática eclesial.\n\nAs principais orações de proteção: São Miguel Arcanjo (composta pelo Papa Leão XIII em 1886, após visão mística do poder demoníaco no século XX); Anjo da Guarda (cada um tem um anjo específico, Mt 18,10); Três Ave Marias (devoção mariana tradicional para pedir proteção; atribuída a Santa Mectildes); Oração de Santo Antão, Oração a Nossa Senhora do Perpétuo Socorro, Medalha de São Bento.\n\nEm contextos de luta espiritual explícita, a Igreja dispõe ainda de sacramentais: crucifixo, água benta, velas bentas, sal bento, medalhas abençoadas. Para casos graves, o ministério de exorcismo é reservado a sacerdotes com mandato explícito do bispo (CDC cân. 1172). O Rito de Exorcismos (1999) é o texto oficial."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação na vida cristã",
      "body": "Rezar a São Miguel Arcanjo nos momentos de tentação, ansiedade, medo. A oração leoniana breve: São Miguel Arcanjo, defendei-nos no combate; sede o nosso refúgio contra as maldades e as ciladas do demônio. Repreenda-o Deus, instantemente o pedimos. E vós, príncipe da milícia celeste, pela virtude divina, precipitai no inferno a Satanás e aos outros espíritos malignos que vagueiam pelo mundo para perder as almas. Amém.\n\nDiariamente, invocar o Anjo da Guarda — especialmente antes de viagens, decisões importantes, situações de risco. Sagrada Escritura (Sl 91,11): Ordenou aos seus anjos que te guardassem em todos os seus caminhos.\n\nUsar sacramentais com fé: sinal da cruz com água benta ao entrar em casa; crucifixo à cabeceira da cama; medalha de São Bento (Medalha de São Bento protege contra mal, tentação, morte súbita) ou Medalha Milagrosa.\n\nEm situações de aflição espiritual intensa: procurar sacerdote. A oração de libertação (mais leve) pode ser feita por qualquer fiel. Exorcismo solene é ministério específico, não improvisado. Nunca mexer com espiritismo, magia, oráculos, tarô — portas abertas para influências demoníacas. O remédio contra tudo isso é a vida sacramental: confissão, Eucaristia, oração, caridade."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "Efésios 6,10-18 (armadura de Deus)", "url": null, "page": null },
    { "kind": "scripture", "label": "Salmo 91 (O salmo da proteção)", "url": null, "page": null },
    { "kind": "scripture", "label": "Mateus 18,10 (anjos das crianças)", "url": null, "page": null },
    { "kind": "papal", "label": "Leão XIII, Oração a São Miguel (1886)", "url": null, "page": null },
    { "kind": "catechism", "label": "Catecismo da Igreja Católica, §§ 1673 (exorcismos)", "url": null, "page": null },
    { "kind": "other", "label": "Rito de Exorcismos (1999)", "url": null, "page": null }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections, sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


-- 2. Antes do estudo
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'oracoes',
  'a4ac132b-2372-4026-ae01-db3a7d3bdf81',
  $json$[
    {
      "slug": "contexto_historico",
      "title": "Contexto histórico",
      "body": "Desde a Idade Média, estudantes cristãos consagram o estudo a Deus pela oração. São Tomás de Aquino compôs a célebre Oração antes dos Estudos, usada até hoje em universidades católicas: Criador inefável, verdadeira fonte da Luz e Princípio da Sabedoria, dignai-Vos infundir na obscuridade da minha inteligência um raio da Vossa claridade... O pedido é iluminação divina para compreender a verdade.\n\nA sabedoria cristã entende o estudo não como mero acúmulo de dados, mas como busca da verdade — que em última instância é Deus, a Verdade absoluta (Jo 14,6). Por isso Santo Tomás e toda a tradição escolástica viam nos estudos vocação espiritual: entender a criação, compreender a Revelação, articular a fé com a razão.\n\nSão Jerônimo (séc. IV-V), tradutor da Vulgata, é padroeiro dos estudiosos e biblistas. Nas suas Cartas ensina: a ignorância das Escrituras é ignorância de Cristo. Santo Isidoro de Sevilha (séc. VII), autor das Etimologias, é padroeiro da internet e da informática — patrono para quem estuda com tecnologias modernas."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação na vida cristã",
      "body": "Antes de abrir livros ou dar aulas, rezar breve oração. Pode-se usar a Oração de São Tomás (longa, para ocasiões importantes) ou fórmula mais simples: Senhor, abri meu entendimento para compreender Tua verdade; dai-me clareza nos conceitos, memória para reter, humildade para aprender. Pela intercessão de São Tomás de Aquino, concedei-me crescer em sabedoria e amor a Ti. Amém.\n\nEstudantes católicos podem adotar um santo padroeiro: São Tomás de Aquino (filosofia, teologia, estudos em geral), São Jerônimo (literatura, linguística, Bíblia), São Alberto Magno (ciências), Santa Catarina de Alexandria (filosofia, ensino feminino), São Luís Gonzaga (estudantes jovens), Santo Isidoro (informática, comunicações).\n\nA regra tradicional das universidades católicas: começar e terminar aulas com oração breve. Mesmo em ambientes seculares, fazer esse gesto em particular: sinal da cruz mental antes de iniciar atividade intelectual. O estudo se torna, assim, ato de culto — oferta a Deus de nossa inteligência e esforço.\n\nPara exames e provas: antes, rezar pedindo tranquilidade e clareza; durante, confiar no Senhor; depois, seja qual for o resultado, agradecer. Sucesso é bênção; dificuldade é chamado à humildade. Ambos servem à santificação."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "Tiago 1,5 (se a alguém falta sabedoria, peça a Deus)", "url": null, "page": null },
    { "kind": "scripture", "label": "Provérbios 9,10 (temor do Senhor, princípio da sabedoria)", "url": null, "page": null },
    { "kind": "father", "label": "São Tomás de Aquino, Oração antes dos Estudos", "url": null, "page": null },
    { "kind": "father", "label": "São Jerônimo, Cartas sobre o estudo das Escrituras", "url": null, "page": null },
    { "kind": "papal", "label": "João Paulo II, Fides et Ratio (1998)", "url": null, "page": null }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections, sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


-- 3. Sofrimento e confiança
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'oracoes',
  '29187b9e-6457-4180-a1d1-f182f8644403',
  $json$[
    {
      "slug": "contexto_historico",
      "title": "Contexto histórico",
      "body": "A fé cristã não evita o sofrimento; transforma-o. Cristo mesmo sofreu voluntariamente pela nossa salvação. O cristão que sofre unindo-se à Cruz torna o próprio padecimento redentor (Col 1,24: completo em minha carne o que falta aos sofrimentos de Cristo em favor do seu corpo, que é a Igreja).\n\nAs orações da confiança são tesouro antigo. Santa Faustina recebeu de Cristo a Oração Jesus, confio em Vós (1935, Diário 1485), que acompanha a imagem da Divina Misericórdia. É invocação simples e poderosa: três palavras para qualquer situação.\n\nSanta Teresinha do Menino Jesus (falecida em 1897) viveu a pequena via — confiança absoluta no Pai como criança. Sua Oração de Oferecimento ao Amor Misericordioso é obra-prima da mística contemporânea. Santo Inácio escreveu a Suscipe — oferenda total: Tomai, Senhor, e recebei toda a minha liberdade, minha memória, inteligência, vontade... dai-me o Vosso amor e a Vossa graça; isto me basta.\n\nEm situação de doença grave, prova intensa, luto — o Rosário dos Mistérios Dolorosos é companhia eficaz. Acompanhar Cristo na Paixão ensina a carregar a própria cruz. Santa Gianna Beretta Molla (mártir italiana do aborto, séc. XX) é padroeira das mães em dificuldades."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação na vida cristã",
      "body": "Jaculatória mais poderosa nas horas difíceis: Jesus, confio em Vós. Repetida com fé, transforma ansiedade em paz. Pode-se combinar com a Coroa da Divina Misericórdia (rezada no terço normal, às 15h — hora da misericórdia): sete vezes a série Pai Eterno, eu Vos ofereço o Corpo, Sangue... / Pela sua dolorosa paixão, tende misericórdia...\n\nSuscipe de Santo Inácio: para quem busca abandono total. Recitar lentamente, deixando cada palavra descer ao coração. Quem perdeu tudo ainda tem a graça de Deus — e isso basta.\n\nSalmo 23 (O Senhor é meu pastor): lido lentamente em momentos de medo ou angústia, restaura a confiança. Ainda que eu caminhe por um vale tenebroso, nenhum mal temerei, porque estais comigo. Este salmo é o melhor antídoto contra o medo paralisante.\n\nOração dos enfermos: Senhor Jesus, que curaste os doentes que buscavam Tua ajuda, abençoai o meu sofrimento. Dai-me força para suportar. Unai a minha dor à Vossa Paixão para a salvação das almas. Amém.\n\nEm luto: Rezar por quem partiu (Eterno descanso), mas também pedir força para continuar. Santo Tomás de Aquino: o amor eterno encontra seus amados na eternidade. O sofrimento do luto é testemunho do amor; esse mesmo amor é o que não morre.\n\nTerço dos Mistérios Dolorosos nas quartas e sextas: acompanhar Cristo na agonia, flagelação, coroação de espinhos, carregamento da Cruz, crucifixão. Cada mistério uma escola de suportar a própria cruz com amor."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "Colossenses 1,24 (completo na minha carne...)", "url": null, "page": null },
    { "kind": "scripture", "label": "Salmo 23 (O Senhor é meu pastor)", "url": null, "page": null },
    { "kind": "scripture", "label": "2 Coríntios 12,9 (minha graça te basta)", "url": null, "page": null },
    { "kind": "father", "label": "Santo Inácio de Loyola, Suscipe (Exercícios)", "url": null, "page": null },
    { "kind": "father", "label": "Santa Teresinha, História de uma Alma; Oferecimento ao Amor Misericordioso", "url": null, "page": null },
    { "kind": "other", "label": "Santa Faustina, Diário (Divina Misericórdia)", "url": null, "page": null }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections, sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


-- 4. Viagem
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'oracoes',
  '61968c92-9f7c-417d-ba4d-82cb22478324',
  $json$[
    {
      "slug": "contexto_historico",
      "title": "Contexto histórico",
      "body": "Viajar sempre foi questão de proteção. Na Antiguidade cristã, os mártires e missionários rezavam antes de partir; os marinheiros invocavam Nossa Senhora Estrela do Mar (Ave Maris Stella, hino dos séc. VIII-IX). Hoje, com trânsito, aviões, viagens internacionais, a tradição mantém viva a necessidade da proteção divina.\n\nAs principais orações do viajante: oração a São Cristóvão (padroeiro dos motoristas e viajantes); oração do viajante tradicional (Dai, Senhor, proteção a quem vai caminhar...); invocações ao Anjo da Guarda; Ave Maris Stella e Salve Rainha; Três Ave Marias pela paz; consagração ao Sagrado Coração.\n\nSão Cristóvão é um dos santos mais populares dos motoristas. Segundo a tradição, carregou o Menino Jesus através de um rio; daí seu nome (Christo-phoros, portador de Cristo). Sua medalha é frequentemente pendurada nos retrovisores. Padroeiro da direção segura e das viagens.\n\nA bênção dos veículos é rito tradicional: sacerdote asperge o carro com água benta e reza para que o Senhor proteja condutor e passageiros. Muitas paróquias fazem no dia de São Cristóvão (25 de julho) ou por solicitação. Carros, motos, caminhões, ônibus — todos podem ser abençoados."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação na vida cristã",
      "body": "Antes de iniciar viagem: fazer sinal da cruz, rezar uma Ave Maria, invocar São Cristóvão, pedir ao Anjo da Guarda. Em carro, pode-se também benzer-se com água benta (levar um frasco pequeno). Esta não é superstição: é reconhecer que toda nossa segurança está em Deus.\n\nDurante o trânsito longo: rezar o terço (muitos motoristas fizeram o hábito do terço no carro — excelente uso do tempo que seria desperdiçado). O terço é oração que dispensa livro e pode ser feito de olhos abertos, concentrado na direção. Uma hora de trânsito equivale a três terços completos.\n\nEm viagens de avião: rezar antes da decolagem (poucos minutos) e pedir chegada em segurança. No pouso, agradecer. Muitas paróquias aeroportuárias (há capelas em grandes aeroportos) oferecem Missa rápida ou oração antes de viagens internacionais.\n\nPeregrinações: viagens especificamente religiosas. Terra Santa, Roma, Fátima, Aparecida, Santiago de Compostela, Lourdes, Guadalupe — centros de peregrinação católica. Viajar para santuário é tradição antiga e renovada; fortalece a fé, gera conversões, une famílias.\n\nAo retornar: agradecer. Muitas vezes esquecemos a ação de graças. Uma Missa de agradecimento ou uma oferta na paróquia é retribuição digna pelas graças de viagem segura.\n\nAo partir definitivamente desta terra (morte): a mesma lógica. Os oratórios e orações do moribundo são viagem última. Quem viveu acostumado a rezar antes de viajar, viaja em paz para a eternidade."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "Tobias 5,17 (O bom Deus nos tenha em sua proteção)", "url": null, "page": null },
    { "kind": "scripture", "label": "Salmo 121 (Ergo os olhos para os montes)", "url": null, "page": null },
    { "kind": "other", "label": "Bênção dos Veículos — Rito de Bênçãos (Editora Paulus)", "url": null, "page": null },
    { "kind": "other", "label": "Ave Maris Stella (hino do séc. VIII-IX)", "url": null, "page": null },
    { "kind": "other", "label": "Tradição de São Cristóvão, padroeiro dos motoristas", "url": null, "page": null }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections, sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


-- 5. Pelos defuntos
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'oracoes',
  '6e48f0f4-f322-49f7-bfd5-11afc1698c02',
  $json$[
    {
      "slug": "contexto_historico",
      "title": "Contexto histórico",
      "body": "Rezar pelos defuntos é obra de misericórdia espiritual fundamentada na doutrina do Purgatório. As almas dos justos que morrem em graça mas com pena temporal a pagar podem ser ajudadas pelos sufrágios dos vivos — especialmente pela Santa Missa, orações, esmolas, indulgências aplicadas a elas.\n\n2 Mac 12,44-46 é o fundamento escriturístico: Judas Macabeu mandou oferecer sacrifícios pelos soldados mortos em pecado, crendo que essa oração podia libertá-los. Santo pensamento orar pelos mortos, para que sejam libertos de seus pecados. A prática perpassa toda a Tradição cristã.\n\nA oração mais conhecida é o Eterno Descanso: Dai-lhes, Senhor, o descanso eterno, e brilhe para eles a luz que não tem fim. Descansem em paz. Amém. Versículos litúrgicos (Requiem aeternam dona eis, Domine) cantados nas Missas de defuntos, na Liturgia das Horas para falecidos, em sepultamentos.\n\nO Dia de Finados (2 de novembro) e o mês de novembro inteiro são consagrados às almas do purgatório. Durante esse mês, indulgências especiais aplicáveis: visita ao cemitério com orações (8 primeiros dias de novembro dão indulgência plenária, se cumpridas as condições habituais — confissão, comunhão, oração pelo Papa, desapego de todo pecado). Obra de misericórdia espiritual importante."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação na vida cristã",
      "body": "Rezar pelo Eterno Descanso é dever de quem ama. Nos aniversários de morte de familiares, mandar celebrar Missa (Missa de defunto é oferta máxima); fazer visita ao túmulo e rezar; oferecer obras de caridade em intenção deles. Esses atos aliviam efetivamente suas almas no Purgatório.\n\nCoroa da Divina Misericórdia aplicada aos defuntos: rezada às 15h ou em qualquer hora, com intenção específica pelas almas. Especialmente eficaz segundo a promessa feita a Santa Faustina.\n\nMês de novembro: dedicar alguns momentos diários às almas. Uma Ave Maria; um terço; visita ao cemitério. Nos primeiros oito dias, indulgência plenária possível uma vez por dia, aplicável a um defunto. Aproveitar essa graça extraordinária é caridade imensa.\n\nMissa de 7° dia, 30° dia, aniversário: tradição católica bonita. Encomendar Missa na paróquia (oferenda modesta; o Livro de Ofícios indica valores simbólicos — pode-se dar mais ou menos conforme possibilidades). A Missa aplicada é a oração mais poderosa pela alma.\n\nPais, avós, cônjuges falecidos: manter viva sua memória pela oração. Fazer memorial em casa (foto, vela, pequeno altar) ajuda a fé dos filhos. Ensiná-los a rezar pelos que partiram é transmitir a doutrina da Comunhão dos Santos.\n\nOrar também pelas almas esquecidas: aquelas que não têm ninguém rezando por elas. São Gregório Magno (séc. VI) inaugurou as Missas Gregorianas (30 Missas consecutivas por uma alma específica) — tradição de enorme poder. Mosteiros e santuários oferecem esse serviço. Quem reza muito pelos defuntos será, por sua vez, lembrado em orações pelas almas que ajudou a libertar.\n\nA vida eterna é real. Os que partiram não estão longe; estão em outra dimensão. Rezar por eles é forma de amor que persiste além da morte. Quando partirmos, precisaremos das mesmas orações — ofereçamos agora para recebê-las depois."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "2 Macabeus 12,44-46", "url": null, "page": null },
    { "kind": "scripture", "label": "1 Coríntios 3,13-15", "url": null, "page": null },
    { "kind": "catechism", "label": "Catecismo da Igreja Católica, §§ 1030-1032, 1471-1479 (indulgências)", "url": null, "page": null },
    { "kind": "other", "label": "Enchiridion Indulgentiarum (indulgências aplicáveis aos defuntos)", "url": null, "page": null },
    { "kind": "father", "label": "São Gregório Magno, Diálogos (Missas Gregorianas)", "url": null, "page": null }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections, sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


-- ============================================================================
-- Quiz
-- ============================================================================
with q as (
  insert into public.study_quizzes
    (content_type, content_ref, title, description, passing_score, xp_bonus, reliquia_slug_on_master, status, published_at)
  values (
    'oracoes',
    'topic:oracoes-ocasioes',
    'Prova: Orações para Ocasiões',
    'Cobre as orações específicas para diferentes situações: proteção espiritual, estudo, sofrimento, viagem, defuntos.',
    70,
    20,
    null,
    'published',
    now()
  )
  on conflict (content_type, content_ref) do update
    set title = excluded.title, description = excluded.description,
        passing_score = excluded.passing_score, xp_bonus = excluded.xp_bonus,
        status = 'published',
        published_at = coalesce(public.study_quizzes.published_at, now()),
        updated_at = now()
  returning id
)
insert into public.study_quiz_questions (quiz_id, kind, prompt, options, correct, explanation, sort_order)
select q.id, kind, prompt, options::jsonb, correct::jsonb, explanation, sort_order
from q,
(values
  (
    'single',
    'Quem compôs a Oração a São Miguel Arcanjo (São Miguel Arcanjo, defendei-nos no combate)?',
    $json$[{"id":"a","label":"Pio X"},{"id":"b","label":"Leão XIII, em 1886, após visão mística"},{"id":"c","label":"São Luís Maria Grignion de Montfort"},{"id":"d","label":"Santo Agostinho"}]$json$,
    $json$["b"]$json$,
    'Leão XIII compôs a oração em 1886, após visão do poder demoníaco que se manifestaria no séc. XX. Durante décadas, foi rezada ao final de toda Missa rezada. É oração potente contra ataques espirituais.',
    1
  ),
  (
    'single',
    'Quem é São Tomás de Aquino na tradição católica do estudo?',
    $json$[{"id":"a","label":"Padroeiro dos motoristas"},{"id":"b","label":"Padroeiro dos estudantes, filósofos e teólogos, autor da Oração antes dos Estudos"},{"id":"c","label":"Mártir da Igreja primitiva"},{"id":"d","label":"Fundador da ordem franciscana"}]$json$,
    $json$["b"]$json$,
    'São Tomás de Aquino (1225-1274), o Doutor Angélico, é padroeiro dos estudantes e teólogos. Autor da célebre Oração antes dos Estudos: Criador inefável, verdadeira fonte da Luz... Sua Suma Teológica é marco da sabedoria cristã.',
    2
  ),
  (
    'single',
    'Quem é o padroeiro tradicional dos motoristas e viajantes?',
    $json$[{"id":"a","label":"São Francisco de Assis"},{"id":"b","label":"São Cristóvão, portador de Cristo (Christo-phoros)"},{"id":"c","label":"São José Operário"},{"id":"d","label":"São Pedro Apóstolo"}]$json$,
    $json$["b"]$json$,
    'São Cristóvão (Christo-phoros, portador de Cristo) é o padroeiro tradicional dos motoristas e viajantes. Segundo tradição carregou o Menino Jesus através de um rio. Sua medalha é frequentemente pendurada em carros.',
    3
  ),
  (
    'multi',
    'Quais práticas aliviam as almas do Purgatório?',
    $json$[{"id":"a","label":"Santa Missa aplicada pela alma"},{"id":"b","label":"Orações (terço, Coroa da Misericórdia)"},{"id":"c","label":"Indulgências aplicadas aos defuntos"},{"id":"d","label":"Esmolas e obras de caridade em intenção deles"}]$json$,
    $json$["a","b","c","d"]$json$,
    'Todas estas práticas aliviam as almas: Missa aplicada (máxima oferta), orações, indulgências (especialmente no mês de novembro), obras de caridade em intenção deles. Fundamentam-se em 2 Mac 12,44-46 e tradição contínua da Igreja.',
    4
  ),
  (
    'truefalse',
    'Nos primeiros oito dias de novembro, é possível ganhar indulgência plenária aplicável a um defunto, visitando cemitério com as condições habituais (confissão, comunhão, oração pelo Papa, desapego do pecado).',
    $json$[{"id":"v","label":"Verdadeiro"},{"id":"f","label":"Falso"}]$json$,
    $json$["v"]$json$,
    'Verdadeiro. Nos primeiros oito dias de novembro, indulgência plenária diária aplicável a defunto, se cumpridas condições habituais. Oportunidade extraordinária de caridade às almas. Enchiridion Indulgentiarum.',
    5
  )
) as data(kind, prompt, options, correct, explanation, sort_order)
on conflict do nothing;
