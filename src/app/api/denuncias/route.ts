import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TIPOS = ['pedido_oracao', 'intencao_publica', 'comentario'] as const
const CATEGORIAS = ['heterodoxo', 'supersticao', 'sensacionalista', 'ofensivo', 'spam', 'outro'] as const

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let body: {
    conteudo_tipo?: string
    conteudo_id?: string
    categoria?: string
    detalhes?: string
  }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  if (!body.conteudo_tipo || !(TIPOS as readonly string[]).includes(body.conteudo_tipo)) {
    return NextResponse.json({ error: 'invalid_conteudo_tipo' }, { status: 400 })
  }
  if (!body.categoria || !(CATEGORIAS as readonly string[]).includes(body.categoria)) {
    return NextResponse.json({ error: 'invalid_categoria' }, { status: 400 })
  }
  if (!body.conteudo_id || !/^[0-9a-f-]{36}$/i.test(body.conteudo_id)) {
    return NextResponse.json({ error: 'invalid_conteudo_id' }, { status: 400 })
  }
  const detalhes = body.detalhes ? String(body.detalhes).trim().slice(0, 500) : null

  const { data, error } = await supabase.rpc('denunciar_conteudo', {
    p_conteudo_tipo: body.conteudo_tipo,
    p_conteudo_id: body.conteudo_id,
    p_categoria: body.categoria,
    p_detalhes: detalhes,
  })

  if (error) {
    // unique constraint = already reported
    if (String(error.message).toLowerCase().includes('duplicate')) {
      return NextResponse.json({ ok: true, already_reported: true })
    }
    console.error('[denuncias] RPC error', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, denuncia_id: data })
}
