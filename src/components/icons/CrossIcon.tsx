/**
 * Cruz dourada com pedra central vermelha — SVG puro.
 * Substitui qualquer uso de &#10013; (unicode) que vira emoji roxo em mobile.
 *
 * Tamanhos pré-definidos:
 *   xs  = 12×17   (inline, badges)
 *   sm  = 16×23   (sidebar, cards)
 *   md  = 24×35   (headers compactos)
 *   lg  = 36×52   (header principal)
 */

const SIZES = {
  xs: { w: 12, h: 17 },
  sm: { w: 16, h: 23 },
  md: { w: 24, h: 35 },
  lg: { w: 36, h: 52 },
} as const

type CrossSize = keyof typeof SIZES

interface CrossIconProps {
  size?: CrossSize
  className?: string
}

export default function CrossIcon({ size = 'sm', className }: CrossIconProps) {
  const { w, h } = SIZES[size]
  // Unique gradient ID to avoid SVG ID collisions when multiple instances render
  const gradId = `cg-${size}`

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 36 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {/* Vertical beam */}
      <rect x="14" y="0" width="8" height="52" rx="1.5" fill={`url(#${gradId})`} />
      {/* Horizontal beam */}
      <rect x="0" y="14" width="36" height="8" rx="1.5" fill={`url(#${gradId})`} />
      {/* Center jewel */}
      <circle cx="18" cy="18" r="3" fill="#6B1D2A" stroke="#C9A84C" strokeWidth="1" />
      {/* Finials */}
      <circle cx="18" cy="2" r="1.5" fill="#C9A84C" opacity="0.6" />
      <circle cx="18" cy="50" r="1.5" fill="#C9A84C" opacity="0.6" />
      <circle cx="2" cy="18" r="1.5" fill="#C9A84C" opacity="0.6" />
      <circle cx="34" cy="18" r="1.5" fill="#C9A84C" opacity="0.6" />
      <defs>
        <linearGradient id={gradId} x1="18" y1="0" x2="18" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D9C077" />
          <stop offset="50%" stopColor="#C9A84C" />
          <stop offset="100%" stopColor="#A88B3A" />
        </linearGradient>
      </defs>
    </svg>
  )
}
