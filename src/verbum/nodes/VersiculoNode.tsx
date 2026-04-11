'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { VERBUM_COLORS } from '../design-tokens'
import type { VersiculoNodeData } from '../types/verbum.types'

function VersiculoNode({ data, selected }: NodeProps) {
  const d = data as unknown as VersiculoNodeData
  const isAT = d.testament === 'AT'

  return (
    <div
      className="relative px-4 py-3 rounded-lg min-w-[160px] max-w-[240px] transition-shadow"
      style={{
        background: VERBUM_COLORS.node_versiculo_bg,
        border: `1.5px solid ${selected ? VERBUM_COLORS.ui_gold : VERBUM_COLORS.node_versiculo_border}`,
        boxShadow: selected
          ? `0 0 16px ${VERBUM_COLORS.node_canonical_glow}`
          : '0 2px 8px rgba(0,0,0,0.4)',
      }}
    >
      {/* Testament badge */}
      <div
        className="absolute -top-2 -right-2 text-[8px] font-bold px-1.5 py-0.5 rounded"
        style={{
          background: isAT ? '#3A2A10' : '#1A2030',
          color: isAT ? VERBUM_COLORS.edge_tipologia : VERBUM_COLORS.edge_doutrina,
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {d.testament}
      </div>

      <div
        className="text-[11px] font-semibold"
        style={{
          fontFamily: 'Cinzel, serif',
          color: VERBUM_COLORS.ui_gold,
          letterSpacing: '0.05em',
        }}
      >
        {d.bible_reference}
      </div>
      <div
        className="text-[11px] mt-1.5 leading-relaxed italic"
        style={{
          fontFamily: 'Cormorant Garamond, serif',
          color: VERBUM_COLORS.text_primary,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        &ldquo;{d.bible_text}&rdquo;
      </div>

      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <Handle type="source" position={Position.Right} className="!opacity-0" />
    </div>
  )
}

export default memo(VersiculoNode)
