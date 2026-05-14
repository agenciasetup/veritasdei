/**
 * /api/admin/colecao — ações administrativas do Códex Veritas.
 *
 * - test-unlock:    força o desbloqueio de uma carta para um usuário (por
 *                   e-mail), para o admin conferir a carta sem cumprir a regra.
 * - reevaluate-all: reavalia todos os usuários (chamar após publicar/editar a
 *                   regra de uma carta — os triggers só pegam eventos novos).
 *
 * Gate: role=admin no profile. As escritas usam o client service_role porque
 * user_cartas não aceita INSERT direto (só o motor) e fn_avaliar_cartas_todos
 * é service_role-only.
 */
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body =
  | { action: 'test-unlock'; email: string; carta_id: string }
  | { action: 'reevaluate-all' }

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle<{ role: string }>()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const admin = createAdminClient()

  if (body.action === 'reevaluate-all') {
    const { data, error } = await admin.rpc('fn_avaliar_cartas_todos')
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, usuarios_avaliados: data })
  }

  if (body.action === 'test-unlock') {
    const email = (body.email || '').trim().toLowerCase()
    if (!email || !body.carta_id) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }
    const { data: alvo } = await admin
      .from('profiles')
      .select('id, name')
      .ilike('email', email)
      .maybeSingle<{ id: string; name: string | null }>()
    if (!alvo) {
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
    }
    const { error } = await admin
      .from('user_cartas')
      .upsert(
        { user_id: alvo.id, carta_id: body.carta_id, vista: false },
        { onConflict: 'user_id,carta_id', ignoreDuplicates: true },
      )
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, user: alvo.name ?? alvo.id })
  }

  return NextResponse.json({ error: 'unknown_action' }, { status: 400 })
}
