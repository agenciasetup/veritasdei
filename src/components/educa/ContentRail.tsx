'use client'

/**
 * ContentRail — carrossel horizontal estilo Netflix.
 *
 * Uso:
 *   <ContentRail title="Continue de onde parou" cta={{ label: 'Ver tudo', href: '...' }}>
 *     <RailItem>...</RailItem>
 *     <RailItem>...</RailItem>
 *   </ContentRail>
 *
 * - Scroll horizontal com snap nos itens.
 * - Setas no desktop (md+) que aparecem em hover.
 * - Padding lateral coordenado com o container pai (gap mínimo de 16px
 *   nas extremidades pra não cortar cards na borda da tela).
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

type RailProps = {
  title: string
  subtitle?: string
  cta?: { label: string; href: string }
  children: ReactNode
  /** Gap entre items em px (default 12 mobile, 16 desktop). */
  gap?: number
}

export default function ContentRail({
  title,
  subtitle,
  cta,
  children,
  gap = 12,
}: RailProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    updateArrows()
    el.addEventListener('scroll', updateArrows, { passive: true })
    const ro = new ResizeObserver(updateArrows)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      ro.disconnect()
    }
  }, [updateArrows])

  function scrollBy(direction: 1 | -1) {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'smooth' })
  }

  return (
    <section className="group/rail">
      <div className="flex items-end justify-between gap-3 mb-3 md:mb-4 px-1">
        <div className="min-w-0">
          <h2
            className="text-lg md:text-2xl"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-1)',
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="text-xs md:text-sm mt-0.5"
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {cta && (
          <Link
            href={cta.href}
            className="inline-flex items-center gap-1 text-xs flex-shrink-0"
            style={{
              color: 'var(--accent)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {cta.label} <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      <div className="relative">
        {/* Setas — só md+, fade em hover */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Anterior"
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full opacity-0 group-hover/rail:opacity-100 transition-opacity"
            style={{
              background: 'rgba(0,0,0,0.7)',
              border: '1px solid var(--border-1)',
              backdropFilter: 'blur(4px)',
              color: 'white',
            }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Próximo"
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full opacity-0 group-hover/rail:opacity-100 transition-opacity"
            style={{
              background: 'rgba(0,0,0,0.7)',
              border: '1px solid var(--border-1)',
              backdropFilter: 'blur(4px)',
              color: 'white',
            }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <div
          ref={scrollerRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-4 md:-mx-8 px-4 md:px-8"
          style={{
            gap,
            scrollbarWidth: 'none',
          }}
        >
          {children}
        </div>
      </div>
    </section>
  )
}

/**
 * Item do rail — wrapper com largura fixa pra scroll snap consistente.
 * `width` em px. Default mobile 260, desktop pode customizar.
 */
export function RailItem({
  children,
  widthClassName = 'w-64 md:w-72',
}: {
  children: ReactNode
  /** Tailwind class de largura. Ex.: 'w-72 md:w-80'. */
  widthClassName?: string
}) {
  return (
    <div className={`${widthClassName} flex-shrink-0 snap-start`}>
      {children}
    </div>
  )
}
