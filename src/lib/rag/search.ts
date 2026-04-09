import { generateEmbedding } from '../openai/embeddings'
import { openai } from '../openai/client'
import { buildRAGPrompt } from './prompt'
import { isSensitiveTopic } from '../utils/sensitive-topics'
import type { QueryResponse, SearchResult, AIInsight } from '@/types'
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

function parseAIResponse(raw: string): AIInsight | null {
  try {
    // Remove potential markdown code fences
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      relatedTopics: Array.isArray(parsed.relatedTopics) ? parsed.relatedTopics : [],
      sourceContext: typeof parsed.sourceContext === 'object' && parsed.sourceContext !== null
        ? parsed.sourceContext
        : {},
    }
  } catch {
    // If JSON parsing fails, try to extract summary from plain text
    if (raw.length > 50) {
      return {
        summary: raw,
        keyPoints: [],
        relatedTopics: [],
        sourceContext: {},
      }
    }
    return null
  }
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

  // 4. Gerar explicação educativa com GPT-4o-mini
  let insight: AIInsight | null = null
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2500,
      temperature: 0.3,
    })

    const rawResponse = completion.choices[0].message.content ?? ''
    insight = parseAIResponse(rawResponse)
  } catch {
    // AI insight is optional — search still works without it
    insight = null
  }

  // 5. Montar resposta estruturada
  const toSearchResult = (item: RawResult, pillar: SearchResult['pillar']): SearchResult => ({
    id: item.id,
    pillar,
    reference: item.reference,
    text: item.text_pt ?? item.text ?? '',
    context: insight?.sourceContext[item.reference],
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
    insight,
    sensitive: isSensitiveTopic(query),
    tags: [],
  }
}
