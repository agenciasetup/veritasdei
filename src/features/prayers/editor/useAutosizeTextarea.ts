'use client'

import { useEffect, useRef } from 'react'

/**
 * Hook pequeno: cresce a altura de uma textarea pra se encaixar
 * no conteúdo. Chamado com o valor pra re-medir quando muda.
 */
export function useAutosizeTextarea(value: string) {
  const ref = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return ref
}
