import { createClient } from '@/lib/supabase/client'
import { sanitizePostgrestFilter } from '@/lib/utils/sanitize'
import type {
  CanonicalEntity,
  IdentityResult,
  BibleVerse,
  KnowledgeBaseEntry,
} from '../types/verbum.types'
import { searchByReference, searchByText, isReferencePattern } from './bible.service'

// Lazy-init: deferred from module import to prevent premature Supabase auth init.
let supabase: ReturnType<typeof createClient> | undefined

/**
 * Normalize input for comparison: lowercase, remove accents.
 */
function normalize(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Resolve a user's text input into a canonical identity, typology match,
 * or suggestions for creating a new node.
 *
 * This is THE critical function — always called before creating any node.
 */
export async function resolveIdentity(input: string): Promise<IdentityResult> {
  supabase ??= createClient()
  if (!supabase){
    return { type: 'new', action: 'create_new', suggestions: {} }
  }

  const normalized = normalize(input)
  const original = input.trim()

  // 1. Check canonical entities by aliases
  const canonical = await findCanonicalByAlias(normalized)
  if (canonical) {
    return {
      type: 'canonical',
      entity: canonical,
      action: canonical.is_trinitarian ? 'activate_trinitarian' : 'activate_canonical',
    }
  }

  // 2. Check typology registry
  const typologyMatch = await findTypologyMatch(normalized)
  if (typologyMatch) {
    return {
      type: 'typology_match',
      suggestions: { knowledge: [] },
      action: 'create_new',
    }
  }

  // 3. If it looks like a bible reference, search directly
  if (isReferencePattern(original)) {
    const verse = await searchByReference(original)
    return {
      type: 'new',
      suggestions: {
        verses: verse ? [verse] : [],
        knowledge: [],
      },
      action: 'create_new',
    }
  }

  // 4 & 5. Search biblia + knowledge base in parallel
  const [verses, knowledge] = await Promise.all([
    searchByText(original, 5),
    searchKnowledgeBase(normalized),
  ])

  return {
    type: 'new',
    suggestions: { verses, knowledge },
    action: 'create_new',
  }
}

/**
 * Find a canonical entity whose aliases array contains the normalized input.
 */
async function findCanonicalByAlias(normalized: string): Promise<CanonicalEntity | null> {
  supabase ??= createClient()
  if (!supabase)return null

  const { data } = await supabase
    .from('verbum_canonical_entities')
    .select('*')
    .contains('aliases', [normalized])
    .limit(1)
    .maybeSingle()

  return data as CanonicalEntity | null
}

/**
 * Check if the input matches a known typology entry.
 */
async function findTypologyMatch(normalized: string): Promise<boolean> {
  supabase ??= createClient()
  if (!supabase)return false

  const { data: typeMatch } = await supabase
    .from('verbum_typology_registry')
    .select('id')
    .contains('aliases_type', [normalized])
    .limit(1)

  if (typeMatch && typeMatch.length > 0) return true

  const { data: antitypeMatch } = await supabase
    .from('verbum_typology_registry')
    .select('id')
    .contains('aliases_antitype', [normalized])
    .limit(1)

  return !!(antitypeMatch && antitypeMatch.length > 0)
}

/**
 * Search ai_knowledge_base by keywords array.
 */
async function searchKnowledgeBase(normalized: string): Promise<KnowledgeBaseEntry[]> {
  supabase ??= createClient()
  if (!supabase)return []

  // Single query: keyword array match OR topic ilike — avoids two sequential queries
  const { data } = await supabase
    .from('ai_knowledge_base')
    .select('category, topic, core_teaching, bible_references, keywords')
    .or(`keywords.cs.{${sanitizePostgrestFilter(normalized)}},topic.ilike.%${sanitizePostgrestFilter(normalized)}%`)
    .limit(3)

  return (data || []) as KnowledgeBaseEntry[]
}

/**
 * Search canonical entities by partial name match.
 * Used for the AddNodePanel suggestions.
 */
export async function searchCanonicalEntities(query: string): Promise<CanonicalEntity[]> {
  supabase ??= createClient()
  if (!supabase)return []

  const normalized = normalize(query)

  // Search by display_name or aliases
  const { data } = await supabase
    .from('verbum_canonical_entities')
    .select('*')
    .or(`display_name.ilike.%${sanitizePostgrestFilter(query)}%,canonical_name.ilike.%${sanitizePostgrestFilter(normalized)}%`)
    .limit(5)

  return (data || []) as CanonicalEntity[]
}
