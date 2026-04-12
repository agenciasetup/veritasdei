import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/push/test
 *
 * Gatilho de teste que chama a Edge Function `send-push` com o service-role
 * key (ficamos server-side — nunca expomos o service key pro browser) e
 * envia uma notificação pro próprio usuário autenticado.
 *
 * Usada pelo botão "Enviar teste" na seção de notificações do perfil.
 */
export async function POST(_req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
    },
    body: JSON.stringify({
      user_ids: [user.id],
      payload: {
        title: '✝ Veritas Dei',
        body: 'Suas notificações estão funcionando. Que Deus te abençoe!',
        url: '/',
        tag: 'test',
      },
    }),
  })

  const result = await res.json().catch(() => ({}))
  if (!res.ok) {
    return NextResponse.json(
      { error: 'push_failed', detail: result },
      { status: 502 },
    )
  }
  return NextResponse.json({ ok: true, result })
}
