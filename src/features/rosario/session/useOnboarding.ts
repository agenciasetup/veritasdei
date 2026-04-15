'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * Controla o estado de "onboarding já foi visto" para quem abre o terço pela
 * primeira vez. Persistimos uma flag simples no `localStorage` — sem schema
 * versionado porque o valor é só um booleano e não há risco de lixo futuro.
 *
 * Padrão SSR-safe (igual ao `useWakeLock` / `useHapticFeedback`): usamos
 * `useSyncExternalStore` com snapshots client/server explícitos, com pub/sub
 * local pra que `dismiss()` e `reopen()` re-renderizem todos os consumidores.
 */

const STORAGE_KEY = 'veritasdei:rosario:onboarded'

const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function notify() {
  for (const listener of listeners) listener()
}

function readFlag(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function writeFlag(value: boolean): void {
  if (typeof window === 'undefined') return
  try {
    if (value) {
      window.localStorage.setItem(STORAGE_KEY, 'true')
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // ignore quota / SecurityError
  }
}

function getClientSnapshot(): boolean {
  return readFlag()
}

function getServerSnapshot(): boolean {
  // No servidor assumimos "já viu" — evita um flash do overlay durante a
  // hidratação para usuários que retornam. O snapshot real do cliente corrige
  // no primeiro subscribe sem warning de mismatch.
  return true
}

export interface UseOnboardingReturn {
  /** `true` se o overlay de onboarding já foi dispensado alguma vez. */
  dismissed: boolean
  /** Marca como visto e persiste. */
  dismiss: () => void
  /** Reabre o tutorial (limpa a flag). */
  reopen: () => void
}

export function useOnboarding(): UseOnboardingReturn {
  const dismissed = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  )

  const dismiss = useCallback(() => {
    writeFlag(true)
    notify()
  }, [])

  const reopen = useCallback(() => {
    writeFlag(false)
    notify()
  }, [])

  return { dismissed, dismiss, reopen }
}
