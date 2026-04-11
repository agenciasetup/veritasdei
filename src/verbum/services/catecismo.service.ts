import { createClient } from '@/lib/supabase/client'
import { sanitizeIlike } from '@/lib/utils/sanitize'

// Lazy-init: deferred from module import to prevent premature Supabase auth init.
let supabase: ReturnType<typeof createClient> | undefined

/**
 * Search catecismo by paragraph number.
 */
export async function searchByParagraph(paragraph: number) {
  supabase ??= createClient()
  if (!supabase)return null

  const { data } = await supabase
    .from('catecismo')
    .select('id, paragraph, section, part, text, source')
    .eq('paragraph', paragraph)
    .limit(1)
    .single()

  return data
}

/**
 * Search catecismo by text content.
 */
export async function searchByText(query: string, limit = 5) {
  supabase ??= createClient()
  if (!supabase)return []

  const { data } = await supabase
    .from('catecismo')
    .select('id, paragraph, section, part, text, source')
    .ilike('text', `%${sanitizeIlike(query)}%`)
    .limit(limit)

  return data || []
}

/**
 * Get multiple catecismo paragraphs by their numbers.
 */
export async function getParagraphs(paragraphs: number[]) {
  if (!supabase || paragraphs.length === 0) return []

  const { data } = await supabase
    .from('catecismo')
    .select('id, paragraph, section, part, text, source')
    .in('paragraph', paragraphs)
    .order('paragraph')

  return data || []
}
