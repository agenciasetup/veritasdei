-- ============================================================================
-- Sprint 2A.1 — Dogmas sobre Deus: deepdives + quiz
-- ============================================================================
-- Publica conteúdo aprofundado para os 5 subtópicos do tópico
-- "Dogmas sobre Deus" em content_groups='dogmas':
--   1. A Existência de Deus
--   2. A Existência de Deus como Objeto de Fé
--   3. A Unidade de Deus
--   4. Deus é Eterno
--   5. A Santíssima Trindade
-- Adiciona também um quiz bônus do tópico.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. A Existência de Deus (f4d8a774-25c6-4fc3-91b5-7bb55cdce4d5)
-- ----------------------------------------------------------------------------
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'dogmas',
  'f4d8a774-25c6-4fc3-91b5-7bb55cdce4d5',
  $json$[
    {
      "slug": "contexto_historico",
      "title": "Contexto histórico",
      "body": "A afirmação de que a existência de Deus pode ser conhecida pela razão natural é um pressuposto perene da tradição cristã, mas foi solenemente definida como dogma pelo Concílio Vaticano I na Constituição Dogmática Dei Filius (1870). O contexto era a crise do agnosticismo e do fideísmo do século XIX: de um lado, correntes racionalistas negavam qualquer possibilidade de conhecer Deus; de outro, fideístas afirmavam que a fé não tinha nenhuma base racional. A Igreja respondeu definindo que a razão humana, mesmo ferida pelo pecado, permanece capaz de alcançar certeza sobre a existência de Deus a partir das coisas criadas.\n\nEssa doutrina retoma a célebre passagem de Romanos 1,19-20, onde São Paulo ensina que os pagãos são inescusáveis porque 'o que de Deus se pode conhecer está manifesto neles... suas perfeições invisíveis, tornando-se visíveis pelas suas obras'. O Livro da Sabedoria 13,1-9 também censura aqueles que, vendo a grandeza das criaturas, não chegaram ao seu Autor.\n\nSão Tomás de Aquino sistematizou esse caminho nas célebres Cinco Vias da Suma Teológica (I, q.2, a.3): do movimento, da causalidade eficiente, da contingência, dos graus de perfeição e da ordem do mundo. Cada via parte de um aspecto da realidade observável e conclui racionalmente pela existência de um Ser Primeiro que chamamos Deus."
    },
    {
      "slug": "padres_da_igreja",
      "title": "Padres da Igreja",
      "body": "Santo Agostinho, nas Confissões (Livro VII) e em A Cidade de Deus (Livro VIII), mostra como os filósofos platônicos, pela luz natural da razão, chegaram a vislumbrar o Deus verdadeiro. Para ele, toda a criação grita o Criador: 'Tarde te amei, beleza tão antiga e tão nova' — porque a criação é espelho do Criador.\n\nSão João Damasceno, em A Fé Ortodoxa (Livro I, cap. 3), resume a demonstração patrística: 'O próprio poder e conservação do mundo nos ensinam que Deus existe.' Nenhuma coisa pode existir por si mesma; nenhuma pode manter-se em ser sem uma causa primeira.\n\nSão Justino Mártir, no Diálogo com Trifão, e Santo Ireneu de Lião, em Contra as Heresias, desenvolveram uma apologia da fé que pressupunha a capacidade da razão humana de reconhecer o Deus único — capacidade que só fica obscurecida, nunca destruída, pelo pecado."
    },
    {
      "slug": "magisterio",
      "title": "Magistério da Igreja",
      "body": "O Concílio Vaticano I (Dei Filius, cap. 2) define: 'A mesma santa Mãe Igreja sustenta e ensina que Deus, princípio e fim de todas as coisas, pode ser conhecido com certeza pela luz natural da razão humana a partir das coisas criadas.' Quem negar essa possibilidade é anátema (cân. 1 do mesmo decreto).\n\nO Catecismo da Igreja Católica (§§ 31-35) retoma e explica o ensinamento: 'A partir do movimento e do devir, da contingência, da ordem e beleza do mundo, pode-se conhecer Deus como origem e fim do universo.' O CIC § 36 afirma ainda que 'a Santa Igreja, nossa Mãe, sustenta e ensina que Deus pode ser conhecido com certeza pela luz natural da razão humana' — citando textualmente Dei Filius.\n\nJoão Paulo II, na encíclica Fides et Ratio (1998), defende o 'uso legítimo da razão natural' contra o pós-modernismo relativista, reafirmando que a razão, bem usada, conduz à Verdade e, em última instância, a Deus."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação na vida cristã",
      "body": "Este dogma não é curiosidade acadêmica: é fundamento da apologética católica. O cristão pode — e deve — dar razões da sua fé (1 Pd 3,15). Quando alguém diz 'eu não creio porque não há provas', a Igreja responde: há provas racionais para a existência de Deus, acessíveis a qualquer inteligência humilde.\n\nNa vida espiritual, reconhecer que a criação manifesta o Criador transforma o olhar sobre o mundo. A natureza, a ordem dos astros, a beleza da música, a complexidade de uma célula — tudo se torna convite à adoração. Santo Inácio de Loyola propõe nos Exercícios a 'contemplação para alcançar amor', em que o retirante percebe Deus 'trabalhando em todas as coisas criadas'.\n\nEste dogma também protege contra o fideísmo ingênuo, que reduz a fé a mero sentimento, e contra o racionalismo orgulhoso, que pretende dispensar a graça. A razão leva até a porta do mistério; a fé abre a porta."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "Romanos 1,19-20", "url": null, "page": null },
    { "kind": "scripture", "label": "Sabedoria 13,1-9", "url": null, "page": null },
    { "kind": "council", "label": "Concílio Vaticano I, Dei Filius, cap. 2 e cân. 1", "url": null, "page": null },
    { "kind": "catechism", "label": "Catecismo da Igreja Católica, §§ 31-38", "url": null, "page": null },
    { "kind": "father", "label": "São Tomás de Aquino, Suma Teológica, I, q.2, a.3", "url": null, "page": "As Cinco Vias" },
    { "kind": "father", "label": "Santo Agostinho, Confissões, Livro VII; Cidade de Deus, Livro VIII", "url": null, "page": null },
    { "kind": "papal", "label": "João Paulo II, Fides et Ratio (1998)", "url": null, "page": null }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections,
      sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


-- ----------------------------------------------------------------------------
-- 2. A Existência de Deus como Objeto de Fé (03fdda87-0b62-438d-9909-7097bb7a91f1)
-- ----------------------------------------------------------------------------
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'dogmas',
  '03fdda87-0b62-438d-9909-7097bb7a91f1',
  $json$[
    {
      "slug": "contexto_historico",
      "title": "Contexto histórico",
      "body": "Parece paradoxal: se a razão pode provar a existência de Deus, por que seria necessário crer nela? Esta questão atravessa toda a história da teologia. Já São Tomás de Aquino (Suma Teológica I, q.2, a.2) responde que a existência de Deus é simultaneamente conclusão racional para alguns e objeto de fé para a maioria, porque só poucos têm tempo, capacidade e paz de espírito para percorrer as demonstrações filosóficas.\n\nO Concílio Vaticano I, na mesma Dei Filius que definiu a cognoscibilidade natural de Deus, ensinou que 'aprouve à sabedoria e à bondade de Deus revelar-se' também sobre realidades que, em si, não excedem a razão — como a própria existência. Isso evita dois erros: o racionalismo (que torna a fé desnecessária) e o fideísmo (que nega que a razão alcance qualquer verdade sobre Deus).\n\nA distinção é fundamental: há verdades que só a fé conhece (a Trindade, a Encarnação, a graça) e verdades que tanto a razão quanto a fé alcançam (existência de Deus, imortalidade da alma, lei moral natural). Estas últimas são chamadas 'preâmbulos da fé'."
    },
    {
      "slug": "padres_da_igreja",
      "title": "Padres da Igreja",
      "body": "Para os Padres, a fé não contradiz a razão, mas a plenifica. Santo Anselmo de Cantuária cunhou a fórmula clássica 'fides quaerens intellectum' — a fé que busca compreensão. A fé parte de autoridade divina (Deus revelou), mas se fortalece ao ser exercitada racionalmente.\n\nSanto Agostinho, no De Utilitate Credendi, argumenta que aceitar uma verdade porque Deus a revelou é ato racional, pois Deus é a Verdade mesma. Crer não é anti-racional: é confiar no testemunho de quem não pode enganar nem enganar-se.\n\nSão Gregório Magno, nas Homilias sobre os Evangelhos, ensina que a fé começa onde a razão não consegue penetrar e leva a alma a Deus pela obediência amorosa."
    },
    {
      "slug": "magisterio",
      "title": "Magistério da Igreja",
      "body": "A Dei Filius (Vaticano I, cap. 2 e 3) afirma que a Revelação foi necessária não por absoluta incapacidade da razão, mas porque, no estado atual do gênero humano ferido pelo pecado, as verdades divinas 'mais acessíveis à razão' só chegariam a poucos, com muito esforço, e frequentemente misturadas com erro. Deus revelou-se para que 'todos os homens possam conhecer com facilidade, firme certeza e sem mistura de erro' essas verdades.\n\nO CIC (§§ 37-38) detalha: 'as condições históricas e sociais nas quais vive o homem pecador tornam-lhe muito difícil conhecer a Deus só pela luz da razão.' Por isso 'o homem necessita de ser iluminado pela Revelação de Deus'.\n\nNo Catecismo § 150, lê-se que 'crer é um ato humano, consciente e livre, que corresponde à dignidade da pessoa humana'. A fé, portanto, não elimina a razão: coroa-a."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação na vida cristã",
      "body": "Este dogma protege o fiel ordinário — aquele que não é filósofo — de pensar que sua fé é 'menos válida' por não saber demonstrar racionalmente a existência de Deus. Crer pela autoridade de Deus que se revelou é ato plenamente racional, porque Deus não pode enganar. A maioria dos santos não eram filósofos.\n\nAo mesmo tempo, convida ao esforço de estudo: quem pode, deve buscar compreender o que crê. Santo Anselmo: 'Não busco entender para crer, mas creio para entender.' A catequese, a leitura do Catecismo, o estudo das Escrituras são modos concretos de fazer a fé 'buscar intelecto'.\n\nPara os céticos contemporâneos que dizem 'eu só acredito no que posso provar', o dogma responde: toda vida humana é feita de atos de fé razoáveis — confiamos em médicos, historiadores, cientistas sem repetir suas provas. Crer em Deus, que não pode enganar, é o ato de fé mais razoável de todos."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "council", "label": "Concílio Vaticano I, Dei Filius, cap. 2-3", "url": null, "page": null },
    { "kind": "catechism", "label": "Catecismo da Igreja Católica, §§ 37-38, 150-159", "url": null, "page": null },
    { "kind": "father", "label": "São Tomás de Aquino, Suma Teológica, I, q.2, a.2", "url": null, "page": null },
    { "kind": "father", "label": "Santo Agostinho, De Utilitate Credendi", "url": null, "page": null },
    { "kind": "father", "label": "Santo Anselmo, Proslogion", "url": null, "page": "fides quaerens intellectum" }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections,
      sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


-- ----------------------------------------------------------------------------
-- 3. A Unidade de Deus (8789f710-d6d9-4e1f-8a0f-cc891f0795ab)
-- ----------------------------------------------------------------------------
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'dogmas',
  '8789f710-d6d9-4e1f-8a0f-cc891f0795ab',
  $json$[
    {
      "slug": "contexto_historico",
      "title": "Contexto histórico",
      "body": "A unidade de Deus — isto é, a existência de um único Deus verdadeiro — é o primeiro artigo do Credo e o primeiro mandamento: 'Shemá Israel — Ouve, Israel: o Senhor nosso Deus é o único Senhor' (Dt 6,4). Foi a revelação mais característica do povo hebreu num mundo antigo povoado de politeísmos.\n\nA Igreja primitiva teve que defender essa unidade contra dois flancos: o politeísmo greco-romano (que multiplicava os deuses) e o gnosticismo dualista (que postulava dois princípios — um bom e um mau). Concílios como o de Niceia (325) reafirmaram a fé num 'só Deus Pai Todo-Poderoso'.\n\nNa Idade Média, São Tomás demonstra a unicidade divina pela própria simplicidade de Deus: se houvesse dois deuses, seriam diferentes; mas diferença pressupõe divisão e limitação — e Deus é infinitamente perfeito, logo não pode haver dois (Suma Teológica I, q.11)."
    },
    {
      "slug": "padres_da_igreja",
      "title": "Padres da Igreja",
      "body": "Santo Ireneu de Lião, em Contra as Heresias, combate Marcião e os gnósticos que postulavam dois deuses: o do Antigo Testamento (mau) e o do Novo (bom). Ireneu responde que 'a Regra da Verdade recebida no Batismo' ensina um só Deus Pai, Criador e Redentor.\n\nSanto Atanásio, no De Incarnatione, e os Padres Capadócios (Basílio, Gregório de Nissa, Gregório Nazianzeno) articulam a doutrina do 'único Deus em três Pessoas' contra o arianismo e o triteísmo. A unidade não é numérica (como um entre muitos), mas essencial: uma única substância divina.\n\nSão João Damasceno resume: 'Confessamos um só Deus, uma só origem, uma só princípio, sem princípio, incriado, ingênito, indestrutível, imortal, eterno, infinito, sem limite' (A Fé Ortodoxa I, 5)."
    },
    {
      "slug": "magisterio",
      "title": "Magistério da Igreja",
      "body": "O Símbolo Niceno-Constantinopolitano começa: 'Creio em um só Deus, Pai Todo-Poderoso.' O IV Concílio de Latrão (1215) definiu: 'Há um só verdadeiro Deus, eterno, imenso, imutável, incompreensível, todo-poderoso.'\n\nO Catecismo da Igreja Católica dedica os §§ 200-202 à unidade de Deus: 'A fé cristã confessa que há um só Deus por natureza, substância e essência.' O § 228 sintetiza: 'Ouve, Israel: o Senhor nosso Deus é o único Senhor... Israel entendia que o seu Deus era o único Deus e não havia outros.'\n\nNostra Aetate (Vaticano II) reconhece que judeus e muçulmanos adoram também o 'Deus único', embora com Revelação incompleta quanto ao mistério trinitário, que só se conhece em Cristo."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação na vida cristã",
      "body": "Confessar um só Deus implica exclusividade absoluta do culto: não pode haver ídolos. Hoje os ídolos raramente são estátuas: são o dinheiro, o poder, o prazer, a fama. O primeiro mandamento — 'Não terás outros deuses diante de mim' — continua interpelando a cada coração.\n\nA unidade de Deus também sustenta a unidade do plano de salvação: não há um 'Deus do Antigo Testamento' rigoroso e um 'Deus do Novo' compassivo. É o mesmo Deus que criou, que prometeu, que enviou o Filho e derrama o Espírito. Essa continuidade é pilar da leitura cristã das Escrituras.\n\nPraticamente: na oração, dirigir-se 'a Deus' — simplesmente. Toda a liturgia termina orando 'ao Pai, por Cristo, no Espírito Santo' — uma só divindade, três Pessoas, um só culto."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "Deuteronômio 6,4 (Shemá)", "url": null, "page": null },
    { "kind": "scripture", "label": "Isaías 45,5-6", "url": null, "page": null },
    { "kind": "scripture", "label": "1 Coríntios 8,6", "url": null, "page": null },
    { "kind": "council", "label": "Concílio de Niceia (325), Símbolo Niceno", "url": null, "page": null },
    { "kind": "council", "label": "IV Concílio de Latrão (1215), cap. 1 Firmiter", "url": null, "page": null },
    { "kind": "catechism", "label": "Catecismo da Igreja Católica, §§ 200-231", "url": null, "page": null },
    { "kind": "father", "label": "Santo Ireneu, Contra as Heresias, Livro I", "url": null, "page": null },
    { "kind": "father", "label": "São João Damasceno, A Fé Ortodoxa, Livro I, cap. 5", "url": null, "page": null }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections,
      sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


-- ----------------------------------------------------------------------------
-- 4. Deus é Eterno (922b8f42-0a8f-48c4-9748-353ef06e79c2)
-- ----------------------------------------------------------------------------
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'dogmas',
  '922b8f42-0a8f-48c4-9748-353ef06e79c2',
  $json$[
    {
      "slug": "contexto_historico",
      "title": "Contexto histórico",
      "body": "A eternidade de Deus significa muito mais que 'durar muito tempo': Deus está fora do tempo, não tem começo nem fim nem sucessão. Boécio, no De Consolatione Philosophiae (Livro V), deu a definição clássica: eternidade é 'a possessão total e simultaneamente perfeita de uma vida sem fim' (interminabilis vitae tota simul et perfecta possessio).\n\nEssa noção foi refinada contra o maniqueísmo e o gnosticismo, que concebiam divindades submetidas ao devir. A Escritura é clara: 'Antes que os montes nascessem... Tu és Deus desde sempre e para sempre' (Sl 90,2). Deus mesmo se revela a Moisés como 'Eu sou aquele que sou' (Ex 3,14) — o Ser puro, sem passado nem futuro.\n\nSão Tomás de Aquino (Suma Teológica I, q.10) distingue três modos de duração: o tempo (das criaturas mutáveis), o aevum (dos anjos — sem tempo mas com possibilidade de mudança) e a eternidade (só de Deus — absolutamente imutável)."
    },
    {
      "slug": "padres_da_igreja",
      "title": "Padres da Igreja",
      "body": "Santo Agostinho, nas Confissões (Livro XI), medita profundamente sobre o tempo e a eternidade: 'Teus anos nem vão nem vêm; os nossos, porém, vão e vêm... Teus anos são um só dia, e teu dia não é cotidiano, mas um hoje eterno'. Para Agostinho, todo o tempo — passado, presente, futuro — está presente diante de Deus como um único 'agora'.\n\nSão Gregório de Nissa (Contra Eunômio) sublinha que só Deus possui o ser 'por si mesmo' (aseidade); todo o resto recebe o ser. E por isso só Deus é propriamente eterno.\n\nSão João Damasceno, em A Fé Ortodoxa, ensina que Deus 'está acima de toda sucessão temporal, não tendo recebido o ser de outro nem estando submetido a qualquer mudança'. Para os Padres, a eternidade é inseparável da imutabilidade."
    },
    {
      "slug": "magisterio",
      "title": "Magistério da Igreja",
      "body": "O IV Concílio de Latrão (1215) definiu que Deus é 'eterno, imenso, imutável, incompreensível'. O Concílio Vaticano I (Dei Filius, cap. 1) reitera: 'Deus... é um espírito único, verdadeiro, vivo, eterno, imenso, incompreensível.'\n\nO Catecismo da Igreja Católica (§ 202) ensina: 'Jesus é o Senhor... O próprio Deus se revelou no Antigo Testamento pelo nome impronunciável de Yhwh — \u201cEu sou aquele que sou\u201d. Este nome divino exprime o ser mesmo de Deus, sempre presente.' O § 212 resume: 'Deus é \u201cAquele que é\u201d, do sempre ao sempre.'\n\nSão João Paulo II, na Catequese sobre Deus (1985), explica que a eternidade não significa 'tempo sem fim' mas 'ausência de tempo': Deus não envelhece, não aprende, não muda — é Plenitude total e simultânea."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação na vida cristã",
      "body": "A eternidade de Deus é fonte de esperança. Nossas vidas são breves e mudam; Deus não. Suas promessas não caducam. 'Eu sou o mesmo ontem, hoje e sempre' (Hb 13,8). Em meio à instabilidade do mundo, podemos ancorar-nos no Deus imutável.\n\nTambém corrige nossa imagem antropomórfica: Deus não está 'esperando' nada acontecer. Ele já vê toda a história — nascimentos, mortes, decisões — num único olhar eterno. Isso não elimina nossa liberdade (Deus vê os atos livres como livres), mas consola quem sofre com o 'demora' de Deus: Ele já agiu na eternidade; só nos cabe descobrir isso no tempo.\n\nPraticamente: rezar com os Salmos que confessam a eternidade divina (Sl 90, Sl 102, Sl 145). Contemplar que, quando entramos na graça, já tocamos a eternidade — 'A vida eterna é esta: que te conheçam a ti, o único Deus verdadeiro' (Jo 17,3). A eternidade começa agora, na comunhão com Deus."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "Êxodo 3,14 (Eu sou aquele que sou)", "url": null, "page": null },
    { "kind": "scripture", "label": "Salmo 90,2", "url": null, "page": null },
    { "kind": "scripture", "label": "Hebreus 13,8", "url": null, "page": null },
    { "kind": "council", "label": "IV Concílio de Latrão (1215), Firmiter", "url": null, "page": null },
    { "kind": "council", "label": "Concílio Vaticano I, Dei Filius, cap. 1", "url": null, "page": null },
    { "kind": "catechism", "label": "Catecismo da Igreja Católica, §§ 202-221", "url": null, "page": null },
    { "kind": "father", "label": "Santo Agostinho, Confissões, Livro XI", "url": null, "page": null },
    { "kind": "father", "label": "Boécio, De Consolatione Philosophiae, V", "url": null, "page": null },
    { "kind": "father", "label": "São Tomás de Aquino, Suma Teológica, I, q.10", "url": null, "page": null }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections,
      sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


-- ----------------------------------------------------------------------------
-- 5. A Santíssima Trindade (04f1b765-1e55-4514-a8f0-2566e39d2f21)
-- ----------------------------------------------------------------------------
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'dogmas',
  '04f1b765-1e55-4514-a8f0-2566e39d2f21',
  $json$[
    {
      "slug": "contexto_historico",
      "title": "Contexto histórico",
      "body": "A Santíssima Trindade é 'o mistério central da fé e da vida cristã' (CIC § 234). Deus é um só na substância e três nas Pessoas: Pai, Filho e Espírito Santo. Nenhuma razão humana teria descoberto esta verdade — é revelação pura, inacessível fora de Cristo.\n\nA doutrina foi forjada nos grandes concílios dos séculos IV e V, em meio às heresias que tentavam racionalizar o mistério: o arianismo (Ário negava a divindade plena do Filho), o macedonianismo (negava a divindade do Espírito), o sabelianismo (reduzia as três Pessoas a modos do mesmo Deus), o triteísmo (multiplicava Deus em três). A Igreja respondeu: um só Deus (contra o triteísmo) verdadeiramente em três Pessoas (contra o sabelianismo).\n\nO vocabulário técnico foi estabelecido em grego — ousia (essência, substância) para a unidade; hypostasis (pessoa) para as distinções — e latinizado por Tertuliano como 'uma substância, três pessoas' (una substantia, tres personae). Os Padres Capadócios (Basílio, Gregório de Nissa, Gregório Nazianzeno) consolidaram a formulação que permanece até hoje."
    },
    {
      "slug": "padres_da_igreja",
      "title": "Padres da Igreja",
      "body": "Santo Atanásio, no De Decretis Nicaenae Synodi, defendeu o termo 'consubstancial' (homoousios) contra Ário: o Filho é da mesma substância do Pai, não uma criatura elevada. Esta palavra decidiu o Concílio de Niceia (325).\n\nOs Padres Capadócios — em especial São Gregório de Nissa (Contra Eunômio) — estabeleceram a distinção entre 'o que é comum' às Pessoas (a substância divina) e 'o que é próprio' de cada uma (as relações: paternidade, filiação, espiração). 'Pai' não é nome de essência, mas de relação; 'Filho', idem; 'Espírito Santo', procedência.\n\nSanto Agostinho, no De Trinitate (obra monumental em 15 livros), elaborou as analogias trinitárias no ser humano: memória-inteligência-vontade; amante-amado-amor. Essas analogias não 'provam' a Trindade (nada prova um mistério revelado), mas mostram vestígios da Trindade na criação — porque fomos feitos 'à imagem de Deus' (Gn 1,26-27)."
    },
    {
      "slug": "magisterio",
      "title": "Magistério da Igreja",
      "body": "O Símbolo de Niceia-Constantinopla (381) define: 'Creio em um só Deus, Pai Todo-Poderoso... e em um só Senhor Jesus Cristo, Filho Unigênito de Deus... consubstancial ao Pai... e no Espírito Santo, Senhor que dá a vida, o qual procede do Pai e do Filho.' Esse símbolo ainda se reza em toda Missa dominical.\n\nO Símbolo de Santo Atanásio (Quicumque) é hino dogmático sobre a Trindade: 'A fé católica é esta: que adoremos um só Deus na Trindade e a Trindade na unidade, sem confundir as Pessoas nem separar a substância.'\n\nO IV Concílio de Latrão (1215) e o Concílio de Florença (1442) precisaram a doutrina. O Catecismo da Igreja Católica dedica os §§ 232-267 à Trindade, afirmando: 'A Trindade é Una. Não confessamos três deuses, mas um só Deus em três Pessoas... As Pessoas divinas são realmente distintas entre si... Tudo é uno nelas, onde não se opõe a relação' (§§ 253-255)."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação na vida cristã",
      "body": "O sinal da cruz, feito em cada oração, é confissão trinitária: 'Em nome do Pai e do Filho e do Espírito Santo.' Cada cristão foi batizado nesse nome (Mt 28,19). Viver é, para o cristão, habitar a vida trinitária.\n\nTodo sacramento é trinitário. Toda oração litúrgica termina dirigindo-se 'ao Pai, por Cristo, no Espírito Santo'. A vida espiritual é itinerário: pelo Filho — pois só Ele 'nos dá a conhecer o Pai' (Jo 1,18) — e no Espírito Santo — que faz de nós 'filhos no Filho' (Gl 4,6). Essa estrutura percorre toda a Missa, todo o Breviário, toda a piedade católica.\n\nContemplar a Trindade é contemplar o Amor: o Pai amando o Filho eternamente, e desse amor procedendo o Espírito. 'Deus é amor' (1 Jo 4,8) — e é amor porque é comunhão de Pessoas. Somos chamados a entrar nessa comunhão: 'Se alguém me ama, guardará a minha palavra; e meu Pai o amará, e viremos a ele e faremos nele morada' (Jo 14,23). A inhabitação trinitária na alma em graça é o horizonte mais alto da vida cristã."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "Mateus 28,19 (fórmula batismal)", "url": null, "page": null },
    { "kind": "scripture", "label": "João 14-17 (discurso trinitário)", "url": null, "page": null },
    { "kind": "scripture", "label": "1 João 4,8-16", "url": null, "page": null },
    { "kind": "scripture", "label": "2 Coríntios 13,13 (bênção trinitária)", "url": null, "page": null },
    { "kind": "council", "label": "Concílio de Niceia (325) e Constantinopla I (381), Símbolo Niceno-Constantinopolitano", "url": null, "page": null },
    { "kind": "council", "label": "IV Concílio de Latrão (1215)", "url": null, "page": null },
    { "kind": "council", "label": "Concílio de Florença (1442), Decreto aos Jacobitas", "url": null, "page": null },
    { "kind": "catechism", "label": "Catecismo da Igreja Católica, §§ 232-267", "url": null, "page": null },
    { "kind": "father", "label": "Símbolo de Santo Atanásio (Quicumque)", "url": null, "page": null },
    { "kind": "father", "label": "Santo Agostinho, De Trinitate (15 livros)", "url": null, "page": null },
    { "kind": "father", "label": "São Gregório de Nissa, Contra Eunômio", "url": null, "page": null },
    { "kind": "father", "label": "São Tomás de Aquino, Suma Teológica, I, q.27-43", "url": null, "page": null }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections,
      sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


-- ============================================================================
-- Quiz bônus: "Prova: Dogmas sobre Deus"
-- ============================================================================
-- O content_ref aponta para o slug do tópico, não de um subtópico, pois o
-- quiz cobre os 5 dogmas do tópico.
-- ============================================================================

with q as (
  insert into public.study_quizzes
    (content_type, content_ref, title, description, passing_score, xp_bonus, reliquia_slug_on_master, status, published_at)
  values (
    'dogmas',
    'topic:dogmas-sobre-deus',
    'Prova: Dogmas sobre Deus',
    'Verifica seu entendimento dos cinco dogmas fundamentais sobre Deus: existência, objeto de fé, unidade, eternidade e Trindade.',
    70,
    30,
    null,
    'published',
    now()
  )
  on conflict (content_type, content_ref) do update
    set title = excluded.title,
        description = excluded.description,
        passing_score = excluded.passing_score,
        xp_bonus = excluded.xp_bonus,
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
    'Qual concílio definiu dogmaticamente que a existência de Deus pode ser conhecida com certeza pela luz natural da razão humana?',
    $json$[{"id":"a","label":"Concílio de Trento (1545-1563)"},{"id":"b","label":"Concílio Vaticano I (1870), Dei Filius"},{"id":"c","label":"Concílio Vaticano II (1962-1965)"},{"id":"d","label":"Concílio de Niceia (325)"}]$json$,
    $json$["b"]$json$,
    'O Concílio Vaticano I, na Constituição Dogmática Dei Filius (1870), definiu contra o agnosticismo e fideísmo que a razão natural pode alcançar certeza sobre a existência de Deus.',
    1
  ),
  (
    'single',
    'O que significa que Deus é "eterno"?',
    $json$[{"id":"a","label":"Que existe há muito tempo, mas um dia terminará"},{"id":"b","label":"Que não tem princípio, mas terá fim"},{"id":"c","label":"Que possui totalmente e simultaneamente uma vida sem fim, fora do tempo"},{"id":"d","label":"Que é o mais antigo dos seres criados"}]$json$,
    $json$["c"]$json$,
    'A definição clássica de Boécio: eternidade é "a possessão total e simultaneamente perfeita de uma vida sem fim" (interminabilis vitae tota simul et perfecta possessio).',
    2
  ),
  (
    'single',
    'Qual termo grego foi decisivo no Concílio de Niceia (325) para afirmar que o Filho é da mesma substância do Pai?',
    $json$[{"id":"a","label":"Hypostasis (pessoa)"},{"id":"b","label":"Homoousios (consubstancial)"},{"id":"c","label":"Ousia (essência)"},{"id":"d","label":"Prosopon (face)"}]$json$,
    $json$["b"]$json$,
    'Homoousios (consubstancial) foi o termo defendido por Santo Atanásio contra Ário e inscrito no Símbolo Niceno: o Filho é da mesma substância do Pai.',
    3
  ),
  (
    'multi',
    'Quais das seguintes afirmações sobre a unidade de Deus são verdadeiras segundo a fé católica?',
    $json$[{"id":"a","label":"Há um só Deus verdadeiro"},{"id":"b","label":"A unidade de Deus é apenas numérica (um entre muitos)"},{"id":"c","label":"A unidade de Deus é essencial (uma única substância divina)"},{"id":"d","label":"No único Deus subsistem três Pessoas realmente distintas"}]$json$,
    $json$["a","c","d"]$json$,
    'A unidade divina não é numérica — Deus não é "um" como elemento numa contagem. É uma unidade essencial absoluta: uma só substância divina. E nessa única substância subsistem três Pessoas: Pai, Filho, Espírito Santo.',
    4
  ),
  (
    'truefalse',
    'Mesmo sendo objeto de fé, a existência de Deus pode ser demonstrada racionalmente por quem tem tempo e capacidade para percorrer as demonstrações filosóficas.',
    $json$[{"id":"v","label":"Verdadeiro"},{"id":"f","label":"Falso"}]$json$,
    $json$["v"]$json$,
    'Verdadeiro. São Tomás (Suma I, q.2, a.2) ensina que a existência de Deus é simultaneamente conclusão racional para alguns e objeto de fé para a maioria — evitando tanto o racionalismo quanto o fideísmo.',
    5
  ),
  (
    'single',
    'Qual obra de Santo Agostinho é o tratado mais influente sobre a Trindade na tradição latina?',
    $json$[{"id":"a","label":"Confissões"},{"id":"b","label":"Cidade de Deus"},{"id":"c","label":"De Trinitate (15 livros)"},{"id":"d","label":"Regra de Santo Agostinho"}]$json$,
    $json$["c"]$json$,
    'O De Trinitate, obra monumental em 15 livros, é o tratado trinitário mais influente da tradição latina. Nele Agostinho desenvolve as analogias trinitárias no ser humano (memória-inteligência-vontade; amante-amado-amor).',
    6
  ),
  (
    'single',
    'Qual é a fórmula latina que resume a fé trinitária?',
    $json$[{"id":"a","label":"Una substantia, tres personae (uma substância, três pessoas)"},{"id":"b","label":"Tres personae, tres substantiae (três pessoas, três substâncias)"},{"id":"c","label":"Una persona, tres substantiae (uma pessoa, três substâncias)"},{"id":"d","label":"Soli Deo gloria (só a Deus a glória)"}]$json$,
    $json$["a"]$json$,
    'Una substantia, tres personae — formulação cunhada por Tertuliano e consagrada pela Igreja: uma única substância divina subsistindo em três Pessoas distintas.',
    7
  )
) as data(kind, prompt, options, correct, explanation, sort_order)
on conflict do nothing;
