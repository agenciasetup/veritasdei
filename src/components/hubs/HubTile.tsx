'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { useRecentRoutes } from '@/hooks/useRecentRoutes'

/**
 * Card grande, arredondado, tocável — usado nas páginas de hub
 * (/orar, /liturgia, /aprender). Visual pensado pra dedo de mobile:
 * alvo mínimo de 72px, alto contraste, ícone grande à esquerda.
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
      className="ios-surface flex items-center gap-4 p-4 transition-transform active:scale-[0.985] touch-target-lg"
      style={{
        minHeight: '76px',
        ...(featured
          ? {
              borderColor: 'rgba(201,168,76,0.22)',
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.05) inset, 0 10px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.08)',
            }
          : null),
      }}
    >
      <div
        className="flex items-center justify-center rounded-2xl flex-shrink-0"
        style={{
          width: '48px',
          height: '48px',
          background: featured
            ? 'linear-gradient(180deg, rgba(201,168,76,0.28) 0%, rgba(201,168,76,0.08) 100%)'
            : 'rgba(255,255,255,0.04)',
          border: featured
            ? '1px solid rgba(201,168,76,0.25)'
            : '1px solid rgba(255,255,255,0.05)',
          color: featured ? '#E4C56E' : 'var(--gold-light)',
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[15px] truncate"
          style={{
            color: 'var(--text-primary)',
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
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <ChevronRight className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={2} style={{ color: 'var(--text-muted)' }} />
    </Link>
  )
}
