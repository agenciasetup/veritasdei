import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * PATCH  /api/novenas/custom/[id]  — atualiza novena custom
 * DELETE /api/novenas/custom/[id]  — deleta novena custom
 */

interface NovenaDay {
  titulo: string
  texto: string
}

interface PatchBody {
  titulo?: unknown
  descricao?: unknown
  dias?: unknown
  arquivada?: unknown
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

function sanitizePatch(body: PatchBody) {
  const patch: Record<string, unknown> = {}

  if (body.titulo !== undefined) {
    if (typeof body.titulo !== 'string') return null
    const titulo = body.titulo.trim()
    if (titulo.length === 0 || titulo.length > 200) return null
    patch.titulo = titulo
  }

  if (body.descricao !== undefined) {
    if (body.descricao === null) {
      patch.descricao = null
    } else if (typeof body.descricao === 'string') {
      const trimmed = body.descricao.trim()
      if (trimmed.length > 2000) return null
      patch.descricao = trimmed.length > 0 ? trimmed : null
    } else {
      return null
    }
  }

  if (body.dias !== undefined) {
    if (!Array.isArray(body.dias) || body.dias.length !== 9) return null
    const dias: NovenaDay[] = []
    for (const raw of body.dias) {
      const day = sanitizeDay(raw)
      if (!day) return null
      dias.push(day)
    }
    patch.dias = dias
  }

  if (body.arquivada !== undefined) {
    if (typeof body.arquivada !== 'boolean') return null
    patch.arquivada = body.arquivada
  }

  if (Object.keys(patch).length === 0) return null
  return patch
}

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let body: PatchBody
  try {
    body = (await req.json()) as PatchBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const patch = sanitizePatch(body)
  if (!patch) {
    return NextResponse.json({ error: 'invalid_fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('novenas_custom')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single()

  if (error) {
    console.error('[novenas/custom/id] update error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ novena: data })
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const { error } = await supabase
    .from('novenas_custom')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[novenas/custom/id] delete error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: true })
}
