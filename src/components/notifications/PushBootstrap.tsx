'use client'

/**
 * PushBootstrap — registra device para push nativo (FCM) quando o app
 * Capacitor abre.
 *
 * Em web (PWA + browser): no-op total. Web Push continua usando
 * navigator.serviceWorker + PushManager (lib/push subscribe), independente
 * deste componente.
 *
 * Fluxo native:
 *   1. Aguarda usuário logar (precisa de user_id pra registrar token).
 *   2. Pede permissão de notificação. Usuário pode negar.
 *   3. Se permitido, pega o FCM token via @capacitor-firebase/messaging.
 *   4. POST /api/push/register-token com { token, platform }.
 *   5. Listener tokenReceived: re-registra se Firebase rotacionar.
 *
 * Sem retry agressivo — se algo falhar, próxima abertura do app tenta de
 * novo. Usuário pode forçar via tela de configurações de notificação
 * (futuro: toggle "Ativar notificações no app" que dispara tudo de novo).
 */

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useNotificationToast } from '@/contexts/NotificationToastContext'
import { isNativePlatform, getPlatform } from '@/lib/platform/is-native'

export default function PushBootstrap() {
  const { user, isAuthenticated } = useAuth()
  const { show: showToast } = useNotificationToast()
  const router = useRouter()
  const registeredForUserRef = useRef<string | null>(null)

  // Listeners SEMPRE ligados em native (mesmo deslogado), pra capturar
  // taps em notificações que abrem o app. O register de token só roda
  // depois de logar (precisa de user_id).
  useEffect(() => {
    if (!isNativePlatform()) return

    let canceled = false
    const removers: Array<() => void> = []

    ;(async () => {
      try {
        const { FirebaseMessaging } = await import(
          '@capacitor-firebase/messaging'
        )
        if (canceled) return

        // P2 — foreground: notificação chega com app aberto. FCM não
        // mostra na barra do sistema; renderizamos um toast in-app.
        const fgHandle = await FirebaseMessaging.addListener(
          'notificationReceived',
          (event) => {
            const n = event.notification
            if (!n) return
            const data = (n.data ?? {}) as Record<string, unknown>
            const url = typeof data.url === 'string' ? data.url : undefined
            showToast({
              title: n.title ?? 'Veritas Dei',
              body: n.body ?? '',
              url,
            })
          },
        )
        removers.push(() => fgHandle.remove().catch(() => {}))

        // P3 — tap em notif (background ou app fechado). data.url leva
        // pra rota destino. router.push usa o roteador do Next, não
        // sai do WebView.
        const tapHandle = await FirebaseMessaging.addListener(
          'notificationActionPerformed',
          (event) => {
            const data = (event.notification?.data ?? {}) as Record<
              string,
              unknown
            >
            const url = typeof data.url === 'string' ? data.url : undefined
            if (url) router.push(url)
          },
        )
        removers.push(() => tapHandle.remove().catch(() => {}))

        // Rotação de token — re-registra se Firebase trocar.
        const tokenHandle = await FirebaseMessaging.addListener(
          'tokenReceived',
          (event) => {
            if (!event.token) return
            const platformLive = getPlatform()
            if (platformLive !== 'android' && platformLive !== 'ios') return
            fetch('/api/push/register-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: event.token,
                platform: platformLive,
              }),
              credentials: 'include',
            }).catch((err) =>
              console.warn('[push] re-register falhou:', err),
            )
          },
        )
        removers.push(() => tokenHandle.remove().catch(() => {}))
      } catch (err) {
        console.warn('[push] listeners falhou:', err)
      }
    })()

    return () => {
      canceled = true
      removers.forEach((fn) => fn())
    }
  }, [router, showToast])

  // Effect 2: registra token quando user loga.
  useEffect(() => {
    if (!isNativePlatform()) return
    if (!isAuthenticated || !user) return
    if (registeredForUserRef.current === user.id) return

    let canceled = false
    ;(async () => {
      try {
        const { FirebaseMessaging } = await import(
          '@capacitor-firebase/messaging'
        )
        if (canceled) return

        const perm = await FirebaseMessaging.requestPermissions()
        if (perm.receive !== 'granted') {
          registeredForUserRef.current = user.id
          return
        }

        const tokenResult = await FirebaseMessaging.getToken()
        if (canceled || !tokenResult.token) return

        const platform = getPlatform()
        if (platform !== 'android' && platform !== 'ios') return
        const res = await fetch('/api/push/register-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenResult.token, platform }),
          credentials: 'include',
        })
        if (!res.ok) {
          console.warn('[push] register-token falhou:', res.status)
          return
        }
        registeredForUserRef.current = user.id
      } catch (err) {
        console.warn('[push] register falhou:', err)
      }
    })()

    return () => {
      canceled = true
    }
  }, [isAuthenticated, user])

  return null
}
