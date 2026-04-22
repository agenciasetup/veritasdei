import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendPushToUsers } from '@/lib/push/send'
import { comunidadeRezouPorMim } from '@/lib/push/templates'

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

  const { data: existing } = await supabase
    .from('pedidos_oracao_rezas')
    .select('pedido_id')
    .eq('pedido_id', body.pedido_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
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
    if (!String(insErr.message).includes('duplicate')) {
      return NextResponse.json({ error: 'db_error' }, { status: 500 })
    }
  }

  // Fire-and-forget: notifica o dono do pedido ("X rezou por você").
  // Não bloqueia a resposta HTTP — se o push falhar, a ação continua válida.
  notifyPedidoOwner(supabase, body.pedido_id, user.id).catch((err) =>
    console.warn('[pedidos-oracao/rezei] push falhou:', err),
  )

  return NextResponse.json({ ok: true, rezou: true })
}

async function notifyPedidoOwner(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  pedidoId: string,
  rezouUserId: string,
) {
  const { data: pedido } = await supabase
    .from('pedidos_oracao')
    .select('user_id')
    .eq('id', pedidoId)
    .maybeSingle()
  if (!pedido || pedido.user_id === rezouUserId) return

  const { data: rezouProfile } = await supabase
    .from('profiles')
    .select('name, public_handle')
    .eq('id', rezouUserId)
    .maybeSingle()

  const autor =
    rezouProfile?.name?.split(' ')[0] ||
    (rezouProfile?.public_handle ? `@${rezouProfile.public_handle}` : 'Um irmão')

  await sendPushToUsers(
    [pedido.user_id],
    comunidadeRezouPorMim({ autor, pedidoId }),
    { categoria: 'comunidade' },
  )
}
