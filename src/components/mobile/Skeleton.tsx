import { type CSSProperties, type ReactNode } from 'react'

/**
 * Skeleton primitives — usam a classe global `.skeleton` (shimmer).
 *
 * Mantém EXATAMENTE as mesmas dimensões dos componentes reais para
 * evitar layout shift na transição loading → loaded.
 */

interface BaseProps {
  className?: string
  style?: CSSProperties
}

export function Skeleton({ className = '', style }: BaseProps) {
  return <div className={`skeleton ${className}`} style={style} />
}

export function SkeletonText({
  width = '100%',
  height = 12,
  className = '',
}: { width?: string | number; height?: number; className?: string }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: 4 }}
    />
  )
}

export function SkeletonCard({
  className = '',
  height = 96,
  rounded = 20,
  style,
  children,
}: {
  className?: string
  height?: number | string
  rounded?: number
  style?: CSSProperties
  children?: ReactNode
}) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ height, borderRadius: rounded, ...style }}
    >
      {children}
    </div>
  )
}

export function SkeletonAvatar({ size = 44 }: { size?: number }) {
  return (
    <div
      className="skeleton flex-shrink-0"
      style={{ width: size, height: size, borderRadius: 9999 }}
    />
  )
}

export function SkeletonHubTile() {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(201,168,76,0.06)',
        height: 120,
      }}
    >
      <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12 }} />
      <SkeletonText width="70%" height={14} />
      <SkeletonText width="40%" height={10} />
    </div>
  )
}

export function SkeletonList({
  count = 3,
  itemHeight = 64,
  gap = 8,
}: { count?: number; itemHeight?: number; gap?: number }) {
  return (
    <div className="flex flex-col" style={{ gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height={itemHeight} rounded={16} />
      ))}
    </div>
  )
}
