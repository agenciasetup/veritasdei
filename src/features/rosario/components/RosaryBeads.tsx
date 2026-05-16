'use client'

import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { type BeadId } from '@/features/rosario/data/beadSequence'
import { ROSARY_THEMES, type RosaryTheme } from '@/features/rosario/data/theme'
import {
  LAYOUT_CONSTANTS,
  computeRosaryLayout,
  describeBead,
  type BeadLayout,
} from './rosaryBeadsLayout'

/**
 * SVG rendering of the full rosary (60 beads).
 *
 * Renderiza as variantes visuais da skin:
 *   - `crucifixVariant`: forma da cruz (classic/benedictine/budded/celtic/pio)
 *   - `introBeadVariant`: forma da conta inicial Pai Nosso
 *     (classic/medal-bento/medal-divine-mercy/rose)
 *   - `beadShape`: forma das contas comuns (sphere/rose/cube/oval)
 *
 * Pass `onBeadSelect` to make every bead clickable + keyboard-accessible.
 * Hit-area transparente garante tap target ≥ 44pt mesmo em telas pequenas.
 */

const LAYOUT: readonly BeadLayout[] = Object.freeze(computeRosaryLayout())
const C = LAYOUT_CONSTANTS

type BeadState = 'future' | 'current' | 'completed'

export interface RosaryBeadsProps {
  currentBeadId?: BeadId | null
  completedBeadIds?: ReadonlySet<BeadId>
  /** If provided, each bead becomes an interactive button firing this callback. */
  onBeadSelect?: (beadId: BeadId) => void
  className?: string
  ariaDescription?: string
  theme?: RosaryTheme
}

const STYLE = `
  @keyframes rosary-pulse {
    0%, 100% { opacity: 0.35; transform: scale(1); }
    50%      { opacity: 0.85; transform: scale(1.10); }
  }
  @keyframes rosary-glow {
    0%, 100% { opacity: 0.55; }
    50%      { opacity: 1; }
  }
  .rosary-pulse-ring {
    transform-box: fill-box;
    transform-origin: center;
    animation: rosary-pulse 2200ms ease-in-out infinite;
  }
  .rosary-glow-halo {
    animation: rosary-glow 2400ms ease-in-out infinite;
    transform-box: fill-box;
    transform-origin: center;
  }
  .rosary-bead-button {
    cursor: pointer;
    outline: none;
    transition: filter 160ms ease-out;
  }
  .rosary-bead-button:hover {
    filter: brightness(1.25);
  }
  .rosary-bead-button:focus-visible > .rosary-focus-ring {
    opacity: 1;
  }
  .rosary-bead-button:active .rosary-visible {
    transform: scale(0.92);
    transform-box: fill-box;
    transform-origin: center;
  }
  .rosary-hit-area {
    fill: transparent;
    pointer-events: all;
  }
  .rosary-focus-ring {
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease-out;
  }
  @media (prefers-reduced-motion: reduce) {
    .rosary-pulse-ring, .rosary-glow-halo { animation: none; opacity: 0.7; }
    .rosary-bead-button { transition: none; }
  }
`

export function RosaryBeads({
  currentBeadId = null,
  completedBeadIds,
  onBeadSelect,
  className,
  ariaDescription = 'Terço completo',
  theme = ROSARY_THEMES.pt,
}: RosaryBeadsProps) {
  const interactive = Boolean(onBeadSelect)
  const idSuffix = `${theme.language}-${theme.beadShape ?? 'sphere'}`

  return (
    <svg
      viewBox={`0 0 ${C.viewBoxWidth} ${C.viewBoxHeight}`}
      className={className}
      role="img"
      aria-label={ariaDescription}
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{STYLE}</style>

      <defs>
        <radialGradient id={`rosary-bead-current-${idSuffix}`} cx="35%" cy="35%" r="75%">
          <stop offset="0%" stopColor={theme.beadCurrentStops[0]} />
          <stop offset="55%" stopColor={theme.beadCurrentStops[1]} />
          <stop offset="100%" stopColor={theme.beadCurrentStops[2]} />
        </radialGradient>
        <radialGradient id={`rosary-bead-future-${idSuffix}`} cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor={theme.beadFutureStops[0]} />
          <stop offset="100%" stopColor={theme.beadFutureStops[1]} />
        </radialGradient>
        <radialGradient id={`rosary-bead-completed-${idSuffix}`} cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor={theme.beadCompletedStops[0]} />
          <stop offset="100%" stopColor={theme.beadCompletedStops[1]} />
        </radialGradient>
        {/* Soft glow filter — halo around current bead/crucifix */}
        <filter id={`rosary-glow-${idSuffix}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Cord — loop + pendant. Dashed for a delicate textile feel. */}
      <circle
        cx={C.loopCenterX}
        cy={C.loopCenterY}
        r={C.loopRadius}
        fill="none"
        stroke={theme.cordStroke}
        strokeWidth={1}
        strokeDasharray="1 5"
      />
      <line
        x1={C.loopCenterX}
        y1={C.loopCenterY + C.loopRadius}
        x2={C.loopCenterX}
        y2={C.loopCenterY + C.loopRadius + 160}
        stroke={theme.cordStroke}
        strokeWidth={1}
        strokeDasharray="1 5"
      />

      {LAYOUT.map((bead) => {
        const state: BeadState =
          bead.id === currentBeadId
            ? 'current'
            : completedBeadIds?.has(bead.id)
              ? 'completed'
              : 'future'
        return (
          <BeadShape
            key={bead.id}
            bead={bead}
            state={state}
            interactive={interactive}
            onSelect={onBeadSelect}
            theme={theme}
            idSuffix={idSuffix}
          />
        )
      })}
    </svg>
  )
}

interface BeadShapeProps {
  bead: BeadLayout
  state: BeadState
  interactive: boolean
  onSelect?: (beadId: BeadId) => void
  theme: RosaryTheme
  idSuffix: string
}

function BeadShape({ bead, state, interactive, onSelect, theme, idSuffix }: BeadShapeProps) {
  const fill = `url(#rosary-bead-${state}-${idSuffix})`
  const stroke =
    state === 'current'
      ? theme.accentLight
      : state === 'completed'
        ? theme.borderStrong
        : theme.border
  const strokeWidth = state === 'current' ? 2 : 1
  const label = describeBead(bead.id)

  const handleClick = onSelect ? () => onSelect(bead.id) : undefined
  const handleKey = onSelect
    ? (e: ReactKeyboardEvent<SVGGElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(bead.id)
        }
      }
    : undefined

  const interactiveProps = interactive
    ? {
        role: 'button' as const,
        tabIndex: 0,
        onClick: handleClick,
        onKeyDown: handleKey,
        className: 'rosary-bead-button',
      }
    : {}

  const ariaCurrent = state === 'current' ? ('step' as const) : undefined

  const hitRadius =
    bead.kind === 'crucifix' ? bead.r + 12 : Math.max(bead.r * 2.4, 18)

  // ── CRUCIFIX ──────────────────────────────────────────────────────────
  if (bead.kind === 'crucifix') {
    return (
      <g
        {...interactiveProps}
        aria-label={label}
        aria-current={ariaCurrent}
        data-bead-id={bead.id}
        data-bead-state={state}
      >
        {interactive && (
          <circle
            cx={bead.cx}
            cy={bead.cy}
            r={hitRadius}
            className="rosary-hit-area"
          />
        )}
        <circle
          cx={bead.cx}
          cy={bead.cy}
          r={bead.r + 8}
          fill="none"
          stroke={theme.accentLight}
          strokeWidth={2}
          className="rosary-focus-ring"
        />
        {state === 'current' && (
          <circle
            cx={bead.cx}
            cy={bead.cy}
            r={bead.r + 8}
            fill={theme.accentLight}
            opacity={0.18}
            filter={`url(#rosary-glow-${idSuffix})`}
            className="rosary-glow-halo"
          />
        )}
        <g className="rosary-visible">
          <CrucifixGlyph
            variant={theme.crucifixVariant ?? 'classic'}
            cx={bead.cx}
            cy={bead.cy}
            size={bead.r}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            accent={theme.accentLight}
          />
        </g>
      </g>
    )
  }

  // ── INTRO PAI NOSSO (decorated when skin requests) ───────────────────
  if (bead.id === 'intro-our-father') {
    const introVariant = theme.introBeadVariant ?? 'classic'
    if (introVariant !== 'classic') {
      return (
        <g
          {...interactiveProps}
          aria-label={label}
          aria-current={ariaCurrent}
          data-bead-id={bead.id}
          data-bead-state={state}
        >
          {interactive && (
            <circle
              cx={bead.cx}
              cy={bead.cy}
              r={hitRadius}
              className="rosary-hit-area"
            />
          )}
          <circle
            cx={bead.cx}
            cy={bead.cy}
            r={bead.r + 7}
            fill="none"
            stroke={theme.accentLight}
            strokeWidth={2}
            className="rosary-focus-ring"
          />
          {state === 'current' && (
            <circle
              cx={bead.cx}
              cy={bead.cy}
              r={bead.r + 6}
              fill="none"
              stroke={theme.accentLight}
              strokeWidth={1.2}
              opacity={0.5}
              className="rosary-pulse-ring"
            />
          )}
          <g className="rosary-visible">
            <IntroBeadGlyph
              variant={introVariant}
              cx={bead.cx}
              cy={bead.cy}
              size={bead.r * 1.8}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              accent={theme.accentLight}
              deep={theme.accentDeep}
            />
          </g>
        </g>
      )
    }
  }

  // ── REGULAR BEAD ─────────────────────────────────────────────────────
  const shape = theme.beadShape ?? 'sphere'
  return (
    <g
      {...interactiveProps}
      aria-label={label}
      aria-current={ariaCurrent}
      data-bead-id={bead.id}
      data-bead-state={state}
    >
      {interactive && (
        <circle
          cx={bead.cx}
          cy={bead.cy}
          r={hitRadius}
          className="rosary-hit-area"
        />
      )}
      <circle
        cx={bead.cx}
        cy={bead.cy}
        r={bead.r + 7}
        fill="none"
        stroke={theme.accentLight}
        strokeWidth={2}
        className="rosary-focus-ring"
      />
      {state === 'current' && (
        <circle
          cx={bead.cx}
          cy={bead.cy}
          r={bead.r + 5}
          fill="none"
          stroke={theme.accentLight}
          strokeWidth={1.2}
          opacity={0.55}
          className="rosary-pulse-ring"
        />
      )}
      <BeadGlyph
        shape={shape}
        cx={bead.cx}
        cy={bead.cy}
        r={bead.r}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        accent={theme.accentLight}
      />
    </g>
  )
}

/* ─── CRUCIFIX VARIANTS ─────────────────────────────────────────────── */

function CrucifixGlyph({
  variant,
  cx,
  cy,
  size,
  fill,
  stroke,
  strokeWidth,
  accent,
}: {
  variant: NonNullable<RosaryTheme['crucifixVariant']>
  cx: number
  cy: number
  size: number
  fill: string
  stroke: string
  strokeWidth: number
  accent: string
}) {
  const s = size

  if (variant === 'benedictine') {
    // Cruz beneditina — cruz + medalha circular com micro-cruz dentro
    return (
      <g>
        <rect
          x={cx - s * 0.17}
          y={cy - s}
          width={s * 0.34}
          height={s * 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          rx={2}
        />
        <rect
          x={cx - s * 0.75}
          y={cy - s * 0.17 + s * 0.2}
          width={s * 1.5}
          height={s * 0.34}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          rx={2}
        />
        <circle
          cx={cx}
          cy={cy + s * 0.2}
          r={s * 0.42}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth * 1.2}
        />
        <line
          x1={cx}
          y1={cy + s * 0.2 - s * 0.22}
          x2={cx}
          y2={cy + s * 0.2 + s * 0.22}
          stroke={accent}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
        <line
          x1={cx - s * 0.22}
          y1={cy + s * 0.2}
          x2={cx + s * 0.22}
          y2={cy + s * 0.2}
          stroke={accent}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      </g>
    )
  }

  if (variant === 'budded') {
    // Cruz florida — pontas em trifólio (esfera em cada extremidade)
    const tipR = s * 0.18
    return (
      <g>
        <rect
          x={cx - s * 0.13}
          y={cy - s + tipR * 0.8}
          width={s * 0.26}
          height={s * 2 - tipR * 1.6}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          rx={2}
        />
        <rect
          x={cx - s * 0.7 + tipR * 0.8}
          y={cy - s * 0.13 + s * 0.2}
          width={s * 1.4 - tipR * 1.6}
          height={s * 0.26}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          rx={2}
        />
        {([
          [cx, cy - s + tipR * 0.6],
          [cx, cy + s - tipR * 0.6],
          [cx - s * 0.7 + tipR * 0.6, cy + s * 0.2],
          [cx + s * 0.7 - tipR * 0.6, cy + s * 0.2],
        ] as const).map(([px, py], i) => (
          <circle
            key={i}
            cx={px}
            cy={py}
            r={tipR}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        ))}
      </g>
    )
  }

  if (variant === 'celtic') {
    // Cruz céltica — anel ao redor do crossing
    return (
      <g>
        <rect
          x={cx - s * 0.15}
          y={cy - s}
          width={s * 0.3}
          height={s * 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          rx={2}
        />
        <rect
          x={cx - s * 0.65}
          y={cy - s * 0.15 + s * 0.2}
          width={s * 1.3}
          height={s * 0.3}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          rx={2}
        />
        <circle
          cx={cx}
          cy={cy + s * 0.2}
          r={s * 0.62}
          fill="none"
          stroke={accent}
          strokeWidth={strokeWidth * 1.6}
          opacity={0.85}
        />
      </g>
    )
  }

  if (variant === 'pio') {
    // Cruz tau franciscana — formato de T (sem topo)
    return (
      <g>
        <rect
          x={cx - s * 0.14}
          y={cy - s * 0.25}
          width={s * 0.28}
          height={s * 1.95}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          rx={2}
        />
        <rect
          x={cx - s * 0.78}
          y={cy - s * 0.42}
          width={s * 1.56}
          height={s * 0.34}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          rx={2}
        />
      </g>
    )
  }

  // classic — cruz simples com sutil highlight central
  return (
    <g>
      <rect
        x={cx - s * 0.17}
        y={cy - s}
        width={s * 0.34}
        height={s * 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        rx={1.5}
      />
      <rect
        x={cx - s * 0.65}
        y={cy - s * 0.17 + s * 0.2}
        width={s * 1.3}
        height={s * 0.34}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        rx={1.5}
      />
      <circle
        cx={cx}
        cy={cy + s * 0.2}
        r={s * 0.08}
        fill={accent}
        opacity={0.55}
      />
    </g>
  )
}

/* ─── INTRO BEAD VARIANTS ───────────────────────────────────────────── */

function IntroBeadGlyph({
  variant,
  cx,
  cy,
  size,
  fill,
  stroke,
  strokeWidth,
  accent,
  deep,
}: {
  variant: NonNullable<RosaryTheme['introBeadVariant']>
  cx: number
  cy: number
  size: number
  fill: string
  stroke: string
  strokeWidth: number
  accent: string
  deep: string
}) {
  const r = size / 2

  if (variant === 'medal-bento') {
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        <line
          x1={cx} y1={cy - r * 0.55} x2={cx} y2={cy + r * 0.55}
          stroke={accent} strokeWidth={1.4} strokeLinecap="round"
        />
        <line
          x1={cx - r * 0.55} y1={cy} x2={cx + r * 0.55} y2={cy}
          stroke={accent} strokeWidth={1.4} strokeLinecap="round"
        />
        {([
          [0, -r * 0.78],
          [r * 0.78, 0],
          [0, r * 0.78],
          [-r * 0.78, 0],
        ] as const).map(([dx, dy], i) => (
          <circle key={i} cx={cx + dx} cy={cy + dy} r={1.2} fill={accent} />
        ))}
      </g>
    )
  }

  if (variant === 'medal-divine-mercy') {
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        <polygon
          points={`${cx},${cy - r * 0.05} ${cx - r * 0.7},${cy + r * 0.85} ${cx - r * 0.28},${cy + r * 0.85}`}
          fill={accent}
          opacity={0.6}
        />
        <polygon
          points={`${cx},${cy - r * 0.05} ${cx + r * 0.7},${cy + r * 0.85} ${cx + r * 0.28},${cy + r * 0.85}`}
          fill={deep}
          opacity={0.6}
        />
        <circle cx={cx} cy={cy} r={r * 0.22} fill={accent} opacity={0.75} />
      </g>
    )
  }

  if (variant === 'rose') {
    const petalR = r * 0.55
    return (
      <g>
        <circle cx={cx} cy={cy} r={r * 0.94} fill={fill} stroke={stroke} strokeWidth={strokeWidth * 0.7} opacity={0.9} />
        {[0, 1, 2, 3, 4].map((i) => {
          const theta = (Math.PI * 2 * i) / 5 - Math.PI / 2
          const px = cx + Math.cos(theta) * r * 0.42
          const py = cy + Math.sin(theta) * r * 0.42
          return (
            <ellipse
              key={i}
              cx={px}
              cy={py}
              rx={petalR * 0.55}
              ry={petalR * 0.85}
              transform={`rotate(${(theta * 180) / Math.PI + 90} ${px} ${py})`}
              fill={accent}
              opacity={0.5}
            />
          )
        })}
        <circle cx={cx} cy={cy} r={r * 0.2} fill={accent} opacity={0.85} />
      </g>
    )
  }

  return <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
}

/* ─── REGULAR BEAD SHAPES ──────────────────────────────────────────── */

function BeadGlyph({
  shape,
  cx,
  cy,
  r,
  fill,
  stroke,
  strokeWidth,
  accent,
}: {
  shape: NonNullable<RosaryTheme['beadShape']>
  cx: number
  cy: number
  r: number
  fill: string
  stroke: string
  strokeWidth: number
  accent: string
}) {
  if (shape === 'cube') {
    const side = r * 1.7
    return (
      <rect
        x={cx - side / 2}
        y={cy - side / 2}
        width={side}
        height={side}
        rx={r * 0.25}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        className="rosary-visible"
      />
    )
  }
  if (shape === 'oval') {
    return (
      <ellipse
        cx={cx}
        cy={cy}
        rx={r * 0.78}
        ry={r * 1.15}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        className="rosary-visible"
      />
    )
  }
  if (shape === 'rose') {
    return (
      <g className="rosary-visible">
        <circle cx={cx} cy={cy} r={r * 0.94} fill={fill} stroke={stroke} strokeWidth={strokeWidth * 0.7} />
        {[0, 1, 2, 3].map((i) => {
          const theta = (Math.PI * 2 * i) / 4 - Math.PI / 2
          const px = cx + Math.cos(theta) * r * 0.32
          const py = cy + Math.sin(theta) * r * 0.32
          return (
            <ellipse
              key={i}
              cx={px}
              cy={py}
              rx={r * 0.3}
              ry={r * 0.48}
              transform={`rotate(${(theta * 180) / Math.PI + 90} ${px} ${py})`}
              fill={accent}
              opacity={0.42}
            />
          )
        })}
      </g>
    )
  }
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      className="rosary-visible"
    />
  )
}
