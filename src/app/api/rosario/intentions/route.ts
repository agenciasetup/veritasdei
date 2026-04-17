import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/api/guard'
import { parseJson } from '@/lib/api/validate'

/**
 * Intenções pessoais do terço — CRUD do usuário autenticado.
 *
 *   GET  /api/rosario/intentions
 *        → lista todas as intenções do usuário (não-arquivadas primeiro,
 *          mais recentes primeiro).
 *
 *   POST /api/rosario/intentions
 *        body: { titulo: string, descricao?: string | null }
 *        → cria uma nova intenção.
 *
 * PATCH e DELETE vivem em `./[id]/route.ts`.
 *
 * Lado servidor (em vez de browser client direto) para que:
 *   1) `user_id` seja derivado do auth.getUser() — impossível forjar;
 *   2) Extensões/proxies que bloqueiam chamadas ao postgrest não quebrem
 *      o fluxo, já que o request sai do servidor do Next.
 */

const draftSchema = z.object({
  titulo: z.string().trim().min(1).max(120),
  descricao: z
    .string()
    .trim()
    .max(1000)
    .nullish()
    .transform(v => (v && v.length > 0 ? v : null)),
})

export async function GET() {
  const guard = await requireUser()
  if (guard instanceof NextResponse) return guard
  const { user, supabase } = guard

  const { data, error } = await supabase
    .from('rosary_intentions')
    .select('id, user_id, titulo, descricao, arquivada, created_at, updated_at')
    .eq('user_id', user.id)
    .order('arquivada', { ascending: true })
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[rosary_intentions] select error', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ intentions: data ?? [] })
}

export async function POST(req: NextRequest) {
  const guard = await requireUser()
  if (guard instanceof NextResponse) return guard
  const { user, supabase } = guard

  const draft = await parseJson(req, draftSchema)
  if (draft instanceof NextResponse) return draft

  const { data, error } = await supabase
    .from('rosary_intentions')
    .insert({
      user_id: user.id,
      titulo: draft.titulo,
      descricao: draft.descricao,
    })
    .select('id, user_id, titulo, descricao, arquivada, created_at, updated_at')
    .single()

  if (error) {
    console.error('[rosary_intentions] insert error', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ intention: data })
}
