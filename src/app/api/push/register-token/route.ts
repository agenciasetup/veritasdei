/**
 * POST /api/push/register-token
 *   body: { token: string, platform: 'android' | 'ios' }
 *   → grava o token FCM do device em user_notificacoes_prefs e ativa
 *     push_enabled. Chamado por PushBootstrap quando o app empacotado
 *     abre e o usuário concede permissão.
 *
 * DELETE /api/push/register-token
 *   → limpa só o token FCM (sem mexer no Web Push). Útil quando o
 *     usuário desinstala o app ou revoga a permissão.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface RegisterBody {
  token?: string
  platform?: string
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let body: RegisterBody
  try {
    body = (await req.json()) as RegisterBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const token = body?.token?.trim()
  const platform = body?.platform
  if (!token || token.length < 20) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 })
  }
  if (platform !== 'android' && platform !== 'ios') {
    return NextResponse.json({ error: 'invalid_platform' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('user_notificacoes_prefs')
    .upsert(
      {
        user_id: user.id,
        push_enabled: true,
        fcm_token: token,
        fcm_platform: platform,
        fcm_registered_at: now,
        atualizado_em: now,
      },
      { onConflict: 'user_id' },
    )

  if (error) {
    console.error('[push/register-token] upsert error', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const { error } = await supabase
    .from('user_notificacoes_prefs')
    .update({
      fcm_token: null,
      fcm_platform: null,
      fcm_registered_at: null,
      atualizado_em: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) {
    console.error('[push/register-token] delete error', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
