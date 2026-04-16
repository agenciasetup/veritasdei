'use client'

import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'

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
            background: 'rgba(15,14,12,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(201,168,76,0.08)',
          }}
        >
          <h1
            className="text-base font-medium truncate"
            style={{
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {title}
          </h1>
          {rightAction && <div className="flex-shrink-0 ml-3 pointer-events-auto">{rightAction}</div>}
        </div>
      </div>

      {/* Expanded large title */}
      <header className="px-5 pt-16 pb-3 relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {expandedExtra && <div className="mb-3">{expandedExtra}</div>}
            <h1
              className="text-3xl leading-tight font-semibold"
              style={{
                fontFamily: 'var(--font-elegant)',
                color: 'var(--text-primary)',
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="text-sm mt-1.5"
                style={{
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {rightAction && <div className="flex-shrink-0 pt-1">{rightAction}</div>}
        </div>
        <div ref={sentinelRef} className="h-px" aria-hidden="true" />
      </header>

      {children}
    </div>
  )
}

export default CollapsibleHeader
