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
import { Home, GraduationCap, Swords, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/educa',          icon: Home,          label: 'Início' },
  { href: '/educa/trilhas',  icon: GraduationCap, label: 'Trilhas' },
  { href: '/educa/debate',   icon: Swords,        label: 'Debate' },
  { href: '/educa/perfil',   icon: User,          label: 'Perfil' },
] as const

function isActive(pathname: string, href: string): boolean {
  if (href === '/educa') return pathname === '/educa'
  return pathname === href || pathname.startsWith(href + '/')
}

export default function EducaSidebar() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Menu lateral"
      className="fixed top-12 left-0 z-[90] h-[calc(100%-3rem)] w-16 flex flex-col items-center py-3 gap-1"
      style={{
        background: 'var(--surface-2)',
        borderRight: '1px solid var(--border-1)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className="relative w-12 h-12 flex items-center justify-center rounded-xl transition-colors group"
            style={{
              background: active ? 'var(--accent-soft)' : 'transparent',
              color: active ? 'var(--accent)' : 'var(--text-3)',
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
