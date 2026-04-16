'use client'

import { useSyncExternalStore } from 'react'

/**
 * `navigator.onLine` de forma SSR-safe, re-renderizando o componente
 * quando o browser dispara `online` / `offline` no `window`.
 *
 * SSR-safe via `useSyncExternalStore` com snapshot servidor = `true`.
 *
 * Anteriormente vivia em `src/features/rosario/session/useOnlineStatus.ts`.
 * Mantemos um re-export naquele arquivo para imports legados.
 */

function subscribe(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('online', listener)
  window.addEventListener('offline', listener)
  return () => {
    window.removeEventListener('online', listener)
    window.removeEventListener('offline', listener)
  }
}

function getClientSnapshot(): boolean {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine
}

function getServerSnapshot(): boolean {
  return true
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
}
