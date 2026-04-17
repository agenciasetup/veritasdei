'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { type ReactNode, useState } from 'react'

/**
 * Transição direcional entre páginas estilo iOS:
 *  - mais profundo  → slide left + fade
 *  - menos profundo → slide right + fade
 *  - mesma profundidade (troca de tab) → crossfade rápido
 *
 * "Profundidade" é estimada pelo número de segmentos da rota.
 */

const TAB_HUBS = ['/', '/orar', '/liturgia', '/aprender', '/perfil']

function depthOf(path: string): number {
  if (path === '/') return 0
  return path.split('/').filter(Boolean).length
}

function isTabHub(path: string): boolean {
  if (path === '/') return true
  return TAB_HUBS.some((p) => p !== '/' && path.startsWith(p) && path === p)
}

type Direction = 'forward' | 'back' | 'fade'

function computeDirection(prev: string, next: string): Direction {
  if (prev === next) return 'fade'
  const prevDepth = depthOf(prev)
  const nextDepth = depthOf(next)
  if (isTabHub(prev) && isTabHub(next)) return 'fade'
  if (nextDepth > prevDepth) return 'forward'
  if (nextDepth < prevDepth) return 'back'
  return 'fade'
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  // Padrão React 18+ "store previous": setState durante render é OK e
  // dispara re-render síncrono antes do commit, sem cascading.
  const [prevPath, setPrevPath] = useState(pathname)
  const [direction, setDirection] = useState<Direction>('fade')

  if (prevPath !== pathname) {
    setDirection(computeDirection(prevPath, pathname))
    setPrevPath(pathname)
  }

  const variants =
    direction === 'fade'
      ? {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        }
      : direction === 'forward'
        ? {
            initial: { opacity: 0, x: '8%' },
            animate: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: '-4%' },
          }
        : {
            initial: { opacity: 0, x: '-8%' },
            animate: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: '4%' },
          }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={{
          duration: direction === 'fade' ? 0.10 : 0.16,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{ willChange: 'transform, opacity' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export default PageTransition
