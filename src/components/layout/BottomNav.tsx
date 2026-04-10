'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Home, GraduationCap, Search, MapPin, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',          icon: Home,          label: 'Início' },
  { href: '/trilhas',   icon: GraduationCap, label: 'Trilhas' },
  { href: '/?focus=search', icon: Search,    label: 'Buscar',  isSearch: true },
  { href: '/paroquias', icon: MapPin,        label: 'Paróquias' },
  { href: '/perfil',    icon: User,          label: 'Eu' },
]

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
        const isActive = item.isSearch
          ? false
          : pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
        const Icon = item.icon

        // Search button gets special central styling
        if (item.isSearch) {
          return (
            <Link
              key="search"
              href="/?focus=search"
              className="flex flex-col items-center gap-0.5 py-1.5 px-3 -mt-3 relative"
              aria-label="Buscar"
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
                  boxShadow: '0 4px 16px rgba(201,168,76,0.3)',
                }}
              >
                <Search className="w-5 h-5" style={{ color: '#0F0E0C' }} />
              </div>
              <span
                className="text-[10px] tracking-wide"
                style={{ fontFamily: 'Poppins, sans-serif', color: '#C9A84C' }}
              >
                {item.label}
              </span>
            </Link>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className="flex flex-col items-center gap-0.5 py-2 px-3 transition-colors relative"
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
