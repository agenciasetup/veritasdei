import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/novenas/reminders
 *
 * Endpoint chamado por um cron job (ex: Vercel Cron, Supabase pg_cron)
 * para enviar lembretes push de novena diária a todos os usuários
 * que possuem novenas ativas e push habilitado.
 *
 * Protegido por CRON_SECRET no header Authorization.
 *
 * Fluxo:
 *   1. Busca todos os progress com completed_at IS NULL
 *   2. Para cada usuário distinto, verifica se tem push habilitado
 *   3. Envia push via Edge Function send-push
 *   4. Registra no feed in-app com dedupe diário
 */

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Se CRON_SECRET definido, valida. Senão, aceita service-role key.
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }

  // Admin client (bypassa RLS)
  const supabase = createClient(supabaseUrl, serviceKey)

  // Buscar todos os user_ids com novenas ativas
  const { data: activeProgress, error: progressErr } = await supabase
    .from('novenas_progress')
    .select('user_id, builtin_slug, custom_novena_id, current_day')
    .is('completed_at', null)

  if (progressErr) {
    console.error('[novenas/reminders] progress fetch error', progressErr)
    return NextResponse.json({ error: progressErr.message }, { status: 500 })
  }

  if (!activeProgress || activeProgress.length === 0) {
    return NextResponse.json({ sent: 0, message: 'no_active_novenas' })
  }

  // Agrupar por user_id (um lembrete por usuário, não por novena)
  const userNovenas = new Map<string, { slug: string | null; day: number }>()
  for (const p of activeProgress) {
    if (!userNovenas.has(p.user_id)) {
      userNovenas.set(p.user_id, {
        slug: p.builtin_slug,
        day: p.current_day,
      })
    }
  }

  const userIds = Array.from(userNovenas.keys())

  // Buscar quais desses usuários têm push habilitado
  const { data: pushUsers } = await supabase
    .from('user_notificacoes_prefs')
    .select('user_id')
    .in('user_id', userIds)
    .eq('push_enabled', true)
    .not('push_endpoint', 'is', null)

  const pushUserIds = (pushUsers ?? []).map(u => u.user_id)

  let pushSent = 0

  // Enviar push em lotes de 10
  for (let i = 0; i < pushUserIds.length; i += 10) {
    const batch = pushUserIds.slice(i, i + 10)

    try {
      await fetch(`${supabaseUrl}/functions/v1/send-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
        },
        body: JSON.stringify({
          user_ids: batch,
          payload: {
            title: 'Hora da Novena',
            body: 'Não esqueça de rezar sua novena hoje. A perseverança é o caminho da graça.',
            url: '/novenas/minhas',
            tag: 'novena-daily',
          },
        }),
      })
      pushSent += batch.length
    } catch (err) {
      console.error('[novenas/reminders] push batch error', err)
    }
  }

  // Registrar no feed in-app para todos os usuários com novenas ativas
  const dayKey = new Date().toISOString().slice(0, 10)
  const feedRows = userIds.map(userId => {
    const info = userNovenas.get(userId)!
    return {
      user_id: userId,
      type: 'novena_reminder',
      title: 'Hora da Novena',
      body: `Dia ${info.day} de 9 — continue sua novena hoje.`,
      target_url: '/novenas/minhas',
      source: 'novena_cron',
      payload: { slug: info.slug, day: info.day },
      dedupe_key: `novena-reminder:${dayKey}`,
    }
  })

  if (feedRows.length > 0) {
    const { error: feedErr } = await supabase
      .from('user_notificacoes_feed')
      .upsert(feedRows, { onConflict: 'user_id,dedupe_key' })

    if (feedErr) {
      console.error('[novenas/reminders] feed upsert error', feedErr)
    }
  }

  return NextResponse.json({
    sent: pushSent,
    feed_notified: userIds.length,
    total_active_users: userIds.length,
  })
}
