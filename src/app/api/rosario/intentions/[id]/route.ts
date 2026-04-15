import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * PATCH  /api/rosario/intentions/[id]
 *        body: { titulo?, descricao?, arquivada? }
 *        → atualiza campos permitidos da intenção do usuário.
 *
 * DELETE /api/rosario/intentions/[id]
 *        → remove a intenção (rosary_sessions.intention_id vira NULL
 *          via FK ON DELETE SET NULL).
 */

interface PatchBody {
  titulo?: unknown
  descricao?: unknown
  arquivada?: unknown
}

function sanitizePatch(body: PatchBody): Record<string, unknown> | null {
  const patch: Record<string, unknown> = {}

  if ('titulo' in body) {
    if (typeof body.titulo !== 'string') return null
    const titulo = body.titulo.trim()
    if (titulo.length === 0 || titulo.length > 120) return null
    patch.titulo = titulo
  }

  if ('descricao' in body) {
    if (body.descricao === null) {
      patch.descricao = null
    } else if (typeof body.descricao === 'string') {
      const trimmed = body.descricao.trim()
      if (trimmed.length > 1000) return null
      patch.descricao = trimmed.length > 0 ? trimmed : null
    } else {
      return null
    }
  }

  if ('arquivada' in body) {
    if (typeof body.arquivada !== 'boolean') return null
    patch.arquivada = body.arquivada
  }

  if (Object.keys(patch).length === 0) return null
  return patch
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
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
    .from('rosary_intentions')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id) // defense-in-depth além da RLS
    .select('id, user_id, titulo, descricao, arquivada, created_at, updated_at')
    .single()

  if (error) {
    console.error('[rosary_intentions] update error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ intention: data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const { error } = await supabase
    .from('rosary_intentions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[rosary_intentions] delete error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
