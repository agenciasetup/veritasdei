'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  Home, BookOpen, MapPin, User, LayoutGrid,
  Church, Droplets, ScrollText, Tablets, Scale, Heart, X,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Início' },
  { href: '/trilhas', icon: BookOpen, label: 'Trilhas' },
  { href: '/paroquias', icon: MapPin, label: 'Paróquias' },
  { href: '/perfil', icon: User, label: 'Perfil' },
]

const MORE_ITEMS = [
  { href: '/dogmas', icon: Church, label: 'Dogmas' },
  { href: '/sacramentos', icon: Droplets, label: 'Sacramentos' },
  { href: '/preceitos', icon: ScrollText, label: 'Preceitos' },
  { href: '/mandamentos', icon: Tablets, label: 'Mandamentos' },
  { href: '/oracoes', icon: BookOpen, label: 'Orações' },
  { href: '/virtudes-pecados', icon: Scale, label: 'Virtudes' },
  { href: '/obras-misericordia', icon: Heart, label: 'Misericórdia' },
  { href: '/comunidade', icon: LayoutGrid, label: 'Comunidade' },
  { href: '/carteirinha', icon: User, label: 'Carteirinha' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const [showMore, setShowMore] = useState(false)

  if (!isAuthenticated) return null

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div
          className="fixed inset-0 z-[99] md:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-[56px] left-0 right-0 rounded-t-2xl p-4"
            style={{
              background: 'rgba(16,16,16,0.98)',
              borderTop: '1px solid rgba(201,168,76,0.15)',
              paddingBottom: 'env(safe-area-inset-bottom, 8px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <h3
                className="text-sm font-bold tracking-wider uppercase"
                style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
              >
                Conteúdo da Fé
              </h3>
              <button
                onClick={() => setShowMore(false)}
                className="p-1"
                style={{ color: '#7A7368' }}
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MORE_ITEMS.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all"
                    style={{
                      background: isActive ? 'rgba(201,168,76,0.1)' : 'rgba(10,10,10,0.5)',
                      border: isActive ? '1px solid rgba(201,168,76,0.25)' : '1px solid rgba(201,168,76,0.06)',
                      color: isActive ? '#C9A84C' : '#7A7368',
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span
                      className="text-[10px] text-center leading-tight"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav
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
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
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

        {/* More button */}
        <button
          onClick={() => setShowMore(!showMore)}
          className="flex flex-col items-center gap-0.5 py-2 px-3 transition-colors relative"
          style={{ color: showMore ? '#C9A84C' : '#7A7368' }}
          aria-label="Mais opções"
        >
          <LayoutGrid className="w-5 h-5" />
          <span
            className="text-[10px] tracking-wide"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Mais
          </span>
        </button>
      </nav>
    </>
  )
}
