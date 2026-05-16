import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 *   POST /api/rosario/skins/equipar
 *     body: { skin_id: string }
 *
 * Define a skin ativa do user. Delega pra RPC `fn_set_active_rosary_skin`
 * que roda como SECURITY DEFINER — necessário porque a policy UPDATE
 * `profiles_admin_update_all` (pré-existente) faz EXISTS recursivo na
 * própria tabela profiles, quebrando qualquer UPDATE feito direto via
 * PostgREST com cookie autenticado.
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let body: { skin_id?: unknown }
  try {
    body = (await req.json()) as { skin_id?: unknown }
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const skinId = typeof body.skin_id === 'string' ? body.skin_id : null
  if (!skinId) {
    return NextResponse.json({ error: 'invalid_skin_id' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('fn_set_active_rosary_skin', {
    p_skin_id: skinId,
  })

  if (error) {
    const msg = error.message ?? ''
    if (msg.includes('not_authenticated')) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    if (msg.includes('skin_unavailable')) {
      return NextResponse.json({ error: 'skin_unavailable' }, { status: 410 })
    }
    if (msg.includes('skin_not_owned')) {
      return NextResponse.json({ error: 'skin_not_owned' }, { status: 403 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json({ ok: true, active_skin_id: data ?? skinId })
}
