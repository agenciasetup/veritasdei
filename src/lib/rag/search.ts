import { generateEmbedding } from '../openai/embeddings'
import { openai } from '../openai/client'
import { buildRAGPrompt } from './prompt'
import { isSensitiveTopic } from '../utils/sensitive-topics'
import type { QueryResponse, SearchResult } from '@/types'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface RawResult {
  id: string
  reference: string
  text_pt?: string
  text?: string
  similarity: number
  [key: string]: unknown
}

export async function searchCorpus(query: string): Promise<QueryResponse> {
  const supabase = getSupabaseAdmin()

  // 1. Gerar embedding da pergunta
  const queryEmbedding = await generateEmbedding(query)

  // 2. Busca paralela nos 4 pilares
  const [bibliaRaw, catecismoRaw, magisterioRaw, patristicaRaw] = await Promise.all([
    supabase.rpc('search_biblia', {
      query_embedding: queryEmbedding,
      match_threshold: 0.45,
      match_count: 5,
    }),
    supabase.rpc('search_catecismo', {
      query_embedding: queryEmbedding,
      match_threshold: 0.45,
      match_count: 4,
    }),
    supabase.rpc('search_magisterio', {
      query_embedding: queryEmbedding,
      match_threshold: 0.45,
      match_count: 3,
    }),
    supabase.rpc('search_patristica', {
      query_embedding: queryEmbedding,
      match_threshold: 0.45,
      match_count: 4,
    }),
  ])

  const bibliaResults: RawResult[] = bibliaRaw.data ?? []
  const catecismoResults: RawResult[] = catecismoRaw.data ?? []
  const magisterioResults: RawResult[] = magisterioRaw.data ?? []
  const patristicaResults: RawResult[] = patristicaRaw.data ?? []

  // Magistério = catecismo + documentos conciliares
  const allMagisterioResults = [...catecismoResults, ...magisterioResults]
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5)

  // 3. Montar prompt RAG
  const prompt = buildRAGPrompt(
    query,
    bibliaResults.map(r => ({ reference: r.reference, text: r.text_pt ?? r.text ?? '' })),
    allMagisterioResults.map(r => ({ reference: r.reference, text: r.text ?? '' })),
    patristicaResults.map(r => ({ reference: r.reference, text: r.text ?? '' }))
  )

  // 4. Formatar com GPT-4o-mini (formatador, não autoridade)
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1500,
    temperature: 0.1, // baixo: queremos consistência, não criatividade
  })

  const _formattedResponse = completion.choices[0].message.content ?? ''

  // 5. Montar resposta estruturada
  const toSearchResult = (item: RawResult, pillar: SearchResult['pillar']): SearchResult => ({
    id: item.id,
    pillar,
    reference: item.reference,
    text: item.text_pt ?? item.text ?? '',
    similarity: item.similarity,
  })

  return {
    query,
    pillars: [
      {
        pillar: 'biblia',
        results: bibliaResults.map(r => toSearchResult(r, 'biblia')),
      },
      {
        pillar: 'magisterio',
        results: allMagisterioResults.map(r => toSearchResult(r, 'magisterio')),
      },
      {
        pillar: 'patristica',
        results: patristicaResults.map(r => toSearchResult(r, 'patristica')),
      },
    ],
    sensitive: isSensitiveTopic(query),
    tags: [], // implementar com extração de tags no Sprint 4
  }
}
