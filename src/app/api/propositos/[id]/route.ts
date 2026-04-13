import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * PATCH /api/propositos/[id]
 *   body: Partial<PropositoDraft>
 *   → atualiza propósito do usuário autenticado.
 *
 * DELETE /api/propositos/[id]
 *   → apaga (logs cascateiam via FK).
 */

interface PatchBody {
  tipo?: string
  titulo?: string
  descricao?: string | null
  cadencia?: 'diaria' | 'semanal' | 'mensal' | 'dias_semana'
  meta_por_periodo?: number
  dias_semana?: number[] | null
  horario_sugerido?: string | null
  ativo?: boolean
}

const ALLOWED: (keyof PatchBody)[] = [
  'tipo',
  'titulo',
  'descricao',
  'cadencia',
  'meta_por_periodo',
  'dias_semana',
  'horario_sugerido',
  'ativo',
]

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let body: PatchBody
  try {
    body = (await req.json()) as PatchBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  // whitelist dos campos permitidos — evita mexer em user_id/created_at/id
  const patch: Record<string, unknown> = {}
  for (const key of ALLOWED) {
    if (key in body) patch[key] = body[key]
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'empty_patch' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('user_propositos')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id) // defense-in-depth além da RLS
    .select('*')
    .single()

  if (error) {
    console.error('[propositos] update error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ proposito: data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { error } = await supabase
    .from('user_propositos')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[propositos] delete error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
