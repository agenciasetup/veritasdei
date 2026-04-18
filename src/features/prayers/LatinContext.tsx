'use client'

import { createContext, useContext, useEffect, useState } from 'react'

/**
 * Contexto global do toggle de Latim nas páginas de oração.
 * Persiste em localStorage (`vd:latin`) e inicia desligado.
 *
 * Uso: envolva a árvore de leitura em <LatinProvider>, depois
 * chame `useLatin()` nos componentes que dependem (Renderer,
 * Toggle button).
 */

type LatinContextValue = {
  latin: boolean
  setLatin: (v: boolean) => void
  toggle: () => void
}

const LatinCtx = createContext<LatinContextValue | null>(null)

const STORAGE_KEY = 'vd:latin'

export function LatinProvider({ children }: { children: React.ReactNode }) {
  const [latin, setLatinState] = useState(false)

  // Hidrata do localStorage uma vez no mount (evita hydration mismatch)
  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
      if (stored === '1') setLatinState(true)
    } catch {
      /* privacy mode / disabled storage */
    }
  }, [])

  const setLatin = (v: boolean) => {
    setLatinState(v)
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, v ? '1' : '0')
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <LatinCtx.Provider value={{ latin, setLatin, toggle: () => setLatin(!latin) }}>
      {children}
    </LatinCtx.Provider>
  )
}

export function useLatin(): LatinContextValue {
  const ctx = useContext(LatinCtx)
  if (!ctx) {
    // Fallback seguro pro caso de uso sem provider: latim sempre off.
    return { latin: false, setLatin: () => {}, toggle: () => {} }
  }
  return ctx
}
