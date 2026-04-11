import type { SumaPart } from './types'

/**
 * Amostra representativa da Suma Teológica
 * Artigos completos das questões mais importantes
 * Fonte: AquinasOperaOmnia (domínio público)
 */
export const SUMA_PARTS: SumaPart[] = [
  {
    id: 'prima-pars',
    abbreviation: 'I',
    name: 'Prima Pars',
    description: 'Deus em Si mesmo: existência, atributos, Trindade, criação, anjos, homem e governo divino.',
    synthesis: 'A Prima Pars trata de Deus considerado em Si mesmo. São Tomás começa demonstrando a existência de Deus pelas Cinco Vias (q.2), depois investiga Seus atributos: simplicidade (q.3), perfeição (q.4), bondade (q.5-6), infinidade (q.7), imutabilidade (q.9), eternidade (q.10), unidade (q.11) e o modo como O conhecemos (q.12-13). Em seguida, trata da Trindade das Pessoas divinas (q.27-43), da criação em geral (q.44-49), dos anjos (q.50-64), da criação do mundo corporal (q.65-74), do homem em sua natureza de corpo e alma (q.75-102) e, finalmente, do governo divino sobre todas as criaturas (q.103-119). O princípio unificador é: tudo procede de Deus e tudo é governado por Ele.',
    themes: [
      {
        title: 'A Existência de Deus',
        description: 'As célebres Cinco Vias para demonstrar a existência de Deus.',
        synthesis: 'São Tomás ensina que a existência de Deus não é evidente para nós (a.1), embora seja evidente em si mesma, porque não conhecemos a essência divina diretamente. Portanto, precisa ser demonstrada (a.2), e pode sê-lo a posteriori, ou seja, pelos efeitos. Na célebre Questão 2, Artigo 3, apresenta as Cinco Vias: (1) pelo movimento — tudo que se move é movido por outro, e é necessário um Primeiro Motor Imóvel; (2) pela causalidade eficiente — nada é causa de si, logo há uma Primeira Causa; (3) pelo contingente e necessário — os seres contingentes exigem um Ser Necessário por si; (4) pelos graus de perfeição — os mais e menos perfeitos supõem um Máximo de perfeição; (5) pelo governo do mundo — seres sem inteligência agem para um fim, logo são dirigidos por uma Inteligência suprema. Deus é, portanto, demonstrável pela razão natural.',
        questions: [
          {
            number: 2,
            title: 'Da existência de Deus',
            articles: [
              {
                id: 'I-q2-a1',
                question: 2,
                article: 1,
                title: 'A existência de Deus é evidente por si mesma?',
                objections: [
                  'Parece que a existência de Deus é evidente por si mesma. Pois dizemos que são evidentes por si mesmas as coisas cujo conhecimento nos é naturalmente inato, como os primeiros princípios. Ora, diz o Damasceno: "O conhecimento da existência de Deus é naturalmente inato em todos." Logo, a existência de Deus é evidente por si mesma.',
                  'Além disso, diz-se que são evidentes por si mesmas as coisas que se conhecem assim que se conhecem os termos. Ora, assim que se entende o que significa o nome "Deus", sabe-se que Deus existe; pois este nome significa "aquilo de que nada maior se pode pensar". Ora, o que existe na realidade e no intelecto é maior do que o que existe apenas no intelecto. Logo, Deus existe.',
                ],
                sedContra: 'Ninguém pode pensar o oposto daquilo que é evidente por si mesmo. Ora, pode-se pensar que Deus não existe, conforme o Salmo 13: "Disse o insensato em seu coração: Deus não existe." Logo, a existência de Deus não é evidente por si mesma.',
                respondeo: 'Uma coisa pode ser evidente de dois modos: por si mesma (em si), mas não para nós; e por si mesma e para nós. Uma proposição é evidente por si mesma quando o predicado está incluído na noção do sujeito, como "O homem é animal." Porém, se alguém ignora a definição do sujeito, a proposição não será evidente para ele. Assim, a proposição "Deus existe" é evidente em si mesma, porque nele sujeito e predicado se identificam. Mas, como não conhecemos a essência de Deus, essa proposição não é evidente para nós, e precisa ser demonstrada por meio daquilo que nos é mais conhecido, isto é, pelos efeitos de Deus.',
                replies: [
                  'O conhecimento da existência de Deus está implantado em nós de modo geral e confuso — não como conhecimento de que Deus existe propriamente, mas enquanto a felicidade que o homem naturalmente deseja é Deus. Isso não é conhecer que Deus existe, assim como conhecer que alguém vem não é conhecer Pedro, ainda que seja Pedro quem vem.',
                  'Talvez quem ouve o nome "Deus" não entenda que signifique algo de que nada maior se possa pensar, já que alguns pensaram que Deus fosse um corpo. Mas, mesmo admitido que todos entendam o significado do nome, daí não se segue que o que é significado pelo nome exista na realidade, mas só no intelecto.',
                ],
              },
              {
                id: 'I-q2-a3',
                question: 2,
                article: 3,
                title: 'Deus existe?',
                objections: [
                  'Parece que Deus não existe. Pois se de dois contrários um fosse infinito, o outro seria totalmente destruído. Ora, pelo nome "Deus" entende-se um bem infinito. Se, portanto, Deus existisse, não haveria nenhum mal. Ora, há mal no mundo. Logo, Deus não existe.',
                  'Além disso, o que pode ser produzido por poucos princípios não é produzido por muitos. Ora, tudo o que aparece no mundo pode ser explicado por outros princípios, supondo que Deus não exista; pois os efeitos naturais se reduzem à natureza como princípio, e os voluntários à razão e vontade humana. Logo, não há necessidade de supor a existência de Deus.',
                ],
                sedContra: 'Diz-se na pessoa de Deus em Êxodo 3,14: "Eu sou Aquele que sou."',
                respondeo: 'A existência de Deus pode ser provada por cinco vias. A primeira e mais manifesta é a que se toma do movimento. É certo e verificado pelos sentidos que neste mundo algumas coisas se movem. Ora, tudo que se move é movido por outro. Se, portanto, aquilo por que é movido também se move, é necessário que também este seja movido por outro, e este por outro. Mas não se pode proceder ao infinito, pois assim não haveria um primeiro motor, e nenhum dos outros moveria. Logo, é necessário chegar a um primeiro motor que não é movido por nenhum outro; e todos entendem que este é Deus. A segunda via parte da razão de causa eficiente... A terceira via parte do possível e do necessário... A quarta via toma-se dos graus que se encontram nas coisas... A quinta via toma-se do governo das coisas.',
                replies: [
                  'Como diz Santo Agostinho: "Deus, sendo sumamente bom, de nenhum modo permitiria que houvesse algum mal em suas obras, a não ser que fosse tão poderoso e bom que até do mal tirasse o bem." Pertence, pois, à infinita bondade de Deus permitir o mal para dele tirar o bem.',
                  'Como a natureza opera para um fim determinado sob a direção de um agente superior, é necessário que as coisas feitas pela natureza se reduzam também a Deus como primeira causa.',
                ],
              },
            ],
          },
          {
            number: 3,
            title: 'Da simplicidade de Deus',
            articles: [
              {
                id: 'I-q3-a1',
                question: 3,
                article: 1,
                title: 'Deus é um corpo?',
                objections: [
                  'Parece que Deus é um corpo. Pois corpo é aquilo que tem três dimensões. Ora, a Sagrada Escritura atribui a Deus três dimensões, pois diz em Jó 11,8-9: "É mais alto que o céu, mais profundo que o inferno, mais extenso que a terra, mais largo que o mar." Logo, Deus é um corpo.',
                ],
                sedContra: 'Diz-se em João 4,24: "Deus é espírito."',
                respondeo: 'Deus não é um corpo. E isto se pode demonstrar de três modos. Primeiro: nenhum corpo move sem ser movido, como consta pela experiência. Ora, já se demonstrou que Deus é o primeiro motor imóvel. Logo, é manifesto que Deus não é um corpo. Segundo: é necessário que o primeiro ente esteja em ato e de nenhum modo em potência. Ora, todo corpo está em potência, pois o contínuo é divisível ao infinito. Logo, é impossível que Deus seja corpo. Terceiro: Deus é o mais nobre dos entes. Ora, é impossível que um corpo seja o mais nobre dos entes, pois o corpo é ou vivo ou não vivo. O corpo vivo é mais nobre que o não vivo. Mas o que dá vida ao corpo é mais nobre que o corpo. Logo, é impossível que Deus seja corpo.',
                replies: [
                  'A Sagrada Escritura nos transmite as coisas divinas sob figuras sensíveis e corporais. Quando, portanto, atribui a Deus três dimensões, significa a extensão de seu poder sob a semelhança da extensão corporal.',
                ],
              },
            ],
          },
        ],
      },
      {
        title: 'A Santíssima Trindade',
        description: 'O mistério das três Pessoas divinas na unidade da essência.',
        synthesis: 'A Trindade é o mistério central da fé cristã: um só Deus em três Pessoas distintas — Pai, Filho e Espírito Santo. São Tomás explica que "pessoa" (q.29) significa o que há de mais perfeito em toda a natureza, isto é, o subsistente em natureza racional. Em Deus, as Pessoas se distinguem pelas relações de origem: o Pai gera o Filho (processão do Verbo), e do Pai e do Filho procede o Espírito Santo (processão do Amor). As relações são reais e subsistentes, constituindo as próprias Pessoas, sem dividir a essência divina. Há quatro relações reais (paternidade, filiação, espiração ativa, processão), mas três Pessoas, porque a espiração ativa é comum ao Pai e ao Filho.',
        questions: [
          {
            number: 29,
            title: 'Das Pessoas divinas',
            articles: [
              {
                id: 'I-q29-a1',
                question: 29,
                article: 1,
                title: 'Qual é a definição de pessoa?',
                objections: [
                  'Parece que a definição de pessoa dada por Boécio é insuficiente: "Pessoa é a substância individual de natureza racional." Pois nenhuma coisa singular se define. Ora, pessoa significa algo singular. Logo, pessoa não é convenientemente definida.',
                ],
                sedContra: 'Basta a autoridade de Boécio.',
                respondeo: 'Embora o singular e o individual não possam ser definidos, pode-se contudo explicar o que se significa pelo nome "pessoa". Pessoa significa o que há de mais perfeito em toda a natureza, isto é, o subsistente em natureza racional. Ora, como tudo o que é perfeito deve ser atribuído a Deus, já que a sua essência contém em si toda perfeição, convém atribuir a Deus este nome de "Pessoa" — não do mesmo modo que se atribui às criaturas, mas de modo mais excelente.',
                replies: [
                  'Embora o singular particular não possa ser definido, aquilo que pertence à razão comum de singularidade pode ser definido. E assim Boécio define pessoa.',
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'prima-secundae',
    abbreviation: 'I-II',
    name: 'Prima Secundae',
    description: 'A ação humana: felicidade, atos humanos, paixões, hábitos, virtudes, pecado, lei e graça.',
    synthesis: 'A Prima Secundae trata do caminho do homem para Deus, ou seja, da ação humana em geral. Começa pelo fim último — a felicidade (q.1-5) —, mostra que só a visão de Deus satisfaz plenamente o desejo natural do homem, e então analisa os meios: os atos humanos voluntários (q.6-21), as paixões da alma (q.22-48), os hábitos e virtudes (q.49-70), o pecado (q.71-89), a lei (natural, humana, divina — q.90-108) e a graça (q.109-114). O princípio organizador é: o homem, criado à imagem de Deus, retorna a Ele pelo exercício livre de seus atos, guiado pela lei e fortalecido pela graça.',
    themes: [
      {
        title: 'A Felicidade do Homem',
        description: 'Em que consiste a verdadeira felicidade e como alcançá-la.',
        synthesis: 'São Tomás demonstra que o homem age necessariamente por um fim último (q.1), pois a vontade tende naturalmente ao bem. Investiga então em que consiste a verdadeira felicidade: não nas riquezas, honras, fama, poder, prazeres do corpo, nem mesmo nos bens da alma criada (q.2, a.1-7). A felicidade perfeita consiste unicamente na visão da essência divina (q.2, a.8), pois só o Bem infinito pode saciar o desejo infinito do intelecto humano. Nesta vida, temos apenas uma felicidade imperfeita; a felicidade perfeita é escatológica — é a visão beatífica, na qual o intelecto alcança a própria essência de Deus e descansa plenamente.',
        questions: [
          {
            number: 1,
            title: 'Do último fim do homem',
            articles: [
              {
                id: 'I-II-q1-a1',
                question: 1,
                article: 1,
                title: 'Convém ao homem agir por um fim?',
                objections: [
                  'Parece que não convém ao homem agir por um fim. Pois a causa é naturalmente anterior. Ora, o fim tem razão de último. Logo, o fim não tem razão de causa. Mas o homem age por uma causa, pois pertence à sua razão buscar a causa das coisas. Logo, não convém ao homem agir por um fim, mas sim por uma causa.',
                ],
                sedContra: 'Todos os agentes por intelecto agem por um fim, como diz o Filósofo. Ora, o homem faz as coisas por intelecto. Logo, o homem age por um fim.',
                respondeo: 'Das ações que o homem faz, só aquelas são propriamente humanas que são próprias do homem enquanto homem. Ora, o homem difere das criaturas irracionais em que é senhor de seus atos. Por isso, são propriamente humanas apenas aquelas ações de que o homem é senhor. Ora, o homem é senhor de seus atos pela razão e vontade. O objeto próprio da vontade é o bem e o fim. Logo, é manifesto que é próprio das ações humanas serem por um fim.',
                replies: [
                  'O fim, embora seja último na execução, é primeiro na intenção do agente. E deste modo tem razão de causa.',
                ],
              },
            ],
          },
          {
            number: 2,
            title: 'Em que consiste a felicidade do homem',
            articles: [
              {
                id: 'I-II-q2-a8',
                question: 2,
                article: 8,
                title: 'A felicidade do homem consiste na visão da essência divina?',
                objections: [
                  'Parece que a felicidade do homem não consiste na visão da essência divina. Pois diz Dionísio que pelo que é supremo de seu intelecto o homem se une a Deus como ao absolutamente desconhecido. Ora, aquilo em que consiste a felicidade é conhecido ao máximo. Logo, a felicidade não consiste em ver a essência de Deus.',
                ],
                sedContra: 'Diz-se em 1 João 3,2: "Quando Ele aparecer, seremos semelhantes a Ele, porque O veremos tal como é."',
                respondeo: 'A felicidade última e perfeita não pode consistir senão na visão da essência divina. Para evidenciá-lo, devem considerar-se duas coisas. Primeira: o homem não é perfeitamente feliz enquanto lhe resta algo a desejar e buscar. Segunda: a perfeição de cada potência se mede pelo objeto. Ora, o intelecto humano conhece a essência do efeito e, por isso, deseja naturalmente conhecer a essência da causa. Se, portanto, o intelecto da criatura racional não alcança a causa primeira das coisas, seu desejo natural de saber não está satisfeito e, por conseguinte, não é perfeitamente feliz. Logo, para a felicidade perfeita, requer-se que o intelecto alcance a própria essência da causa primeira. E assim terá a sua perfeição pela união com Deus como objeto.',
                replies: [
                  'Dionísio fala do conhecimento que temos nesta vida (in via), pelo qual nos unimos a Deus como ao desconhecido, pois não alcançamos a sua essência. Na pátria celeste (in patria), veremos a Deus face a face.',
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'secunda-secundae',
    abbreviation: 'II-II',
    name: 'Secunda Secundae',
    description: 'As virtudes e vícios em particular: fé, esperança, caridade, prudência, justiça, fortaleza e temperança.',
    synthesis: 'A Secunda Secundae é a mais extensa parte da Suma e trata das virtudes e vícios em particular. Começa pelas três virtudes teologais — fé (q.1-16), esperança (q.17-22) e caridade (q.23-46) — que têm Deus como objeto direto. Depois trata das quatro virtudes cardeais — prudência (q.47-56), justiça (q.57-122, incluindo a religião), fortaleza (q.123-140) e temperança (q.141-170). Cada virtude é analisada em sua natureza, partes, vícios opostos e dons do Espírito Santo correspondentes. Conclui com os estados de vida (q.171-189): carismas, vida ativa e contemplativa, perfeição religiosa.',
    themes: [
      {
        title: 'A Fé',
        description: 'Natureza, objeto e necessidade da fé teologal.',
        synthesis: 'A fé é a primeira das virtudes teologais. São Tomás ensina que seu objeto formal é a Verdade Primeira (Deus revelante) — a fé não assente a nada senão porque Deus o revelou (q.1, a.1). Materialmente, a fé abrange tudo o que Deus revelou, incluindo verdades sobre as criaturas enquanto se referem a Deus. A fé é um hábito do intelecto, mas movido pela vontade: cremos porque queremos crer, impelidos pela graça. A fé é necessária para a salvação, é mais certa que qualquer ciência humana (pois se funda na Verdade divina), e é mérito quando livre. Os vícios opostos são a infidelidade, a heresia e a apostasia.',
        questions: [
          {
            number: 1,
            title: 'Da fé',
            articles: [
              {
                id: 'II-II-q1-a1',
                question: 1,
                article: 1,
                title: 'Qual é o objeto da fé?',
                objections: [
                  'Parece que o objeto da fé não é a verdade primeira. Pois parece que o objeto da fé é o que nos é proposto a crer. Ora, não só Deus nos é proposto a crer, mas também coisas sobre as criaturas. Logo, o objeto da fé não é apenas a verdade primeira.',
                ],
                sedContra: 'Diz Dionísio que a fé se refere à verdade simples e sempre existente.',
                respondeo: 'O objeto de qualquer hábito cognoscitivo inclui duas coisas: aquilo que é materialmente conhecido, que é como o objeto material, e aquilo pelo que é conhecido, que é a razão formal do objeto. Na fé, a razão formal é a verdade primeira, pois a fé não assente a nada senão porque é revelado por Deus. Logo, a verdade divina é o objeto formal da fé. Materialmente, porém, não só Deus, mas muitas outras coisas caem sob a fé, enquanto se referem a Deus de algum modo.',
                replies: [
                  'As coisas das criaturas que caem sob a fé referem-se a Deus e, sob essa razão, pertencem ao objeto da fé.',
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'tertia-pars',
    abbreviation: 'III',
    name: 'Tertia Pars',
    description: 'Cristo caminho para Deus: a Encarnação, os Sacramentos e a vida eterna.',
    synthesis: 'A Tertia Pars trata de Cristo como caminho do homem para Deus. Divide-se em: (1) o próprio Cristo — conveniência da Encarnação (q.1-6), união hipostática (q.2), perfeições de Cristo em ciência, graça e poder (q.7-26), vida e Paixão de Cristo (q.27-59); (2) os Sacramentos como meios de salvação — em geral (q.60-65) e em particular: Batismo (q.66-71), Confirmação (q.72), Eucaristia (q.73-83), Penitência (q.84-90). A Suma ficou incompleta — São Tomás parou de escrever em dezembro de 1273. O Suplemento (compilado por seus discípulos a partir do Comentário às Sentenças) completa os sacramentos restantes e a escatologia.',
    themes: [
      {
        title: 'A Encarnação',
        description: 'A conveniência e o modo da Encarnação do Verbo.',
        synthesis: 'São Tomás demonstra que era sumamente conveniente que Deus se encarnasse (q.1), pois pertence à razão do Sumo Bem comunicar-se à criatura de modo sumo. A Encarnação é a união da natureza divina e da natureza humana na única Pessoa do Verbo (união hipostática). Cristo é verdadeiro Deus e verdadeiro homem — uma só Pessoa em duas naturezas, sem confusão nem separação. A natureza humana não foi diminuída, mas elevada à máxima dignidade. O motivo principal da Encarnação foi a redenção do pecado, embora Deus pudesse ter redimido o homem de outro modo. A Encarnação manifesta simultaneamente a bondade, sabedoria, justiça e poder de Deus.',
        questions: [
          {
            number: 1,
            title: 'Da conveniência da Encarnação',
            articles: [
              {
                id: 'III-q1-a1',
                question: 1,
                article: 1,
                title: 'Era conveniente que Deus se encarnasse?',
                objections: [
                  'Parece que não era conveniente que Deus se encarnasse. Pois Deus, sendo desde toda a eternidade a própria bondade, era sumamente bom tal como era. Ora, o que é sumamente bom não pode ser melhor. Logo, não convinha que Deus se encarnasse.',
                ],
                sedContra: 'Parece sumamente conveniente que as coisas invisíveis de Deus se manifestem por meio das visíveis. Pois para isso foi feito o mundo inteiro, como diz o Apóstolo em Romanos 1,20. Ora, como diz o Damasceno, pela Encarnação manifestaram-se ao mesmo tempo a bondade, a sabedoria, a justiça e o poder de Deus. Logo, era conveniente que Deus se encarnasse.',
                respondeo: 'A cada coisa convém aquilo que lhe compete segundo a razão de sua natureza. Ora, a natureza de Deus é a própria essência da bondade. Por isso, tudo o que pertence à razão de bem convém a Deus. Ora, pertence à razão de bem que se comunique a outros. Pertence, pois, à razão do sumo bem que se comunique à criatura de modo sumo. E isso se realiza maximamente quando Deus une a si a natureza criada de modo a formar uma só Pessoa de três realidades: o Verbo, a alma e a carne, como diz Santo Agostinho. Logo, é manifesto que era conveniente que Deus se encarnasse.',
                replies: [
                  'O mistério da Encarnação não se realizou como se Deus fosse aperfeiçoado de algum modo, mas porque o homem fosse aperfeiçoado. Deus não se torna maior pela Encarnação, mas a natureza humana é elevada à máxima dignidade.',
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]
