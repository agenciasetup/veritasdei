import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET  /api/novenas/custom         — lista novenas custom do usuário
 * POST /api/novenas/custom         — cria nova novena custom (9 dias)
 */

interface NovenaDay {
  titulo: string
  texto: string
}

interface CustomDraftBody {
  titulo?: unknown
  descricao?: unknown
  dias?: unknown
}

function sanitizeDay(d: unknown): NovenaDay | null {
  if (typeof d !== 'object' || d === null) return null
  const day = d as Record<string, unknown>
  if (typeof day.titulo !== 'string' || typeof day.texto !== 'string') return null
  const titulo = day.titulo.trim()
  const texto = day.texto.trim()
  if (titulo.length === 0 || titulo.length > 200) return null
  if (texto.length === 0 || texto.length > 5000) return null
  return { titulo, texto }
}

function sanitizeDraft(body: CustomDraftBody) {
  if (typeof body.titulo !== 'string') return null
  const titulo = body.titulo.trim()
  if (titulo.length === 0 || titulo.length > 200) return null

  let descricao: string | null = null
  if (typeof body.descricao === 'string') {
    const trimmed = body.descricao.trim()
    if (trimmed.length > 2000) return null
    descricao = trimmed.length > 0 ? trimmed : null
  }

  if (!Array.isArray(body.dias) || body.dias.length !== 9) return null
  const dias: NovenaDay[] = []
  for (const raw of body.dias) {
    const day = sanitizeDay(raw)
    if (!day) return null
    dias.push(day)
  }

  return { titulo, descricao, dias }
}

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('novenas_custom')
    .select('id, user_id, titulo, descricao, dias, arquivada, created_at, updated_at')
    .eq('user_id', user.id)
    .order('arquivada', { ascending: true })
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[novenas/custom] select error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ novenas: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let body: CustomDraftBody
  try {
    body = (await req.json()) as CustomDraftBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const draft = sanitizeDraft(body)
  if (!draft) {
    return NextResponse.json({ error: 'invalid_fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('novenas_custom')
    .insert({
      user_id: user.id,
      titulo: draft.titulo,
      descricao: draft.descricao,
      dias: draft.dias,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[novenas/custom] insert error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ novena: data })
}
