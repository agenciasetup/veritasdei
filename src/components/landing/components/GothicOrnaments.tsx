/**
 * SVG ornaments used as floating/decorative pieces in the landing.
 * All purely decorative (aria-hidden).
 */

interface Svg {
  className?: string
  color?: string
  opacity?: number
}

export function GothicCross({ className = '', color = '#C9A84C', opacity = 0.8 }: Svg) {
  return (
    <svg
      viewBox="0 0 80 120"
      fill="none"
      className={className}
      aria-hidden
      style={{ opacity }}
    >
      <defs>
        <linearGradient id="crossGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.1" />
          <stop offset="50%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <g stroke="url(#crossGrad)" strokeWidth="1.2" fill="none">
        <path d="M40 6 L40 110" />
        <path d="M14 40 L66 40" />
        <path d="M32 6 L48 6" />
        <path d="M32 110 L48 110" />
        <path d="M14 32 L14 48" />
        <path d="M66 32 L66 48" />
        <circle cx="40" cy="40" r="5" />
        <circle cx="40" cy="40" r="1.5" fill={color} />
        <path d="M40 52 L40 72" strokeDasharray="1 3" opacity="0.5" />
      </g>
    </svg>
  )
}

export function QuatrefoilOrnament({ className = '', color = '#C9A84C', opacity = 0.7 }: Svg) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden
      style={{ opacity }}
    >
      <g stroke={color} strokeWidth="1" fill="none">
        <circle cx="60" cy="30" r="22" />
        <circle cx="60" cy="90" r="22" />
        <circle cx="30" cy="60" r="22" />
        <circle cx="90" cy="60" r="22" />
        <circle cx="60" cy="60" r="8" />
        <circle cx="60" cy="60" r="2" fill={color} />
      </g>
    </svg>
  )
}

export function ArchOrnament({ className = '', color = '#C9A84C', opacity = 0.5 }: Svg) {
  return (
    <svg viewBox="0 0 200 280" fill="none" className={className} aria-hidden style={{ opacity }}>
      <g stroke={color} strokeWidth="1" fill="none">
        <path d="M20 280 L20 120 Q20 20 100 20 Q180 20 180 120 L180 280" />
        <path d="M40 280 L40 130 Q40 40 100 40 Q160 40 160 130 L160 280" />
        <path d="M60 280 L60 140 Q60 60 100 60 Q140 60 140 140 L140 280" />
        <path d="M100 20 L100 80" />
        <circle cx="100" cy="90" r="10" />
        <path d="M100 100 L100 140" />
      </g>
    </svg>
  )
}

export function FleurDeLis({ className = '', color = '#C9A84C', opacity = 0.9 }: Svg) {
  return (
    <svg viewBox="0 0 60 80" fill="none" className={className} aria-hidden style={{ opacity }}>
      <g stroke={color} strokeWidth="1.1" fill="none">
        <path d="M30 8 Q22 22 22 36 Q22 46 30 52 Q38 46 38 36 Q38 22 30 8 Z" />
        <path d="M30 52 L30 72" />
        <path d="M14 52 Q14 38 22 36" />
        <path d="M46 52 Q46 38 38 36" />
        <path d="M16 66 L44 66" />
        <circle cx="30" cy="36" r="1.5" fill={color} />
      </g>
    </svg>
  )
}
