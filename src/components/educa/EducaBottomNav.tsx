'use client'

/**
 * EducaBottomNav — bottom nav mobile do Veritas Educa.
 *
 * 4 itens. Sem haptic, sem hide-on-scroll, sem detecção de teclado —
 * a UX do Educa é leitura/foco, então a barra fica simples e fixa.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, GraduationCap, Cross, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/educa',          icon: Home,          label: 'Início' },
  { href: '/educa/estudo',   icon: BookOpen,      label: 'Estudo' },
  { href: '/educa/trilhas',  icon: GraduationCap, label: 'Trilhas' },
  { href: '/rosario',        icon: Cross,         label: 'Rosário' },
  { href: '/educa/perfil',   icon: User,          label: 'Perfil' },
] as const

function isActive(pathname: string, href: string): boolean {
  // /educa só ativa na rota exata; subrotas ativam só o item correspondente,
  // não o "Início". /educa/estudo casa com /estudo/* (wrapper + leitor).
  if (href === '/educa') return pathname === '/educa'
  if (href === '/educa/estudo') {
    return pathname.startsWith('/educa/estudo') || pathname.startsWith('/estudo')
  }
  return pathname === href || pathname.startsWith(href + '/')
}

export default function EducaBottomNav() {
  const pathname = usePathname()

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
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            className="relative flex flex-col items-center justify-center gap-0.5 py-3 px-2 flex-1 active:scale-95 transition-transform"
            style={{ color: active ? 'var(--accent)' : 'var(--text-3)' }}
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
