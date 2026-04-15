'use client'

import { useSyncExternalStore } from 'react'

/**
 * Expõe `navigator.onLine` de forma SSR-safe, re-renderizando o componente
 * quando o browser dispara `online` / `offline` no `window`.
 *
 * SSR-safe via `useSyncExternalStore` com snapshot servidor = `true`
 * (assumimos online durante render — se o cliente estiver offline no
 * primeiro render, o store corrige no próximo tick sem warning).
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
