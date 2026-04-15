'use client'

import { type BeadId } from '@/features/rosario/data/beadSequence'
import {
  LAYOUT_CONSTANTS,
  computeRosaryLayout,
  describeBead,
  type BeadLayout,
} from './rosaryBeadsLayout'

/**
 * Static, non-interactive SVG rendering of the full rosary (60 beads).
 *
 * Sprint 1.2 scope: visual only. `currentBeadId` highlights one bead and
 * `completedBeadIds` dims already-prayed ones. Click handlers and keyboard
 * navigation land in sprint 1.3.
 */

const LAYOUT: readonly BeadLayout[] = Object.freeze(computeRosaryLayout())
const C = LAYOUT_CONSTANTS

type BeadState = 'future' | 'current' | 'completed'

export interface RosaryBeadsProps {
  currentBeadId?: BeadId | null
  completedBeadIds?: ReadonlySet<BeadId>
  className?: string
  ariaDescription?: string
}

export function RosaryBeads({
  currentBeadId = null,
  completedBeadIds,
  className,
  ariaDescription = 'Terço completo',
}: RosaryBeadsProps) {
  return (
    <svg
      viewBox={`0 0 ${C.viewBoxWidth} ${C.viewBoxHeight}`}
      className={className}
      role="img"
      aria-label={ariaDescription}
      xmlns="http://www.w3.org/2000/svg"
    >
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
        return <BeadShape key={bead.id} bead={bead} state={state} />
      })}
    </svg>
  )
}

interface BeadShapeProps {
  bead: BeadLayout
  state: BeadState
}

function BeadShape({ bead, state }: BeadShapeProps) {
  const fill = `url(#rosary-bead-${state})`
  const stroke =
    state === 'current'
      ? '#D9C077'
      : state === 'completed'
        ? 'rgba(201,168,76,0.55)'
        : 'rgba(201,168,76,0.42)'
  const strokeWidth = state === 'current' ? 2 : 1
  const label = describeBead(bead.id)

  if (bead.kind === 'crucifix') {
    const s = bead.r
    return (
      <g aria-label={label} data-bead-id={bead.id} data-bead-state={state}>
        {state === 'current' && (
          <circle
            cx={bead.cx}
            cy={bead.cy}
            r={s + 6}
            fill="none"
            stroke="#D9C077"
            strokeWidth={1}
            opacity={0.35}
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
    <g aria-label={label} data-bead-id={bead.id} data-bead-state={state}>
      {state === 'current' && (
        <circle
          cx={bead.cx}
          cy={bead.cy}
          r={bead.r + 5}
          fill="none"
          stroke="#D9C077"
          strokeWidth={1}
          opacity={0.4}
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
