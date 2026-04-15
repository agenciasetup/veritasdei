'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

/**
 * Leitura guiada das orações via Web Speech API (`window.speechSynthesis`).
 *
 * - **SSR-safe**: detecção de suporte com `useSyncExternalStore` + snapshot
 *   servidor `false`. Sem `setState` síncrono dentro de `useEffect`.
 * - **Preferência** persistida em `veritasdei:rosario:tts` (`'on' | 'off'`).
 *   Default é **desligado** — voz automática sem pedir pode assustar.
 * - **Voz**: ao falar, tenta usar a primeira voz `pt-BR`, depois `pt-*`,
 *   depois o default do browser. Voices do Chrome carregam assincronamente
 *   via `voiceschanged`; nós apenas consultamos `getVoices()` no momento da
 *   fala — se estiver vazia, o browser usa default e ainda soa razoável.
 * - **speak()** cancela a utterance anterior antes de iniciar a próxima,
 *   para que trocas rápidas de passo não engasguem a fila.
 * - **stop()** cancela a fila inteira.
 */

const STORAGE_KEY = 'veritasdei:rosario:tts'

type Preference = 'on' | 'off'

// ---------- suporte ----------

function getSupportedClient(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return (
      typeof window.speechSynthesis !== 'undefined' &&
      typeof window.SpeechSynthesisUtterance !== 'undefined'
    )
  } catch {
    return false
  }
}

function getSupportedServer(): boolean {
  return false
}

const noopSubscribe = () => () => {}

// ---------- preferência (pub/sub local) ----------

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
  // Default: **desligado**. Voz automática é opt-in.
  return false
}

function getEnabledServerSnapshot(): boolean {
  return false
}

// ---------- escolha de voz ----------

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined') return null
  try {
    const voices = window.speechSynthesis.getVoices()
    if (!voices || voices.length === 0) return null
    const ptBR = voices.find((v) => v.lang === 'pt-BR' || v.lang === 'pt_BR')
    if (ptBR) return ptBR
    const pt = voices.find((v) => v.lang.toLowerCase().startsWith('pt'))
    if (pt) return pt
    return null
  } catch {
    return null
  }
}

// ---------- hook ----------

export interface UseSpeechSynthesisReturn {
  /** `true` se `speechSynthesis` existe neste browser. */
  supported: boolean
  /** `true` se o usuário ligou a leitura guiada. */
  enabled: boolean
  /** `true` enquanto uma utterance está em andamento. */
  speaking: boolean
  /** Fala o texto (cancela utterance anterior). */
  speak: (text: string) => void
  /** Cancela tudo. */
  stop: () => void
  /** Alterna a preferência e persiste. */
  setEnabled: (next: boolean) => void
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
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
  const [speaking, setSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  /**
   * Chrome descarrega as vozes de forma assíncrona e só notifica via
   * `voiceschanged`. Fazemos um `getVoices()` inicial para forçar o
   * populate nos browsers que só carregam sob demanda.
   */
  useEffect(() => {
    if (!supported) return
    try {
      window.speechSynthesis.getVoices()
    } catch {
      // ignore
    }
  }, [supported])

  const stop = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      window.speechSynthesis.cancel()
    } catch {
      // ignore
    }
    utteranceRef.current = null
    setSpeaking(false)
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (!text) return
      if (typeof window === 'undefined') return
      if (!getSupportedClient()) return
      try {
        window.speechSynthesis.cancel()
        const utter = new window.SpeechSynthesisUtterance(text)
        const voice = pickVoice()
        if (voice) utter.voice = voice
        utter.lang = voice?.lang ?? 'pt-BR'
        utter.rate = 0.95
        utter.pitch = 1
        utter.volume = 1
        utter.onstart = () => setSpeaking(true)
        utter.onend = () => {
          if (utteranceRef.current === utter) {
            utteranceRef.current = null
            setSpeaking(false)
          }
        }
        utter.onerror = () => {
          if (utteranceRef.current === utter) {
            utteranceRef.current = null
            setSpeaking(false)
          }
        }
        utteranceRef.current = utter
        window.speechSynthesis.speak(utter)
      } catch {
        setSpeaking(false)
      }
    },
    [],
  )

  // Limpeza: cancela qualquer utterance pendente ao desmontar o componente.
  useEffect(() => {
    return () => {
      if (typeof window === 'undefined') return
      try {
        window.speechSynthesis.cancel()
      } catch {
        // ignore
      }
    }
  }, [])

  const setEnabled = useCallback((next: boolean) => {
    savePref(next ? 'on' : 'off')
    notifyPref()
    if (!next) {
      // Se desligou, corta a voz atual imediatamente.
      if (typeof window !== 'undefined') {
        try {
          window.speechSynthesis.cancel()
        } catch {
          // ignore
        }
      }
      setSpeaking(false)
    }
  }, [])

  return { supported, enabled, speaking, speak, stop, setEnabled }
}
