'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * Vibração curta semântica — opt-out via localStorage.
 *
 * - SSR-safe: usa `useSyncExternalStore` com snapshot SSR explícito, então
 *   não há hydration mismatch nem setState em `useEffect`.
 * - Preferência persistida em `veritasdei:haptic` (`'on' | 'off'`).
 *   Default é ligado quando o device suporta vibração.
 * - Padrões semânticos cobrem desde tap leve até warning destrutivo.
 *
 * iOS Safari ainda não suporta `navigator.vibrate` — retorno é no-op.
 */

const STORAGE_KEY = 'veritasdei:haptic'
// retro-compat: chave anterior usada apenas dentro do feature rosario
const LEGACY_STORAGE_KEY = 'veritasdei:rosario:haptic'

type Preference = 'on' | 'off'

interface VibrateNavigator {
  vibrate?: (pattern: number | number[]) => boolean
}

/** Padrões de haptic. Mantém os antigos do rosário e adiciona globais. */
export type HapticPattern =
  // ─── Globais ───
  | 'tap'        // 5ms — selecao leve, troca de tab
  | 'selection' // 8ms — selecionar item em lista
  | 'light'     // 10ms — alias para `step`
  | 'medium'    // 18ms — confirma de toggle
  | 'heavy'     // 30ms — confirma de acao
  | 'warning'   // [30,100,30] — destrutiva
  // ─── Específicos do Rosário ───
  | 'step'        // 10ms — avancar conta
  | 'beadAdvance' // alias para step
  | 'decade'      // pulso duplo ao cruzar dezena
  | 'complete'    // tres pulsos ao concluir

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 5,
  selection: 8,
  light: 10,
  medium: 18,
  heavy: 30,
  warning: [30, 100, 30],
  step: 10,
  beadAdvance: 10,
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
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_STORAGE_KEY)
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

export interface UseHapticReturn {
  /** `true` se `navigator.vibrate` existe neste dispositivo. */
  supported: boolean
  /** `true` se o usuário não desligou a preferência. */
  enabled: boolean
  /** Dispara um padrão (no-op se desabilitado ou não suportado). */
  pulse: (pattern: HapticPattern) => void
  /** Alterna a preferência e persiste. */
  setEnabled: (next: boolean) => void
}

export function useHaptic(): UseHapticReturn {
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

// ── Backwards compat: antigo nome usado em src/features/rosario/ ──
export const useHapticFeedback = useHaptic
export type UseHapticFeedbackReturn = UseHapticReturn
