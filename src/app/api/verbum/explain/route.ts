import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai/client'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { VERBUM_SYSTEM_PROMPT } from '@/verbum/prompts/theologicalPrompts'

export async function POST(request: NextRequest) {
  try {
    // Auth check — prevent unauthenticated GPT-4o usage
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    // Rate limit: 10 requests per minute per user
    if (!rateLimit(user.id, 10, 60_000)) {
      return NextResponse.json({ error: 'Muitas requisições. Aguarde um momento.' }, { status: 429 })
    }

    const body = await request.json()
    const { prompt, mode } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (prompt.length > 5000) {
      return NextResponse.json({ error: 'Prompt muito longo. Máximo 5000 caracteres.' }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: VERBUM_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
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
