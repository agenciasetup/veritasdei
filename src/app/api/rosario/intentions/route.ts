import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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

interface IntentionDraftBody {
  titulo?: unknown
  descricao?: unknown
}

function sanitizeDraft(body: IntentionDraftBody) {
  if (typeof body.titulo !== 'string') return null
  const titulo = body.titulo.trim()
  if (titulo.length === 0 || titulo.length > 120) return null
  let descricao: string | null = null
  if (typeof body.descricao === 'string') {
    const trimmed = body.descricao.trim()
    if (trimmed.length > 1000) return null
    descricao = trimmed.length > 0 ? trimmed : null
  }
  return { titulo, descricao }
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
    .from('rosary_intentions')
    .select('id, user_id, titulo, descricao, arquivada, created_at, updated_at')
    .eq('user_id', user.id)
    .order('arquivada', { ascending: true })
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[rosary_intentions] select error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ intentions: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let body: IntentionDraftBody
  try {
    body = (await req.json()) as IntentionDraftBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const draft = sanitizeDraft(body)
  if (!draft) {
    return NextResponse.json({ error: 'invalid_fields' }, { status: 400 })
  }

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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ intention: data })
}
