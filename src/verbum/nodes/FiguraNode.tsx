'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { VERBUM_COLORS } from '../design-tokens'
import type { FiguraNodeData } from '../types/verbum.types'

function FiguraNode({ data, selected }: NodeProps) {
  const d = data as unknown as FiguraNodeData

  return (
    <div
      className="relative px-4 py-3 rounded-xl min-w-[140px] max-w-[200px] transition-shadow"
      style={{
        background: VERBUM_COLORS.node_figura_bg,
        border: `1.5px solid ${selected ? VERBUM_COLORS.ui_gold : VERBUM_COLORS.node_figura_border}`,
        boxShadow: selected
          ? `0 0 16px ${VERBUM_COLORS.node_canonical_glow}`
          : '0 2px 8px rgba(0,0,0,0.4)',
      }}
    >
      <div
        className="text-sm font-semibold text-center"
        style={{
          fontFamily: 'Cinzel, serif',
          color: VERBUM_COLORS.text_primary,
          letterSpacing: '0.05em',
        }}
      >
        {d.title}
      </div>
      {d.title_latin && (
        <div
          className="text-[10px] text-center italic mt-0.5"
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            color: VERBUM_COLORS.text_muted,
          }}
        >
          {d.title_latin}
        </div>
      )}
      {d.historical_period && (
        <div
          className="text-[9px] text-center mt-1"
          style={{ color: VERBUM_COLORS.text_muted }}
        >
          {d.historical_period}
        </div>
      )}
      {d.bible_key_verse && (
        <div
          className="text-[10px] text-center mt-1 italic"
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            color: VERBUM_COLORS.text_secondary,
          }}
        >
          {d.bible_key_verse}
        </div>
      )}

      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <Handle type="source" position={Position.Right} className="!opacity-0" />
    </div>
  )
}

export default memo(FiguraNode)
