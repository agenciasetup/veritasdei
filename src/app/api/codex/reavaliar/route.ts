/**
 * /api/codex/reavaliar — reavalia as cartas do próprio usuário autenticado.
 *
 * Útil quando o app sabe que algo mudou e quer forçar a checagem sem esperar
 * um trigger (ex.: o usuário acabou de cumprir uma condição cuja origem não
 * tem trigger). É seguro: só reavalia auth.uid(), e fn_avaliar_cartas só
 * desbloqueia o que a pessoa genuinamente conquistou — não há como forjar.
 *
 * A função fn_avaliar_cartas é service_role-only, então a rota usa o client
 * admin, mas SEMPRE com o id do usuário autenticado — nunca um id arbitrário.
 */
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { error } = await admin.rpc('fn_avaliar_cartas', {
    p_user_id: user.id,
  })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
