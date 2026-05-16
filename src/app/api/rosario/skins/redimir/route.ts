import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { rowToSkin } from '@/features/rosario/skins/loadActiveSkin'

/**
 *   POST /api/rosario/skins/redimir
 *     body: { codigo: string }
 *
 * Resgata um código de terço físico → desbloqueia a skin associada.
 * Delega pra função SQL `fn_redimir_rosary_code(p_codigo)`.
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let body: { codigo?: unknown }
  try {
    body = (await req.json()) as { codigo?: unknown }
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const codigo =
    typeof body.codigo === 'string' ? body.codigo.trim().toUpperCase() : null
  if (!codigo || !/^[A-Z0-9]{6,16}$/.test(codigo)) {
    return NextResponse.json({ error: 'invalid_code_format' }, { status: 400 })
  }

  const { data: skinRow, error } = await supabase.rpc('fn_redimir_rosary_code', {
    p_codigo: codigo,
  })

  if (error) {
    const message = error.message ?? ''
    if (message.includes('not_authenticated')) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    if (message.includes('code_not_found')) {
      return NextResponse.json({ error: 'code_not_found' }, { status: 404 })
    }
    if (message.includes('code_already_used')) {
      return NextResponse.json({ error: 'code_already_used' }, { status: 409 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }

  if (!skinRow) {
    return NextResponse.json({ error: 'unknown_error' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    skin: rowToSkin(skinRow as Record<string, unknown>),
  })
}
