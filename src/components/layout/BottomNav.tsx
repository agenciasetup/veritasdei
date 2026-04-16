'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Cross, CalendarHeart, BookOpen, User } from 'lucide-react'
import { useHaptic } from '@/hooks/useHaptic'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

/**
 * Navegação mobile — 5 hubs primários.
 *
 * - Hoje: perfil pessoal diário, liturgia, propósitos, atalhos
 * - Orar: rosário, orações, exame de consciência
 * - Liturgia: calendário, leituras do dia, paróquias, confissão
 * - Aprender: trilhas, dogmas, catecismo, virtudes, S. Tomás
 * - Perfil: dados pessoais, propósitos, notificações, badge de não-lidas
 *
 * Comportamento mobile:
 * - Indicador animado entre tabs com layoutId
 * - Esconde quando o teclado virtual abre (visualViewport)
 * - Esconde ao scrollar para baixo, aparece ao scrollar para cima
 * - Se a rota é "imersiva" (terço, verbum, leituras), nem renderiza
 */

const NAV_ITEMS = [
  { href: '/',         icon: Home,          label: 'Hoje' },
  { href: '/orar',     icon: Cross,         label: 'Orar' },
  { href: '/liturgia', icon: CalendarHeart, label: 'Liturgia' },
  { href: '/aprender', icon: BookOpen,      label: 'Aprender' },
  { href: '/perfil',   icon: User,          label: 'Perfil' },
] as const

const IMMERSIVE_PATHS = ['/verbum', '/rosario', '/liturgia/hoje']

export default function BottomNav() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const haptic = useHaptic()
  const [hidden, setHidden] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [unread, setUnread] = useState(0)
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

  // Notifications unread badge — fetched once, no polling.
  useEffect(() => {
    if (!isAuthenticated) return
    const ctrl = new AbortController()
    fetch('/api/notificacoes?limit=1', { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.unread_count === 'number') {
          setUnread(data.unread_count)
        }
      })
      .catch(() => {})
    return () => ctrl.abort()
  }, [isAuthenticated, pathname])

  if (!isAuthenticated) return null
  if (IMMERSIVE_PATHS.some((p) => pathname.startsWith(p))) return null

  const offscreen = hidden || keyboardOpen

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around md:hidden transition-transform duration-200"
      style={{
        background: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(201,168,76,0.1)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        transform: offscreen ? 'translateY(110%)' : 'translateY(0)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/' && pathname.startsWith(item.href))
        const Icon = item.icon
        const showBadge = item.href === '/perfil' && unread > 0

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
            style={{ color: isActive ? 'var(--gold)' : 'var(--text-muted)' }}
          >
            {isActive && (
              <motion.span
                layoutId="bottomNavIndicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-b-full"
                style={{ background: 'var(--gold)' }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <div className="relative">
              <Icon className="w-6 h-6" />
              {showBadge && (
                <span
                  aria-label={`${unread} notificação${unread === 1 ? '' : 'es'} não lida${unread === 1 ? '' : 's'}`}
                  className="absolute -top-0.5 -right-1.5 min-w-[16px] h-4 rounded-full px-1 text-[9px] font-semibold flex items-center justify-center"
                  style={{
                    background: 'var(--color-danger)',
                    color: '#fff',
                    border: '2px solid rgba(10,10,10,0.95)',
                  }}
                >
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </div>
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
