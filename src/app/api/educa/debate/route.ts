/**
 * POST /api/educa/debate
 *
 * Modo Debate IA — treino do católico em refutações apologéticas.
 *
 * Body:
 *   {
 *     topic: string         // slug de DEBATE_TOPICS (ex.: 'sola-scriptura')
 *     messages: Array<{role: 'user'|'assistant', content: string}>  // histórico
 *   }
 *
 * Resposta:
 *   {
 *     reply: string                 // próxima fala do oponente
 *     eval: {
 *       biblical: 0-3
 *       magisterium: 0-3
 *       charity: 0-3
 *       comment: string             // 1 frase de feedback ao último turno
 *     }
 *     conceded: boolean             // se o oponente "cedeu" o ponto
 *   }
 *
 * Gates:
 *  - Auth obrigatório
 *  - Rate limit: 20/min por user
 *  - AI budget: 30 calls/dia (feature `educa_debate`)
 *  - História máx: 20 mensagens (evita tokens descontrolados)
 *  - Mensagem do user: 3-1000 chars
 *  - Detecção de prompt injection
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { checkAndConsumeAiBudget } from '@/lib/ai/budget'
import { detectPromptInjection } from '@/lib/ai/prompt-defense'
import { openai } from '@/lib/openai/client'
import { findTopicBySlug, systemPrompt } from '@/lib/educa/debate-prompts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_HISTORY = 20
const MAX_USER_CHARS = 1000
const MIN_USER_CHARS = 3

type ChatMessage = { role: 'user' | 'assistant'; content: string }

type DebateEval = {
  biblical: number
  magisterium: number
  charity: number
  comment: string
}

type DebateReply = {
  reply: string
  eval: DebateEval
  conceded: boolean
}

function clampScore(n: unknown): number {
  const v = typeof n === 'number' ? n : 0
  return Math.max(0, Math.min(3, Math.round(v)))
}

/** Normaliza o JSON do modelo num shape garantido. */
function parseAiReply(raw: string): DebateReply {
  // O modelo retorna JSON puro (response_format=json_object), mas se vier
  // com cerca de markdown ou texto extra, tentamos extrair o bloco JSON.
  const trimmed = raw.trim()
  let jsonStr = trimmed
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenceMatch) jsonStr = fenceMatch[1].trim()
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(jsonStr) as Record<string, unknown>
  } catch {
    // Modelo escapou o formato — usa o raw como reply e zera eval.
    return {
      reply: trimmed.slice(0, 2000) || 'Não consegui formular uma resposta. Tenta de novo?',
      eval: { biblical: 0, magisterium: 0, charity: 0, comment: '—' },
      conceded: false,
    }
  }
  const reply = typeof parsed.reply === 'string' ? parsed.reply : ''
  const evalObj = (parsed.eval || {}) as Record<string, unknown>
  return {
    reply: reply.slice(0, 2000),
    eval: {
      biblical: clampScore(evalObj.biblical),
      magisterium: clampScore(evalObj.magisterium),
      charity: clampScore(evalObj.charity),
      comment:
        typeof evalObj.comment === 'string'
          ? evalObj.comment.slice(0, 240)
          : '—',
    },
    conceded: parsed.conceded === true,
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    if (!(await rateLimit(user.id, 20, 60_000))) {
      return NextResponse.json(
        { error: 'Muitas mensagens. Aguarde um momento.' },
        { status: 429 },
      )
    }

    const budget = await checkAndConsumeAiBudget(user.id, 'educa_debate')
    if (!budget.allowed) {
      return NextResponse.json(
        {
          error: `Limite diário de debate atingido (${budget.capCalls} turnos). Tente amanhã.`,
        },
        { status: 429 },
      )
    }

    const body = (await req.json()) as {
      topic?: unknown
      messages?: unknown
    }

    const topicSlug = typeof body.topic === 'string' ? body.topic : ''
    const topic = findTopicBySlug(topicSlug)
    if (!topic) {
      return NextResponse.json({ error: 'Tema inválido.' }, { status: 400 })
    }

    const rawMessages = Array.isArray(body.messages) ? body.messages : []
    const messages: ChatMessage[] = []
    for (const m of rawMessages.slice(-MAX_HISTORY)) {
      if (!m || typeof m !== 'object') continue
      const role = (m as { role?: unknown }).role
      const content = (m as { content?: unknown }).content
      if (
        (role === 'user' || role === 'assistant') &&
        typeof content === 'string' &&
        content.trim().length > 0
      ) {
        messages.push({ role, content: content.slice(0, MAX_USER_CHARS) })
      }
    }

    // Validações do último turno do user
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUser) {
      const len = lastUser.content.trim().length
      if (len < MIN_USER_CHARS) {
        return NextResponse.json(
          { error: 'Sua mensagem é muito curta.' },
          { status: 400 },
        )
      }
      const injection = detectPromptInjection(lastUser.content)
      if (injection.suspicious) {
        console.warn(
          `[educa/debate] suspicious input user=${user.id} pattern=${injection.matchedPattern}`,
        )
        return NextResponse.json(
          {
            error:
              'Mensagem não reconhecida. Mantenha o debate sobre o tema escolhido.',
          },
          { status: 400 },
        )
      }
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt(topic) },
        // Se o histórico estiver vazio, instrui a IA a abrir com a frase
        // canônica de abertura — assim a 1ª mensagem é determinística.
        ...(messages.length === 0
          ? [
              {
                role: 'user' as const,
                content: `O usuário acabou de entrar no debate sobre "${topic.title}". Responda abrindo o debate com a seguinte frase EXATAMENTE como reply: """${topic.opening}""". Use eval zerado e comment "—".`,
              },
            ]
          : messages),
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    const out = parseAiReply(raw)

    // Vitória — o oponente concedeu. Persiste a sessão e dispara os contadores
    // do Códex (debates_vencidos / debates_perfeitos). Scores do modelo são
    // 0-3; a função do banco aceita 0-100, então mapeamos *100/3 e arredondamos.
    if (out.conceded) {
      try {
        const admin = createAdminClient()
        const toPct = (n: number) => Math.round((n * 100) / 3)
        await admin.rpc('fn_debate_finalizar', {
          p_user_id: user.id,
          p_tema: topic.title,
          p_score_biblico: toPct(out.eval.biblical),
          p_score_magisterio: toPct(out.eval.magisterium),
          p_score_caridade: toPct(out.eval.charity),
          p_argumentos: messages,
        })
      } catch (e) {
        // Não bloqueia a resposta do debate; só registra no log.
        console.error('[educa/debate] fn_debate_finalizar falhou:', e)
      }
    }

    return NextResponse.json(out, {
      headers: {
        // Resposta personalizada por turno — jamais cachear ou compartilhar
        // entre usuários. CDNs e Service Workers do PWA respeitam isso.
        'Cache-Control': 'private, no-store, max-age=0',
      },
    })
  } catch (err) {
    console.error('[educa/debate] error:', err)
    return NextResponse.json(
      { error: 'Erro interno no debate.' },
      { status: 500 },
    )
  }
}
