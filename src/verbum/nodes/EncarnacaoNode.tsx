'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { VERBUM_COLORS } from '../design-tokens'
import { useVerbumCanvas } from '../contexts/VerbumCanvasContext'
import type { EncarnacaoNodeData } from '../types/verbum.types'

function EncarnacaoNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as EncarnacaoNodeData
  const { onAnalyzeNode, isReadOnly } = useVerbumCanvas()

  return (
    <motion.div
      className="relative px-4 py-3 rounded-xl min-w-[150px] max-w-[200px] group"
      style={{
        background: 'linear-gradient(135deg, #1A1208 0%, #201810 100%)',
        border: `2px solid ${selected ? VERBUM_COLORS.ui_gold : VERBUM_COLORS.node_canonical_border}`,
        boxShadow: `0 0 20px ${VERBUM_COLORS.node_canonical_glow}, 0 2px 8px rgba(0,0,0,0.5)`,
      }}
      animate={{
        boxShadow: [
          `0 0 16px ${VERBUM_COLORS.node_canonical_glow}, 0 2px 8px rgba(0,0,0,0.5)`,
          `0 0 24px ${VERBUM_COLORS.node_canonical_glow}, 0 2px 8px rgba(0,0,0,0.5)`,
          `0 0 16px ${VERBUM_COLORS.node_canonical_glow}, 0 2px 8px rgba(0,0,0,0.5)`,
        ],
      }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
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
        className="text-sm font-bold text-center"
        style={{
          fontFamily: 'Cinzel, serif',
          color: VERBUM_COLORS.ui_gold,
          letterSpacing: '0.08em',
        }}
      >
        {d.title}
      </div>
      <div
        className="text-[10px] text-center mt-1 italic"
        style={{
          fontFamily: 'Cormorant Garamond, serif',
          color: VERBUM_COLORS.text_primary,
        }}
      >
        &ldquo;Et Verbum caro factum est&rdquo;
      </div>
      <div
        className="text-[9px] text-center mt-0.5"
        style={{ color: VERBUM_COLORS.text_muted }}
      >
        {d.bible_reference}
      </div>

      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <Handle type="source" position={Position.Right} className="!opacity-0" />
    </motion.div>
  )
}

export default memo(EncarnacaoNode)
