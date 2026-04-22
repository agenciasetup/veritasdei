/**
 * Envio de Web Push (VAPID) no runtime Node da Vercel.
 *
 * Chamado por:
 *   - /api/push/test       → teste manual do usuário
 *   - /api/novenas/reminders (cron 8h UTC)
 *   - /api/cron/lembretes  (cron hora-em-hora, fan-out por categoria)
 *   - /api/comunidade/…    → triggers real-time (reação/carta)
 *
 * Fluxo:
 *   1. Busca `user_notificacoes_prefs` dos userIds, filtrando por push_enabled
 *      + categoria específica (pref_liturgia, pref_novenas, etc.).
 *   2. Para cada um, envia via webpush.sendNotification em paralelo (batches).
 *   3. Se o push service responder 404/410 → subscription expirada, limpa.
 *   4. Grava também em user_notificacoes_feed para o usuário ver in-app
 *      mesmo se o dispositivo estiver offline / permissão revogada.
 */

import webpush, { type PushSubscription as WebPushSubscription } from 'web-push'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Categoria, PushPayload } from './templates'

let vapidConfigured = false

function ensureVapid() {
  if (vapidConfigured) return true
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:suporte@veritasdei.com.br'
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  vapidConfigured = true
  return true
}

function getAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

const CATEGORIA_TO_COLUMN: Record<Categoria, string | null> = {
  liturgia: 'pref_liturgia',
  angelus: 'pref_angelus',
  novena: 'pref_novenas',
  exame: 'pref_exame',
  comunidade: 'pref_comunidade',
  cartas: 'pref_comunidade',
  test: null,
}

interface PrefRow {
  user_id: string
  push_endpoint: string | null
  push_p256dh: string | null
  push_auth: string | null
}

export interface SendResult {
  sent: number
  failed: number
  cleaned: number
  skipped: number
}

export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload,
  opts: { categoria: Categoria; admin?: SupabaseClient } = { categoria: 'test' },
): Promise<SendResult> {
  const result: SendResult = { sent: 0, failed: 0, cleaned: 0, skipped: 0 }
  if (!userIds.length) return result
  if (!ensureVapid()) {
    console.error('[push/send] VAPID keys não configuradas')
    result.skipped = userIds.length
    return result
  }

  const supabase = opts.admin ?? getAdminClient()
  if (!supabase) {
    console.error('[push/send] admin client indisponível')
    result.skipped = userIds.length
    return result
  }

  const column = CATEGORIA_TO_COLUMN[opts.categoria]
  let query = supabase
    .from('user_notificacoes_prefs')
    .select('user_id, push_endpoint, push_p256dh, push_auth')
    .in('user_id', userIds)
    .eq('push_enabled', true)
    .not('push_endpoint', 'is', null)
  if (column) query = query.eq(column, true)

  const { data: rows, error } = await query
  if (error) {
    console.error('[push/send] prefs fetch error', error)
    result.skipped = userIds.length
    return result
  }

  const prefRows = (rows ?? []) as PrefRow[]
  result.skipped = userIds.length - prefRows.length

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url,
    tag: payload.tag,
  })

  const expiredUsers: string[] = []

  // Envio em batches para evitar bursts enormes
  const BATCH = 50
  for (let i = 0; i < prefRows.length; i += BATCH) {
    const slice = prefRows.slice(i, i + BATCH)
    const outcomes = await Promise.allSettled(
      slice.map((row) =>
        webpush.sendNotification(
          {
            endpoint: row.push_endpoint!,
            keys: { p256dh: row.push_p256dh!, auth: row.push_auth! },
          } satisfies WebPushSubscription,
          body,
          { TTL: 60 * 60 * 24 },
        ),
      ),
    )

    outcomes.forEach((outcome, idx) => {
      const row = slice[idx]
      if (outcome.status === 'fulfilled') {
        result.sent += 1
        return
      }
      const err = outcome.reason as { statusCode?: number; message?: string }
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        result.cleaned += 1
        expiredUsers.push(row.user_id)
      } else {
        result.failed += 1
        console.warn(
          '[push/send] erro user=%s status=%s msg=%s',
          row.user_id,
          err?.statusCode,
          err?.message,
        )
      }
    })
  }

  if (expiredUsers.length) {
    await supabase
      .from('user_notificacoes_prefs')
      .update({
        push_enabled: false,
        push_endpoint: null,
        push_p256dh: null,
        push_auth: null,
        atualizado_em: new Date().toISOString(),
      })
      .in('user_id', expiredUsers)
  }

  // Feed in-app — todo mundo que tinha push habilitado recebe entrada,
  // mesmo se o device falhou (assim o sino do app mostra).
  if (payload.dedupeKey && prefRows.length) {
    const feedRows = prefRows.map((row) => ({
      user_id: row.user_id,
      type: opts.categoria,
      title: payload.title,
      body: payload.body,
      target_url: payload.url,
      source: `push_${opts.categoria}`,
      payload: { tag: payload.tag },
      dedupe_key: payload.dedupeKey,
    }))
    const { error: feedErr } = await supabase
      .from('user_notificacoes_feed')
      .upsert(feedRows, { onConflict: 'user_id,dedupe_key' })
    if (feedErr) console.warn('[push/send] feed upsert error', feedErr.message)
  }

  return result
}
