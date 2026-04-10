import { generateEmbedding } from '../openai/embeddings'
import { openai } from '../openai/client'
import { buildRAGPrompt } from './prompt'
import { disambiguateQuery } from './disambiguation'
import { isSensitiveTopic } from '../utils/sensitive-topics'
import type { QueryResponse, SearchResult, AIInsight, ProtestantView } from '@/types'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

function getSupabaseAdmin(): AnySupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('[search] Missing SUPABASE env vars:', { url: !!url, key: !!key })
  }
  return createClient(url ?? '', key ?? '')
}

interface RawResult {
  id: string
  reference: string
  text_pt?: string
  text?: string
  book?: string
  chapter?: number
  verse?: number
  testament?: string
  similarity: number
  rank?: number
  [key: string]: unknown
}

function parseProtestantView(raw: unknown): ProtestantView | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  if (typeof obj.summary !== 'string' || typeof obj.refutation !== 'string') return null
  return {
    summary: obj.summary,
    denominations: Array.isArray(obj.denominations) ? obj.denominations : [],
    refutation: obj.refutation,
  }
}

function parseAIResponse(raw: string): AIInsight | null {
  try {
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      relatedTopics: Array.isArray(parsed.relatedTopics) ? parsed.relatedTopics : [],
      sourceContext: typeof parsed.sourceContext === 'object' && parsed.sourceContext !== null
        ? parsed.sourceContext
        : {},
      protestantView: parseProtestantView(parsed.protestantView),
    }
  } catch {
    if (raw.length > 50) {
      return {
        summary: raw,
        keyPoints: [],
        relatedTopics: [],
        sourceContext: {},
        protestantView: null,
      }
    }
    return null
  }
}

/**
 * Keyword-based Bible search via PostgREST (fast fallback).
 * Used when vector search times out or fails.
 */
async function searchBibliaKeyword(
  supabase: AnySupabaseClient,
  query: string,
  preferredBooks: string[],
  testamentFilter: string | null,
  limit: number = 8
): Promise<RawResult[]> {
  // Extract meaningful keywords (3+ chars, excluding common words)
  const stopWords = new Set([
    'que', 'como', 'para', 'por', 'com', 'uma', 'uns', 'dos', 'das',
    'nos', 'nas', 'seu', 'sua', 'são', 'foi', 'era', 'tem', 'ter',
    'ser', 'está', 'isso', 'este', 'esta', 'esse', 'essa', 'qual',
    'quem', 'onde', 'quando', 'sobre', 'entre', 'depois', 'antes',
    'mais', 'muito', 'toda', 'todo', 'cada', 'outro', 'outra',
    'mesmo', 'ainda', 'também', 'porque', 'porquê', 'pelo', 'pela',
    'dele', 'dela', 'deles', 'delas', 'aqui', 'ali', 'lá',
  ])

  const keywords = query
    .toLowerCase()
    .replace(/[^\w\sáàâãéèêíìîóòôõúùûçñ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !stopWords.has(w))
    .slice(0, 5)

  if (keywords.length === 0) return []

  console.log('[search] Keyword fallback with:', keywords)

  // Try full-text search RPC first (uses PostgreSQL's FTS)
  try {
    const ftsQuery = keywords.join(' & ')
    const { data: ftsData, error: ftsError } = await supabase.rpc('search_biblia_text', {
      search_query: keywords.join(' '),
      match_count: limit,
    } as Record<string, unknown>)

    const ftsArr = ftsData as RawResult[] | null
    if (!ftsError && ftsArr && ftsArr.length > 0) {
      console.log(`[search] FTS returned ${ftsArr.length} results`)
      return ftsArr.map(r => ({
        ...r,
        similarity: Math.min(0.7, 0.5 + (r.rank ?? 0) * 0.1),
      }))
    }
    if (ftsError) {
      console.warn('[search] FTS error (falling back to ilike):', ftsError.message)
    }
  } catch {
    console.warn('[search] FTS not available, using ilike')
  }

  // Fallback: ilike search
  const orConditions = keywords.map(k => `text_pt.ilike.%${k}%`).join(',')

  let queryBuilder = supabase
    .from('biblia')
    .select('id, reference, text_pt, book, chapter, verse, testament')
    .or(orConditions)

  if (testamentFilter) {
    queryBuilder = queryBuilder.eq('testament', testamentFilter)
  }

  // Prioritize preferred books if specified
  if (preferredBooks.length > 0) {
    const { data: preferred, error: prefError } = await queryBuilder
      .in('book', preferredBooks)
      .limit(limit)

    if (!prefError && preferred && preferred.length >= 3) {
      console.log(`[search] Keyword (preferred books) returned ${preferred.length} results`)
      return (preferred as RawResult[]).map((r, i) => ({
        ...r,
        similarity: 0.6 - i * 0.02,
      }))
    }
  }

  // General keyword search
  const { data, error } = await supabase
    .from('biblia')
    .select('id, reference, text_pt, book, chapter, verse, testament')
    .or(orConditions)
    .limit(limit)

  if (error) {
    console.error('[search] Keyword search error:', error.message)
    return []
  }

  console.log(`[search] Keyword (general) returned ${(data ?? []).length} results`)
  return ((data ?? []) as RawResult[]).map((r, i) => ({
    ...r,
    similarity: 0.55 - i * 0.02,
  }))
}

/**
 * Vector-based Bible search.
 * NOTE: The search_biblia function returns top-N results ordered by similarity
 * WITHOUT a WHERE filter (so the IVFFlat index is used efficiently).
 * We apply the threshold filter here in the app.
 */
async function searchBibliaVector(
  supabase: AnySupabaseClient,
  queryEmbedding: number[],
  matchCount: number = 5,
  matchThreshold: number = 0.45
): Promise<{ data: RawResult[]; error: string | null }> {
  try {
    // Request more results than needed so we can filter by threshold
    const { data, error } = await supabase.rpc('search_biblia', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount * 3,
    } as Record<string, unknown>)

    if (error) {
      console.error('[search] search_biblia RPC error:', error.message, error.code)
      return { data: [], error: error.message }
    }

    // Filter by threshold (done here since the DB function no longer has WHERE)
    const filtered = ((data ?? []) as RawResult[])
      .filter(r => r.similarity >= matchThreshold)
      .slice(0, matchCount)

    return { data: filtered, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[search] search_biblia exception:', msg)
    return { data: [], error: msg }
  }
}

/**
 * Fetch specific Bible verses by their exact reference.
 * Used for "must-include" verses for theological topics
 * (e.g., Mt 26,26 for Eucharist queries).
 */
async function fetchMustIncludeVerses(
  supabase: AnySupabaseClient,
  refs: string[],
): Promise<RawResult[]> {
  if (refs.length === 0) return []

  try {
    // References contain commas (e.g., "Mt 26,26") which can confuse
    // PostgREST's .in() filter. Use .or() with individual eq conditions instead.
    const orFilter = refs.map(r => `reference.eq.${r}`).join(',')
    const { data, error } = await supabase
      .from('biblia')
      .select('id, reference, text_pt, book, chapter, verse, testament')
      .or(orFilter)

    if (error) {
      console.error('[search] Must-include fetch error:', error.message)
      // Fallback: try fetching by book/chapter/verse individually
      return fetchMustIncludeByParts(supabase, refs)
    }

    console.log(`[search] Must-include: requested ${refs.length}, found ${(data ?? []).length}`)
    return ((data ?? []) as RawResult[]).map(r => ({
      ...r,
      similarity: 0.95, // High priority — these are theologically essential
    }))
  } catch (err) {
    console.error('[search] Must-include exception:', err)
    return []
  }
}

/**
 * Fallback: fetch must-include verses by parsing book_abbr/chapter/verse.
 * Used when .or() fails due to comma escaping issues in PostgREST.
 */
async function fetchMustIncludeByParts(
  supabase: AnySupabaseClient,
  refs: string[],
): Promise<RawResult[]> {
  // Parse refs like "Mt 26,26" → { book_abbr: "Mt", chapter: 26, verse: 26 }
  const parsed = refs.map(ref => {
    const match = ref.match(/^(\d?\s*\w+)\s+(\d+),(\d+)$/)
    if (!match) return null
    return { book_abbr: match[1].trim(), chapter: parseInt(match[2]), verse: parseInt(match[3]) }
  }).filter(Boolean)

  if (parsed.length === 0) return []

  // Group by book to minimize queries
  const byBook = new Map<string, Array<{ chapter: number; verse: number }>>()
  for (const p of parsed) {
    if (!p) continue
    const key = p.book_abbr
    if (!byBook.has(key)) byBook.set(key, [])
    byBook.get(key)!.push({ chapter: p.chapter, verse: p.verse })
  }

  const results: RawResult[] = []
  for (const [bookAbbr, verses] of byBook.entries()) {
    const chapters = [...new Set(verses.map(v => v.chapter))]
    const verseNums = verses.map(v => v.verse)

    const { data } = await supabase
      .from('biblia')
      .select('id, reference, text_pt, book, chapter, verse, testament')
      .eq('book_abbr', bookAbbr)
      .in('chapter', chapters)
      .in('verse', verseNums)

    if (data) {
      results.push(...(data as RawResult[]).map(r => ({
        ...r,
        similarity: 0.95,
      })))
    }
  }

  console.log(`[search] Must-include (by parts): found ${results.length}`)
  return results
}

/**
 * Deduplicate results by reference, keeping the highest similarity.
 */
function deduplicateResults(results: RawResult[]): RawResult[] {
  const seen = new Map<string, RawResult>()
  for (const r of results) {
    const existing = seen.get(r.reference)
    if (!existing || (r.similarity > existing.similarity)) {
      seen.set(r.reference, r)
    }
  }
  return Array.from(seen.values()).sort((a, b) => b.similarity - a.similarity)
}

/**
 * Group related verses together. If we have Jo 3,16 and Jo 3,17,
 * they should appear together for better context.
 */
function groupRelatedVerses(results: RawResult[]): RawResult[] {
  if (results.length <= 1) return results

  // Sort by book, chapter, verse to group consecutive verses
  const sorted = [...results].sort((a, b) => {
    if (a.book !== b.book) return (a.book ?? '').localeCompare(b.book ?? '')
    if (a.chapter !== b.chapter) return (a.chapter ?? 0) - (b.chapter ?? 0)
    return (a.verse ?? 0) - (b.verse ?? 0)
  })

  // Re-sort by highest similarity within each group
  return sorted.sort((a, b) => b.similarity - a.similarity)
}

export async function searchCorpus(query: string): Promise<QueryResponse> {
  const supabase = getSupabaseAdmin()

  // 1. Disambiguate names and enrich query
  const disambiguation = disambiguateQuery(query)
  const searchQuery = disambiguation.wasDisambiguated
    ? disambiguation.enrichedQuery
    : query

  console.log('[search] Query:', query)
  if (disambiguation.wasDisambiguated) {
    console.log('[search] Disambiguated:', {
      enrichedQuery: searchQuery.substring(0, 100),
      notes: disambiguation.promptNotes.length,
      books: disambiguation.preferredBooks,
      testament: disambiguation.testamentFilter,
    })
  }

  // 2. Generate embedding for the enriched query
  let queryEmbedding: number[]
  try {
    queryEmbedding = await generateEmbedding(searchQuery)
  } catch (err) {
    console.error('[search] Embedding generation failed:', err)
    // If embedding fails, we can still do keyword search for Bible
    queryEmbedding = []
  }

  // 3. Execute all searches in parallel
  const hasEmbedding = queryEmbedding.length > 0
  const hasMustInclude = disambiguation.mustIncludeRefs.length > 0

  const [bibliaVectorResult, catecismoRaw, magisterioRaw, patristicaRaw, bibliaKeywordResult, mustIncludeResult] =
    await Promise.all([
      // Vector search for Bible
      hasEmbedding
        ? searchBibliaVector(supabase, queryEmbedding, 7, 0.42)
        : Promise.resolve({ data: [] as RawResult[], error: 'No embedding' }),

      // Catecismo vector search (small table, reliable)
      hasEmbedding
        ? supabase.rpc('search_catecismo', {
            query_embedding: queryEmbedding,
            match_threshold: 0.42,
            match_count: 5,
          } as Record<string, unknown>)
        : Promise.resolve({ data: [], error: null }),

      // Magisterio vector search
      hasEmbedding
        ? supabase.rpc('search_magisterio', {
            query_embedding: queryEmbedding,
            match_threshold: 0.42,
            match_count: 3,
          } as Record<string, unknown>)
        : Promise.resolve({ data: [], error: null }),

      // Patristica vector search (tiny table, reliable)
      hasEmbedding
        ? supabase.rpc('search_patristica', {
            query_embedding: queryEmbedding,
            match_threshold: 0.42,
            match_count: 4,
          } as Record<string, unknown>)
        : Promise.resolve({ data: [], error: null }),

      // Keyword fallback for Bible (always runs as backup)
      searchBibliaKeyword(
        supabase,
        query,
        disambiguation.preferredBooks,
        disambiguation.testamentFilter,
        8
      ),

      // Must-include references: fetch essential verses by exact reference
      hasMustInclude
        ? fetchMustIncludeVerses(supabase, disambiguation.mustIncludeRefs)
        : Promise.resolve([] as RawResult[]),
    ])

  // Log errors from other searches
  if (catecismoRaw.error) console.error('[search] catecismo error:', catecismoRaw.error)
  if (magisterioRaw.error) console.error('[search] magisterio error:', magisterioRaw.error)
  if (patristicaRaw.error) console.error('[search] patristica error:', patristicaRaw.error)

  // 4. Combine Bible results: must-include + vector + keyword
  const bibliaVectorResults = bibliaVectorResult.data
  const bibliaKeywordResults = bibliaKeywordResult

  // Must-include verses get top priority (theologically essential)
  const allBibliaSources = [
    ...mustIncludeResult,      // Priority 1: essential verses for the topic
    ...bibliaVectorResults,    // Priority 2: semantically similar
    ...bibliaKeywordResults,   // Priority 3: keyword matches
  ]

  let bibliaResults: RawResult[]
  if (allBibliaSources.length > 0) {
    console.log(`[search] Bible sources: must-include=${mustIncludeResult.length}, vector=${bibliaVectorResults.length}, keyword=${bibliaKeywordResults.length}`)
    bibliaResults = deduplicateResults(allBibliaSources).slice(0, 10)
  } else {
    console.warn('[search] No Bible results from any source')
    bibliaResults = []
  }

  // Group related verses
  bibliaResults = groupRelatedVerses(bibliaResults)

  const catecismoResults: RawResult[] = catecismoRaw.data ?? []
  const magisterioResults: RawResult[] = magisterioRaw.data ?? []
  const patristicaResults: RawResult[] = patristicaRaw.data ?? []

  const allMagisterioResults = [...catecismoResults, ...magisterioResults]
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5)

  // 5. Build prompt with disambiguation context
  const prompt = buildRAGPrompt(
    query,
    bibliaResults.map(r => ({ reference: r.reference, text: r.text_pt ?? r.text ?? '' })),
    allMagisterioResults.map(r => ({ reference: r.reference, text: r.text ?? '' })),
    patristicaResults.map(r => ({ reference: r.reference, text: r.text ?? '' })),
    disambiguation.promptNotes
  )

  const totalResults = bibliaResults.length + allMagisterioResults.length + patristicaResults.length
  console.log(`[search] Total results: ${totalResults} (biblia: ${bibliaResults.length}, magistério: ${allMagisterioResults.length}, patrística: ${patristicaResults.length})`)

  let insight: AIInsight | null = null
  // Only call OpenAI when we have source material to synthesize
  if (totalResults > 0) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.3,
      })

      const rawResponse = completion.choices[0].message.content ?? ''
      insight = parseAIResponse(rawResponse)
    } catch (err) {
      console.error('[search] OpenAI error:', err instanceof Error ? err.message : err)
      insight = null
    }
  }

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
