import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 *   POST /api/rosario/skins/equipar
 *     body: { skin_id: string }
 *
 * Define a skin ativa do usuário (`profiles.active_rosary_skin_id`).
 * Valida que o user é dono da skin (existe linha em user_rosary_skins).
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

  // Confirma que o usuário possui a skin
  const { data: ownership } = await supabase
    .from('user_rosary_skins')
    .select('skin_id')
    .eq('user_id', user.id)
    .eq('skin_id', skinId)
    .maybeSingle()

  if (!ownership) {
    return NextResponse.json({ error: 'skin_not_owned' }, { status: 403 })
  }

  // Confirma que a skin é publicada (não pode equipar uma admin-only oculta)
  const { data: skin } = await supabase
    .from('rosary_skins')
    .select('id, status, visivel')
    .eq('id', skinId)
    .maybeSingle()

  if (!skin || skin.status !== 'published' || !skin.visivel) {
    return NextResponse.json({ error: 'skin_unavailable' }, { status: 410 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ active_rosary_skin_id: skinId })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, active_skin_id: skinId })
}
