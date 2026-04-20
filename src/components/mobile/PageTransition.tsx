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

/**
 * Hubs da bottom nav — slide horizontal entre eles (mesma profundidade,
 * direção baseada na ordem do nav).
 * Inclui aliases legacy (/orar → /rezar etc) para o período de redirects 301.
 */
const TAB_HUBS_ORDER = [
  '/rezar',
  '/formacao',
  '/igrejas',
  '/comunidade',
  '/biblioteca',
]

const HUB_ALIASES: Record<string, string> = {
  '/orar': '/rezar',
  '/aprender': '/formacao',
  '/paroquias': '/igrejas',
}

function canonicalizeHub(path: string): string {
  return HUB_ALIASES[path] ?? path
}

function hubIndex(path: string): number {
  const canonical = canonicalizeHub(path)
  return TAB_HUBS_ORDER.indexOf(canonical)
}

function depthOf(path: string): number {
  if (path === '/') return 0
  return path.split('/').filter(Boolean).length
}

function isTabHub(path: string): boolean {
  return hubIndex(path) >= 0 || path === '/'
}

type Direction = 'forward' | 'back' | 'fade' | 'slide-left' | 'slide-right'

function computeDirection(prev: string, next: string): Direction {
  if (prev === next) return 'fade'
  const prevHub = hubIndex(prev)
  const nextHub = hubIndex(next)
  // Mesma profundidade + ambos são hubs da bottom nav: slide horizontal direcional.
  if (prevHub >= 0 && nextHub >= 0) {
    if (nextHub > prevHub) return 'slide-left'
    if (nextHub < prevHub) return 'slide-right'
    return 'fade'
  }
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

  const variants = (() => {
    switch (direction) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        }
      case 'forward':
        return {
          initial: { opacity: 0, x: '8%' },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: '-4%' },
        }
      case 'back':
        return {
          initial: { opacity: 0, x: '-8%' },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: '4%' },
        }
      case 'slide-left':
        // Novo hub está mais à direita na nav — página entra da direita.
        return {
          initial: { opacity: 0, x: '12%' },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: '-6%' },
        }
      case 'slide-right':
        // Novo hub está mais à esquerda — página entra da esquerda.
        return {
          initial: { opacity: 0, x: '-12%' },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: '6%' },
        }
    }
  })()

  const isSlide = direction === 'slide-left' || direction === 'slide-right'

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={{
          duration: direction === 'fade' ? 0.10 : isSlide ? 0.20 : 0.16,
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
