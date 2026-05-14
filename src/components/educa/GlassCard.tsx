'use client'

/**
 * GlassCard — wrapper com efeito glassmorphism premium (paleta sacra).
 *
 * Variantes:
 *  - `default`   : base preta translúcida + blur, borda dourada bem sutil
 *  - `gold`      : tom dourado discreto no fundo (pra destaques)
 *  - `wine`      : tom vinho profundo (pra Modo Debate, alertas)
 *  - `inset`     : invertido (mais escuro, pra blocos aninhados)
 *
 * O blur depende do Safari/Chrome moderno suportar backdrop-filter.
 * Fallback: o background semi-opaco já garante leitura.
 */

import { forwardRef, type CSSProperties, type ReactNode } from 'react'

type Variant = 'default' | 'gold' | 'wine' | 'inset' | 'flat'

const VARIANT_STYLE: Record<Variant, CSSProperties> = {
  default: {
    background:
      'linear-gradient(180deg, rgba(20,18,16,0.65) 0%, rgba(15,14,12,0.55) 100%)',
    border: '1px solid color-mix(in srgb, var(--accent) 14%, transparent)',
    boxShadow:
      '0 4px 24px -8px rgba(0,0,0,0.6), inset 0 1px 0 0 rgba(255,255,255,0.04)',
  },
  gold: {
    background:
      'linear-gradient(180deg, color-mix(in srgb, var(--accent) 14%, rgba(20,18,16,0.7)) 0%, rgba(15,14,12,0.55) 100%)',
    border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
    boxShadow:
      '0 8px 32px -12px color-mix(in srgb, var(--accent) 30%, transparent), inset 0 1px 0 0 rgba(255,255,255,0.05)',
  },
  wine: {
    background:
      'linear-gradient(180deg, color-mix(in srgb, var(--wine-light) 22%, rgba(20,18,16,0.7)) 0%, rgba(15,14,12,0.6) 100%)',
    border: '1px solid color-mix(in srgb, var(--wine-light) 32%, transparent)',
    boxShadow:
      '0 8px 32px -12px color-mix(in srgb, var(--wine) 35%, transparent), inset 0 1px 0 0 rgba(255,255,255,0.04)',
  },
  inset: {
    background: 'rgba(10,9,8,0.7)',
    border: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)',
  },
  // 'flat' — direção editorial nova: superfície sólida, sem glass, sem
  // gradient, borda 5% branco. Usado pela dashboard /educa.
  flat: {
    background: 'var(--surface-2)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
}

type Props = {
  variant?: Variant
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** Quando true, aplica padding e arredonda generosamente (presenta look "card cheio"). */
  padded?: boolean
  /** Encaminhar comportamento de link/botão (mantém shadow + scale ativo). */
  interactive?: boolean
  as?: 'div' | 'section' | 'article'
}

const GlassCard = forwardRef<HTMLDivElement, Props>(function GlassCard(
  props,
  ref,
) {
  const {
    variant = 'default',
    children,
    className,
    style,
    padded = false,
    interactive = false,
    as = 'div',
  } = props
  const Tag = as as 'div'
  const variantStyle: CSSProperties = VARIANT_STYLE[variant as Variant]
  const isFlat = variant === 'flat'
  const merged: CSSProperties = {
    ...variantStyle,
    ...(isFlat
      ? {}
      : {
          backdropFilter: 'blur(18px) saturate(140%)',
          WebkitBackdropFilter: 'blur(18px) saturate(140%)',
        }),
    borderRadius: isFlat ? 24 : 24,
    ...style,
  }
  return (
    <Tag
      ref={ref}
      className={[
        'relative overflow-hidden',
        padded ? 'p-5 md:p-6' : '',
        interactive ? 'active:scale-[0.99] transition-transform' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={merged}
    >
      {children}
    </Tag>
  )
})

export default GlassCard
