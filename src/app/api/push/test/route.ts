import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendPushToUsers } from '@/lib/push/send'
import { testar } from '@/lib/push/templates'

/**
 * POST /api/push/test
 *
 * Envia uma notificação de teste para o próprio usuário autenticado.
 * Usa a lib `sendPushToUsers` (web-push + VAPID) — sem Edge Function.
 *
 * Ignora filtros por categoria (categoria: 'test' passa direto).
 */
export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const result = await sendPushToUsers([user.id], testar(), { categoria: 'test' })

  if (result.sent === 0) {
    return NextResponse.json(
      {
        error: 'push_failed',
        detail: result,
        hint:
          result.skipped > 0
            ? 'Nenhuma subscription ativa — reative o toggle.'
            : 'Push service rejeitou. Verifique VAPID keys.',
      },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true, result })
}
