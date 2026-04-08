export type Pillar = 'biblia' | 'magisterio' | 'patristica'

export interface SearchResult {
  id: string
  pillar: Pillar
  reference: string        // ex: "João 11,25" ou "CIC § 988" ou "Santo Agostinho — Confissões, X,27"
  text: string             // trecho encontrado
  context?: string         // nota de contexto (opcional)
  similarity: number       // score de similaridade 0-1
}

export interface PillarResponse {
  pillar: Pillar
  results: SearchResult[]
}

export interface QueryResponse {
  query: string
  pillars: PillarResponse[]
  sensitive: boolean       // true = mostrar disclaimer pastoral
  tags: string[]           // tags temáticas da resposta
}

export interface EtymologyEntry {
  id: string
  term_pt: string          // termo em português moderno
  term_original: string    // termo original (grego/hebraico/latim)
  transliteration: string
  original_meaning: string
  modern_difference: string
  examples: string[]       // referências no corpus
}
