import { createClient } from '@/lib/supabase/client'
import type { BibleVerse } from '../types/verbum.types'

const supabase = createClient()

/**
 * Normalize a reference input to match the DB format (comma, not colon).
 * "Mt 16:18" → "Mt 16,18"
 * "Jo 1:14" → "Jo 1,14"
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
 * Search for a verse by exact reference (e.g., "Mt 16:18" or "Mt 16,18").
 */
export async function searchByReference(reference: string): Promise<BibleVerse | null> {
  if (!supabase) return null

  const parsed = parseReference(reference)
  if (!parsed) {
    // Try direct match with normalized reference
    const normalized = normalizeReference(reference)
    const { data } = await supabase
      .from('biblia')
      .select('book, book_abbr, chapter, verse, reference, text_pt, text_latin, testament')
      .eq('reference', normalized)
      .limit(1)
      .single()

    if (!data) return null
    return mapToVerse(data)
  }

  const { data } = await supabase
    .from('biblia')
    .select('book, book_abbr, chapter, verse, reference, text_pt, text_latin, testament')
    .ilike('book_abbr', parsed.book_abbr)
    .eq('chapter', parsed.chapter)
    .eq('verse', parsed.verse)
    .limit(1)
    .single()

  if (!data) return null
  return mapToVerse(data)
}

/**
 * Search bible by free text (using ILIKE for text content).
 */
export async function searchByText(query: string, limit = 8): Promise<BibleVerse[]> {
  if (!supabase) return []

  // Split query into words for broader matching
  const words = query.trim().split(/\s+/).filter(w => w.length > 2)
  if (words.length === 0) return []

  // Use ILIKE with the full query first
  const { data } = await supabase
    .from('biblia')
    .select('book, book_abbr, chapter, verse, reference, text_pt, text_latin, testament')
    .ilike('text_pt', `%${query}%`)
    .limit(limit)

  if (data && data.length > 0) {
    return data.map(mapToVerse)
  }

  // Fallback: search by first significant word
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
  if (!supabase) return []

  let query = supabase
    .from('biblia')
    .select('book, book_abbr, chapter, verse, reference, text_pt, text_latin, testament')
    .or(`book.ilike.%${bookQuery}%,book_abbr.ilike.%${bookQuery}%`)

  if (chapter) {
    query = query.eq('chapter', chapter)
  }

  const { data } = await query.order('chapter').order('verse').limit(limit)
  return (data || []).map(mapToVerse)
}

/**
 * Detect if a query is a bible reference pattern.
 */
export function isReferencePattern(query: string): boolean {
  return /^\d?\s?[A-Za-zÀ-ú]+\s+\d+[,:]\s?\d+$/.test(query.trim())
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
