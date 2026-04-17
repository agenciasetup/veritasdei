import { NextRequest, NextResponse } from 'next/server'
import { searchCorpus } from '@/lib/rag/search'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    if (!(await rateLimit(user.id, 15, 60_000))) {
      return NextResponse.json({ error: 'Muitas requisições. Aguarde um momento.' }, { status: 429 })
    }

    const { query } = await req.json()

    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return NextResponse.json({ error: 'Pergunta inválida. Mínimo 3 caracteres.' }, { status: 400 })
    }
    if (query.length > 500) {
      return NextResponse.json({ error: 'Pergunta muito longa. Máximo 500 caracteres.' }, { status: 400 })
    }

    const result = await searchCorpus(query.trim())

    // Extract structured data for the Verbum canvas
    const verses = result.pillars
      .find(p => p.pillar === 'biblia')
      ?.results.map(r => ({
        reference: r.reference,
        text: r.text,
        similarity: r.similarity,
      })) || []

    const magisterium = result.pillars
      .find(p => p.pillar === 'magisterio')
      ?.results.map(r => ({
        reference: r.reference,
        text: r.text,
      })) || []

    const patristic = result.pillars
      .find(p => p.pillar === 'patristica')
      ?.results.map(r => ({
        reference: r.reference,
        text: r.text,
      })) || []

    return NextResponse.json({
      query: result.query,
      insight: result.insight,
      verses,
      magisterium,
      patristic,
      tags: result.tags,
    })
  } catch (err) {
    console.error('[verbum/research] error:', err)
    return NextResponse.json({ error: 'Erro interno ao pesquisar.' }, { status: 500 })
  }
}
