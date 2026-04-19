'use client'

/**
 * Bloqueia zoom em mobile — pinça e double-tap, em qualquer browser.
 *
 * iOS Safari ignora `user-scalable=no` desde o iOS 10, por isso precisamos
 * registrar listeners dos eventos `gesture*` (proprietários do WebKit) e
 * interceptar `touchmove` com mais de um dedo. Desktop fica livre para
 * usar Ctrl/Cmd +/-/0 normalmente (acessibilidade).
 */

import { useEffect } from 'react'

export default function NoZoom() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // iOS Safari — bloqueia pinça via eventos proprietários
    const onGesture = (e: Event) => e.preventDefault()

    // Mobile genérico — bloqueia multi-touch que causaria pinch
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault()
    }

    // iOS — double-tap-to-zoom: só deixa passar taps não-repetidos
    let lastTouchEnd = 0
    const onTouchEnd = (e: TouchEvent) => {
      const now = Date.now()
      if (now - lastTouchEnd <= 350) e.preventDefault()
      lastTouchEnd = now
    }

    document.addEventListener('gesturestart', onGesture, { passive: false })
    document.addEventListener('gesturechange', onGesture, { passive: false })
    document.addEventListener('gestureend', onGesture, { passive: false })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd, { passive: false })

    return () => {
      document.removeEventListener('gesturestart', onGesture)
      document.removeEventListener('gesturechange', onGesture)
      document.removeEventListener('gestureend', onGesture)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  return null
}
