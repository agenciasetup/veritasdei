'use client'

import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import { VERBUM_COLORS, EDGE_WEIGHT_STROKE } from '../design-tokens'

export default function TipologiaEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props
  const weight = (data?.magisterial_weight as number) || 3

  const [edgePath] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
    borderRadius: 20,
  })

  return (
    <BaseEdge
      {...props}
      path={edgePath}
      style={{
        stroke: VERBUM_COLORS.edge_tipologia,
        strokeWidth: EDGE_WEIGHT_STROKE[weight as keyof typeof EDGE_WEIGHT_STROKE] || 2,
        strokeDasharray: '8 4',
      }}
    />
  )
}
