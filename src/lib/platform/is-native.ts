/**
 * Detecção de plataforma Capacitor.
 *
 * Em SSR (server components, route handlers), `window` não existe e
 * essas funções retornam falso/'web'. No client dentro do WebView
 * Capacitor (Android/iOS), retornam true e o nome da plataforma.
 *
 * Usa import direto de @capacitor/core porque o pacote é browser-safe
 * (apenas lê window.Capacitor; sem efeitos colaterais nativos).
 */

import { Capacitor } from '@capacitor/core'

export type NativePlatform = 'ios' | 'android'
export type Platform = NativePlatform | 'web'

export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false
  return Capacitor.isNativePlatform()
}

export function getPlatform(): Platform {
  if (typeof window === 'undefined') return 'web'
  return Capacitor.getPlatform() as Platform
}
