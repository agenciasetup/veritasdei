'use client'

import { memo, useCallback } from 'react'
import { type Node } from '@xyflow/react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlignHorizontalSpaceAround, AlignVerticalSpaceAround, Trash2, Sparkles } from 'lucide-react'
import { VERBUM_COLORS } from '../design-tokens'

interface SelectionToolbarProps {
  selectedNodes: Node[]
  onAlignHorizontal: () => void
  onAlignVertical: () => void
  onDistribute: () => void
  onDeleteSelected: () => void
  onAnalyzeSelected: () => void
}

function SelectionToolbar({
  selectedNodes,
  onAlignHorizontal,
  onAlignVertical,
  onDistribute,
  onDeleteSelected,
  onAnalyzeSelected,
}: SelectionToolbarProps) {
  const visible = selectedNodes.length >= 2

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="fixed top-14 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-1 px-2 py-1.5 rounded-xl"
          style={{
            background: VERBUM_COLORS.ui_bg,
            border: `1px solid ${VERBUM_COLORS.ui_border}`,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}
        >
          <span
            className="text-[10px] px-2 mr-1"
            style={{ color: VERBUM_COLORS.text_muted, fontFamily: 'Poppins, sans-serif' }}
          >
            {selectedNodes.length} selecionados
          </span>

          <ToolbarButton
            icon={<AlignHorizontalSpaceAround className="w-3.5 h-3.5" />}
            title="Alinhar horizontalmente"
            onClick={onAlignHorizontal}
          />
          <ToolbarButton
            icon={<AlignVerticalSpaceAround className="w-3.5 h-3.5" />}
            title="Alinhar verticalmente"
            onClick={onAlignVertical}
          />
          <ToolbarButton
            icon={<span className="text-[10px] font-bold">D</span>}
            title="Distribuir uniformemente"
            onClick={onDistribute}
          />

          <div className="w-px h-4 mx-0.5" style={{ background: VERBUM_COLORS.ui_border }} />

          <ToolbarButton
            icon={<Sparkles className="w-3.5 h-3.5" />}
            title="Analisar conexoes com IA"
            onClick={onAnalyzeSelected}
            accent
          />

          <div className="w-px h-4 mx-0.5" style={{ background: VERBUM_COLORS.ui_border }} />

          <ToolbarButton
            icon={<Trash2 className="w-3.5 h-3.5" />}
            title="Deletar selecionados"
            onClick={onDeleteSelected}
            danger
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ToolbarButton({
  icon,
  title,
  onClick,
  accent,
  danger,
}: {
  icon: React.ReactNode
  title: string
  onClick: () => void
  accent?: boolean
  danger?: boolean
}) {
  const color = danger
    ? '#E07070'
    : accent
    ? VERBUM_COLORS.ui_gold
    : VERBUM_COLORS.text_secondary

  return (
    <button
      onClick={onClick}
      className="p-1.5 rounded-lg transition-colors"
      style={{ color }}
      title={title}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger
          ? 'rgba(224,112,112,0.1)'
          : accent
          ? 'rgba(201,168,76,0.1)'
          : 'rgba(255,255,255,0.06)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      {icon}
    </button>
  )
}

export default memo(SelectionToolbar)
