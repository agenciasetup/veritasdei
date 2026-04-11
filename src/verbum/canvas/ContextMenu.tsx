'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { VERBUM_COLORS } from '../design-tokens'
import type { ContextMenuAction } from '../types/verbum.types'

interface ContextMenuProps {
  x: number
  y: number
  visible: boolean
  onSelect: (action: ContextMenuAction) => void
  onClose: () => void
}

const MENU_ITEMS: { action: ContextMenuAction; icon: string; label: string }[] = [
  { action: 'figura', icon: '✝', label: 'Inserir Personagem Bíblico' },
  { action: 'versiculo', icon: '📖', label: 'Inserir Versículo' },
  { action: 'dogma', icon: '⛪', label: 'Inserir Dogma / Conceito' },
  { action: 'conceito', icon: '✨', label: 'Inserir da Tradição' },
]

export default function ContextMenu({ x, y, visible, onSelect, onClose }: ContextMenuProps) {
  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop to close */}
          <div className="fixed inset-0 z-[200]" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[201] rounded-xl overflow-hidden"
            style={{
              left: x,
              top: y,
              background: VERBUM_COLORS.ui_bg,
              border: `1px solid ${VERBUM_COLORS.ui_border}`,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
              minWidth: 240,
            }}
          >
            {/* Header */}
            <div
              className="px-4 py-2 text-[10px] tracking-widest uppercase"
              style={{
                fontFamily: 'Cinzel, serif',
                color: VERBUM_COLORS.text_muted,
                borderBottom: `1px solid ${VERBUM_COLORS.ui_border}`,
              }}
            >
              Adicionar ao Grafo
            </div>

            {/* Items */}
            {MENU_ITEMS.map((item) => (
              <button
                key={item.action}
                onClick={() => {
                  onSelect(item.action)
                  onClose()
                }}
                className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                style={{
                  color: VERBUM_COLORS.text_primary,
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '13px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(201, 168, 76, 0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
