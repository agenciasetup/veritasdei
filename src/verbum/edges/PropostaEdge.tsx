'use client'

import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import { VERBUM_COLORS } from '../design-tokens'

export default function PropostaEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = props

  const [edgePath] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
    borderRadius: 20,
  })

  return (
    <BaseEdge
      {...props}
      path={edgePath}
      style={{
        stroke: VERBUM_COLORS.edge_proposta,
        strokeWidth: 1.5,
        strokeDasharray: '6 6',
        opacity: 0.7,
      }}
    />
  )
}
