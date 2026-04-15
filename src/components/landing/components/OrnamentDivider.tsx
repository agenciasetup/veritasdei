interface OrnamentDividerProps {
  variant?: 'gold' | 'wine'
  className?: string
}

/**
 * Filete dourado horizontal com um losango/cruz central.
 * Usado entre seções para ritmo editorial.
 */
export function OrnamentDivider({ variant = 'gold', className = '' }: OrnamentDividerProps) {
  const color = variant === 'gold' ? '#C9A84C' : '#5A1625'
  const faded = variant === 'gold' ? 'rgba(201,168,76,0.0)' : 'rgba(90,22,37,0.0)'
  const mid = variant === 'gold' ? 'rgba(201,168,76,0.55)' : 'rgba(90,22,37,0.45)'

  return (
    <div className={`relative flex items-center justify-center py-10 ${className}`} aria-hidden>
      <div className="flex items-center gap-5 w-full max-w-3xl px-6">
        <div
          className="flex-1 h-px"
          style={{
            background: `linear-gradient(to right, ${faded}, ${mid}, ${color})`,
          }}
        />

        <svg width="42" height="42" viewBox="0 0 42 42" fill="none" className="flex-shrink-0">
          <g stroke={color} strokeWidth="1" fill="none" opacity="0.85">
            <path d="M21 3 L39 21 L21 39 L3 21 Z" />
            <path d="M21 11 L31 21 L21 31 L11 21 Z" opacity="0.55" />
            <circle cx="21" cy="21" r="2" fill={color} stroke="none" />
            <path d="M21 8 L21 14 M21 28 L21 34 M8 21 L14 21 M28 21 L34 21" strokeWidth="0.8" opacity="0.6" />
          </g>
        </svg>

        <div
          className="flex-1 h-px"
          style={{
            background: `linear-gradient(to left, ${faded}, ${mid}, ${color})`,
          }}
        />
      </div>
    </div>
  )
}
