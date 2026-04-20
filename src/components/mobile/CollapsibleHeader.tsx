'use client'

import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
import Divider from '@/components/ui/Divider'

/**
 * `<CollapsibleHeader />` — padrão Large Title estilo iOS.
 *
 * - Estado expandido: título Cormorant grande + subtítulo opcional.
 * - Estado colapsado (após scroll): barra compacta sticky com blur,
 *   título em Poppins menor.
 *
 * O colapso é detectado via IntersectionObserver de uma sentinela invisível
 * abaixo do título grande — performance bem melhor que ouvir scroll.
 */

interface CollapsibleHeaderProps {
  title: string
  subtitle?: string
  /** Ação no canto direito (ex: botão de busca) */
  rightAction?: ReactNode
  /** Conteúdo abaixo do header — recebe o scroll natural da página */
  children?: ReactNode
  /** Sub-elemento extra exibido no estado expandido (ex: avatar) */
  expandedExtra?: ReactNode
}

export function CollapsibleHeader({
  title,
  subtitle,
  rightAction,
  expandedExtra,
  children,
}: CollapsibleHeaderProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(
      ([entry]) => setCollapsed(!entry.isIntersecting),
      { threshold: 0 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div className="relative">
      {/* Sticky compact bar — fades in quando o título grande sai de vista */}
      <div
        className="sticky top-0 z-30 -mb-14 h-14 pointer-events-none"
        aria-hidden={!collapsed}
      >
        <div
          className="flex items-center justify-between px-5 h-full transition-opacity duration-200 safe-top"
          style={{
            opacity: collapsed ? 1 : 0,
            pointerEvents: collapsed ? 'auto' : 'none',
            background: 'color-mix(in srgb, var(--surface-2) 92%, transparent)',
            backdropFilter: 'saturate(130%) blur(8px)',
            WebkitBackdropFilter: 'saturate(130%) blur(8px)',
            borderBottom: '1px solid var(--border-1)',
          }}
        >
          <h1
            className="text-sm font-semibold tracking-[0.12em] uppercase truncate"
            style={{
              color: 'var(--text-1)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {title}
          </h1>
          {rightAction && <div className="flex-shrink-0 ml-3 pointer-events-auto">{rightAction}</div>}
        </div>
      </div>

      {/* Expanded large title */}
      <header className="px-5 pt-16 pb-2 relative text-center">
        {rightAction && (
          <div className="absolute right-5 top-16">{rightAction}</div>
        )}
        {expandedExtra && <div className="mb-3">{expandedExtra}</div>}
        <h1
          className="text-[28px] leading-tight tracking-[0.1em] uppercase"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-1)',
            fontWeight: 700,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-sm mt-2 max-w-md mx-auto"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {subtitle}
          </p>
        )}
        <Divider variant="ornament" className="max-w-[180px] mx-auto" spacing="default" />
        <div ref={sentinelRef} className="h-px" aria-hidden="true" />
      </header>

      {children}
    </div>
  )
}

export default CollapsibleHeader
