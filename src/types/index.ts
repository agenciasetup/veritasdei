export type Pillar = 'biblia' | 'magisterio' | 'patristica'

export interface SearchResult {
  id: string
  pillar: Pillar
  reference: string        // ex: "João 11,25" ou "CIC § 988" ou "Santo Agostinho — Confissões, X,27"
  text: string             // trecho encontrado
  context?: string         // nota de contexto: por que esta fonte importa
  similarity: number       // score de similaridade 0-1
}

export interface PillarResponse {
  pillar: Pillar
  results: SearchResult[]
}

export interface AIInsight {
  summary: string          // explicação educativa de 2-3 parágrafos
  keyPoints: string[]      // 3-5 pontos-chave do tema
  relatedTopics: string[]  // 3-4 temas relacionados para explorar
  sourceContext: Record<string, string>  // reference → "por que importa"
}

export interface QueryResponse {
  query: string
  pillars: PillarResponse[]
  insight: AIInsight | null  // explicação da IA (null se falhou)
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
