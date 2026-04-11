import { createClient } from '@/lib/supabase/client'
import type { BibleVerse } from '../types/verbum.types'

// Lazy-init: deferred from module import to prevent premature Supabase auth init.
let supabase: ReturnType<typeof createClient> | undefined

/**
 * Normalize a reference input to match the DB format (comma, not colon).
 * "Mt 16:18" -> "Mt 16,18"
 */
function normalizeReference(input: string): string {
  return input.replace(/(\d+):(\d+)/, '$1,$2')
}

/**
 * Parse a bible reference string like "Mt 16:18" or "Mt 16,18"
 * into { book_abbr, chapter, verse }.
 */
function parseReference(input: string): { book_abbr: string; chapter: number; verse: number } | null {
  const match = input.match(/^(\d?\s?[A-Za-zÀ-ú]+)\s+(\d+)[,:]\s?(\d+)$/)
  if (!match) return null
  return {
    book_abbr: match[1].trim(),
    chapter: parseInt(match[2], 10),
    verse: parseInt(match[3], 10),
  }
}

/**
 * Parse a verse range like "Isaias 22:22-25" or "Is 22,22-25"
 * Returns { book_abbr, chapter, verseStart, verseEnd }
 */
function parseRangeReference(input: string): {
  book_abbr: string
  chapter: number
  verseStart: number
  verseEnd: number
} | null {
  const match = input.match(/^(\d?\s?[A-Za-zÀ-ú]+)\s+(\d+)[,:]\s?(\d+)\s?[-–]\s?(\d+)$/)
  if (!match) return null
  return {
    book_abbr: match[1].trim(),
    chapter: parseInt(match[2], 10),
    verseStart: parseInt(match[3], 10),
    verseEnd: parseInt(match[4], 10),
  }
}

/**
 * Detect if a query is a bible reference pattern (single verse).
 */
export function isReferencePattern(query: string): boolean {
  return /^\d?\s?[A-Za-zÀ-ú]+\s+\d+[,:]\s?\d+$/.test(query.trim())
}

/**
 * Detect if a query is a verse range pattern (e.g. "Is 22:22-25").
 */
export function isRangePattern(query: string): boolean {
  return /^\d?\s?[A-Za-zÀ-ú]+\s+\d+[,:]\s?\d+\s?[-–]\s?\d+$/.test(query.trim())
}

/**
 * Detect if a query is a chapter-only reference (e.g. "Mt 16").
 */
function isChapterPattern(query: string): boolean {
  return /^\d?\s?[A-Za-zÀ-ú]+\s+\d+$/.test(query.trim())
}

/**
 * Common book name aliases mapping to DB abbreviations.
 * Handles different Portuguese forms and common abbreviations.
 */
const BOOK_ALIASES: Record<string, string[]> = {
  gn: ['genesis', 'gênesis', 'gen'],
  ex: ['exodo', 'êxodo'],
  lv: ['levitico', 'levítico', 'lev'],
  nm: ['numeros', 'números', 'num'],
  dt: ['deuteronomio', 'deuteronômio', 'deut'],
  js: ['josue', 'josué', 'jos'],
  jz: ['juizes', 'juízes'],
  rt: ['rute'],
  '1sm': ['1 samuel', '1samuel', '1sam', 'i samuel'],
  '2sm': ['2 samuel', '2samuel', '2sam', 'ii samuel'],
  '1rs': ['1 reis', '1reis', 'i reis'],
  '2rs': ['2 reis', '2reis', 'ii reis'],
  '1cr': ['1 cronicas', '1 crônicas', '1cronicas', 'i cronicas'],
  '2cr': ['2 cronicas', '2 crônicas', '2cronicas', 'ii cronicas'],
  ne: ['neemias'],
  est: ['ester'],
  jo: ['jó'],
  sl: ['salmos', 'salmo', 'sal', 'psalm'],
  pr: ['proverbios', 'provérbios', 'prov'],
  ecl: ['eclesiastes'],
  ct: ['canticos', 'cânticos', 'cantico', 'cântico', 'cantares'],
  is: ['isaias', 'isaías'],
  jr: ['jeremias'],
  lm: ['lamentacoes', 'lamentações'],
  ez: ['ezequiel'],
  dn: ['daniel', 'dan'],
  os: ['oseias', 'oséias'],
  jl: ['joel'],
  am: ['amos', 'amós'],
  ab: ['abdias'],
  jn: ['jonas'],
  mq: ['miqueias', 'miquéias'],
  na: ['naum'],
  hc: ['habacuc', 'habacuque'],
  sf: ['sofonias'],
  ag: ['ageu'],
  zc: ['zacarias'],
  ml: ['malaquias'],
  mt: ['mateus'],
  mc: ['marcos'],
  lc: ['lucas'],
  jo_ev: ['joao', 'joão'],
  at: ['atos'],
  rm: ['romanos', 'rom'],
  '1cor': ['1 corintios', '1 coríntios', '1corintios', 'i corintios'],
  '2cor': ['2 corintios', '2 coríntios', '2corintios', 'ii corintios'],
  gl: ['galatas', 'gálatas', 'gal'],
  ef: ['efesios', 'efésios'],
  fl: ['filipenses'],
  cl: ['colossenses'],
  '1ts': ['1 tessalonicenses', '1tessalonicenses', 'i tessalonicenses'],
  '2ts': ['2 tessalonicenses', '2tessalonicenses', 'ii tessalonicenses'],
  '1tm': ['1 timoteo', '1 timóteo', '1timoteo', 'i timoteo'],
  '2tm': ['2 timoteo', '2 timóteo', '2timoteo', 'ii timoteo'],
  tt: ['tito'],
  fm: ['filemon', 'filémon'],
  hb: ['hebreus'],
  tg: ['tiago'],
  '1pd': ['1 pedro', '1pedro', 'i pedro'],
  '2pd': ['2 pedro', '2pedro', 'ii pedro'],
  '1jo': ['1 joao', '1 joão', '1joao', 'i joao'],
  '2jo': ['2 joao', '2 joão', '2joao', 'ii joao'],
  '3jo': ['3 joao', '3 joão', '3joao', 'iii joao'],
  jd: ['judas'],
  ap: ['apocalipse'],
}

/**
 * Try to resolve a full book name to its abbreviation using aliases.
 */
function resolveBookAbbreviation(bookName: string): string {
  const normalized = bookName
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  for (const [abbr, aliases] of Object.entries(BOOK_ALIASES)) {
    for (const alias of aliases) {
      const aliasNorm = alias
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      if (normalized === aliasNorm || normalized === abbr) {
        return abbr
      }
    }
  }

  return bookName
}

/**
 * Search for a verse by exact reference (e.g., "Mt 16:18" or "Mt 16,18").
 */
export async function searchByReference(reference: string): Promise<BibleVerse | null> {
  supabase ??= createClient()
  if (!supabase)return null

  const parsed = parseReference(reference)
  if (!parsed) {
    const normalized = normalizeReference(reference)
    const { data } = await supabase
      .from('biblia')
      .select('book, book_abbr, chapter, verse, reference, text_pt, text_latin, testament')
      .eq('reference', normalized)
      .limit(1)
      .maybeSingle()

    if (!data) return null
    return mapToVerse(data)
  }

  // Try with original abbreviation first
  const { data } = await supabase
    .from('biblia')
    .select('book, book_abbr, chapter, verse, reference, text_pt, text_latin, testament')
    .ilike('book_abbr', parsed.book_abbr)
    .eq('chapter', parsed.chapter)
    .eq('verse', parsed.verse)
    .limit(1)
    .maybeSingle()

  if (data) return mapToVerse(data)

  // Try with resolved abbreviation (handles "Isaias" -> "Is")
  const resolvedAbbr = resolveBookAbbreviation(parsed.book_abbr)
  if (resolvedAbbr !== parsed.book_abbr) {
    const { data: data2 } = await supabase
      .from('biblia')
      .select('book, book_abbr, chapter, verse, reference, text_pt, text_latin, testament')
      .ilike('book_abbr', resolvedAbbr)
      .eq('chapter', parsed.chapter)
      .eq('verse', parsed.verse)
      .limit(1)
      .maybeSingle()

    if (data2) return mapToVerse(data2)
  }

  // Try matching by full book name
  const { data: data3 } = await supabase
    .from('biblia')
    .select('book, book_abbr, chapter, verse, reference, text_pt, text_latin, testament')
    .ilike('book', `%${parsed.book_abbr}%`)
    .eq('chapter', parsed.chapter)
    .eq('verse', parsed.verse)
    .limit(1)
    .maybeSingle()

  if (data3) return mapToVerse(data3)
  return null
}

/**
 * Search for a range of verses (e.g., "Is 22:22-25").
 * Returns all verses in the range.
 */
export async function searchByRange(reference: string): Promise<BibleVerse[]> {
  supabase ??= createClient()
  if (!supabase)return []

  const parsed = parseRangeReference(reference)
  if (!parsed) return []

  // Try with original abbreviation
  let { data } = await supabase
    .from('biblia')
    .select('book, book_abbr, chapter, verse, reference, text_pt, text_latin, testament')
    .ilike('book_abbr', parsed.book_abbr)
    .eq('chapter', parsed.chapter)
    .gte('verse', parsed.verseStart)
    .lte('verse', parsed.verseEnd)
    .order('verse')

  if (data && data.length > 0) return data.map(mapToVerse)

  // Try with resolved abbreviation
  const resolvedAbbr = resolveBookAbbreviation(parsed.book_abbr)
  if (resolvedAbbr !== parsed.book_abbr) {
    const { data: data2 } = await supabase
      .from('biblia')
      .select('book, book_abbr, chapter, verse, reference, text_pt, text_latin, testament')
      .ilike('book_abbr', resolvedAbbr)
      .eq('chapter', parsed.chapter)
      .gte('verse', parsed.verseStart)
      .lte('verse', parsed.verseEnd)
      .order('verse')

    if (data2 && data2.length > 0) return data2.map(mapToVerse)
  }

  // Try by full book name
  const { data: data3 } = await supabase
    .from('biblia')
    .select('book, book_abbr, chapter, verse, reference, text_pt, text_latin, testament')
    .ilike('book', `%${parsed.book_abbr}%`)
    .eq('chapter', parsed.chapter)
    .gte('verse', parsed.verseStart)
    .lte('verse', parsed.verseEnd)
    .order('verse')

  return (data3 || []).map(mapToVerse)
}

/**
 * Search bible by free text (semantic-style search using ILIKE).
 * Splits query into keywords for broader matching.
 */
export async function searchByText(query: string, limit = 8): Promise<BibleVerse[]> {
  supabase ??= createClient()
  if (!supabase)return []

  const words = query.trim().split(/\s+/).filter(w => w.length > 2)
  if (words.length === 0) return []

  // Full query match first
  const { data } = await supabase
    .from('biblia')
    .select('book, book_abbr, chapter, verse, reference, text_pt, text_latin, testament')
    .ilike('text_pt', `%${query}%`)
    .limit(limit)

  if (data && data.length > 0) {
    return data.map(mapToVerse)
  }

  // Multi-word search: try each word and aggregate
  if (words.length >= 2) {
    const allResults: BibleVerse[] = []
    const seenRefs = new Set<string>()

    for (const word of words.sort((a, b) => b.length - a.length).slice(0, 3)) {
      const { data: wordData } = await supabase
        .from('biblia')
        .select('book, book_abbr, chapter, verse, reference, text_pt, text_latin, testament')
        .ilike('text_pt', `%${word}%`)
        .limit(limit)

      if (wordData) {
        for (const row of wordData) {
          const ref = row.reference as string
          if (!seenRefs.has(ref)) {
            seenRefs.add(ref)
            allResults.push(mapToVerse(row))
          }
        }
      }
      if (allResults.length >= limit) break
    }

    // Score results by how many query words appear in text
    allResults.sort((a, b) => {
      const scoreA = words.filter(w =>
        a.text_pt.toLowerCase().includes(w.toLowerCase())
      ).length
      const scoreB = words.filter(w =>
        b.text_pt.toLowerCase().includes(w.toLowerCase())
      ).length
      return scoreB - scoreA
    })

    return allResults.slice(0, limit)
  }

  // Single word fallback
  const mainWord = words.sort((a, b) => b.length - a.length)[0]
  const { data: fallback } = await supabase
    .from('biblia')
    .select('book, book_abbr, chapter, verse, reference, text_pt, text_latin, testament')
    .ilike('text_pt', `%${mainWord}%`)
    .limit(limit)

  return (fallback || []).map(mapToVerse)
}

/**
 * Search bible by book name and optional chapter.
 */
export async function searchByBook(bookQuery: string, chapter?: number, limit = 10): Promise<BibleVerse[]> {
  supabase ??= createClient()
  if (!supabase)return []

  const resolvedAbbr = resolveBookAbbreviation(bookQuery)

  let query = supabase
    .from('biblia')
    .select('book, book_abbr, chapter, verse, reference, text_pt, text_latin, testament')
    .or(`book.ilike.%${bookQuery}%,book_abbr.ilike.%${bookQuery}%,book_abbr.ilike.%${resolvedAbbr}%`)

  if (chapter) {
    query = query.eq('chapter', chapter)
  }

  const { data } = await query.order('chapter').order('verse').limit(limit)
  return (data || []).map(mapToVerse)
}

function mapToVerse(row: Record<string, unknown>): BibleVerse {
  return {
    book: row.book as string,
    chapter: row.chapter as number,
    verse: row.verse as number,
    reference: row.reference as string,
    text_pt: row.text_pt as string,
    testament: row.testament as 'AT' | 'NT',
  }
}
