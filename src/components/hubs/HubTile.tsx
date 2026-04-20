'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { useRecentRoutes } from '@/hooks/useRecentRoutes'

/**
 * Card grande, arredondado, tocável — usado nas páginas de hub
 * (`/rezar`, `/formacao`, `/igrejas`, `/biblioteca`). Visual flat
 * iOS-style pensado pra dedo de mobile: alvo mínimo 76px, alto
 * contraste, ícone grande à esquerda.
 *
 * `featured` destaca o tile principal do hub (ex: Terço em /rezar)
 * com acento sutil na borda + fundo do ícone.
 */

interface HubTileProps {
  href: string
  icon: ReactNode
  title: string
  subtitle?: string
  featured?: boolean
}

export default function HubTile({ href, icon, title, subtitle, featured }: HubTileProps) {
  const { track } = useRecentRoutes()
  return (
    <Link
      href={href}
      onClick={() => track(href, title)}
      className="flex items-center gap-4 p-4 rounded-2xl transition-transform duration-150 ease-out active:scale-[0.985] touch-target-lg"
      style={{
        minHeight: '76px',
        background: 'var(--surface-2)',
        border: `1px solid ${featured ? 'var(--accent-soft)' : 'var(--border-1)'}`,
        boxShadow: featured
          ? '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)'
          : undefined,
      }}
    >
      <div
        className="flex items-center justify-center rounded-2xl flex-shrink-0"
        style={{
          width: '48px',
          height: '48px',
          background: featured ? 'var(--accent-soft)' : 'var(--surface-3)',
          border: `1px solid ${featured ? 'var(--accent-soft)' : 'var(--border-2)'}`,
          color: featured ? 'var(--accent)' : 'var(--text-2)',
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[15px] truncate"
          style={{
            color: 'var(--text-1)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            letterSpacing: '-0.005em',
          }}
        >
          {title}
        </p>
        {subtitle && (
          <p
            className="text-[12.5px] mt-0.5 truncate"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <ChevronRight
        className="w-[18px] h-[18px] flex-shrink-0"
        strokeWidth={2}
        style={{ color: 'var(--text-3)' }}
      />
    </Link>
  )
}
