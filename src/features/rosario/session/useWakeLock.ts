'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

/**
 * Mantém a tela ligada durante uma sessão ativa usando a Screen Wake Lock API.
 *
 * - SSR-safe: detecção de suporte via `useSyncExternalStore`, então não há
 *   setState síncrono dentro de `useEffect` nem hydration mismatch.
 * - `visibilitychange`: quando a aba fica oculta o browser libera o sentinel
 *   automaticamente; ao voltar à aba o hook re-solicita.
 * - Libera o sentinel no unmount ou quando `enabled` vira false.
 *
 * Retorna `{ supported, active, error }` pra UI poder exibir um indicador.
 */

type WakeLockType = 'screen'

interface WakeLockSentinel extends EventTarget {
  readonly released: boolean
  readonly type: WakeLockType
  release(): Promise<void>
}

interface WakeLockNavigator {
  wakeLock?: {
    request(type: WakeLockType): Promise<WakeLockSentinel>
  }
}

function getSupportedClient(): boolean {
  if (typeof navigator === 'undefined') return false
  try {
    const nav = navigator as unknown as WakeLockNavigator
    return typeof nav.wakeLock?.request === 'function'
  } catch {
    return false
  }
}

function getSupportedServer(): boolean {
  return false
}

const noopSubscribe = () => () => {}

export interface UseWakeLockReturn {
  /** `true` se a API está disponível neste dispositivo/browser. */
  supported: boolean
  /** `true` enquanto o sentinel está ativo. */
  active: boolean
  /** Último erro encontrado, se houver (permissão negada, etc.). */
  error: string | null
}

export function useWakeLock(enabled: boolean): UseWakeLockReturn {
  const supported = useSyncExternalStore(
    noopSubscribe,
    getSupportedClient,
    getSupportedServer,
  )
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  const request = useCallback(async () => {
    if (typeof navigator === 'undefined') return
    const nav = navigator as unknown as WakeLockNavigator
    if (!nav.wakeLock?.request) return
    if (sentinelRef.current && !sentinelRef.current.released) return
    try {
      const sentinel = await nav.wakeLock.request('screen')
      sentinelRef.current = sentinel
      setActive(true)
      setError(null)
      sentinel.addEventListener('release', () => {
        if (sentinelRef.current === sentinel) {
          setActive(false)
        }
      })
    } catch (err) {
      setActive(false)
      setError(err instanceof Error ? err.message : 'Wake lock falhou')
    }
  }, [])

  const release = useCallback(async () => {
    const sentinel = sentinelRef.current
    if (!sentinel || sentinel.released) {
      setActive(false)
      return
    }
    try {
      await sentinel.release()
    } catch {
      // ignore
    } finally {
      sentinelRef.current = null
      setActive(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      void release()
      return
    }
    void request()

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void request()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      void release()
    }
  }, [enabled, request, release])

  return { supported, active, error }
}
