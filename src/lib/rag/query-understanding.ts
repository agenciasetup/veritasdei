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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

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

REGRA CRÍTICA 1: Identifique o tema pela INTENÇÃO, não pelas palavras isoladas.

REGRA CRÍTICA 2: Se o usuário usa um TERMO TEOLÓGICO ESPECÍFICO/TÉCNICO (heresias, movimentos históricos, doutrinas nomeadas, nomes próprios — ex: utraquismo, jansenismo, donatismo, monotelismo, pelagianismo, gnosticismo, modalismo, arianismo, sedevacantismo, febronianismo, galicanismo, quietismo), esse termo DEVE ser o \`primaryTopic\` — NÃO o generalize para uma categoria ampla como "Eucaristia" ou "Graça". O termo específico é sempre mais informativo do que sua categoria.

Exemplos (tema geral — usuário NÃO nomeou um conceito específico):
- "Jesus é pão? Isso não é idolatria?" → primaryTopic: "Eucaristia" (o usuário quer entender a presença real, a menção a idolatria é uma objeção)
- "Por que católicos rezam para santos? Isso não é politeísmo?" → primaryTopic: "Intercessão dos Santos" (politeísmo é a objeção)
- "Maria é deusa para os católicos?" → primaryTopic: "Devoção Mariana" (deusa é a objeção)
- "Por que confessar para um padre se só Deus perdoa?" → primaryTopic: "Confissão" (a objeção é sobre mediação humana)
- "A Bíblia proíbe imagens, por que a Igreja tem estátuas?" → primaryTopic: "Imagens Sacras" (proibição é a objeção)
- "O papa é infalível? Isso é heresia!" → primaryTopic: "Papado" (heresia é a objeção)
- "Purgatório existe? Não está na Bíblia!" → primaryTopic: "Purgatório" (a objeção é sola scriptura)
- "Batismo de criança vale? Ela não tem fé!" → primaryTopic: "Batismo Infantil" (a objeção é sobre fé consciente)

Exemplos (termo específico — usuário NOMEOU um conceito; PRESERVE o termo):
- "O que é utraquismo?" → primaryTopic: "Utraquismo" (NÃO "Eucaristia", mesmo sendo relacionado)
- "Quem foram os donatistas?" → primaryTopic: "Donatismo" (NÃO "Igreja" nem "Sacramentos")
- "O jansenismo é heresia?" → primaryTopic: "Jansenismo" (NÃO "Graça" nem "Predestinação")
- "O que o Concílio de Trento ensinou sobre a justificação?" → primaryTopic: "Concílio de Trento" ou "Justificação" (o nome próprio prevalece)
- "O monotelismo ainda existe?" → primaryTopic: "Monotelismo" (NÃO "Cristologia")

IMPORTANTE: A pergunta frequentemente contém uma OBJEÇÃO ou PROVOCAÇÃO embutida. Separe o tema central da objeção.

KEYWORDS: gere \`knowledgeKeywords\` em PORTUGUÊS, minúsculas, SEM acentos (ex: "comunhao", "eucaristia", "utraquismo"). Inclua sempre o termo específico se houver.

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

    const rawKeywords: unknown[] = Array.isArray(parsed.knowledgeKeywords)
      ? parsed.knowledgeKeywords
      : []
    const normalizedKeywords: string[] = rawKeywords
      .filter((k): k is string => typeof k === 'string' && k.length > 0)
      .map(k => normalizeKeyword(k))
      .filter(k => k.length > 0)

    return {
      primaryTopic: typeof parsed.primaryTopic === 'string' ? parsed.primaryTopic : '',
      searchQuery: typeof parsed.searchQuery === 'string' ? parsed.searchQuery : query,
      knowledgeKeywords: [...new Set(normalizedKeywords)],
      isObjection: parsed.isObjection === true,
      objectionContext: typeof parsed.objectionContext === 'string' ? parsed.objectionContext : null,
    }
  } catch (err) {
    console.error('[query-understanding] AI understanding failed:', err instanceof Error ? err.message : err)
    return null
  }
}

/**
 * Normalize a keyword for matching against ai_knowledge_base.keywords:
 * lowercase, strip diacritics, trim. The admin pipeline stores keywords
 * in this form (see /api/admin/knowledge/process), so we must match it.
 */
function normalizeKeyword(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Portuguese stopwords + question words to strip when extracting content
 * words from the raw user query for lexical KB lookups. Kept small and
 * focused on the high-frequency filler that pollutes ILIKE matches.
 */
const PT_STOPWORDS = new Set([
  'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
  'de', 'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas',
  'em', 'por', 'para', 'pra', 'com', 'sem', 'sob', 'sobre', 'entre', 'ate',
  'e', 'ou', 'mas', 'se', 'que', 'porque', 'pois', 'como', 'quando', 'onde',
  'qual', 'quais', 'quem', 'quanto', 'quanta', 'cujo',
  'eh', 'ser', 'sao', 'foi', 'era', 'seja', 'sendo', 'tem', 'ter', 'teve',
  'isso', 'isto', 'aquilo', 'esse', 'essa', 'este', 'esta', 'aquele', 'aquela',
  'meu', 'minha', 'seu', 'sua', 'nosso', 'nossa', 'dele', 'dela',
  'nao', 'sim', 'mais', 'menos', 'muito', 'muita', 'pouco', 'pouca',
  'todo', 'toda', 'todos', 'todas', 'algum', 'alguma', 'nenhum', 'nenhuma',
  'eu', 'voce', 'vc', 'ele', 'ela', 'nos', 'eles', 'elas',
  'qual', 'vale', 'pode', 'podem', 'posso', 'deve', 'devo',
  'explique', 'explica', 'fale', 'diga', 'conte', 'significa', 'significado',
  'existe', 'existem', 'entao', 'tambem', 'ainda', 'so', 'apenas',
])

/**
 * Extract content words from a raw user query for lexical KB lookups.
 * Normalizes (lowercase, no accents), strips punctuation, removes
 * stopwords, keeps tokens with length >= 4.
 */
function extractContentWords(rawQuery: string): string[] {
  const normalized = normalizeKeyword(rawQuery)
  const tokens = normalized
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 4 && !PT_STOPWORDS.has(t))
  return [...new Set(tokens)]
}

interface KnowledgeBaseRow extends KnowledgeBaseMatch {
  id: string
}

/**
 * Searches the ai_knowledge_base table for curated theological content
 * matching the user's question. Runs four lexical strategies in parallel
 * and merges/dedupes the results:
 *
 *   S1. topic ILIKE %primaryTopic%      (LLM-identified theme)
 *   S2. keywords && normalizedKeywords  (LLM-generated keywords)
 *   S3. topic/summary/core_teaching ILIKE %word% for each content word
 *       of the RAW user query (catches specific terms the LLM may have
 *       generalized away, e.g. "utraquismo")
 *   S4. topic/summary/core_teaching ILIKE %primaryTopic%
 *
 * The old implementation used sequential early-returns: if S1 found 2
 * entries for a broad topic like "Eucaristia", it never checked whether
 * the user actually asked about the more specific "Utraquismo" entry.
 *
 * Only status='active' rows are considered.
 * The ai_knowledge_base has a GIN index on keywords[], so S2 is fast.
 */
export async function searchKnowledgeBase(
  supabase: AnySupabaseClient,
  keywords: string[],
  primaryTopic: string,
  rawQuery: string = '',
): Promise<KnowledgeBaseMatch[]> {
  const select = 'id, topic, category, core_teaching, bible_references, summary, keywords'

  const normalizedTopic = normalizeKeyword(primaryTopic)
  const normalizedKeywords = keywords.map(normalizeKeyword).filter(k => k.length > 0)
  const contentWords = extractContentWords(rawQuery)

  if (!normalizedTopic && normalizedKeywords.length === 0 && contentWords.length === 0) {
    return []
  }

  try {
    // Build all lookups as promises and run them in parallel.
    const pending: Array<Promise<{ label: string; rows: KnowledgeBaseRow[] }>> = []

    const run = (
      label: string,
      builder: () => PromiseLike<{ data: unknown; error: unknown }>,
    ) => {
      pending.push(
        Promise.resolve(builder()).then(({ data, error }) => {
          if (error) {
            const msg = error instanceof Error ? error.message : String(error)
            console.error(`[knowledge-base] ${label} error:`, msg)
            return { label, rows: [] as KnowledgeBaseRow[] }
          }
          return { label, rows: (Array.isArray(data) ? data : []) as KnowledgeBaseRow[] }
        }),
      )
    }

    // S1: topic ILIKE primaryTopic
    if (primaryTopic) {
      run('S1-topic', () =>
        supabase
          .from('ai_knowledge_base')
          .select(select)
          .eq('status', 'active')
          .ilike('topic', `%${sanitizeIlike(primaryTopic)}%`)
          .limit(3),
      )
    }

    // S2: keywords overlap (normalized)
    if (normalizedKeywords.length > 0) {
      run('S2-keywords', () =>
        supabase
          .from('ai_knowledge_base')
          .select(select)
          .eq('status', 'active')
          .overlaps('keywords', normalizedKeywords)
          .limit(5),
      )
    }

    // S3: topic/summary/core_teaching ILIKE %word% for each content word
    //     of the RAW user query. This is the key strategy for catching
    //     specific terms the LLM may have generalized away.
    for (const word of contentWords.slice(0, 5)) {
      const safe = sanitizePostgrestFilter(word)
      run(`S3-word:${word}`, () =>
        supabase
          .from('ai_knowledge_base')
          .select(select)
          .eq('status', 'active')
          .or(
            `topic.ilike.%${safe}%,summary.ilike.%${safe}%,core_teaching.ilike.%${safe}%`,
          )
          .limit(3),
      )
    }

    // S4: text search on summary/core_teaching for the LLM's primaryTopic
    //     (complements S1 when the topic appears in the body but not the title)
    if (primaryTopic) {
      const safeTopic = sanitizePostgrestFilter(primaryTopic)
      run('S4-topic-text', () =>
        supabase
          .from('ai_knowledge_base')
          .select(select)
          .eq('status', 'active')
          .or(`summary.ilike.%${safeTopic}%,core_teaching.ilike.%${safeTopic}%`)
          .limit(3),
      )
    }

    const results = await Promise.all(pending)

    // Merge + dedupe by id, scoring by number of strategies that hit.
    // Strategies that matched the raw user query get a higher weight,
    // since they reflect the literal intent of the question.
    const scores = new Map<string, { row: KnowledgeBaseRow; score: number; labels: string[] }>()
    const weight = (label: string): number => {
      if (label.startsWith('S3-word:')) return 3 // literal user word
      if (label === 'S1-topic') return 2
      if (label === 'S2-keywords') return 2
      if (label === 'S4-topic-text') return 1
      return 1
    }

    for (const { label, rows } of results) {
      const w = weight(label)
      for (const row of rows) {
        const existing = scores.get(row.id)
        if (existing) {
          existing.score += w
          existing.labels.push(label)
        } else {
          scores.set(row.id, { row, score: w, labels: [label] })
        }
      }
    }

    const ranked = [...scores.values()].sort((a, b) => b.score - a.score).slice(0, 3)

    if (ranked.length === 0) {
      console.log(
        `[knowledge-base] No matches found for topic="${primaryTopic}", keywords=[${normalizedKeywords.join(', ')}], words=[${contentWords.join(', ')}]`,
      )
      return []
    }

    console.log(
      `[knowledge-base] ${ranked.length} matches: ${ranked
        .map(r => `"${r.row.topic}" (${r.labels.join('+')}, score=${r.score})`)
        .join(', ')}`,
    )

    return ranked.map(({ row }) => ({
      topic: row.topic,
      category: row.category,
      core_teaching: row.core_teaching,
      bible_references: row.bible_references,
      summary: row.summary,
      keywords: row.keywords,
    }))
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
