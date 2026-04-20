"use client"

import { useCallback, useRef, useState } from "react"

/**
 * Controla a aplicação temporária da classe `animate-gold-flash`
 * (definida em globals.css) para sinalizar conclusão de ação sacra
 * — ex: completar dezena do Terço, registrar missa, finalizar novena.
 *
 * Uso:
 * ```tsx
 * const flash = useSuccessFlash()
 *
 * return (
 *   <div className={flash.active ? 'animate-gold-flash' : ''} ref={flash.ref}>
 *     ...
 *   </div>
 *   <button onClick={() => {
 *     markDone()
 *     flash.trigger()
 *   }}>Marcar como feito</button>
 * )
 * ```
 *
 * Duração padrão: 600ms (casa com o keyframe `goldFlash` no CSS).
 * Também respeita `prefers-reduced-motion` via media query global.
 */
export function useSuccessFlash(durationMs = 600) {
  const [active, setActive] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const trigger = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setActive(true)
    timeoutRef.current = setTimeout(() => {
      setActive(false)
      timeoutRef.current = null
    }, durationMs)
  }, [durationMs])

  return { active, trigger }
}
