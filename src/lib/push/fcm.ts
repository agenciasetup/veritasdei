/**
 * Firebase Cloud Messaging — envio server-side via firebase-admin.
 *
 * Usado em paralelo com o Web Push (lib/push/send.ts) para alcançar
 * usuários que abriram o app empacotado (Capacitor Android/iOS).
 *
 * Credenciais: a service account JSON do Firebase fica numa única env var
 * `FIREBASE_SERVICE_ACCOUNT` (string JSON inteira). Geramos no console do
 * Firebase em Project Settings ▸ Service Accounts ▸ Generate new private
 * key. Nunca commitar esse JSON.
 *
 * Init é lazy (1 vez por cold start). Em ambientes sem a env, o módulo
 * vira no-op silencioso — Web Push continua funcionando normal.
 */

import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getMessaging, type Messaging } from 'firebase-admin/messaging'
import type { PushPayload } from './templates'

let cachedApp: App | null = null
let cachedMessaging: Messaging | null = null
let initFailed = false

function getMessagingClient(): Messaging | null {
  if (cachedMessaging) return cachedMessaging
  if (initFailed) return null

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) {
    initFailed = true
    return null
  }

  try {
    const credentials = JSON.parse(raw) as {
      project_id: string
      private_key: string
      client_email: string
    }
    cachedApp =
      getApps()[0] ??
      initializeApp(
        {
          credential: cert({
            projectId: credentials.project_id,
            privateKey: credentials.private_key,
            clientEmail: credentials.client_email,
          }),
        },
        'veritasdei-fcm',
      )
    cachedMessaging = getMessaging(cachedApp)
    return cachedMessaging
  } catch (err) {
    console.error('[fcm] init falhou:', err)
    initFailed = true
    return null
  }
}

export interface FcmTokenInfo {
  user_id: string
  fcm_token: string
}

export interface FcmSendResult {
  sent: number
  failed: number
  cleaned: number
  expiredUserIds: string[]
}

/**
 * Envia notificações FCM para uma lista de tokens.
 *
 * Usa sendEach (batch) que aceita até 500 tokens por chamada e devolve
 * um resultado por token — ideal pra detectar tokens inválidos
 * (UNREGISTERED, INVALID_ARGUMENT) e marcá-los como expirados.
 */
export async function sendFcmToTokens(
  rows: FcmTokenInfo[],
  payload: PushPayload,
): Promise<FcmSendResult> {
  const result: FcmSendResult = {
    sent: 0,
    failed: 0,
    cleaned: 0,
    expiredUserIds: [],
  }
  if (!rows.length) return result

  const messaging = getMessagingClient()
  if (!messaging) {
    // sem credenciais → não tenta. Não é "failed", só skip silencioso.
    return result
  }

  const messages = rows.map((row) => ({
    token: row.fcm_token,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: {
      url: payload.url ?? '/',
      tag: payload.tag ?? 'veritasdei',
    },
    android: {
      priority: 'high' as const,
      notification: {
        channelId: 'default',
        tag: payload.tag,
        clickAction: 'OPEN_VERITASDEI',
      },
    },
    apns: {
      headers: { 'apns-priority': '10' },
      payload: {
        aps: {
          alert: { title: payload.title, body: payload.body },
          sound: 'default',
          badge: 1,
        },
      },
    },
  }))

  // sendEach aceita até 500 mensagens por call.
  const BATCH = 500
  for (let i = 0; i < messages.length; i += BATCH) {
    const slice = messages.slice(i, i + BATCH)
    try {
      const batchResult = await messaging.sendEach(slice)
      batchResult.responses.forEach((resp, idx) => {
        const row = rows[i + idx]
        if (resp.success) {
          result.sent += 1
          return
        }
        const code = resp.error?.code
        // Tokens inválidos / desinstalados → marcar pra limpar.
        if (
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-argument'
        ) {
          result.cleaned += 1
          result.expiredUserIds.push(row.user_id)
        } else {
          result.failed += 1
          console.warn(
            '[fcm] erro user=%s code=%s msg=%s',
            row.user_id,
            code,
            resp.error?.message,
          )
        }
      })
    } catch (err) {
      // Falha no envio inteiro do batch (rede, auth, etc). Conta tudo
      // como failed; não marca como expirado pra não perder tokens
      // bons só por causa de uma falha transitória.
      result.failed += slice.length
      console.error('[fcm] sendEach erro batch:', err)
    }
  }

  return result
}
