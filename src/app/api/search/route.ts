import { NextRequest, NextResponse } from 'next/server'
import { searchCorpus } from '@/lib/rag/search'

// TODO: adicionar rate limiting com Upstash Redis

export async function POST(req: NextRequest) {
  try {
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
