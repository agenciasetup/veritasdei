'use client'

/**
 * Camada cliente de Web Push.
 *
 * Fluxo:
 *  1. `isPushSupported()` → device suporta push? (iOS < 16.4 por ex. não)
 *  2. `isStandalone()`    → rodando como PWA instalado? (iOS exige)
 *  3. `subscribePush()`   → pede permissão, cria subscription, envia ao server
 *  4. `unsubscribePush()` → limpa tudo
 *
 * Não pedimos permissão agressivamente — o usuário precisa clicar no
 * toggle em /perfil?tab=notificacoes.
 */

export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const mq =
    window.matchMedia?.('(display-mode: standalone)').matches ?? false
  // iOS Safari usa navigator.standalone
  const ios = (window.navigator as unknown as { standalone?: boolean })
    .standalone === true
  return mq || ios
}

export function isIos(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua)
}

/** URL-safe base64 → Uint8Array backed by a real ArrayBuffer
 * (applicationServerKey rejects SharedArrayBuffer-backed views). */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const buffer = new ArrayBuffer(raw.length)
  const out = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

async function ensureSwRegistered(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration()
  if (existing) return existing
  return navigator.serviceWorker.register('/sw.js')
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  const reg = await ensureSwRegistered()
  return reg.pushManager.getSubscription()
}

export async function subscribePush(): Promise<PushSubscription> {
  if (!isPushSupported()) throw new Error('push_unsupported')

  // iOS requer app instalado
  if (isIos() && !isStandalone()) throw new Error('ios_needs_install')

  // Pede permissão
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('permission_denied')

  const reg = await ensureSwRegistered()

  // Se já existir uma subscription, reusa
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidPublic) throw new Error('vapid_public_missing')
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublic),
    })
  }

  // Envia pro server
  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription: sub.toJSON(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  })
  if (!res.ok) {
    await sub.unsubscribe().catch(() => {})
    throw new Error('subscribe_failed')
  }
  return sub
}

export async function unsubscribePush(): Promise<void> {
  if (!isPushSupported()) return
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (sub) await sub.unsubscribe().catch(() => {})
  await fetch('/api/push/subscribe', { method: 'DELETE' }).catch(() => {})
}

export async function sendTestPush(): Promise<boolean> {
  const res = await fetch('/api/push/test', { method: 'POST' })
  return res.ok
}
