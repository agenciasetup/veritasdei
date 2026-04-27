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
import { useAuth } from '@/contexts/AuthContext'
import { isNativePlatform, getPlatform } from '@/lib/platform/is-native'

export default function PushBootstrap() {
  const { user, isAuthenticated } = useAuth()
  const registeredForUserRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isNativePlatform()) return
    if (!isAuthenticated || !user) return
    if (registeredForUserRef.current === user.id) return

    let canceled = false
    let removeListener: (() => void) | null = null

    ;(async () => {
      try {
        const { FirebaseMessaging } = await import(
          '@capacitor-firebase/messaging'
        )
        if (canceled) return

        // 1. Pede permissão. Em iOS/Android moderno o sistema mostra prompt.
        const perm = await FirebaseMessaging.requestPermissions()
        if (perm.receive !== 'granted') {
          // Usuário negou. Não tenta de novo nesta sessão.
          registeredForUserRef.current = user.id
          return
        }

        // 2. Token. iOS pode demorar uns segundos no 1º get.
        const tokenResult = await FirebaseMessaging.getToken()
        if (canceled || !tokenResult.token) return

        // 3. Manda pro servidor.
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

        // 4. Listener de rotação de token. Firebase pode trocar quando
        // o app é reinstalado, dados limpos, ou periodicamente em
        // alguns devices. Re-registra silenciosamente.
        const handle = await FirebaseMessaging.addListener(
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
        removeListener = () => {
          handle.remove().catch(() => {})
        }
      } catch (err) {
        console.warn('[push] bootstrap falhou:', err)
      }
    })()

    return () => {
      canceled = true
      if (removeListener) removeListener()
    }
  }, [isAuthenticated, user])

  return null
}
