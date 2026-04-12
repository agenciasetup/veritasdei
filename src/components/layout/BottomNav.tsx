'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Cross, CalendarHeart, BookOpen, User } from 'lucide-react'

/**
 * Navegação mobile — 5 hubs primários.
 *
 * - Hoje: perfil pessoal diário, liturgia, propósitos, atalhos
 * - Orar: rosário, orações, exame de consciência
 * - Liturgia: calendário, leituras do dia, paróquias, confissão
 * - Aprender: trilhas, dogmas, catecismo, virtudes, S. Tomás
 * - Perfil: dados pessoais, propósitos, notificações
 *
 * Busca deixa de ser um slot — vira ícone no header da página Hoje.
 */

const NAV_ITEMS = [
  { href: '/',         icon: Home,          label: 'Hoje' },
  { href: '/orar',     icon: Cross,         label: 'Orar' },
  { href: '/liturgia', icon: CalendarHeart, label: 'Liturgia' },
  { href: '/aprender', icon: BookOpen,      label: 'Aprender' },
  { href: '/perfil',   icon: User,          label: 'Perfil' },
] as const

export default function BottomNav() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) return null

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around md:hidden"
      style={{
        background: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(201,168,76,0.1)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/' && pathname.startsWith(item.href))
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className="flex flex-col items-center gap-0.5 py-2 px-3 transition-colors relative flex-1"
            style={{ color: isActive ? '#C9A84C' : '#7A7368' }}
          >
            {isActive && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-b-full"
                style={{ background: '#C9A84C' }}
              />
            )}
            <Icon className="w-5 h-5" />
            <span
              className="text-[10px] tracking-wide"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
