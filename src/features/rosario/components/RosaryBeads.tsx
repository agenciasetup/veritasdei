'use client'

import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { type BeadId } from '@/features/rosario/data/beadSequence'
import {
  LAYOUT_CONSTANTS,
  computeRosaryLayout,
  describeBead,
  type BeadLayout,
} from './rosaryBeadsLayout'

/**
 * SVG rendering of the full rosary (60 beads).
 *
 * Pass `onBeadSelect` to make every bead clickable + keyboard-accessible.
 * When omitted the component is purely decorative.
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
}

const STYLE = `
  @keyframes rosary-pulse {
    0%, 100% { opacity: 0.35; transform: scale(1); }
    50%      { opacity: 0.85; transform: scale(1.08); }
  }
  .rosary-pulse-ring {
    transform-box: fill-box;
    transform-origin: center;
    animation: rosary-pulse 2200ms ease-in-out infinite;
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
  .rosary-focus-ring {
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms ease-out;
  }
  @media (prefers-reduced-motion: reduce) {
    .rosary-pulse-ring { animation: none; opacity: 0.7; }
    .rosary-bead-button { transition: none; }
  }
`

export function RosaryBeads({
  currentBeadId = null,
  completedBeadIds,
  onBeadSelect,
  className,
  ariaDescription = 'Terço completo',
}: RosaryBeadsProps) {
  const interactive = Boolean(onBeadSelect)
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
        <radialGradient id="rosary-bead-current" cx="35%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#F4E8B8" />
          <stop offset="55%" stopColor="#D9C077" />
          <stop offset="100%" stopColor="#C9A84C" />
        </radialGradient>
        <radialGradient id="rosary-bead-future" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="rgba(201,168,76,0.22)" />
          <stop offset="100%" stopColor="rgba(201,168,76,0.08)" />
        </radialGradient>
        <radialGradient id="rosary-bead-completed" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="rgba(201,168,76,0.45)" />
          <stop offset="100%" stopColor="rgba(201,168,76,0.18)" />
        </radialGradient>
      </defs>

      {/* The cord — loop and pendant line. Subtle dashed stroke. */}
      <circle
        cx={C.loopCenterX}
        cy={C.loopCenterY}
        r={C.loopRadius}
        fill="none"
        stroke="rgba(201, 168, 76, 0.22)"
        strokeWidth={1}
        strokeDasharray="1 5"
      />
      <line
        x1={C.loopCenterX}
        y1={C.loopCenterY + C.loopRadius}
        x2={C.loopCenterX}
        y2={C.loopCenterY + C.loopRadius + 160}
        stroke="rgba(201, 168, 76, 0.22)"
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
}

function BeadShape({ bead, state, interactive, onSelect }: BeadShapeProps) {
  const fill = `url(#rosary-bead-${state})`
  const stroke =
    state === 'current'
      ? '#D9C077'
      : state === 'completed'
        ? 'rgba(201,168,76,0.55)'
        : 'rgba(201,168,76,0.42)'
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

  if (bead.kind === 'crucifix') {
    const s = bead.r
    return (
      <g
        {...interactiveProps}
        aria-label={label}
        aria-current={ariaCurrent}
        data-bead-id={bead.id}
        data-bead-state={state}
      >
        {/* focus ring (hidden unless :focus-visible) */}
        <circle
          cx={bead.cx}
          cy={bead.cy}
          r={s + 8}
          fill="none"
          stroke="#F4E8B8"
          strokeWidth={2}
          className="rosary-focus-ring"
        />
        {state === 'current' && (
          <circle
            cx={bead.cx}
            cy={bead.cy}
            r={s + 6}
            fill="none"
            stroke="#D9C077"
            strokeWidth={1}
            opacity={0.35}
            className="rosary-pulse-ring"
          />
        )}
        <rect
          x={bead.cx - s * 0.17}
          y={bead.cy - s}
          width={s * 0.34}
          height={s * 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          rx={1}
        />
        <rect
          x={bead.cx - s * 0.65}
          y={bead.cy - s * 0.17 + s * 0.2}
          width={s * 1.3}
          height={s * 0.34}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          rx={1}
        />
      </g>
    )
  }

  return (
    <g
      {...interactiveProps}
      aria-label={label}
      aria-current={ariaCurrent}
      data-bead-id={bead.id}
      data-bead-state={state}
    >
      {/* focus ring (hidden unless :focus-visible) */}
      <circle
        cx={bead.cx}
        cy={bead.cy}
        r={bead.r + 7}
        fill="none"
        stroke="#F4E8B8"
        strokeWidth={2}
        className="rosary-focus-ring"
      />
      {state === 'current' && (
        <circle
          cx={bead.cx}
          cy={bead.cy}
          r={bead.r + 5}
          fill="none"
          stroke="#D9C077"
          strokeWidth={1}
          opacity={0.4}
          className="rosary-pulse-ring"
        />
      )}
      <circle
        cx={bead.cx}
        cy={bead.cy}
        r={bead.r}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </g>
  )
}
