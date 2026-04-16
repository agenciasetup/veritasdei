import { NextResponse } from 'next/server'
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
export async function POST() {
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

  // Também registra no feed in-app com dedupe diário.
  const dayKey = new Date().toISOString().slice(0, 10)
  const { error: feedErr } = await supabase
    .from('user_notificacoes_feed')
    .upsert(
      {
        user_id: user.id,
        type: 'push_test',
        title: 'Notificação de teste enviada',
        body: 'Seu teste de push foi enviado com sucesso.',
        target_url: '/',
        source: 'push_test',
        payload: { provider: 'supabase_edge_function' },
        dedupe_key: `push-test:${dayKey}`,
      },
      { onConflict: 'user_id,dedupe_key' },
    )

  if (feedErr) {
    console.error('[push/test] notification feed error', feedErr)
  }

  return NextResponse.json({ ok: true, result })
}
