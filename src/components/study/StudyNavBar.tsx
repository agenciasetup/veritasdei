'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import type { StudyNextHint } from '@/lib/study/types'

interface Props {
  prev: StudyNextHint | null
  next: StudyNextHint | null
}

/**
 * Botões Prev/Next para navegação entre subtópicos.
 *
 * - Mobile (<lg): fixado ao bottom do viewport, acima da BottomNav,
 *   respeitando safe-area do iOS.
 * - Desktop (lg+): sticky bottom dentro da coluna main — sempre
 *   visível conforme o usuário rola.
 *
 * Quando `next.isPillarComplete` é true, o botão vira call-to-action
 * dourado "Pilar concluído".
 */
export default function StudyNavBar({ prev, next }: Props) {
  if (!prev && !next) return null

  return (
    <>
      {/* Desktop: inline sticky bottom */}
      <div
        className="hidden lg:block sticky bottom-4 mt-10 pt-4 pb-2"
        aria-label="Navegação entre lições"
      >
        <div className="max-w-[740px] mx-auto px-4 md:px-6">
          <NavButtons prev={prev} next={next} />
        </div>
      </div>

      {/* Mobile: fixed bottom above BottomNav */}
      <div
        className="lg:hidden fixed left-0 right-0 z-40 px-4 pt-2"
        style={{
          bottom: 'calc(var(--bottom-nav-h, 72px) + env(safe-area-inset-bottom, 0px))',
          background:
            'linear-gradient(to top, rgba(15,14,12,0.96) 72%, rgba(15,14,12,0))',
          paddingBottom: 12,
        }}
      >
        <NavButtons prev={prev} next={next} compact />
      </div>
    </>
  )
}

function NavButtons({
  prev,
  next,
  compact,
}: {
  prev: StudyNextHint | null
  next: StudyNextHint | null
  compact?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <NavSide
        href={prev?.href}
        label={prev?.label ?? 'Início do pilar'}
        direction="prev"
        disabled={!prev}
        compact={compact}
      />
      <NavSide
        href={next?.href}
        label={next?.label ?? ''}
        direction="next"
        disabled={!next}
        complete={next?.isPillarComplete}
        compact={compact}
      />
    </div>
  )
}

function NavSide({
  href,
  label,
  direction,
  disabled,
  complete,
  compact,
}: {
  href?: string
  label: string
  direction: 'prev' | 'next'
  disabled?: boolean
  complete?: boolean
  compact?: boolean
}) {
  const Icon = direction === 'prev' ? ArrowLeft : complete ? Check : ArrowRight
  const background = complete
    ? 'linear-gradient(135deg, rgba(201,168,76,0.25), rgba(168,139,58,0.25))'
    : 'rgba(201,168,76,0.08)'
  const color = complete ? 'var(--accent)' : disabled ? 'var(--text-3)' : 'var(--text-2)'
  const justify = direction === 'prev' ? 'justify-start' : 'justify-end'

  const inner = (
    <>
      {direction === 'prev' ? (
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent)' }} />
      ) : null}
      <span
        className={`text-xs tracking-[0.06em] uppercase truncate ${compact ? 'max-w-[160px]' : ''}`}
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <span style={{ color: 'var(--text-3)' }}>
          {direction === 'prev' ? 'Anterior' : complete ? '' : 'Próximo'}
        </span>
        {direction === 'prev' ? (
          <span className="ml-1.5" style={{ color }}>
            {compact ? '' : label}
          </span>
        ) : (
          <span className={complete ? '' : 'ml-1.5'} style={{ color }}>
            {complete ? label : compact ? '' : label}
          </span>
        )}
      </span>
      {direction === 'next' ? (
        <Icon
          className="w-4 h-4 flex-shrink-0"
          style={{ color: complete ? 'var(--accent)' : 'var(--accent)' }}
        />
      ) : null}
    </>
  )

  const className = `flex-1 inline-flex items-center gap-2 ${justify} px-4 py-2.5 rounded-xl transition-all active:scale-[0.98]`
  const style: React.CSSProperties = {
    background,
    border: '1px solid rgba(201,168,76,0.2)',
    opacity: disabled ? 0.5 : 1,
  }

  if (disabled || !href) {
    return (
      <div
        aria-disabled="true"
        className={className}
        style={style}
      >
        {inner}
      </div>
    )
  }

  return (
    <Link href={href} className={className} style={style}>
      {inner}
    </Link>
  )
}
