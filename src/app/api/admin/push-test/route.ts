/**
 * POST /api/admin/push-test
 *   body: { targetUserId?: string, title: string, body: string, url?: string }
 *
 * Dispara uma notificação push de teste — vai pra ambos canais (Web Push
 * + FCM) que o usuário-alvo tiver configurado.
 *
 * Sem `targetUserId` → manda pra si próprio (admin).
 * Com `targetUserId` → manda pro user específico (precisa existir).
 *
 * Apenas admin/moderator. Categoria 'test' não passa pelos filtros de
 * preferência (CATEGORIA_TO_COLUMN[test] = null).
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToUsers } from '@/lib/push/send'
import { getFcmStatus } from '@/lib/push/fcm'

interface Body {
  targetUserId?: string
  title?: string
  body?: string
  url?: string
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  const { ctx } = guard

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const title = (body.title ?? '').trim()
  const text = (body.body ?? '').trim()
  if (!title || !text) {
    return NextResponse.json(
      { error: 'title e body obrigatórios' },
      { status: 400 },
    )
  }

  const targetId = body.targetUserId?.trim() || ctx.user.id
  // Validação superficial de UUID
  if (!/^[0-9a-f-]{36}$/i.test(targetId)) {
    return NextResponse.json({ error: 'targetUserId inválido' }, { status: 400 })
  }

  const url =
    typeof body.url === 'string' && body.url.startsWith('/') ? body.url : '/'

  // Cliente service role pra bypassar RLS — diagnóstico precisa ler
  // prefs de QUALQUER usuário (não só o admin logado), e o
  // sendPushToUsers também precisa do mesmo poder.
  const adminDb = createAdminClient()

  const { data: prefRow } = await adminDb
    .from('user_notificacoes_prefs')
    .select(
      'push_enabled, push_endpoint, push_p256dh, fcm_token, fcm_platform, fcm_registered_at',
    )
    .eq('user_id', targetId)
    .maybeSingle()

  const target = {
    user_id: targetId,
    push_enabled: !!prefRow?.push_enabled,
    has_web_push: !!(prefRow?.push_endpoint && prefRow?.push_p256dh),
    has_fcm: !!prefRow?.fcm_token,
    fcm_platform: prefRow?.fcm_platform ?? null,
    fcm_registered_at: prefRow?.fcm_registered_at ?? null,
  }

  const fcm = getFcmStatus()

  const result = await sendPushToUsers(
    [targetId],
    {
      title,
      body: text,
      url,
      tag: `admin-test-${Date.now()}`,
    },
    { categoria: 'test', admin: adminDb },
  )

  return NextResponse.json({
    ok: true,
    target,
    fcm,
    vapid_configured: !!process.env.VAPID_PRIVATE_KEY,
    result,
  })
}
