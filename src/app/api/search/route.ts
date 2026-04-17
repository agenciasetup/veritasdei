import { NextRequest, NextResponse } from 'next/server'
import { searchCorpus } from '@/lib/rag/search'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    // Rate limit: 20 requests per minute per user
    if (!(await rateLimit(user.id, 20, 60_000))) {
      return NextResponse.json({ error: 'Muitas requisições. Aguarde um momento.' }, { status: 429 })
    }

    const { query } = await req.json()

    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return NextResponse.json(
        { error: 'Pergunta inválida. Mínimo 3 caracteres.' },
        { status: 400 }
      )
    }

    if (query.length > 500) {
      return NextResponse.json(
        { error: 'Pergunta muito longa. Máximo 500 caracteres.' },
        { status: 400 }
      )
    }

    const result = await searchCorpus(query.trim())
    return NextResponse.json(result)
  } catch (error) {
    console.error('[search/route] Error:', error)
    return NextResponse.json(
      { error: 'Erro interno. Tente novamente.' },
      { status: 500 }
    )
  }
}
