import type { RosarySkinTheme } from '@/features/rosario/data/skinTypes'

/**
 * Mini-preview SVG do terço com a paleta da skin.
 *
 * Mostra um anel de contas dourado (5 grandes + 50 pequenas em proporção
 * reduzida — usamos 5 grandes + 20 pequenas pra caber em ~160px) com a
 * cordinha + pendant + crucifixo. As cores vêm da `theme` em tempo de
 * render. Server-friendly: SVG puro, sem dependência de browser APIs.
 *
 * Usado nos cards da loja e no header do detalhe.
 */
export function SkinMiniPreview({
  theme,
  size = 160,
}: {
  theme: RosarySkinTheme
  size?: number
}) {
  const cx = 50
  const cy = 38
  const radius = 28
  const totalBeads = 18 // 5 grandes + 13 pequenas
  // distribuição: 5 grandes equidistantes, pequenas entre elas
  const beads: Array<{ x: number; y: number; r: number; big: boolean }> = []
  for (let i = 0; i < totalBeads; i++) {
    const theta = (Math.PI * 2 * i) / totalBeads - Math.PI / 2
    const big = i % 4 === 0
    beads.push({
      x: cx + radius * Math.cos(theta),
      y: cy + radius * Math.sin(theta),
      r: big ? 2.5 : 1.6,
      big,
    })
  }

  // Pendant beads (linha vertical abaixo)
  const pendantStart = cy + radius + 4
  const pendant: Array<{ y: number; r: number; big: boolean }> = [
    { y: pendantStart + 0, r: 2.5, big: true },
    { y: pendantStart + 5, r: 1.6, big: false },
    { y: pendantStart + 10, r: 1.6, big: false },
    { y: pendantStart + 15, r: 1.6, big: false },
  ]
  const crucifixY = pendantStart + 24

  // Id determinístico baseado nas cores da paleta — evita Math.random
  // (impure) em server render e garante uniqueness por theme.
  const gradId = `spb-${(theme.accent + theme.accentLight + theme.beadCurrentStops[0])
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 16)}`

  return (
    <svg
      viewBox="0 0 100 110"
      width={size}
      height={size}
      role="img"
      aria-label="Pré-visualização do terço"
      style={{
        background: theme.pageBg,
        borderRadius: 12,
        border: `1px solid ${theme.border}`,
      }}
    >
      <defs>
        <radialGradient id={gradId} cx="35%" cy="35%" r="75%">
          <stop offset="0%" stopColor={theme.beadCurrentStops[0]} />
          <stop offset="55%" stopColor={theme.beadCurrentStops[1]} />
          <stop offset="100%" stopColor={theme.beadCurrentStops[2]} />
        </radialGradient>
      </defs>

      {/* Cordinha do anel */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={theme.cordStroke}
        strokeWidth="0.5"
        strokeDasharray="1 2.5"
      />
      {/* Cordinha do pendant */}
      <line
        x1={cx}
        y1={cy + radius}
        x2={cx}
        y2={crucifixY - 4}
        stroke={theme.cordStroke}
        strokeWidth="0.5"
        strokeDasharray="1 2.5"
      />

      {/* Contas do anel */}
      {beads.map((b, i) => (
        <circle
          key={`r-${i}`}
          cx={b.x}
          cy={b.y}
          r={b.r}
          fill={`url(#${gradId})`}
          stroke={theme.accentLight}
          strokeWidth="0.3"
          opacity={b.big ? 1 : 0.85}
        />
      ))}

      {/* Contas do pendant */}
      {pendant.map((b, i) => (
        <circle
          key={`p-${i}`}
          cx={cx}
          cy={b.y}
          r={b.r}
          fill={`url(#${gradId})`}
          stroke={theme.accentLight}
          strokeWidth="0.3"
        />
      ))}

      {/* Crucifixo (variante simplificada pra preview) */}
      <PreviewCrucifix
        cx={cx}
        cy={crucifixY}
        variant={theme.crucifixVariant}
        fill={`url(#${gradId})`}
        stroke={theme.accentLight}
      />
    </svg>
  )
}

/** Variante simplificada do crucifixo pra mini-preview. */
function PreviewCrucifix({
  cx,
  cy,
  variant,
  fill,
  stroke,
}: {
  cx: number
  cy: number
  variant: RosarySkinTheme['crucifixVariant']
  fill: string
  stroke: string
}) {
  const s = 4 // tamanho base
  if (variant === 'benedictine') {
    // Cruz com medalha circular ao centro
    return (
      <g strokeWidth="0.4" stroke={stroke}>
        <rect x={cx - s * 0.15} y={cy - s} width={s * 0.3} height={s * 2} fill={fill} rx="0.4" />
        <rect x={cx - s * 0.65} y={cy - s * 0.15} width={s * 1.3} height={s * 0.3} fill={fill} rx="0.4" />
        <circle cx={cx} cy={cy} r={s * 0.4} fill={fill} stroke={stroke} strokeWidth="0.5" />
      </g>
    )
  }
  if (variant === 'budded') {
    // Cruz florida — pontas redondas (trifólio)
    return (
      <g strokeWidth="0.4" stroke={stroke}>
        <rect x={cx - s * 0.15} y={cy - s} width={s * 0.3} height={s * 2} fill={fill} rx="0.4" />
        <rect x={cx - s * 0.65} y={cy - s * 0.15} width={s * 1.3} height={s * 0.3} fill={fill} rx="0.4" />
        <circle cx={cx - s * 0.7} cy={cy} r={s * 0.25} fill={fill} />
        <circle cx={cx + s * 0.7} cy={cy} r={s * 0.25} fill={fill} />
        <circle cx={cx} cy={cy - s * 1.05} r={s * 0.25} fill={fill} />
        <circle cx={cx} cy={cy + s * 1.05} r={s * 0.25} fill={fill} />
      </g>
    )
  }
  if (variant === 'celtic') {
    // Cruz com anel central
    return (
      <g strokeWidth="0.4" stroke={stroke} fill={fill}>
        <rect x={cx - s * 0.15} y={cy - s} width={s * 0.3} height={s * 2} rx="0.4" />
        <rect x={cx - s * 0.65} y={cy - s * 0.15} width={s * 1.3} height={s * 0.3} rx="0.4" />
        <circle cx={cx} cy={cy} r={s * 0.55} fill="none" strokeWidth="0.45" />
      </g>
    )
  }
  if (variant === 'pio') {
    // Cruz franciscana, hastes mais finas e longas
    return (
      <g strokeWidth="0.4" stroke={stroke}>
        <rect x={cx - s * 0.1} y={cy - s * 1.2} width={s * 0.2} height={s * 2.2} fill={fill} rx="0.3" />
        <rect x={cx - s * 0.55} y={cy - s * 0.1} width={s * 1.1} height={s * 0.2} fill={fill} rx="0.3" />
      </g>
    )
  }
  // classic
  return (
    <g strokeWidth="0.4" stroke={stroke}>
      <rect x={cx - s * 0.15} y={cy - s} width={s * 0.3} height={s * 2} fill={fill} rx="0.4" />
      <rect x={cx - s * 0.65} y={cy - s * 0.15} width={s * 1.3} height={s * 0.3} fill={fill} rx="0.4" />
    </g>
  )
}
