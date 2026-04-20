'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Cross, GraduationCap, Church, Users, Library } from 'lucide-react'
import { useHaptic } from '@/hooks/useHaptic'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

/**
 * Navegação mobile — 5 hubs primários.
 *
 * - Rezar: terço, novenas, orações, exame de consciência
 * - Formação: trilhas, dogmas, sacramentos, S. Tomás (premium)
 * - Igrejas: paróquias, busca, cadastro
 * - Comunidade: feed, perfis públicos
 * - Biblioteca: Bíblia/leituras, catecismo, IA de busca, referência
 *
 * Perfil é acessível pelo avatar do AppHeader (não é mais uma aba).
 *
 * Comportamento mobile:
 * - Indicador animado entre tabs com layoutId
 * - Esconde quando o teclado virtual abre (visualViewport)
 * - Esconde ao scrollar para baixo, aparece ao scrollar para cima
 * - Se a rota é "imersiva" (terço, verbum, leituras), nem renderiza
 */

// Rezar fica no centro (3ª posição) — é a HOME do app.
const NAV_ITEMS = [
  { href: '/formacao',   icon: GraduationCap,  label: 'Formação' },
  { href: '/comunidade', icon: Users,          label: 'Comunidade' },
  { href: '/rezar',      icon: Cross,          label: 'Rezar' },
  { href: '/igrejas',    icon: Church,         label: 'Igrejas' },
  { href: '/biblioteca', icon: Library,        label: 'Biblioteca' },
] as const

const IMMERSIVE_PATHS = ['/verbum', '/rosario', '/liturgia/hoje']

/** Rotas antigas que ainda ativam o item correspondente durante a migração. */
const ALIASES: Record<string, string> = {
  '/orar': '/rezar',
  '/aprender': '/formacao',
  '/paroquias': '/igrejas',
}

function isItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true
  if (pathname.startsWith(href + '/')) return true
  // Rota antiga mapeada para o novo hub
  for (const [old, canonical] of Object.entries(ALIASES)) {
    if (canonical !== href) continue
    if (pathname === old || pathname.startsWith(old + '/')) return true
  }
  return false
}

export default function BottomNav() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const haptic = useHaptic()
  const [hidden, setHidden] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const lastScrollRef = useRef(0)

  // Hide on scroll-down, show on scroll-up
  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY
      const last = lastScrollRef.current
      if (current < 80) {
        setHidden(false)
      } else if (current > last + 8) {
        setHidden(true)
      } else if (current < last - 8) {
        setHidden(false)
      }
      lastScrollRef.current = current
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Hide when virtual keyboard opens
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null
    if (!vv) return
    const update = () => {
      const heightDiff = window.innerHeight - vv.height
      setKeyboardOpen(heightDiff > 120)
    }
    update()
    vv.addEventListener('resize', update)
    return () => vv.removeEventListener('resize', update)
  }, [])

  if (!isAuthenticated) return null
  if (IMMERSIVE_PATHS.some((p) => pathname.startsWith(p))) return null

  const offscreen = hidden || keyboardOpen

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around md:hidden transition-transform duration-200"
      style={{
        background: 'color-mix(in srgb, var(--surface-2) 90%, transparent)',
        borderTop: '1px solid var(--border-1)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        transform: offscreen ? 'translateY(110%)' : 'translateY(0)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = isItemActive(pathname, item.href)
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => {
              if (!isActive) haptic.pulse('tap')
            }}
            className="relative flex flex-col items-center justify-center gap-0.5 py-3 px-2 transition-colors flex-1 touch-target-lg active:scale-95"
            style={{ color: isActive ? 'var(--accent)' : 'var(--text-3)' }}
          >
            {isActive && (
              <motion.span
                layoutId="bottomNavIndicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-b-full"
                style={{ background: 'var(--accent)' }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <Icon className="w-6 h-6" />
            <span
              className="text-[11px] tracking-wide"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
