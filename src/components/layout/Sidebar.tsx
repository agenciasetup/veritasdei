'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Search, Church, Droplets, ScrollText, Home } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Início' },
  { href: '/dogmas', icon: Church, label: 'Dogmas' },
  { href: '/sacramentos', icon: Droplets, label: 'Sacramentos' },
  { href: '/preceitos', icon: ScrollText, label: 'Preceitos' },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Toggle button — always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-5 left-5 z-[100] w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-300"
        style={{
          background: open ? 'rgba(201,168,76,0.15)' : 'rgba(16,16,16,0.8)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(201,168,76,0.15)',
        }}
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
      >
        {open ? (
          <X className="w-5 h-5" style={{ color: '#C9A84C' }} />
        ) : (
          <Menu className="w-5 h-5" style={{ color: '#C9A84C' }} />
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[90] bg-black/50 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <nav
        className="fixed top-0 left-0 z-[95] h-full flex flex-col transition-transform duration-300 ease-out"
        style={{
          width: '260px',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          background: 'rgba(12,12,12,0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(201,168,76,0.1)',
        }}
      >
        {/* Header */}
        <div className="pt-20 pb-6 px-6">
          <h2
            className="text-lg font-bold tracking-widest uppercase"
            style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
          >
            Veritas Dei
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.2)' }} />
            <span style={{ color: '#C9A84C', opacity: 0.4, fontSize: '0.55rem' }}>&#10022;</span>
            <span className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.2)' }} />
          </div>
        </div>

        {/* Nav links */}
        <div className="flex-1 px-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                style={{
                  background: isActive ? 'rgba(201,168,76,0.1)' : 'transparent',
                  borderLeft: isActive ? '2px solid #C9A84C' : '2px solid transparent',
                  color: isActive ? '#C9A84C' : '#7A7368',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.9rem',
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-6">
          <p
            className="text-xs"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif', letterSpacing: '0.05em' }}
          >
            A IA organiza, não ensina.
          </p>
        </div>
      </nav>
    </>
  )
}
