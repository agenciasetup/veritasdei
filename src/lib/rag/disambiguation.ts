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

  return result
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
