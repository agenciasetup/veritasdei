import { generateEmbedding } from '../openai/embeddings'
import { openai } from '../openai/client'
import { buildRAGPrompt } from './prompt'
import { disambiguateQuery } from './disambiguation'
import { understandQuery, searchKnowledgeBase, extractBibleRefsFromKnowledge } from './query-understanding'
import { isSensitiveTopic } from '../utils/sensitive-topics'
import { sanitizePostgrestFilter } from '../utils/sanitize'
import type { QueryResponse, SearchResult, AIInsight, ProtestantView, ObjectionBlock, MoralTag, HeresyTag, EtymologyHit } from '@/types'
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
  context?: string
  [key: string]: unknown
}

function parseObjections(raw: unknown): ObjectionBlock[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item): ObjectionBlock | null => {
      if (!item || typeof item !== 'object') return null
      const obj = item as Record<string, unknown>
      if (typeof obj.claim !== 'string' || typeof obj.refutation !== 'string') return null
      const claim = obj.claim.trim()
      const refutation = obj.refutation.trim()
      if (claim.length === 0 || refutation.length === 0) return null
      return { claim, refutation }
    })
    .filter((b): b is ObjectionBlock => b !== null)
}

function parseProtestantView(raw: unknown): ProtestantView | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  if (typeof obj.summary !== 'string') return null

  const objections = parseObjections(obj.objections)
  // Refutation is optional if we have structured objections; fall back to
  // joining the objection refutations so legacy UIs keep working.
  const explicitRefutation = typeof obj.refutation === 'string' ? obj.refutation : ''
  const refutation = explicitRefutation.length > 0
    ? explicitRefutation
    : objections.map(o => `**${o.claim}**\n\n${o.refutation}`).join('\n\n')

  if (refutation.length === 0 && objections.length === 0) return null

  return {
    summary: obj.summary,
    denominations: Array.isArray(obj.denominations)
      ? obj.denominations.filter((d): d is string => typeof d === 'string')
      : [],
    objections,
    refutation,
  }
}

const VALID_MORAL_TAGS: ReadonlySet<MoralTag> = new Set(['sin', 'moderate', 'not_sin', 'not_applicable'])
const VALID_HERESY_TAGS: ReadonlySet<HeresyTag> = new Set(['heresy', 'orthodox', 'not_applicable'])

function parseMoralTag(raw: unknown): MoralTag {
  if (typeof raw === 'string' && VALID_MORAL_TAGS.has(raw as MoralTag)) {
    return raw as MoralTag
  }
  return 'not_applicable'
}

function parseHeresyTag(raw: unknown): HeresyTag {
  if (typeof raw === 'string' && VALID_HERESY_TAGS.has(raw as HeresyTag)) {
    return raw as HeresyTag
  }
  return 'not_applicable'
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
      isControversial: parsed.isControversial === true,
      protestantView: parseProtestantView(parsed.protestantView),
      curiosity: typeof parsed.curiosity === 'string' ? parsed.curiosity : null,
      moralTag: parseMoralTag(parsed.moralTag),
      heresyTag: parseHeresyTag(parsed.heresyTag),
      heresyName: typeof parsed.heresyName === 'string' && parsed.heresyName.trim().length > 0
        ? parsed.heresyName.trim()
        : null,
    }
  } catch {
    if (raw.length > 50) {
      return {
        summary: raw,
        keyPoints: [],
        relatedTopics: [],
        sourceContext: {},
        isControversial: false,
        protestantView: null,
        curiosity: null,
        moralTag: 'not_applicable',
        heresyTag: 'not_applicable',
        heresyName: null,
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
  const orConditions = keywords.map(k => `text_pt.ilike.%${sanitizePostgrestFilter(k)}%`).join(',')

  // Prioritize preferred books if specified.
  // NOTE: the `biblia` table stores Gospels with the "São " prefix
  // ("São Mateus", "São João", …) so a plain .in() against
  // ["Mateus","João",…] silently matches nothing. We use .or() with
  // ILIKE patterns to match tolerantly.
  if (preferredBooks.length > 0) {
    const bookOr = preferredBooks
      .map(b => `book.ilike.%${sanitizePostgrestFilter(b)}%`)
      .join(',')

    let preferredQuery = supabase
      .from('biblia')
      .select('id, reference, text_pt, book, chapter, verse, testament')
      .or(orConditions)
      .or(bookOr)

    if (testamentFilter) {
      preferredQuery = preferredQuery.eq('testament', testamentFilter)
    }

    const { data: preferred, error: prefError } = await preferredQuery.limit(limit)

    if (!prefError && preferred && preferred.length >= 3) {
      console.log(`[search] Keyword (preferred books) returned ${preferred.length} results`)
      return (preferred as RawResult[]).map((r, i) => ({
        ...r,
        similarity: 0.6 - i * 0.02,
      }))
    }
  }

  // General keyword search (respects testament filter if present)
  let generalQuery = supabase
    .from('biblia')
    .select('id, reference, text_pt, book, chapter, verse, testament')
    .or(orConditions)

  if (testamentFilter) {
    generalQuery = generalQuery.eq('testament', testamentFilter)
  }

  const { data, error } = await generalQuery.limit(limit)

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

/**
 * Normalize a book name for tolerant matching. The `biblia` table stores
 * Gospels as "São Mateus" / "São Lucas" / "São João" / "São Marcos", but
 * disambiguation.ts declares preferred books as "Mateus" / "Lucas" / "João"
 * / "Marcos". Strip "São "/"Santo " prefixes, diacritics, lowercase, trim.
 */
function normalizeBookName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^(sao|santo|santa)\s+/, '')
    .trim()
}

/**
 * Rerank Bible results with a simple topical boost:
 * - +0.20 if the verse is a must-include ref from the knowledge base
 *   (already at 0.95 similarity, this just pushes it above anything else)
 * - +0.12 if the verse book is in the preferred books for the theme
 *   (e.g., Eucaristia → Jo, 1Cor, Mt, Lc). Normalized to handle "São X".
 * - no penalty for others; the sort stays stable by similarity
 */
function rerankBibliaResults(
  results: RawResult[],
  preferredBooks: string[],
  mustIncludeRefs: string[],
): RawResult[] {
  if (results.length === 0) return results

  const preferredSet = new Set(preferredBooks.map(normalizeBookName))
  const mustIncludeSet = new Set(mustIncludeRefs)

  const boosted = results.map(r => {
    let sim = r.similarity
    if (mustIncludeSet.has(r.reference)) sim += 0.2
    if (preferredSet.size > 0 && r.book && preferredSet.has(normalizeBookName(r.book))) {
      sim += 0.12
    }
    return { ...r, similarity: Math.min(1, sim) }
  })

  return boosted.sort((a, b) => b.similarity - a.similarity)
}

/**
 * Filter out Bible results whose similarity is too low to be relevant.
 * This is the LAST line of defense against "nonsense verses" — anything
 * below the hard floor is dropped even if there are no better options.
 */
function filterLowConfidenceBible(
  results: RawResult[],
  mustIncludeRefs: string[],
  hardFloor: number,
): RawResult[] {
  if (results.length === 0) return results
  const mustIncludeSet = new Set(mustIncludeRefs)
  return results.filter(r => mustIncludeSet.has(r.reference) || r.similarity >= hardFloor)
}

/**
 * Normalize a reference for fuzzy matching: lowercase, strip §,
 * collapse whitespace, remove common punctuation. Lets us match
 * "[CIC 2270]" (LLM output) against "CIC § 2270" (pool ref).
 */
function normalizeRef(ref: string): string {
  return ref
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[§.,;:()[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Curator filter: keep only results that the LLM actually cited in its
 * sourceContext map (plus must-include refs). Reference matching is
 * NORMALIZED — "[CIC 2270]" in the LLM output will match "CIC § 2270"
 * in the pool.
 *
 * Per-pillar fallback: if the LLM cited ZERO refs from this pillar
 * but the retriever found rows, we still surface the top N of the
 * original pool. This prevents the "Nenhuma fonte" empty state when
 * the LLM simply forgot to curate a pillar.
 */
function filterByCurator<T extends { reference: string }>(
  results: T[],
  sourceContext: Record<string, string> | undefined,
  mustIncludeRefs: string[] = [],
  fallbackFloor: number = 3,
): T[] {
  if (!sourceContext || Object.keys(sourceContext).length === 0) {
    return results
  }

  // Build a normalized lookup from the LLM's curator map.
  const normalizedKeys = new Set<string>()
  for (const k of Object.keys(sourceContext)) normalizedKeys.add(normalizeRef(k))
  for (const r of mustIncludeRefs) normalizedKeys.add(normalizeRef(r))

  // First pass: strict match.
  const strict = results.filter(r => normalizedKeys.has(normalizeRef(r.reference)))
  if (strict.length > 0) return strict

  // Second pass: substring match (e.g. "CIC 2270" substring of "CIC 2270 2271").
  const loose = results.filter(r => {
    const ref = normalizeRef(r.reference)
    for (const key of normalizedKeys) {
      if (key.includes(ref) || ref.includes(key)) return true
    }
    return false
  })
  if (loose.length > 0) return loose

  // Final fallback: the LLM never mentioned any ref from this pillar.
  // Return the top N by similarity so the UI isn't empty.
  return results.slice(0, fallbackFloor)
}

/**
 * Strip diacritics + lowercase for substring matching.
 */
function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Keep only etymologies whose term_pt actually appears in the user's
 * query OR in the LLM's keyPoints array. We intentionally DON'T match
 * against the full summary because the summary is long prose that often
 * mentions reference words like "Catecismo" or "Igreja" incidentally —
 * that caused false positives where "Catecismo" etymology leaked into
 * an "aborto" query.
 *
 * Query + keyPoints is the tight signal: the user asked about X, or the
 * LLM flagged X as a core concept of the answer.
 */
function filterEtymologyByRelevance(
  etymologies: EtymologyHit[],
  query: string,
  keyPoints: string[],
): EtymologyHit[] {
  if (etymologies.length === 0) return etymologies
  const haystack = normalizeText(`${query} ${keyPoints.join(' ')}`)
  return etymologies.filter(e => {
    const term = normalizeText(e.term_pt)
    if (term.length < 3) return false
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Match whole-word (bounded by non-letter) to avoid "igreja"
    // matching inside another word.
    const bounded = new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`)
    return bounded.test(haystack)
  })
}

/**
 * Parse a Bible reference like "Jo 4,23" or "1 Cor 13,4" into its
 * components. Returns null for range refs ("Jo 4,23-24") or malformed
 * strings — those stay standalone and never get merged.
 */
function parseBibleRef(ref: string): { book: string; chapter: number; verse: number } | null {
  // Accept: "Jo 4,23", "1 Jo 4,23", "1Jo 4,23", "Gn 1,1". Reject ranges.
  const match = ref.match(/^(\d?\s*[A-Za-zÀ-ÿ]+)\s+(\d+),(\d+)$/)
  if (!match) return null
  const book = match[1].replace(/\s+/g, '').toLowerCase()
  const chapter = parseInt(match[2], 10)
  const verse = parseInt(match[3], 10)
  if (Number.isNaN(chapter) || Number.isNaN(verse)) return null
  return { book, chapter, verse }
}

/**
 * Group consecutive Bible verses into a single entry when they form a run
 * AND none of them has a per-verse curator rationale. Example:
 *   Input:  [Jo 2,1] [Jo 2,2] [Jo 2,3] [Jo 2,4] [Jo 2,5]
 *   Output: [Jo 2,1-5] with concatenated text
 *
 * We parse the REFERENCE STRING (not RawResult.book/chapter/verse) because
 * the search_biblia RPC doesn't return structural fields — only reference
 * + text_pt. Parsing the ref is the only reliable path to detect runs.
 *
 * Rules:
 *   - Only group within the same book + chapter.
 *   - Don't merge must-include verses (preserve their per-verse context).
 *   - Don't merge verses that carry distinct curator commentary.
 */
function groupConsecutiveVerses(
  results: RawResult[],
  mustIncludeRefs: string[] = [],
): RawResult[] {
  if (results.length <= 1) return results

  const mustInclude = new Set(mustIncludeRefs)

  // Attach parsed ref to each item once; fall back to original-only sort
  // for items whose reference can't be parsed (they stay standalone).
  type Parsed = { item: RawResult; parsed: { book: string; chapter: number; verse: number } | null }
  const parsed: Parsed[] = results.map(r => ({ item: r, parsed: parseBibleRef(r.reference) }))

  // Unparseable items go through as-is.
  const unparseable = parsed.filter(p => p.parsed === null).map(p => p.item)
  const parseable = parsed.filter(p => p.parsed !== null) as Array<{
    item: RawResult
    parsed: { book: string; chapter: number; verse: number }
  }>

  // Sort parseable by book, chapter, verse so runs are adjacent.
  parseable.sort((a, b) => {
    if (a.parsed.book !== b.parsed.book) return a.parsed.book.localeCompare(b.parsed.book)
    if (a.parsed.chapter !== b.parsed.chapter) return a.parsed.chapter - b.parsed.chapter
    return a.parsed.verse - b.parsed.verse
  })

  const grouped: RawResult[] = []
  let run: Parsed[] = []

  const flushRun = () => {
    if (run.length === 0) return
    if (run.length === 1) {
      grouped.push(run[0].item)
      run = []
      return
    }
    const first = run[0]
    const last = run[run.length - 1]
    // Build a range ref like "Jo 4,23-24" by replacing the trailing verse.
    const rangeRef = first.item.reference.replace(
      /,(\d+)$/,
      `,$1-${last.parsed?.verse ?? ''}`,
    )

    // Concatenate text, prefixed with the verse number so the reader can
    // still see the boundaries.
    const mergedText = run
      .map(p => {
        const v = p.parsed?.verse
        const body = (p.item.text_pt ?? p.item.text ?? '').trim()
        return v ? `${v}. ${body}` : body
      })
      .join(' ')

    grouped.push({
      ...first.item,
      reference: rangeRef,
      text_pt: mergedText,
      text: mergedText,
      similarity: Math.max(...run.map(p => p.item.similarity)),
    })
    run = []
  }

  const canExtendRun = (prev: Parsed, next: Parsed): boolean => {
    if (!prev.parsed || !next.parsed) return false
    if (prev.parsed.book !== next.parsed.book) return false
    if (prev.parsed.chapter !== next.parsed.chapter) return false
    if (prev.parsed.verse + 1 !== next.parsed.verse) return false
    if (mustInclude.has(prev.item.reference) || mustInclude.has(next.item.reference)) return false
    // Don't merge if either verse carries its own curator commentary.
    if (prev.item.context && prev.item.context !== next.item.context) return false
    if (next.item.context && prev.item.context !== next.item.context) return false
    return true
  }

  for (const p of parseable) {
    if (run.length === 0) {
      run.push(p)
      continue
    }
    const prev = run[run.length - 1]
    if (canExtendRun(prev, p)) {
      run.push(p)
    } else {
      flushRun()
      run.push(p)
    }
  }
  flushRun()

  // Re-add unparseable items and sort everything by similarity desc so
  // the UI shows the strongest hit first.
  return [...grouped, ...unparseable].sort((a, b) => b.similarity - a.similarity)
}

/**
 * Extract 2–5 meaningful keywords from a query for FTS fallbacks on
 * magisterio/patristica/etymo_terms. Strips short words + stopwords
 * similar to searchBibliaKeyword.
 */
function extractKeywordsForFTS(query: string): string {
  const stopWords = new Set([
    'que', 'como', 'para', 'por', 'com', 'uma', 'dos', 'das',
    'nos', 'nas', 'seu', 'sua', 'são', 'foi', 'era', 'tem', 'ter',
    'ser', 'está', 'isso', 'este', 'esta', 'esse', 'essa', 'qual',
    'quem', 'onde', 'quando', 'sobre', 'entre', 'depois', 'antes',
    'mais', 'muito', 'toda', 'todo', 'cada', 'outro', 'outra',
    'mesmo', 'ainda', 'também', 'porque', 'pelo', 'pela',
    'dele', 'dela', 'deles', 'delas', 'aqui', 'ali',
  ])
  return query
    .toLowerCase()
    .replace(/[^\w\sáàâãéèêíìîóòôõúùûçñ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !stopWords.has(w))
    .slice(0, 5)
    .join(' ')
}

/**
 * FTS fallback for magisterio — called when vector search returns 0 rows
 * (e.g. because embeddings haven't been backfilled yet for those 40 rows).
 */
async function searchMagisterioFTS(
  supabase: AnySupabaseClient,
  query: string,
  limit: number = 4,
): Promise<RawResult[]> {
  const kw = extractKeywordsForFTS(query)
  if (!kw) return []
  try {
    const { data, error } = await supabase.rpc('search_magisterio_text', {
      search_query: kw,
      match_count: limit,
    } as Record<string, unknown>)
    if (error) {
      console.warn('[search] search_magisterio_text error:', error.message)
      return []
    }
    const rows = (data ?? []) as RawResult[]
    console.log(`[search] Magisterio FTS returned ${rows.length} results`)
    return rows.map(r => ({
      ...r,
      similarity: Math.min(0.7, 0.5 + (r.rank ?? 0) * 0.1),
    }))
  } catch (err) {
    console.warn('[search] search_magisterio_text exception:', err instanceof Error ? err.message : err)
    return []
  }
}

/**
 * FTS fallback for patristica — called when vector search returns 0 rows.
 */
async function searchPatristicaFTS(
  supabase: AnySupabaseClient,
  query: string,
  limit: number = 4,
): Promise<RawResult[]> {
  const kw = extractKeywordsForFTS(query)
  if (!kw) return []
  try {
    const { data, error } = await supabase.rpc('search_patristica_text', {
      search_query: kw,
      match_count: limit,
    } as Record<string, unknown>)
    if (error) {
      console.warn('[search] search_patristica_text error:', error.message)
      return []
    }
    const rows = (data ?? []) as RawResult[]
    console.log(`[search] Patristica FTS returned ${rows.length} results`)
    return rows.map(r => ({
      ...r,
      similarity: Math.min(0.7, 0.5 + (r.rank ?? 0) * 0.1),
    }))
  } catch (err) {
    console.warn('[search] search_patristica_text exception:', err instanceof Error ? err.message : err)
    return []
  }
}

interface EtymoRow {
  id: string
  term_pt: string
  term_original: string
  original_language: string | null
  transliteration: string | null
  original_meaning: string | null
  modern_difference: string | null
  examples?: string[] | null
  similarity?: number
  rank?: number
}

/**
 * Search etymo_terms for relevant Greek/Latin/Hebrew theological terms.
 * Tries vector first (if we have an embedding and any rows are embedded),
 * then falls back to the FTS RPC which works even with zero embeddings.
 */
async function searchEtymoTerms(
  supabase: AnySupabaseClient,
  queryEmbedding: number[] | null,
  query: string,
  limit: number = 3,
): Promise<EtymologyHit[]> {
  // 1) Try vector search if we have an embedding
  if (queryEmbedding && queryEmbedding.length > 0) {
    try {
      const { data, error } = await supabase.rpc('search_etymo_terms', {
        query_embedding: queryEmbedding,
        match_threshold: 0.42,
        match_count: limit,
      } as Record<string, unknown>)

      if (!error && Array.isArray(data) && data.length > 0) {
        const rows = data as EtymoRow[]
        console.log(`[search] Etymo vector returned ${rows.length} results`)
        return rows.map(r => ({
          id: r.id,
          term_pt: r.term_pt,
          term_original: r.term_original,
          original_language: r.original_language,
          transliteration: r.transliteration,
          original_meaning: r.original_meaning,
          modern_difference: r.modern_difference,
          examples: Array.isArray(r.examples) ? r.examples : [],
          similarity: r.similarity ?? 0.5,
        }))
      }
      if (error) {
        console.warn('[search] search_etymo_terms error:', error.message)
      }
    } catch (err) {
      console.warn('[search] search_etymo_terms exception:', err instanceof Error ? err.message : err)
    }
  }

  // 2) FTS fallback
  const kw = extractKeywordsForFTS(query)
  if (!kw) return []
  try {
    const { data, error } = await supabase.rpc('search_etymo_terms_text', {
      search_query: kw,
      match_count: limit,
    } as Record<string, unknown>)
    if (error) {
      console.warn('[search] search_etymo_terms_text error:', error.message)
      return []
    }
    const rows = (data ?? []) as EtymoRow[]
    console.log(`[search] Etymo FTS returned ${rows.length} results`)
    return rows.map(r => ({
      id: r.id,
      term_pt: r.term_pt,
      term_original: r.term_original,
      original_language: r.original_language,
      transliteration: r.transliteration,
      original_meaning: r.original_meaning,
      modern_difference: r.modern_difference,
      examples: Array.isArray(r.examples) ? r.examples : [],
      similarity: Math.min(0.7, 0.5 + (r.rank ?? 0) * 0.1),
    }))
  } catch (err) {
    console.warn('[search] search_etymo_terms_text exception:', err instanceof Error ? err.message : err)
    return []
  }
}

export async function searchCorpus(query: string): Promise<QueryResponse> {
  const supabase = getSupabaseAdmin()

  console.log('[search] Query:', query)

  // ============================================================
  // PHASE 1: Understand the question (AI + Knowledge Base)
  // Run AI understanding and keyword disambiguation in parallel.
  // AI understanding is the PRIMARY source of truth for the topic;
  // keyword disambiguation is the FALLBACK.
  // ============================================================
  const [aiUnderstanding, disambiguation] = await Promise.all([
    understandQuery(query),
    Promise.resolve(disambiguateQuery(query)),
  ])

  // Determine the search query: AI understanding takes priority
  let searchQuery: string
  let promptNotes: string[] = []
  let mustIncludeRefs: string[] = []
  let preferredBooks: string[] = []
  let testamentFilter: string | null = null
  let knowledgeContext: string | null = null
  let objectionContext: string | null = null

  if (aiUnderstanding) {
    // AI understood the question — use its refined search query
    searchQuery = aiUnderstanding.searchQuery
    objectionContext = aiUnderstanding.objectionContext

    console.log('[search] AI Understanding:', {
      primaryTopic: aiUnderstanding.primaryTopic,
      searchQuery: searchQuery.substring(0, 100),
      isObjection: aiUnderstanding.isObjection,
      objection: aiUnderstanding.objectionContext?.substring(0, 80),
      keywords: aiUnderstanding.knowledgeKeywords,
    })

    // Search the curated knowledge base for the identified topic.
    // Pass the raw user query so the KB lookup can also match specific
    // terms (e.g. "utraquismo") that the LLM may have generalized away.
    const knowledgeMatches = await searchKnowledgeBase(
      supabase,
      aiUnderstanding.knowledgeKeywords,
      aiUnderstanding.primaryTopic,
      query,
    )

    if (knowledgeMatches.length > 0) {
      // Extract curated Bible references from knowledge base
      const knowledgeRefs = extractBibleRefsFromKnowledge(knowledgeMatches)
      mustIncludeRefs.push(...knowledgeRefs)

      // Use the core teaching as context for the RAG prompt
      knowledgeContext = knowledgeMatches
        .map(m => `[${m.topic}] ${m.core_teaching}`)
        .join('\n\n')

      console.log(`[search] Knowledge base: ${knowledgeMatches.length} matches, ${knowledgeRefs.length} curated refs`)
    }

    // Still merge disambiguation data as supplementary context
    if (disambiguation.wasDisambiguated) {
      promptNotes.push(...disambiguation.promptNotes)
      preferredBooks.push(...disambiguation.preferredBooks)
      if (disambiguation.testamentFilter) {
        testamentFilter = disambiguation.testamentFilter
      }
      // Only add disambiguation must-include refs if they don't conflict
      // with the AI-identified topic
      if (knowledgeMatches.length === 0) {
        mustIncludeRefs.push(...disambiguation.mustIncludeRefs)
      }
    }
  } else {
    // AI understanding failed — fall back to keyword disambiguation
    console.warn('[search] AI understanding failed, using keyword disambiguation fallback')
    searchQuery = disambiguation.wasDisambiguated
      ? disambiguation.enrichedQuery
      : query
    promptNotes = disambiguation.promptNotes
    mustIncludeRefs = disambiguation.mustIncludeRefs
    preferredBooks = disambiguation.preferredBooks
    testamentFilter = disambiguation.testamentFilter

    if (disambiguation.wasDisambiguated) {
      console.log('[search] Disambiguated (fallback):', {
        enrichedQuery: searchQuery.substring(0, 100),
        notes: disambiguation.promptNotes.length,
        books: disambiguation.preferredBooks,
        testament: disambiguation.testamentFilter,
      })
    }
  }

  // Deduplicate must-include refs
  mustIncludeRefs = [...new Set(mustIncludeRefs)]

  // ============================================================
  // PHASE 2: Generate embedding from the REFINED query
  // We build the embedding text from TOPIC + SEARCH QUERY so that
  // the primary topic (e.g., "Eucaristia") anchors the vector even
  // if the user's phrasing is unusual. This also pulls the vector
  // away from surface-level keywords from the objection.
  // ============================================================
  const embeddingText = aiUnderstanding && aiUnderstanding.primaryTopic
    ? `${aiUnderstanding.primaryTopic}. ${searchQuery}`
    : searchQuery

  let queryEmbedding: number[]
  try {
    queryEmbedding = await generateEmbedding(embeddingText)
  } catch (err) {
    console.error('[search] Embedding generation failed:', err)
    queryEmbedding = []
  }

  // ============================================================
  // PHASE 3: Execute all searches in parallel
  // ============================================================
  const hasEmbedding = queryEmbedding.length > 0
  const hasMustInclude = mustIncludeRefs.length > 0

  // Threshold tuning: 0.42 was too permissive and caused "nonsense verses".
  // 0.48 is the sweet spot for text-embedding-3-small (empirically tuned on
  // Catholic theological queries); below this, verses are usually topical noise.
  const BIBLIA_VECTOR_THRESHOLD = 0.48
  const MAGISTERIO_VECTOR_THRESHOLD = 0.48
  // Hard floor applied AFTER reranking for Bible (must-include refs bypass this)
  const BIBLIA_HARD_FLOOR = 0.46

  // Cheap early detection of sensitive topic — the prompt uses this to steer
  // the LLM toward pastoral framing BEFORE we build the prompt. (Also
  // propagated to the response for the UI banner.)
  const sensitive = isSensitiveTopic(query)

  const [
    bibliaVectorResult,
    catecismoRaw,
    magisterioRaw,
    patristicaRaw,
    bibliaKeywordResult,
    mustIncludeResult,
    magisterioFTSResult,
    patristicaFTSResult,
    etymologyResult,
  ] = await Promise.all([
      // Vector search for Bible (using refined embedding).
      // Pool is 12 so the curator has plenty to choose from; it'll
      // filter down to the 3–6 that actually fortify the thesis.
      hasEmbedding
        ? searchBibliaVector(supabase, queryEmbedding, 12, BIBLIA_VECTOR_THRESHOLD)
        : Promise.resolve({ data: [] as RawResult[], error: 'No embedding' }),

      // Catecismo vector search — pool of 8
      hasEmbedding
        ? supabase.rpc('search_catecismo', {
            query_embedding: queryEmbedding,
            match_threshold: MAGISTERIO_VECTOR_THRESHOLD,
            match_count: 8,
          } as Record<string, unknown>)
        : Promise.resolve({ data: [], error: null }),

      // Magisterio vector search — pool of 5
      hasEmbedding
        ? supabase.rpc('search_magisterio', {
            query_embedding: queryEmbedding,
            match_threshold: MAGISTERIO_VECTOR_THRESHOLD,
            match_count: 5,
          } as Record<string, unknown>)
        : Promise.resolve({ data: [], error: null }),

      // Patristica vector search — pool of 6
      hasEmbedding
        ? supabase.rpc('search_patristica', {
            query_embedding: queryEmbedding,
            match_threshold: MAGISTERIO_VECTOR_THRESHOLD,
            match_count: 6,
          } as Record<string, unknown>)
        : Promise.resolve({ data: [], error: null }),

      // Keyword fallback for Bible (uses original query for keyword extraction)
      searchBibliaKeyword(
        supabase,
        aiUnderstanding ? aiUnderstanding.searchQuery : query,
        preferredBooks,
        testamentFilter,
        8
      ),

      // Must-include references from knowledge base + disambiguation
      hasMustInclude
        ? fetchMustIncludeVerses(supabase, mustIncludeRefs)
        : Promise.resolve([] as RawResult[]),

      // Magisterio FTS fallback (runs unconditionally — merged with vector
      // results below; essential until all 40 magisterio rows are embedded).
      searchMagisterioFTS(supabase, searchQuery, 4),

      // Patristica FTS fallback (48 of 58 patristica rows lack embeddings).
      searchPatristicaFTS(supabase, searchQuery, 4),

      // Etymo_terms — vector if available, FTS fallback otherwise.
      searchEtymoTerms(
        supabase,
        hasEmbedding ? queryEmbedding : null,
        searchQuery,
        3,
      ),
    ])

  // Log errors
  if (catecismoRaw.error) console.error('[search] catecismo error:', catecismoRaw.error)
  if (magisterioRaw.error) console.error('[search] magisterio error:', magisterioRaw.error)
  if (patristicaRaw.error) console.error('[search] patristica error:', patristicaRaw.error)

  // ============================================================
  // PHASE 4: Combine & deduplicate results
  // Must-include from knowledge base gets top priority.
  // ============================================================
  const bibliaVectorResults = bibliaVectorResult.data
  const bibliaKeywordResults = bibliaKeywordResult

  const allBibliaSources = [
    ...mustIncludeResult,      // Priority 1: curated essential verses
    ...bibliaVectorResults,    // Priority 2: semantically similar (from refined query)
    ...bibliaKeywordResults,   // Priority 3: keyword matches
  ]

  let bibliaResults: RawResult[]
  if (allBibliaSources.length > 0) {
    console.log(`[search] Bible sources: must-include=${mustIncludeResult.length}, vector=${bibliaVectorResults.length}, keyword=${bibliaKeywordResults.length}`)
    const deduped = deduplicateResults(allBibliaSources)
    // Rerank with preferred-books boost + must-include boost
    const reranked = rerankBibliaResults(deduped, preferredBooks, mustIncludeRefs)
    // Drop anything below the hard floor (except must-include refs)
    const filtered = filterLowConfidenceBible(reranked, mustIncludeRefs, BIBLIA_HARD_FLOOR)
    // Expand pool to 14 so the curator has room to pick the best 3–6
    bibliaResults = filtered.slice(0, 14)
    console.log(`[search] Bible after rerank+filter: ${bibliaResults.length} verses (dropped ${deduped.length - bibliaResults.length})`)
  } else {
    console.warn('[search] No Bible results from any source')
    bibliaResults = []
  }

  bibliaResults = groupRelatedVerses(bibliaResults)

  const catecismoResults: RawResult[] = catecismoRaw.data ?? []
  const magisterioVector: RawResult[] = magisterioRaw.data ?? []
  const patristicaVector: RawResult[] = patristicaRaw.data ?? []

  // Merge vector + FTS for magisterio/patristica so the LLM gets SOMETHING
  // even when embeddings haven't been backfilled yet. Dedupe by reference.
  const magisterioResults = deduplicateResults([...magisterioVector, ...magisterioFTSResult])
  const patristicaResults = deduplicateResults([...patristicaVector, ...patristicaFTSResult])

  console.log(`[search] Magisterio: vector=${magisterioVector.length} + fts=${magisterioFTSResult.length} → ${magisterioResults.length}`)
  console.log(`[search] Patristica: vector=${patristicaVector.length} + fts=${patristicaFTSResult.length} → ${patristicaResults.length}`)
  console.log(`[search] Etymo: ${etymologyResult.length} hits`)

  const allMagisterioResults = [...catecismoResults, ...magisterioResults]
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 12)

  // ============================================================
  // PHASE 5: Build RAG prompt with full context
  // Includes: knowledge base context, objection info, disambiguation
  // ============================================================
  const prompt = buildRAGPrompt(
    query,
    bibliaResults.map(r => ({ reference: r.reference, text: r.text_pt ?? r.text ?? '' })),
    allMagisterioResults.map(r => ({ reference: r.reference, text: r.text ?? '' })),
    patristicaResults.map(r => ({ reference: r.reference, text: r.text ?? '' })),
    promptNotes,
    knowledgeContext,
    objectionContext,
    etymologyResult.map(e => ({
      term_pt: e.term_pt,
      term_original: e.term_original,
      original_language: e.original_language,
      transliteration: e.transliteration,
      original_meaning: e.original_meaning,
      modern_difference: e.modern_difference,
    })),
    sensitive,
  )

  const totalResults = bibliaResults.length + allMagisterioResults.length + patristicaResults.length
  console.log(`[search] Total results: ${totalResults} (biblia: ${bibliaResults.length}, magistério: ${allMagisterioResults.length}, patrística: ${patristicaResults.length})`)

  let insight: AIInsight | null = null
  if (totalResults === 0) {
    // No results from any source — return honest "I don't know" instead of hallucinating
    insight = {
      summary: 'Não encontrei informações suficientes na base de dados sobre este tema específico. Para garantir a fidelidade à doutrina católica, recomendo consultar o **Catecismo da Igreja Católica** (CIC), o **Compêndio do CIC**, ou um **sacerdote** para orientação.\n\nNossa base de conhecimento está em constante crescimento, e em breve poderemos ter mais conteúdo sobre este assunto.',
      keyPoints: ['Base de dados sem resultados suficientes para este tema'],
      relatedTopics: [],
      sourceContext: {},
      isControversial: false,
      protestantView: null,
      curiosity: null,
      confidenceLevel: 'low',
      moralTag: 'not_applicable',
      heresyTag: 'not_applicable',
      heresyName: null,
    }
  } else if (totalResults > 0) {
    try {
      // Main response model: gpt-4o (not gpt-4o-mini) for better theological
      // reasoning and stricter adherence to the structured output schema.
      // JSON mode guarantees the parser won't choke on prose/markdown.
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      })

      const rawResponse = completion.choices[0].message.content ?? ''
      insight = parseAIResponse(rawResponse)

      // Calculate confidence level based on source coverage
      if (insight) {
        const pillarsWithResults = [
          bibliaResults.length > 0,
          allMagisterioResults.length > 0,
          patristicaResults.length > 0,
        ].filter(Boolean).length

        if (pillarsWithResults >= 3 && totalResults >= 8) {
          insight.confidenceLevel = 'high'
        } else if (pillarsWithResults >= 2 && totalResults >= 4) {
          insight.confidenceLevel = 'medium'
        } else {
          insight.confidenceLevel = 'low'
        }
      }
    } catch (err) {
      console.error('[search] OpenAI error:', err instanceof Error ? err.message : err)
      insight = null
    }
  }

  // ============================================================
  // PHASE 6: Curator filter + verse grouping
  // The LLM committed to which references it actually used via
  // sourceContext. Drop every pillar row that wasn't picked (except
  // must-include). Then attach the curator's rationale as `context`
  // so the UI can render each source with its explanation.
  //
  // Finally, collapse consecutive Bible verses into ranges
  // ("Jo 2,1-5") unless a verse carries per-verse commentary.
  // ============================================================
  const sourceContext = insight?.sourceContext
  const curatedBiblia = filterByCurator(bibliaResults, sourceContext, mustIncludeRefs)
  const curatedMagisterio = filterByCurator(allMagisterioResults, sourceContext)
  const curatedPatristica = filterByCurator(patristicaResults, sourceContext)

  // Build a normalized → rationale map so we can look up the LLM's
  // per-source explanation even when the ref strings don't match byte-exact
  // (e.g. LLM wrote "CIC 2270" but pool has "CIC § 2270").
  const normalizedContext = new Map<string, string>()
  if (sourceContext) {
    for (const [k, v] of Object.entries(sourceContext)) {
      if (typeof v === 'string' && v.trim().length > 0) {
        normalizedContext.set(normalizeRef(k), v)
      }
    }
  }
  const lookupContext = (ref: string): string | undefined => {
    const n = normalizeRef(ref)
    if (normalizedContext.has(n)) return normalizedContext.get(n)
    // Substring fallback: "cic 2270" matches "cic 2270 2271".
    for (const [key, val] of normalizedContext) {
      if (key.includes(n) || n.includes(key)) return val
    }
    return undefined
  }

  // Attach curator rationale as context BEFORE grouping (the grouper
  // uses context to decide whether to keep a verse standalone).
  const withContext = (rows: RawResult[]): RawResult[] =>
    rows.map(r => ({ ...r, context: lookupContext(r.reference) }))

  const bibliaWithContext = withContext(curatedBiblia)
  const groupedBiblia = groupConsecutiveVerses(bibliaWithContext, mustIncludeRefs)

  console.log(`[search] Curator: biblia ${bibliaResults.length}→${curatedBiblia.length}→${groupedBiblia.length} (grouped), magisterio ${allMagisterioResults.length}→${curatedMagisterio.length}, patristica ${patristicaResults.length}→${curatedPatristica.length}`)

  // Etymology relevance filter: only surface terms whose term_pt appears
  // in the query or the LLM's keyPoints. Stops "Catecismo" from leaking
  // into a query about "aborto".
  const relevantEtymology = filterEtymologyByRelevance(
    etymologyResult,
    query,
    insight?.keyPoints ?? [],
  )

  const toSearchResult = (item: RawResult, pillar: SearchResult['pillar']): SearchResult => ({
    id: item.id,
    pillar,
    reference: item.reference,
    text: item.text_pt ?? item.text ?? '',
    context: item.context ?? lookupContext(item.reference),
    similarity: item.similarity,
  })

  // Build top-level tags from the insight classifications so the UI can
  // render them without re-reading the whole insight object.
  const topLevelTags: string[] = []
  if (insight?.moralTag && insight.moralTag !== 'not_applicable') {
    topLevelTags.push(`moral:${insight.moralTag}`)
  }
  if (insight?.heresyTag && insight.heresyTag !== 'not_applicable') {
    topLevelTags.push(`heresy:${insight.heresyTag}`)
  }

  return {
    query,
    pillars: [
      {
        pillar: 'biblia',
        results: groupedBiblia.map(r => toSearchResult(r, 'biblia')),
      },
      {
        pillar: 'magisterio',
        results: withContext(curatedMagisterio).map(r => toSearchResult(r, 'magisterio')),
      },
      {
        pillar: 'patristica',
        results: withContext(curatedPatristica).map(r => toSearchResult(r, 'patristica')),
      },
    ],
    insight,
    sensitive,
    tags: topLevelTags,
    etymology: relevantEtymology,
  }
}
