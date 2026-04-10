/**
 * Biblical name disambiguation for Catholic context.
 *
 * Many biblical names refer to multiple people (Maria, Judas, Tiago, João, etc.).
 * This module enriches queries with Catholic theological context so the AI
 * and the vector search return the right person/topic.
 */

interface NameContext {
  /** Canonical Catholic identification */
  canonical: string
  /** Books most associated with this person */
  books: string[]
  /** Testament filter: AT (Old), NT (New), or null for both */
  testament: 'AT' | 'NT' | null
  /** Additional context to inject into the query for better embedding match */
  queryEnrichment: string
  /** Disambiguation note for the AI prompt */
  promptNote: string
}

/**
 * Map of ambiguous names to their Catholic-canonical meanings.
 * When a user asks about "Maria" without qualification, we default to
 * the Blessed Virgin Mary (the Catholic default).
 */
const AMBIGUOUS_NAMES: Record<string, {
  default: NameContext
  variants: Record<string, NameContext>
}> = {
  maria: {
    default: {
      canonical: 'Maria Santíssima, Mãe de Deus (Virgem Maria)',
      books: ['Mateus', 'Lucas', 'João', 'Atos dos Apóstolos'],
      testament: 'NT',
      queryEnrichment: 'Virgem Maria Mãe de Jesus Nazaré Anunciação Magnificat',
      promptNote: 'IMPORTANTE: "Maria" sem qualificação refere-se à Virgem Maria, Mãe de Deus — dogma central da fé católica. NÃO confundir com: Maria Madalena (discípula penitente), Maria de Betânia (irmã de Lázaro), Maria mãe de Tiago, Maria mulher de Cléofas, ou Miriã/Maria irmã de Moisés (AT).',
    },
    variants: {
      madalena: {
        canonical: 'Maria Madalena (Santa Maria Madalena)',
        books: ['Lucas', 'Marcos', 'João', 'Mateus'],
        testament: 'NT',
        queryEnrichment: 'Maria Madalena discípula pecadora penitente ressurreição túmulo',
        promptNote: 'Maria Madalena: discípula fiel que esteve ao pé da Cruz e foi a primeira a ver o Ressuscitado. A tradição católica a distingue da pecadora anônima de Lc 7.',
      },
      betania: {
        canonical: 'Maria de Betânia (irmã de Lázaro e Marta)',
        books: ['Lucas', 'João'],
        testament: 'NT',
        queryEnrichment: 'Maria Betânia irmã Lázaro Marta perfume unção pés Jesus',
        promptNote: 'Maria de Betânia: irmã de Lázaro e Marta, que ungiu os pés de Jesus com perfume (Jo 12).',
      },
      miriam: {
        canonical: 'Miriã (irmã de Moisés e Aarão)',
        books: ['Êxodo', 'Números'],
        testament: 'AT',
        queryEnrichment: 'Miriã Maria irmã Moisés Aarão profetisa tamborim',
        promptNote: 'Miriã (Maria do AT): irmã de Moisés e Aarão, profetisa que cantou após a travessia do Mar Vermelho (Ex 15,20).',
      },
    },
  },
  judas: {
    default: {
      canonical: 'Judas Iscariotes (o traidor)',
      books: ['Mateus', 'Marcos', 'Lucas', 'João'],
      testament: 'NT',
      queryEnrichment: 'Judas Iscariotes traidor trinta moedas prata traição beijo',
      promptNote: 'IMPORTANTE: "Judas" sem qualificação geralmente refere-se a Judas Iscariotes, o apóstolo que traiu Jesus. NÃO confundir com: São Judas Tadeu (apóstolo fiel, padroeiro das causas impossíveis) ou Judas irmão de Jesus (autor da Epístola de Judas). Distinguir CLARAMENTE qual Judas está em questão.',
    },
    variants: {
      tadeu: {
        canonical: 'São Judas Tadeu (apóstolo fiel)',
        books: ['Lucas', 'João', 'Atos dos Apóstolos'],
        testament: 'NT',
        queryEnrichment: 'Judas Tadeu apóstolo fiel padroeiro causas impossíveis Lebeu',
        promptNote: 'São Judas Tadeu: apóstolo fiel de Jesus, autor da Epístola de Judas, padroeiro das causas impossíveis. NÃO confundir com Judas Iscariotes.',
      },
      macabeu: {
        canonical: 'Judas Macabeu',
        books: ['1 Macabeus', '2 Macabeus'],
        testament: 'AT',
        queryEnrichment: 'Judas Macabeu revolta templo purificação Hanucá',
        promptNote: 'Judas Macabeu: líder da revolta macabeia, purificou o Templo de Jerusalém. Livros deuterocanônicos (1-2 Macabeus).',
      },
    },
  },
  tiago: {
    default: {
      canonical: 'São Tiago Maior (apóstolo, filho de Zebedeu)',
      books: ['Mateus', 'Marcos', 'Atos dos Apóstolos'],
      testament: 'NT',
      queryEnrichment: 'Tiago Maior apóstolo filho Zebedeu irmão João Santiago Compostela',
      promptNote: 'IMPORTANTE: Existem dois apóstolos com nome Tiago: Tiago Maior (filho de Zebedeu, irmão de João) e Tiago Menor (filho de Alfeu, "irmão do Senhor", autor da Epístola). Se o contexto não especificar, apresente ambos.',
    },
    variants: {
      menor: {
        canonical: 'São Tiago Menor (filho de Alfeu)',
        books: ['Atos dos Apóstolos', 'Gálatas'],
        testament: 'NT',
        queryEnrichment: 'Tiago Menor filho Alfeu irmão Senhor bispo Jerusalém epístola',
        promptNote: 'Tiago Menor: filho de Alfeu, chamado "irmão do Senhor", primeiro bispo de Jerusalém, autor da Epístola de Tiago.',
      },
    },
  },
  joao: {
    default: {
      canonical: 'São João Evangelista (apóstolo amado)',
      books: ['João', '1 João', '2 João', '3 João', 'Apocalipse'],
      testament: 'NT',
      queryEnrichment: 'João evangelista apóstolo amado discípulo Apocalipse Patmos',
      promptNote: 'IMPORTANTE: "João" pode referir-se a: São João Evangelista (apóstolo amado, autor do Evangelho e Apocalipse), São João Batista (precursor de Cristo), ou São João Crisóstomo (Padre da Igreja). O contexto determinará qual.',
    },
    variants: {
      batista: {
        canonical: 'São João Batista (precursor de Cristo)',
        books: ['Mateus', 'Marcos', 'Lucas', 'João'],
        testament: 'NT',
        queryEnrichment: 'João Batista precursor batismo Jordão Herodes profeta',
        promptNote: 'São João Batista: o precursor de Cristo, que batizou Jesus no Rio Jordão. "Eis o Cordeiro de Deus" (Jo 1,29).',
      },
    },
  },
  pedro: {
    default: {
      canonical: 'São Pedro (Simão Pedro, primeiro Papa)',
      books: ['Mateus', 'Marcos', 'Lucas', 'João', 'Atos dos Apóstolos', '1 Pedro', '2 Pedro'],
      testament: 'NT',
      queryEnrichment: 'Pedro Simão Cefas primeiro papa chaves reino pedra Igreja',
      promptNote: 'São Pedro: Simão, chamado Cefas/Pedro por Jesus. Primeiro Papa, fundamento visível da Igreja. "Tu és Pedro, e sobre esta pedra edificarei a minha Igreja" (Mt 16,18).',
    },
    variants: {},
  },
  paulo: {
    default: {
      canonical: 'São Paulo Apóstolo (Saulo de Tarso)',
      books: ['Atos dos Apóstolos', 'Romanos', '1 Coríntios', '2 Coríntios', 'Gálatas', 'Efésios', 'Filipenses', 'Colossenses', '1 Tessalonicenses', '2 Tessalonicenses', '1 Timóteo', '2 Timóteo', 'Tito', 'Filêmon'],
      testament: 'NT',
      queryEnrichment: 'Paulo Saulo Tarso apóstolo gentios conversão Damasco epístolas',
      promptNote: 'São Paulo: Saulo de Tarso, o apóstolo dos gentios. Converteu-se no caminho de Damasco. Autor de 13 epístolas do NT.',
    },
    variants: {},
  },
}

export interface DisambiguationResult {
  /** The enriched query for better vector search */
  enrichedQuery: string
  /** Context notes to inject into the AI prompt */
  promptNotes: string[]
  /** Books to prioritize in search */
  preferredBooks: string[]
  /** Testament filter */
  testamentFilter: 'AT' | 'NT' | null
  /** Bible references that MUST be included in results */
  mustIncludeRefs: string[]
  /** Additional keyword terms for text search */
  keywordTerms: string[]
  /** Whether disambiguation was applied */
  wasDisambiguated: boolean
}

/**
 * Analyzes a query and applies Catholic name disambiguation.
 * Returns enriched query + context notes for the AI prompt.
 */
export function disambiguateQuery(query: string): DisambiguationResult {
  const lower = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const result: DisambiguationResult = {
    enrichedQuery: query,
    promptNotes: [],
    preferredBooks: [],
    testamentFilter: null,
    mustIncludeRefs: [],
    keywordTerms: [],
    wasDisambiguated: false,
  }

  for (const [name, config] of Object.entries(AMBIGUOUS_NAMES)) {
    const normalizedName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (!lower.includes(normalizedName)) continue

    // Check if a specific variant is mentioned
    let matched: NameContext | null = null
    for (const [variant, ctx] of Object.entries(config.variants)) {
      const normalizedVariant = variant.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      if (lower.includes(normalizedVariant)) {
        matched = ctx
        break
      }
    }

    // Check for other variant-indicating keywords
    if (!matched) {
      // Maria-specific detection
      if (name === 'maria') {
        if (lower.includes('madalena') || lower.includes('magdalena')) {
          matched = config.variants.madalena
        } else if (lower.includes('betania') || lower.includes('lazaro') || lower.includes('marta')) {
          matched = config.variants.betania
        } else if (lower.includes('miriam') || lower.includes('moises') || lower.includes('aarao')) {
          matched = config.variants.miriam
        }
      }
      // Judas-specific detection
      if (name === 'judas') {
        if (lower.includes('tadeu') || lower.includes('causas impossiveis') || lower.includes('padroeiro')) {
          matched = config.variants.tadeu
        } else if (lower.includes('macabeu') || lower.includes('macabeus')) {
          matched = config.variants.macabeu
        }
      }
      // Tiago-specific detection
      if (name === 'tiago') {
        if (lower.includes('menor') || lower.includes('alfeu') || lower.includes('epistola')) {
          matched = config.variants.menor
        }
      }
      // Joao-specific detection
      if (name === 'joao') {
        if (lower.includes('batista') || lower.includes('precursor') || lower.includes('jordao') || lower.includes('herodes')) {
          matched = config.variants.batista
        }
      }
    }

    // Use default if no variant matched
    if (!matched) {
      matched = config.default
    }

    result.enrichedQuery = `${query} ${matched.queryEnrichment}`
    result.promptNotes.push(matched.promptNote)
    result.preferredBooks.push(...matched.books)
    if (matched.testament) {
      result.testamentFilter = matched.testament
    }
    result.wasDisambiguated = true
  }

  // Also apply theological topic enrichment
  const topicResult = enrichTheologicalTopic(query)
  if (topicResult) {
    result.enrichedQuery = `${result.enrichedQuery} ${topicResult.queryEnrichment}`
    result.promptNotes.push(topicResult.promptNote)
    result.mustIncludeRefs.push(...topicResult.mustIncludeRefs)
    result.keywordTerms.push(...topicResult.keywordTerms)
    result.wasDisambiguated = true
  }

  return result
}

// ====================================================================
// Theological Topic Enrichment
// ====================================================================

interface TopicConfig {
  /** Keywords that trigger this topic */
  triggers: string[]
  /** Additional terms to enrich the query embedding */
  queryEnrichment: string
  /** Bible references that MUST be included (fetched via keyword) */
  mustIncludeRefs: string[]
  /** Keyword terms for fallback text search */
  keywordTerms: string[]
  /** Context note for the AI prompt */
  promptNote: string
}

/**
 * Maps Catholic theological topics to their essential Bible passages.
 * When a user asks about "Eucaristia", we don't just search for "bread" —
 * we ensure the institution narratives and John 6 are included.
 */
const THEOLOGICAL_TOPICS: TopicConfig[] = [
  {
    triggers: ['eucaristia', 'eucarística', 'eucaristico', 'corpo e sangue', 'santa ceia', 'última ceia', 'ultima ceia', 'transubstanciação', 'transubstanciacao', 'presença real', 'presenca real', 'santo sacrifício', 'santo sacrificio'],
    queryEnrichment: 'Isto é o meu corpo isto é o meu sangue nova aliança Última Ceia pão da vida comer minha carne beber meu sangue eucaristia sacramento',
    mustIncludeRefs: ['Mt 26,26', 'Mt 26,27', 'Mt 26,28', 'Lc 22,19', 'Lc 22,20', 'Jo 6,51', 'Jo 6,53', 'Jo 6,54', 'Jo 6,55', 'Jo 6,56', '1Cor 11,24', '1Cor 11,25', '1Cor 11,26'],
    keywordTerms: ['isto é o meu corpo', 'isto é o meu sangue', 'pão da vida', 'comer minha carne', 'nova aliança'],
    promptNote: 'EUCARISTIA: Os versículos ESSENCIAIS são Mt 26,26-28 ("Isto é o meu corpo/sangue"), Lc 22,19-20 (instituição na Última Ceia), Jo 6,51-56 (discurso do Pão da Vida) e 1Cor 11,23-26 (tradição paulina). Estes devem ser citados OBRIGATORIAMENTE. A doutrina católica ensina a presença real (transubstanciação), não mero símbolo.',
  },
  {
    triggers: ['batismo', 'batizar', 'batizados', 'sacramento do batismo', 'batismal'],
    queryEnrichment: 'batismo água Espírito Santo nascer de novo ide fazei discípulos batizando nome Pai Filho',
    mustIncludeRefs: ['Mt 28,19', 'Jo 3,5', 'At 2,38', 'Rm 6,3', 'Rm 6,4', 'At 22,16', 'Mc 16,16', '1Pd 3,21'],
    keywordTerms: ['batizando', 'nascer da água', 'batismo', 'batizar'],
    promptNote: 'BATISMO: Versículos essenciais: Mt 28,19 (mandato de batizar), Jo 3,5 (nascer da água e do Espírito), At 2,38 (Pedro no Pentecostes), Rm 6,3-4 (batismo na morte de Cristo). A Igreja ensina batismo infantil desde os primeiros séculos.',
  },
  {
    triggers: ['confissão', 'confissao', 'penitência', 'penitencia', 'sacramento da reconciliação', 'reconciliacao', 'perdão dos pecados', 'perdao dos pecados', 'absolvição', 'absolvicao', 'confessar pecados'],
    queryEnrichment: 'perdoar pecados reter pecados confissão sacerdote poder chaves ligar desligar reconciliação penitência',
    mustIncludeRefs: ['Jo 20,22', 'Jo 20,23', 'Mt 16,19', 'Mt 18,18', 'Tg 5,16', '2Cor 5,18', '2Cor 5,19'],
    keywordTerms: ['perdoardes os pecados', 'retiverdes', 'ligar', 'desligar', 'confessai'],
    promptNote: 'CONFISSÃO: Versículos essenciais: Jo 20,22-23 (Jesus dá poder de perdoar/reter pecados), Mt 16,19 e 18,18 (poder das chaves), Tg 5,16 (confessai os pecados). Cristo instituiu o sacramento dando autoridade aos apóstolos.',
  },
  {
    triggers: ['papado', 'papa', 'primado de pedro', 'infalibilidade', 'sucessão apostólica', 'sucessao apostolica', 'bispo de roma'],
    queryEnrichment: 'Pedro pedra rocha edificarei Igreja chaves reino céus apascenta ovelhas confirma irmãos',
    mustIncludeRefs: ['Mt 16,18', 'Mt 16,19', 'Jo 21,15', 'Jo 21,16', 'Jo 21,17', 'Lc 22,32'],
    keywordTerms: ['tu és Pedro', 'sobre esta pedra', 'chaves do reino', 'apascenta as minhas ovelhas'],
    promptNote: 'PAPADO: Versículos essenciais: Mt 16,18-19 ("Tu és Pedro e sobre esta pedra edificarei a minha Igreja"), Jo 21,15-17 ("Apascenta as minhas ovelhas"), Lc 22,32 ("confirma os teus irmãos"). Pedro é sempre listado primeiro entre os apóstolos.',
  },
  {
    triggers: ['purgatório', 'purgatorio', 'oração pelos mortos', 'oracao pelos mortos', 'purificação após morte', 'purificacao apos morte'],
    queryEnrichment: 'purgatório purificação fogo oração pelos mortos sacrifício expiação Judas Macabeu pecado perdoado neste mundo nem no futuro',
    mustIncludeRefs: ['2Mac 12,42', '2Mac 12,43', '2Mac 12,44', '2Mac 12,45', '2Mac 12,46', '1Cor 3,13', '1Cor 3,14', '1Cor 3,15', 'Mt 12,32'],
    keywordTerms: ['oração pelos mortos', 'purificação', 'sacrifício pelos mortos', 'neste mundo nem no futuro'],
    promptNote: 'PURGATÓRIO: Versículos essenciais: 2Mac 12,42-46 (oração e sacrifício pelos mortos — livro deuterocanônico), 1Cor 3,13-15 (purificação pelo fogo), Mt 12,32 (perdão no mundo futuro implica estado intermediário). Doutrina definida nos Concílios de Florença e Trento.',
  },
  {
    triggers: ['intercessão dos santos', 'intercessao dos santos', 'oração aos santos', 'oracao aos santos', 'comunhão dos santos', 'comunhao dos santos', 'pedir aos santos', 'santos intercedem'],
    queryEnrichment: 'santos intercessão oração mediação nuvem testemunhas anjos incenso orações altar',
    mustIncludeRefs: ['Ap 5,8', 'Ap 8,3', 'Ap 8,4', 'Hb 12,1', '2Mac 15,14', 'Tg 5,16'],
    keywordTerms: ['taças de ouro cheias de incenso', 'nuvem de testemunhas', 'oração do justo'],
    promptNote: 'INTERCESSÃO DOS SANTOS: Versículos essenciais: Ap 5,8 (santos apresentam orações a Deus), Ap 8,3-4 (incenso com orações dos santos), Hb 12,1 (nuvem de testemunhas), 2Mac 15,14 (Jeremias intercede após a morte), Tg 5,16 (oração do justo tem grande eficácia).',
  },
  {
    triggers: ['maria', 'virgem maria', 'nossa senhora', 'mãe de deus', 'mae de deus', 'imaculada', 'assunção', 'assuncao', 'magnificat', 'ave maria'],
    queryEnrichment: 'Maria cheia de graça bendita entre mulheres mãe Senhor magnificat mulher revestida sol Caná bodas eis teu filho',
    mustIncludeRefs: ['Lc 1,28', 'Lc 1,42', 'Lc 1,43', 'Lc 1,46', 'Lc 1,48', 'Jo 2,5', 'Jo 19,26', 'Jo 19,27', 'Ap 12,1', 'Gn 3,15'],
    keywordTerms: ['cheia de graça', 'bendita entre as mulheres', 'mãe do meu Senhor', 'fazei tudo', 'eis teu filho'],
    promptNote: 'MARIA: Versículos essenciais: Lc 1,28 (Ave, cheia de graça), Lc 1,42-43 (bendita/mãe do Senhor), Jo 2,5 (Caná — "Fazei tudo o que ele vos disser"), Jo 19,26-27 (Maria como mãe da Igreja), Ap 12,1 (mulher vestida de sol), Gn 3,15 (protoevangelium). Dogmas: Maternidade Divina, Virgindade Perpétua, Imaculada Conceição, Assunção.',
  },
  {
    triggers: ['salvação', 'salvacao', 'justificação', 'justificacao', 'sola fide', 'só a fé', 'so a fe', 'fé e obras', 'fe e obras', 'salvo pela fé', 'salvo pela fe'],
    queryEnrichment: 'fé sem obras morta justificado pelas obras não somente pela fé operai vossa salvação juízo final obras misericórdia',
    mustIncludeRefs: ['Tg 2,24', 'Tg 2,26', 'Fl 2,12', 'Mt 25,35', 'Mt 25,36', 'Mt 25,40', 'Rm 2,6', 'Ap 20,12', 'Ef 2,8', 'Ef 2,9', 'Ef 2,10'],
    keywordTerms: ['fé sem obras', 'justificado pelas obras', 'operai vossa salvação', 'segundo as suas obras'],
    promptNote: 'SALVAÇÃO: A posição católica é que a salvação vem pela graça, recebida pela fé E vivida nas obras. Versículos essenciais: Tg 2,24 ("o homem é justificado pelas obras, não somente pela fé"), Fl 2,12 ("operai vossa salvação"), Mt 25,35-40 (juízo pelas obras), Ef 2,8-10 (graça pela fé + criados para boas obras). Refutar o sola fide.',
  },
  {
    triggers: ['tradição', 'tradicao', 'sola scriptura', 'só a bíblia', 'so a biblia', 'tradição apostólica', 'tradicao apostolica', 'tradição oral', 'tradicao oral'],
    queryEnrichment: 'tradições recebestes guardar tradição transmiti palavra escrita oral ensinamentos apóstolos',
    mustIncludeRefs: ['2Ts 2,15', '2Tm 1,13', '2Tm 1,14', '2Tm 2,2', '1Cor 11,2', 'Jo 21,25'],
    keywordTerms: ['conservai as tradições', 'modelo das sãs palavras', 'vos transmiti', 'o mundo não poderia conter'],
    promptNote: 'TRADIÇÃO: Versículos essenciais: 2Ts 2,15 ("conservai as tradições que vos ensinamos por palavra ou por carta"), 1Cor 11,2 ("conservais as tradições como eu as transmiti"), 2Tm 2,2 (transmissão oral), Jo 21,25 (nem tudo está escrito). A Bíblia mesma refuta o sola scriptura.',
  },
  {
    triggers: ['imagens', 'ídolo', 'idolo', 'idolatria', 'estátuas', 'estatuas', 'ícones', 'icones', 'veneração', 'veneracao', 'imagens de santos'],
    queryEnrichment: 'querubins arca aliança serpente bronze imagens escultura Salomão templo leão boi anjo',
    mustIncludeRefs: ['Ex 25,18', 'Ex 25,19', 'Ex 25,20', 'Nm 21,8', 'Nm 21,9', '1Rs 6,23', '1Rs 6,29', 'Ez 41,18', 'Ez 41,19'],
    keywordTerms: ['dois querubins de ouro', 'serpente de bronze', 'querubins', 'escultura'],
    promptNote: 'IMAGENS: Versículos essenciais: Ex 25,18-20 (Deus MANDA fazer querubins para a Arca), Nm 21,8-9 (serpente de bronze por ordem de Deus), 1Rs 6,23-29 (Salomão decora o Templo com imagens). A proibição de Ex 20,4 é contra ÍDOLOS (deuses falsos), não contra TODA imagem — como o próprio Deus demonstra mandando fazer querubins.',
  },
  {
    triggers: ['missa', 'santo sacrifício da missa', 'liturgia', 'celebração eucarística', 'celebracao eucaristica', 'sacrifício da cruz', 'sacrificio da cruz'],
    queryEnrichment: 'sacrifício missa altar sacerdote oferenda pão vinho Melquisedeque Cordeiro oblação santa ceia corpo sangue',
    mustIncludeRefs: ['Hb 13,10', 'Ml 1,11', 'Gn 14,18', 'Mt 26,26', 'Mt 26,28', '1Cor 10,16', '1Cor 10,21'],
    keywordTerms: ['temos um altar', 'oferenda pura', 'pão e vinho', 'Melquisedeque', 'comunhão do corpo', 'mesa do Senhor'],
    promptNote: 'MISSA: Versículos essenciais: Ml 1,11 (profecia da "oferenda pura" entre as nações), Gn 14,18 (Melquisedeque oferece pão e vinho — figura da Eucaristia), Hb 13,10 ("temos um altar"), 1Cor 10,16.21 (mesa do Senhor), Mt 26,26-28 (instituição). A Missa é a re-apresentação incruenta do sacrifício da Cruz.',
  },
]

/**
 * Enriches the query with theological context for Catholic topics.
 * Ensures essential Bible passages are found even when the embedding
 * would otherwise return generic matches.
 */
function enrichTheologicalTopic(query: string): TopicConfig | null {
  const lower = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  for (const topic of THEOLOGICAL_TOPICS) {
    for (const trigger of topic.triggers) {
      const normalizedTrigger = trigger.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      if (lower.includes(normalizedTrigger)) {
        return topic
      }
    }
  }

  return null
}

/**
 * Detects if the query is about a Catholic-specific topic that
 * requires deuterocanonical books (Tobias, Judite, Sabedoria,
 * Eclesiástico, Baruc, 1-2 Macabeus).
 */
export function requiresDeuterocanonical(query: string): boolean {
  const lower = query.toLowerCase()
  const topics = [
    'purgatorio', 'purgatório',
    'oração pelos mortos', 'oracao pelos mortos',
    'macabeus', 'macabeu',
    'tobias', 'judite', 'sabedoria', 'eclesiástico', 'eclesiastico',
    'baruc', 'deuterocanônico', 'deuterocanonico',
    'anjo rafael', 'anjo tobias',
  ]
  return topics.some(t => lower.includes(t))
}
