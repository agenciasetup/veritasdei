'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * Vibração curta a cada passo do terço, opt-out via localStorage.
 *
 * - SSR-safe: usa `useSyncExternalStore` com snapshot SSR explícito, então
 *   não há hydration mismatch nem setState em `useEffect`.
 * - Preferência persistida em `veritasdei:rosario:haptic` (`'on' | 'off'`).
 *   Default é ligado quando o device suporta vibração.
 * - Padrões semânticos: `step` (10ms) para avançar, `decade` (pulso duplo)
 *   ao cruzar fronteira de dezena, `complete` ao finalizar o terço.
 */

const STORAGE_KEY = 'veritasdei:rosario:haptic'

type Preference = 'on' | 'off'

interface VibrateNavigator {
  vibrate?: (pattern: number | number[]) => boolean
}

export type HapticPattern = 'step' | 'decade' | 'complete'

const PATTERNS: Record<HapticPattern, number | number[]> = {
  step: 10,
  decade: [18, 60, 18],
  complete: [24, 90, 24, 90, 40],
}

// ---------- detecção de suporte ----------

function getSupportedClient(): boolean {
  if (typeof navigator === 'undefined') return false
  try {
    return typeof (navigator as unknown as VibrateNavigator).vibrate === 'function'
  } catch {
    return false
  }
}

function getSupportedServer(): boolean {
  return false
}

const noopSubscribe = () => () => {}

// ---------- preferência com pub/sub local ----------

const prefListeners = new Set<() => void>()

function subscribePref(listener: () => void): () => void {
  prefListeners.add(listener)
  return () => {
    prefListeners.delete(listener)
  }
}

function notifyPref() {
  for (const listener of prefListeners) listener()
}

function loadPref(): Preference | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === 'on' || raw === 'off') return raw
    return null
  } catch {
    return null
  }
}

function savePref(pref: Preference): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, pref)
  } catch {
    // ignore
  }
}

function getEnabledSnapshot(): boolean {
  const stored = loadPref()
  if (stored) return stored === 'on'
  return getSupportedClient()
}

function getEnabledServerSnapshot(): boolean {
  // O servidor não conhece a preferência; usamos `true` como default neutro.
  // A hidratação do cliente re-computa e corrige sem warnings.
  return true
}

// ---------- hook ----------

export interface UseHapticFeedbackReturn {
  /** `true` se `navigator.vibrate` existe neste dispositivo. */
  supported: boolean
  /** `true` se o usuário não desligou a preferência. */
  enabled: boolean
  /** Dispara um padrão (no-op se desabilitado ou não suportado). */
  pulse: (pattern: HapticPattern) => void
  /** Alterna a preferência e persiste. */
  setEnabled: (next: boolean) => void
}

export function useHapticFeedback(): UseHapticFeedbackReturn {
  const supported = useSyncExternalStore(
    noopSubscribe,
    getSupportedClient,
    getSupportedServer,
  )
  const enabled = useSyncExternalStore(
    subscribePref,
    getEnabledSnapshot,
    getEnabledServerSnapshot,
  )

  const pulse = useCallback(
    (pattern: HapticPattern) => {
      if (!enabled) return
      if (typeof navigator === 'undefined') return
      const nav = navigator as unknown as VibrateNavigator
      if (typeof nav.vibrate !== 'function') return
      try {
        nav.vibrate(PATTERNS[pattern])
      } catch {
        // alguns browsers exigem gesto do usuário recente; ignore
      }
    },
    [enabled],
  )

  const setEnabled = useCallback((next: boolean) => {
    savePref(next ? 'on' : 'off')
    notifyPref()
  }, [])

  return { supported, enabled, pulse, setEnabled }
}
