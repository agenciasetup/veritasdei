"use client"

import { useCallback, useSyncExternalStore } from "react"

/**
 * Som opcional para ações sacras (completar dezena do Terço, registrar
 * missa, finalizar novena). Preferência local com opt-out via
 * localStorage. Default: **desligado** — mantém discrição para uso em
 * ambientes silenciosos (igreja, noite).
 *
 * Usa WebAudio para sintetizar um toque curto — não precisa baixar
 * asset de áudio, funciona offline, sem impacto no bundle.
 */

const STORAGE_KEY = "veritas-sound"
type Preference = "on" | "off"

const listeners = new Set<() => void>()
function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
function notify() {
  for (const listener of listeners) listener()
}

function loadPref(): Preference {
  if (typeof window === "undefined") return "off"
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === "on" || raw === "off") return raw
  } catch {
    /* ignore */
  }
  return "off"
}
function savePref(pref: Preference) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, pref)
  } catch {
    /* ignore */
  }
}

function getClientSnapshot(): boolean {
  return loadPref() === "on"
}
function getServerSnapshot(): boolean {
  return false
}

/**
 * Síntese simples: tom fundamental + quinta acima, com decaimento
 * exponencial. Soa como um sino sutil.
 */
function playBell(volume = 0.18) {
  if (typeof window === "undefined") return
  const AC =
    (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
  if (!AC) return
  try {
    const ctx = new AC()
    const now = ctx.currentTime
    const duration = 1.2

    const freqs = [660, 990] // fundamental + quinta
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(volume * (i === 0 ? 1 : 0.6), now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + duration)
    })

    // Cleanup
    setTimeout(() => ctx.close().catch(() => {}), (duration + 0.1) * 1000)
  } catch {
    /* ambientes que bloqueiam AudioContext antes de gesture — silencioso */
  }
}

export interface UseSoundReturn {
  enabled: boolean
  setEnabled: (next: boolean) => void
  /** Toca o toque de sino sacramental (no-op se desabilitado). */
  bell: () => void
}

export function useSound(): UseSoundReturn {
  const enabled = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)

  const setEnabled = useCallback((next: boolean) => {
    savePref(next ? "on" : "off")
    notify()
  }, [])

  const bell = useCallback(() => {
    if (!enabled) return
    playBell()
  }, [enabled])

  return { enabled, setEnabled, bell }
}
