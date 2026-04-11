/**
 * AI-powered query understanding for theological questions.
 *
 * The core problem: when a user asks "Jesus é pão? Isso não é idolatria?",
 * naive keyword matching detects "idolatria" and enriches the search with
 * idolatry-related terms — polluting the results. The actual topic is Eucharist.
 *
 * This module uses a fast AI call to understand the TRUE intent of the question
 * BEFORE generating embeddings. It produces a focused search query that captures
 * the real theological topic, not the surface-level keywords.
 */

import { openai } from '../openai/client'
import { sanitizeIlike, sanitizePostgrestFilter } from '../utils/sanitize'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface QueryUnderstanding {
  /** The primary theological topic (e.g., "Eucaristia") */
  primaryTopic: string
  /** Refined query for semantic search — focused on the real topic */
  searchQuery: string
  /** Keywords to lookup in ai_knowledge_base */
  knowledgeKeywords: string[]
  /** Whether the user is raising an objection or misconception */
  isObjection: boolean
  /** The specific objection being raised (for the AI to address) */
  objectionContext: string | null
}

export interface KnowledgeBaseMatch {
  topic: string
  category: string
  core_teaching: string
  bible_references: string[]
  summary: string
  keywords: string[]
}

const UNDERSTANDING_SYSTEM_PROMPT = `Você é um analisador de perguntas teológicas católicas. Sua ÚNICA tarefa é identificar o TEMA CENTRAL da pergunta e gerar uma busca otimizada.

REGRA CRÍTICA: Identifique o tema pela INTENÇÃO, não pelas palavras isoladas.

Exemplos:
- "Jesus é pão? Isso não é idolatria?" → Tema: Eucaristia (o usuário quer entender a presença real, a menção a idolatria é uma objeção)
- "Por que católicos rezam para santos? Isso não é politeísmo?" → Tema: Intercessão dos Santos (politeísmo é a objeção)
- "Maria é deusa para os católicos?" → Tema: Devoção Mariana (deusa é a objeção)
- "Por que confessar para um padre se só Deus perdoa?" → Tema: Confissão/Reconciliação (a objeção é sobre mediação humana)
- "A Bíblia proíbe imagens, por que a Igreja tem estátuas?" → Tema: Uso de Imagens Sacras (proibição é a objeção)
- "O papa é infalível? Isso é heresia!" → Tema: Papado/Infalibilidade (heresia é a objeção)
- "Purgatório existe? Não está na Bíblia!" → Tema: Purgatório (a objeção é sola scriptura)
- "Batismo de criança vale? Ela não tem fé!" → Tema: Batismo Infantil (a objeção é sobre fé consciente)

IMPORTANTE: A pergunta frequentemente contém uma OBJEÇÃO ou PROVOCAÇÃO embutida. Separe o tema central da objeção.

Responda APENAS em JSON válido, sem markdown.`

/**
 * Uses AI to understand the user's theological question before searching.
 * Returns the true topic, a refined search query, and any objection context.
 *
 * This is a fast, cheap call (~200-400ms with gpt-4o-mini, ~150 tokens).
 */
export async function understandQuery(query: string): Promise<QueryUnderstanding | null> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: UNDERSTANDING_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Pergunta do usuário: "${query}"

Retorne JSON:
{
  "primaryTopic": "nome do tema central (ex: Eucaristia, Batismo, Confissão, Devoção Mariana, Papado, Purgatório, Intercessão dos Santos, Imagens Sacras, Tradição, Salvação, Missa, etc)",
  "searchQuery": "query refinada para busca semântica focada APENAS no tema central, sem termos da objeção. Use termos teológicos católicos precisos.",
  "knowledgeKeywords": ["3-5 palavras-chave para buscar na base de conhecimento curada"],
  "isObjection": true,
  "objectionContext": "descreva brevemente a objeção que o usuário levanta, ou null se não houver objeção"
}`
        }
      ],
      max_tokens: 250,
      temperature: 0.05,
    })

    const raw = completion.choices[0].message.content ?? ''
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return {
      primaryTopic: typeof parsed.primaryTopic === 'string' ? parsed.primaryTopic : '',
      searchQuery: typeof parsed.searchQuery === 'string' ? parsed.searchQuery : query,
      knowledgeKeywords: Array.isArray(parsed.knowledgeKeywords) ? parsed.knowledgeKeywords : [],
      isObjection: parsed.isObjection === true,
      objectionContext: typeof parsed.objectionContext === 'string' ? parsed.objectionContext : null,
    }
  } catch (err) {
    console.error('[query-understanding] AI understanding failed:', err instanceof Error ? err.message : err)
    return null
  }
}

/**
 * Searches the ai_knowledge_base table for curated theological content
 * matching the identified topic. Returns bible_references, core_teaching, etc.
 *
 * The ai_knowledge_base has a GIN index on keywords[], so this is fast.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function searchKnowledgeBase(
  supabase: SupabaseClient<any, any, any>,
  keywords: string[],
  primaryTopic: string,
): Promise<KnowledgeBaseMatch[]> {
  if (keywords.length === 0 && !primaryTopic) return []

  try {
    // Strategy 1: Search by topic name (most precise)
    const { data: topicMatch } = await supabase
      .from('ai_knowledge_base')
      .select('topic, category, core_teaching, bible_references, summary, keywords')
      .ilike('topic', `%${sanitizeIlike(primaryTopic)}%`)
      .limit(2)

    if (topicMatch && topicMatch.length > 0) {
      console.log(`[knowledge-base] Found ${topicMatch.length} matches by topic: "${primaryTopic}"`)
      return topicMatch as KnowledgeBaseMatch[]
    }

    // Strategy 2: Search by keyword overlap
    if (keywords.length > 0) {
      const { data: keywordMatch } = await supabase
        .from('ai_knowledge_base')
        .select('topic, category, core_teaching, bible_references, summary, keywords')
        .overlaps('keywords', keywords)
        .limit(3)

      if (keywordMatch && keywordMatch.length > 0) {
        console.log(`[knowledge-base] Found ${keywordMatch.length} matches by keywords: ${keywords.join(', ')}`)
        return keywordMatch as KnowledgeBaseMatch[]
      }
    }

    // Strategy 3: Search by summary/core_teaching text
    const searchTerm = primaryTopic || keywords[0] || ''
    if (searchTerm) {
      const { data: textMatch } = await supabase
        .from('ai_knowledge_base')
        .select('topic, category, core_teaching, bible_references, summary, keywords')
        .or(`summary.ilike.%${sanitizePostgrestFilter(searchTerm)}%,core_teaching.ilike.%${sanitizePostgrestFilter(searchTerm)}%`)
        .limit(2)

      if (textMatch && textMatch.length > 0) {
        console.log(`[knowledge-base] Found ${textMatch.length} matches by text search: "${searchTerm}"`)
        return textMatch as KnowledgeBaseMatch[]
      }
    }

    console.log(`[knowledge-base] No matches found for topic="${primaryTopic}", keywords=${keywords.join(', ')}`)
    return []
  } catch (err) {
    console.error('[knowledge-base] Search error:', err instanceof Error ? err.message : err)
    return []
  }
}

/**
 * Extracts Bible references from knowledge base matches and normalizes them
 * to the format used in the biblia table (e.g., "Mt 26,26" not "Mt 26:26").
 */
export function extractBibleRefsFromKnowledge(matches: KnowledgeBaseMatch[]): string[] {
  const allRefs: string[] = []
  for (const match of matches) {
    if (Array.isArray(match.bible_references)) {
      for (const ref of match.bible_references) {
        // Normalize: "Mt 26:26-28" → ["Mt 26,26", "Mt 26,27", "Mt 26,28"]
        // Also handle range like "Jo 6:53-56" → ["Jo 6,53", "Jo 6,54", "Jo 6,55", "Jo 6,56"]
        const normalized = normalizeBibleRef(ref)
        allRefs.push(...normalized)
      }
    }
  }
  // Deduplicate
  return [...new Set(allRefs)]
}

/**
 * Normalizes a Bible reference from knowledge base format to biblia table format.
 * "Mt 26:26-28" → ["Mt 26,26", "Mt 26,27", "Mt 26,28"]
 * "Jo 6:56" → ["Jo 6,56"]
 */
function normalizeBibleRef(ref: string): string[] {
  // Replace colon with comma (knowledge base uses ":" but biblia table uses ",")
  const normalized = ref.replace(':', ',')

  // Check for range: "Mt 26,26-28" → expand
  const rangeMatch = normalized.match(/^(.+\s+\d+),(\d+)-(\d+)$/)
  if (rangeMatch) {
    const prefix = rangeMatch[1]
    const start = parseInt(rangeMatch[2])
    const end = parseInt(rangeMatch[3])
    const refs: string[] = []
    for (let i = start; i <= end; i++) {
      refs.push(`${prefix},${i}`)
    }
    return refs
  }

  return [normalized]
}
