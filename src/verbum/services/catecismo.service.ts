import { createClient } from '@/lib/supabase/client'
import { handleQueryError } from '@/lib/supabase/query'
import { sanitizeIlike } from '@/lib/utils/sanitize'

// Lazy-init: deferred from module import to prevent premature Supabase auth init.
let supabase: ReturnType<typeof createClient> | undefined

/**
 * Search catecismo by paragraph number.
 */
export async function searchByParagraph(paragraph: number) {
  supabase ??= createClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('catecismo')
    .select('id, paragraph, section, part, text, source')
    .eq('paragraph', paragraph)
    .limit(1)
    .single()

  if (error) await handleQueryError(error, 'Catecismo.searchByParagraph')
  return data
}

/**
 * Search catecismo by text content.
 */
export async function searchByText(query: string, limit = 5) {
  supabase ??= createClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('catecismo')
    .select('id, paragraph, section, part, text, source')
    .ilike('text', `%${sanitizeIlike(query)}%`)
    .limit(limit)

  if (error) await handleQueryError(error, 'Catecismo.searchByText')
  return data || []
}

/**
 * Get multiple catecismo paragraphs by their numbers.
 */
export async function getParagraphs(paragraphs: number[]) {
  supabase ??= createClient()
  if (!supabase || paragraphs.length === 0) return []

  const { data, error } = await supabase
    .from('catecismo')
    .select('id, paragraph, section, part, text, source')
    .in('paragraph', paragraphs)
    .order('paragraph')

  if (error) await handleQueryError(error, 'Catecismo.getParagraphs')
  return data || []
}
