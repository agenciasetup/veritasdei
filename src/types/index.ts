export type Pillar = 'biblia' | 'magisterio' | 'patristica'

export interface SearchResult {
  id: string
  pillar: Pillar
  reference: string
  text: string
  context?: string
  similarity: number
}

export interface PillarResponse {
  pillar: Pillar
  results: SearchResult[]
}

/**
 * A single objection → refutation block for the "How the Protestant disagrees"
 * section. The UI renders each block as:
 *   [ Objeção: claim ]
 *   [ Como a Igreja Católica responde: refutation ]
 */
export interface ObjectionBlock {
  claim: string       // a objeção específica (1 parágrafo, texto que o protestante diria)
  refutation: string  // como a Igreja Católica combate (fontes das passagens acima)
}

export interface ProtestantView {
  summary: string              // o que o protestante DIZ (visão geral em 1–2 parágrafos)
  denominations: string[]      // denominações que realmente discordam
  objections: ObjectionBlock[] // blocos [Objeção] [Refutação] — PREFERIDO pela UI
  refutation: string           // refutação consolidada (fallback / legado)
}

/**
 * Classificação moral — só para perguntas de conduta ("é pecado X?", "posso fazer X?").
 * - sin: pecado claro segundo o Catecismo
 * - moderate: requer moderação / depende das circunstâncias (matéria próxima)
 * - not_sin: permitido / não é pecado em si
 * - not_applicable: pergunta não é sobre conduta moral
 */
export type MoralTag = 'sin' | 'moderate' | 'not_sin' | 'not_applicable'

/**
 * Classificação de heresia — só quando a IA tem certeza DOUTRINAL baseada
 * nas fontes do Magistério/Catecismo fornecidas. Default SEMPRE = not_applicable.
 * Nunca marcar 'heresy' sem citação explícita de Concílio/Catecismo.
 */
export type HeresyTag = 'heresy' | 'orthodox' | 'not_applicable'

export interface AIInsight {
  summary: string          // explicação católica com markdown (**negrito**, *itálico*, \n\n)
  keyPoints: string[]      // 3-5 pontos-chave
  relatedTopics: string[]  // temas para aprofundar
  sourceContext: Record<string, string>
  isControversial: boolean // se o tema é controverso entre católicos e protestantes
  protestantView: ProtestantView | null  // visão protestante + refutação (só quando controverso)
  curiosity: string | null // curiosidade histórica/etimológica (quando não controverso)
  confidenceLevel?: 'high' | 'medium' | 'low' // nível de confiança baseado nas fontes
  moralTag?: MoralTag      // classificação moral (só para perguntas de conduta)
  heresyTag?: HeresyTag    // classificação doutrinal (só quando houver evidência forte)
  heresyName?: string | null // nome da heresia, se identificada (ex: "Arianismo")
}

/**
 * Etymology hit — used when the RAG pipeline finds a term from etymo_terms
 * that is relevant to the user's question. Surfaced to the LLM so the answer
 * can explain the original Greek/Latin/Hebrew meaning of a key theological
 * term (e.g. εὐχαριστία, sacramentum, ἐπίσκοπος).
 */
export interface EtymologyHit {
  id: string
  term_pt: string
  term_original: string
  original_language: string | null
  transliteration: string | null
  original_meaning: string | null
  modern_difference: string | null
  examples: string[]
  similarity: number
}

export interface QueryResponse {
  query: string
  pillars: PillarResponse[]
  insight: AIInsight | null
  sensitive: boolean
  tags: string[]
  etymology?: EtymologyHit[]
}
