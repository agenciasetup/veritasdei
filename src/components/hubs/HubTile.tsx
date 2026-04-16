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
      className="flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.98] touch-target-lg"
      style={{
        background: featured ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${featured ? 'rgba(201,168,76,0.25)' : 'rgba(201,168,76,0.08)'}`,
        minHeight: '76px',
      }}
    >
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{
          width: '52px',
          height: '52px',
          background: featured
            ? 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.05))'
            : 'rgba(201,168,76,0.06)',
          color: '#C9A84C',
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-base font-medium truncate"
          style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
        >
          {title}
        </p>
        {subtitle && (
          <p
            className="text-xs mt-0.5 truncate"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: '#7A7368' }} />
    </Link>
  )
}
