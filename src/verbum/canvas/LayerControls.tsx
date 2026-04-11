'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Layers, ChevronLeft, ChevronRight } from 'lucide-react'
import { VERBUM_COLORS } from '../design-tokens'
import { LAYERS } from '../types/verbum.types'

interface LayerControlsProps {
  visibleLayers: number[]
  onToggleLayer: (layerId: number) => void
}

const LAYER_COLORS = [
  '#C9A84C', // 0 - Fundamento (gold)
  '#D4AA4A', // 1 - Revelação Primordial
  '#D4884A', // 2 - Profecia e Tipo
  '#9AB0C8', // 3 - Encarnação e Missão
  '#E8E0D0', // 4 - Igreja e Magistério
  '#5C7A5A', // 5 - Estudo Pessoal (green)
]

const LAYER_ICONS = [
  '✝',  // 0 - Fundamento
  '📜', // 1 - Revelação Primordial
  '🔮', // 2 - Profecia e Tipo
  '☀',  // 3 - Encarnação e Missão
  '⛪', // 4 - Igreja e Magistério
  '📖', // 5 - Estudo Pessoal
]

export default function LayerControls({ visibleLayers, onToggleLayer }: LayerControlsProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className="fixed left-4 top-1/2 -translate-y-1/2 z-[200] rounded-xl overflow-hidden"
      style={{
        background: VERBUM_COLORS.ui_bg,
        border: `1px solid ${VERBUM_COLORS.ui_border}`,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        width: expanded ? 220 : 48,
        transition: 'width 0.25s ease',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 transition-colors"
        style={{ borderBottom: `1px solid ${VERBUM_COLORS.ui_border}` }}
      >
        <Layers className="w-4 h-4 flex-shrink-0" style={{ color: VERBUM_COLORS.ui_gold }} />
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="text-xs font-semibold whitespace-nowrap overflow-hidden"
              style={{ fontFamily: 'Cinzel, serif', color: VERBUM_COLORS.text_primary }}
            >
              Camadas
            </motion.span>
          )}
        </AnimatePresence>
        <div className="flex-1" />
        {expanded ? (
          <ChevronLeft className="w-3 h-3 flex-shrink-0" style={{ color: VERBUM_COLORS.text_muted }} />
        ) : (
          <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: VERBUM_COLORS.text_muted }} />
        )}
      </button>

      {/* Layer toggles */}
      {LAYERS.map((layer) => {
        const isVisible = visibleLayers.includes(layer.id)
        const color = LAYER_COLORS[layer.id]

        return (
          <button
            key={layer.id}
            onClick={() => {
              if (layer.canDisable) onToggleLayer(layer.id)
            }}
            disabled={!layer.canDisable}
            className="w-full flex items-center gap-2.5 px-3 py-2 transition-all group"
            style={{
              opacity: isVisible ? 1 : 0.4,
              cursor: layer.canDisable ? 'pointer' : 'default',
              background: isVisible ? 'rgba(255,255,255,0.02)' : 'transparent',
            }}
          >
            {/* Color indicator + icon */}
            <div className="relative flex-shrink-0">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center text-[10px]"
                style={{
                  background: isVisible ? `${color}20` : 'transparent',
                  border: `1.5px solid ${isVisible ? color : `${color}60`}`,
                }}
              >
                <span style={{ filter: isVisible ? 'none' : 'grayscale(1)' }}>
                  {LAYER_ICONS[layer.id]}
                </span>
              </div>
            </div>

            {/* Label (visible when expanded) */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex-1 min-w-0 overflow-hidden"
                >
                  <div
                    className="text-[11px] font-medium whitespace-nowrap"
                    style={{
                      color: isVisible ? color : VERBUM_COLORS.text_muted,
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    {layer.name}
                  </div>
                  <div
                    className="text-[9px] whitespace-nowrap"
                    style={{
                      color: VERBUM_COLORS.text_muted,
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    {layer.description}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Eye toggle (visible when expanded) */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-shrink-0"
                >
                  {layer.canDisable ? (
                    isVisible ? (
                      <Eye className="w-3.5 h-3.5" style={{ color: VERBUM_COLORS.text_muted }} />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" style={{ color: VERBUM_COLORS.text_muted }} />
                    )
                  ) : (
                    <div
                      className="text-[8px] px-1 py-0.5 rounded"
                      style={{
                        background: 'rgba(201,168,76,0.1)',
                        color: VERBUM_COLORS.ui_gold,
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      fixo
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tooltip (visible when collapsed) */}
            {!expanded && (
              <span
                className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50"
                style={{
                  background: 'rgba(10,10,10,0.95)',
                  border: `1px solid rgba(201,168,76,0.15)`,
                  color: VERBUM_COLORS.text_primary,
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                <span style={{ color }}>{layer.name}</span>
                <br />
                <span style={{ color: VERBUM_COLORS.text_muted, fontSize: '10px' }}>
                  {layer.description}
                </span>
              </span>
            )}
          </button>
        )
      })}

      {/* Quick actions when expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="flex gap-1.5 px-3 py-2.5"
              style={{ borderTop: `1px solid ${VERBUM_COLORS.ui_border}` }}
            >
              <button
                onClick={() => {
                  LAYERS.forEach(l => {
                    if (l.canDisable && !visibleLayers.includes(l.id)) onToggleLayer(l.id)
                  })
                }}
                className="flex-1 text-[10px] py-1.5 rounded-md transition-colors"
                style={{
                  background: 'rgba(201,168,76,0.08)',
                  color: VERBUM_COLORS.ui_gold,
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                Mostrar todas
              </button>
              <button
                onClick={() => {
                  LAYERS.forEach(l => {
                    if (l.canDisable && visibleLayers.includes(l.id)) onToggleLayer(l.id)
                  })
                }}
                className="flex-1 text-[10px] py-1.5 rounded-md transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  color: VERBUM_COLORS.text_muted,
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                Só fundamento
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
