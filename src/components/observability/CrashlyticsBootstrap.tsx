'use client'

/**
 * CrashlyticsBootstrap — registra usuário logado no Firebase Crashlytics
 * dentro do app Capacitor. Web é no-op.
 *
 * Mesmo padrão do RevenueCatBootstrap: dynamic import gateado por
 * isNativePlatform() pra que o módulo nativo nunca seja resolvido em
 * contexto web (PWA/browser). A captura de crashes nativos do Java/Kotlin
 * é automática assim que o plugin Gradle estiver aplicado — esse
 * componente só sincroniza identidade pra que o crash apareça atrelado
 * ao usuário no console Firebase.
 *
 * Helper `recordWebError()` exportado pra ser chamado pelo error
 * boundary (src/app/error.tsx) em crashes JS dentro do WebView.
 */

import { useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { isNativePlatform } from '@/lib/platform/is-native'

export default function CrashlyticsBootstrap() {
  const { user, isAuthenticated } = useAuth()
  const lastUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isNativePlatform()) return

    const targetId = isAuthenticated && user ? user.id : ''
    if (targetId === lastUserIdRef.current) return

    let canceled = false
    ;(async () => {
      try {
        const { FirebaseCrashlytics } = await import(
          '@capacitor-firebase/crashlytics'
        )
        if (canceled) return
        await FirebaseCrashlytics.setUserId({ userId: targetId })
        lastUserIdRef.current = targetId
      } catch (err) {
        console.warn('[crashlytics] setUserId falhou:', err)
      }
    })()

    return () => {
      canceled = true
    }
  }, [isAuthenticated, user])

  return null
}

/**
 * Reporta um erro JS pro Crashlytics. Usado pelo error boundary.
 * Em web (PWA/browser) é no-op silencioso.
 */
export async function recordWebError(error: Error): Promise<void> {
  if (!isNativePlatform()) return
  try {
    const { FirebaseCrashlytics } = await import(
      '@capacitor-firebase/crashlytics'
    )
    await FirebaseCrashlytics.recordException({
      message: error.message || 'Unknown error',
    })
    if (error.stack) {
      await FirebaseCrashlytics.log({ message: error.stack.slice(0, 1000) })
    }
  } catch (err) {
    console.warn('[crashlytics] recordException falhou:', err)
  }
}
