'use client'

/**
 * Registra o Service Worker em produção.
 *
 * Dev mode é ignorado para evitar cachear builds quentes do Next.
 * Este componente não pede permissão de notificação — isso é feito
 * explicitamente no perfil, com um toggle consciente.
 */

import { useEffect } from 'react'

export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => console.warn('[pwa] SW register failed:', err))
    }

    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])

  return null
}
