import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/push/subscribe
 *   body: { subscription: PushSubscriptionJSON, timezone?: string }
 *   → salva endpoint+keys em user_notificacoes_prefs, ativa push_enabled.
 *
 * DELETE /api/push/subscribe
 *   → limpa endpoint+keys, seta push_enabled=false.
 *
 * Tudo com RLS do usuário logado — clients não conseguem mexer em registros
 * de outras pessoas.
 */

interface SubBody {
  subscription: {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }
  timezone?: string
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let body: SubBody
  try {
    body = (await req.json()) as SubBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const sub = body?.subscription
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: 'invalid_subscription' }, { status: 400 })
  }

  const ua = req.headers.get('user-agent')?.slice(0, 400) ?? null

  const { error } = await supabase
    .from('user_notificacoes_prefs')
    .upsert(
      {
        user_id: user.id,
        push_enabled: true,
        push_endpoint: sub.endpoint,
        push_p256dh: sub.keys.p256dh,
        push_auth: sub.keys.auth,
        push_user_agent: ua,
        timezone: body.timezone ?? 'America/Sao_Paulo',
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

  if (error) {
    console.error('[push/subscribe] upsert error', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { error } = await supabase
    .from('user_notificacoes_prefs')
    .update({
      push_enabled: false,
      push_endpoint: null,
      push_p256dh: null,
      push_auth: null,
      atualizado_em: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) {
    console.error('[push/subscribe] delete error', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
