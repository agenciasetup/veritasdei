import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/propositos
 *   body: PropositoDraft
 *   → cria um novo propósito para o usuário autenticado.
 *
 * Server-side por dois motivos:
 *  1) Contorna qualquer flakiness do browser client (algumas redes/extensões
 *     bloqueiam PATCH/POST diretos no postgrest e a promise fica pendurada).
 *  2) `user_id` é derivado do auth.getUser() — impossível forjar a identidade.
 */

interface DraftBody {
  tipo: string
  titulo: string
  descricao?: string | null
  cadencia: 'diaria' | 'semanal' | 'mensal' | 'dias_semana'
  meta_por_periodo: number
  dias_semana?: number[] | null
  horario_sugerido?: string | null
  ativo: boolean
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let body: DraftBody
  try {
    body = (await req.json()) as DraftBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (!body?.titulo?.trim() || !body?.tipo || !body?.cadencia) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('user_propositos')
    .insert({
      user_id: user.id,
      tipo: body.tipo,
      titulo: body.titulo.trim(),
      descricao: body.descricao ?? null,
      cadencia: body.cadencia,
      meta_por_periodo: Math.max(1, body.meta_por_periodo ?? 1),
      dias_semana: body.dias_semana ?? null,
      horario_sugerido: body.horario_sugerido ?? null,
      ativo: body.ativo ?? true,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[propositos] insert error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ proposito: data })
}
