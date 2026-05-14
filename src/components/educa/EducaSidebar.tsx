'use client'

/**
 * EducaSidebar — sidebar fina (64px) pro Veritas Educa no desktop.
 *
 * 4 ícones empilhados. Sem hubs, sem grupos, sem expand toggle — a UX
 * é "menos é mais". O TopBar cobre logo + perfil; aqui ficam os 4
 * destinos principais.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Cross, User, Sparkles, Layers } from 'lucide-react'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { useAuth } from '@/contexts/AuthContext'

type NavItem = {
  href: string
  icon: typeof Home
  label: string
  highlight?: boolean
}

const BASE_NAV_ITEMS: readonly NavItem[] = [
  { href: '/educa',          icon: Home,          label: 'Início' },
  { href: '/educa/estudo',   icon: BookOpen,      label: 'Estudo' },
  { href: '/rosario',        icon: Cross,         label: 'Rosário' },
  { href: '/colecao',        icon: Layers,        label: 'Coleção' },
  { href: '/perfil',         icon: User,          label: 'Perfil' },
]

// Item exibido somente quando o usuário está logado e ainda não é premium.
// Quando assinar, some — não vira lixo visual permanente.
const SUBSCRIBE_ITEM: NavItem = {
  href: '/educa/assine',
  icon: Sparkles,
  label: 'Assinar',
  highlight: true,
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/educa') return pathname === '/educa'
  if (href === '/educa/estudo') {
    return (
      pathname.startsWith('/educa/estudo') ||
      pathname.startsWith('/educa/trilhas') ||
      pathname.startsWith('/estudo')
    )
  }
  return pathname === href || pathname.startsWith(href + '/')
}

export default function EducaSidebar() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const { isPremium, loading: subLoading } = useSubscription()

  // Insere "Assinar" antes do Perfil (último item) quando logado e ainda
  // não tem premium. Enquanto carrega a entitlement, não mostra — evita
  // pisca-pisca.
  const navItems: readonly NavItem[] =
    isAuthenticated && !subLoading && !isPremium
      ? [
          ...BASE_NAV_ITEMS.slice(0, -1),
          SUBSCRIBE_ITEM,
          BASE_NAV_ITEMS[BASE_NAV_ITEMS.length - 1],
        ]
      : BASE_NAV_ITEMS

  return (
    <nav
      aria-label="Menu lateral"
      className="fixed top-12 left-0 z-[90] h-[calc(100%-3rem)] w-16 flex flex-col items-center py-3 gap-1"
      style={{
        background: 'var(--surface-2)',
        borderRight: '1px solid var(--border-1)',
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
            title={item.label}
            className="relative w-12 h-12 flex items-center justify-center rounded-xl transition-colors group"
            style={{
              background: active
                ? 'var(--accent-soft)'
                : isHighlight
                  ? 'color-mix(in srgb, var(--accent) 18%, transparent)'
                  : 'transparent',
              color: active || isHighlight ? 'var(--accent)' : 'var(--text-3)',
              border: isHighlight
                ? '1px solid color-mix(in srgb, var(--accent) 30%, transparent)'
                : undefined,
            }}
          >
            <Icon className="w-5 h-5" />
            {active && (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
                style={{ height: '20px', background: 'var(--accent)' }}
              />
            )}
            {/* Tooltip on hover */}
            <span
              className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200"
              style={{
                background: 'rgba(10,10,10,0.95)',
                border: '1px solid var(--border-1)',
                color: 'var(--accent)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
