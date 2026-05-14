'use client'

/**
 * EducaBottomNav — bottom nav mobile do Veritas Educa.
 *
 * Assinante: 5 itens (Início / Estudo / Rosário / Coleção / Perfil).
 * Logado sem assinatura: só Assinar + Perfil — é o único acesso liberado
 * até assinar (o middleware encaminha o resto pra /educa/assine).
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Cross, User, Layers, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/contexts/SubscriptionContext'

type NavItem = {
  href: string
  icon: typeof Home
  label: string
  highlight?: boolean
}

const PREMIUM_NAV: readonly NavItem[] = [
  { href: '/educa',        icon: Home,     label: 'Início' },
  { href: '/educa/estudo', icon: BookOpen, label: 'Estudo' },
  { href: '/rosario',      icon: Cross,    label: 'Rosário' },
  { href: '/colecao',      icon: Layers,   label: 'Coleção' },
  { href: '/perfil',       icon: User,     label: 'Perfil' },
]

const FREE_NAV: readonly NavItem[] = [
  { href: '/educa/assine', icon: Sparkles, label: 'Assinar', highlight: true },
  { href: '/perfil',       icon: User,     label: 'Perfil' },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/educa') return pathname === '/educa'
  // "Estudo" engloba também /educa/trilhas e /estudo/* (subrotas do leitor).
  if (href === '/educa/estudo') {
    return (
      pathname.startsWith('/educa/estudo') ||
      pathname.startsWith('/educa/trilhas') ||
      pathname.startsWith('/estudo')
    )
  }
  return pathname === href || pathname.startsWith(href + '/')
}

export default function EducaBottomNav() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const { isPremium, loading: subLoading } = useSubscription()

  // Enquanto a entitlement carrega, mostra a nav completa pra não piscar
  // a versão reduzida na cara de quem é assinante.
  const navItems: readonly NavItem[] =
    isAuthenticated && !subLoading && !isPremium ? FREE_NAV : PREMIUM_NAV

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around md:hidden"
      style={{
        background: 'color-mix(in srgb, var(--surface-2) 92%, transparent)',
        borderTop: '1px solid var(--border-1)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {navItems.map((item) => {
        const active = isActive(pathname, item.href)
        const Icon = item.icon
        const isHighlight = item.highlight && !active
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            className="relative flex flex-col items-center justify-center gap-0.5 py-3 px-2 flex-1 active:scale-95 transition-transform"
            style={{
              color: active || isHighlight ? 'var(--accent)' : 'var(--text-3)',
            }}
          >
            {active && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-7 rounded-b-full"
                style={{ background: 'var(--accent)' }}
              />
            )}
            <Icon className="w-5 h-5" />
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
