import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/pedidos-oracao/rezei { pedido_id } — toggle "rezei por você"
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let body: { pedido_id?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  if (!body.pedido_id) return NextResponse.json({ error: 'missing_pedido_id' }, { status: 400 })

  // Checa se já rezou
  const { data: existing } = await supabase
    .from('pedidos_oracao_rezas')
    .select('pedido_id')
    .eq('pedido_id', body.pedido_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    // Desmarca (toggle)
    const { error: delErr } = await supabase
      .from('pedidos_oracao_rezas')
      .delete()
      .eq('pedido_id', body.pedido_id)
      .eq('user_id', user.id)
    if (delErr) return NextResponse.json({ error: 'db_error' }, { status: 500 })
    return NextResponse.json({ ok: true, rezou: false })
  }

  const { error: insErr } = await supabase
    .from('pedidos_oracao_rezas')
    .insert({ pedido_id: body.pedido_id, user_id: user.id })
  if (insErr) {
    // Conflict (duplicate) é OK — race condition
    if (!String(insErr.message).includes('duplicate')) {
      return NextResponse.json({ error: 'db_error' }, { status: 500 })
    }
  }
  return NextResponse.json({ ok: true, rezou: true })
}
