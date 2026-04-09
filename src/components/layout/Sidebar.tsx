'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, Home, Church, Droplets, ScrollText, Tablets, BookOpen, Scale, Heart } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Início' },
  { href: '/dogmas', icon: Church, label: 'Dogmas' },
  { href: '/sacramentos', icon: Droplets, label: 'Sacramentos' },
  { href: '/preceitos', icon: ScrollText, label: 'Preceitos' },
  { href: '/mandamentos', icon: Tablets, label: 'Mandamentos' },
  { href: '/oracoes', icon: BookOpen, label: 'Orações' },
  { href: '/virtudes-pecados', icon: Scale, label: 'Virtudes e Pecados' },
]

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false)
  const pathname = usePathname()

  return (
    <nav
      className="fixed top-0 left-0 z-[100] h-full flex flex-col transition-all duration-300 ease-out"
      style={{
        width: expanded ? '220px' : '64px',
        background: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(201,168,76,0.08)',
      }}
    >
      {/* Logo area */}
      <div className="flex items-center justify-center h-16 flex-shrink-0">
        {expanded ? (
          <span
            className="text-sm font-bold tracking-widest uppercase"
            style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
          >
            Veritas Dei
          </span>
        ) : (
          <span style={{ color: '#C9A84C', fontSize: '1.1rem' }}>✝</span>
        )}
      </div>

      {/* Divider */}
      <div className="mx-3 h-px" style={{ background: 'rgba(201,168,76,0.1)' }} />

      {/* Nav items */}
      <div className="flex-1 flex flex-col gap-1 px-2 pt-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className="flex items-center gap-3 rounded-xl transition-all duration-200 group relative"
              style={{
                padding: expanded ? '10px 14px' : '10px 0',
                justifyContent: expanded ? 'flex-start' : 'center',
                background: isActive ? 'rgba(201,168,76,0.1)' : 'transparent',
                color: isActive ? '#C9A84C' : '#7A7368',
              }}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {expanded && (
                <span
                  className="text-sm whitespace-nowrap"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  {item.label}
                </span>
              )}
              {/* Active indicator */}
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
                  style={{ height: '20px', background: '#C9A84C' }}
                />
              )}
              {/* Tooltip when collapsed */}
              {!expanded && (
                <span
                  className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200"
                  style={{
                    background: 'rgba(10,10,10,0.95)',
                    border: '1px solid rgba(201,168,76,0.15)',
                    color: '#C9A84C',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Expand/Collapse toggle */}
      <div className="flex-shrink-0 px-2 pb-4">
        <div className="mx-1 h-px mb-3" style={{ background: 'rgba(201,168,76,0.1)' }} />
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-3 rounded-xl py-2 transition-all duration-200"
          style={{
            justifyContent: expanded ? 'flex-start' : 'center',
            padding: expanded ? '8px 14px' : '8px 0',
            color: '#7A7368',
          }}
          aria-label={expanded ? 'Encolher menu' : 'Expandir menu'}
        >
          {expanded ? (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs" style={{ fontFamily: 'Poppins, sans-serif' }}>Encolher</span>
            </>
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </nav>
  )
}
