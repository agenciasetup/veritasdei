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

export interface ProtestantView {
  summary: string          // síntese das objeções protestantes
  denominations: string[]  // exemplos de denominações que sustentam isso
  refutation: string       // refutação católica com base bíblica e etimológica
}

export interface AIInsight {
  summary: string          // explicação católica com markdown (## títulos, **negrito**, *itálico*, \n)
  keyPoints: string[]      // 3-5 pontos-chave
  relatedTopics: string[]  // temas para aprofundar
  sourceContext: Record<string, string>
  protestantView: ProtestantView | null  // visão protestante + refutação
}

export interface QueryResponse {
  query: string
  pillars: PillarResponse[]
  insight: AIInsight | null
  sensitive: boolean
  tags: string[]
}

export interface EtymologyEntry {
  id: string
  term_pt: string
  term_original: string
  transliteration: string
  original_meaning: string
  modern_difference: string
  examples: string[]
}
