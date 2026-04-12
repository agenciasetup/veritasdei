'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Sparkles } from 'lucide-react'
import { VERBUM_COLORS } from '../design-tokens'
import { useVerbumCanvas } from '../contexts/VerbumCanvasContext'
import type { DogmaNodeData } from '../types/verbum.types'

function DogmaNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as DogmaNodeData
  const { onAnalyzeNode, isReadOnly } = useVerbumCanvas()

  return (
    <div
      className="relative px-4 py-3 rounded-xl min-w-[140px] max-w-[220px] transition-shadow group"
      style={{
        background: VERBUM_COLORS.node_dogma_bg,
        border: `1.5px solid ${selected ? VERBUM_COLORS.ui_gold : VERBUM_COLORS.node_dogma_border}`,
        boxShadow: selected
          ? `0 0 16px rgba(139, 74, 122, 0.3)`
          : '0 2px 8px rgba(0,0,0,0.4)',
      }}
    >
      {/* AI Analysis Button */}
      {!isReadOnly && (
        <button
          onClick={(e) => { e.stopPropagation(); onAnalyzeNode(id) }}
          className="absolute -top-2 -left-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
          style={{
            background: VERBUM_COLORS.ui_bg,
            border: `1px solid ${VERBUM_COLORS.ui_gold}`,
            color: VERBUM_COLORS.ui_gold,
          }}
          title="Analisar conexões com IA"
        >
          <Sparkles className="w-3 h-3" />
        </button>
      )}

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
      {d.ccc_paragraph && (
        <div
          className="text-[10px] text-center mt-1.5"
          style={{
            color: VERBUM_COLORS.node_dogma_border,
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          CCC &sect;{d.ccc_paragraph}
        </div>
      )}
      {d.description && (
        <div
          className="text-[10px] text-center mt-1 leading-relaxed"
          style={{
            color: VERBUM_COLORS.text_secondary,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {d.description}
        </div>
      )}

      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <Handle type="source" position={Position.Right} className="!opacity-0" />
    </div>
  )
}

export default memo(DogmaNode)
