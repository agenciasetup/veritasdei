import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai/client'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { checkAndConsumeAiBudget } from '@/lib/ai/budget'
import {
  wrapUserInput,
  detectPromptInjection,
  SYSTEM_INJECTION_GUARD,
} from '@/lib/ai/prompt-defense'
import { VERBUM_SYSTEM_PROMPT } from '@/verbum/prompts/theologicalPrompts'

export async function POST(request: NextRequest) {
  try {
    // Auth check — prevent unauthenticated GPT-4o usage
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    // Rate limit: 20 requests per minute per user
    if (!(await rateLimit(user.id, 20, 60_000))) {
      return NextResponse.json({ error: 'Muitas requisições. Aguarde um momento.' }, { status: 429 })
    }

    // Daily budget: cap diário de calls por feature. Impede que um user
    // mantenha 20/min por 24h = 28.800 calls/dia (~R$2.880) burlando o
    // rate limit por minuto. Consome +1 atomicamente.
    const budget = await checkAndConsumeAiBudget(user.id, 'verbum_explain')
    if (!budget.allowed) {
      return NextResponse.json(
        { error: `Limite diário atingido (${budget.capCalls} chamadas). Tente novamente amanhã.` },
        { status: 429 },
      )
    }

    const body = await request.json()
    const { prompt, mode } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (prompt.length > 5000) {
      return NextResponse.json({ error: 'Prompt muito longo. Máximo 5000 caracteres.' }, { status: 400 })
    }

    // Heurística pré-modelo: se o prompt tem padrão óbvio de jailbreak,
    // loga e rejeita antes de gastar token.
    const injectionCheck = detectPromptInjection(prompt)
    if (injectionCheck.suspicious) {
      console.warn(
        `[verbum/explain] Suspicious prompt rejected — user=${user.id} pattern=${injectionCheck.matchedPattern}`
      )
      return NextResponse.json(
        { error: 'Pergunta não reconhecida. Faça uma pergunta sobre teologia ou espiritualidade católica.' },
        { status: 400 },
      )
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        // System = guard primeiro (prioridade máxima no contexto), depois
        // o prompt teológico. Input do usuário isolado em tags raras.
        { role: 'system', content: `${SYSTEM_INJECTION_GUARD}\n\n${VERBUM_SYSTEM_PROMPT}` },
        { role: 'user', content: wrapUserInput(prompt) },
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 500 })
    }

    const parsed = JSON.parse(content)
    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Verbum AI error:', error)
    return NextResponse.json(
      { error: 'AI service temporarily unavailable' },
      { status: 500 }
    )
  }
}
