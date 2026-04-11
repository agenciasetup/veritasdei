'use client'

import { motion } from 'framer-motion'
import { Eye, EyeOff, Layers } from 'lucide-react'
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
  '#5C4A2A', // 5 - Estudo Pessoal
]

export default function LayerControls({ visibleLayers, onToggleLayer }: LayerControlsProps) {
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
        width: 44,
      }}
    >
      {/* Header icon */}
      <div
        className="flex items-center justify-center py-2.5"
        style={{ borderBottom: `1px solid ${VERBUM_COLORS.ui_border}` }}
      >
        <Layers className="w-4 h-4" style={{ color: VERBUM_COLORS.ui_gold }} />
      </div>

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
            title={`${layer.name}: ${layer.description}`}
            className="w-full flex items-center justify-center py-2.5 transition-colors group relative"
            style={{
              opacity: isVisible ? 1 : 0.3,
              cursor: layer.canDisable ? 'pointer' : 'default',
            }}
          >
            <div className="relative">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  background: isVisible ? color : 'transparent',
                  border: `2px solid ${color}`,
                }}
              />
              {!isVisible && layer.canDisable && (
                <EyeOff
                  className="absolute -top-0.5 -left-0.5 w-4 h-4"
                  style={{ color: VERBUM_COLORS.text_muted }}
                />
              )}
            </div>

            {/* Tooltip */}
            <span
              className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200"
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
          </button>
        )
      })}
    </motion.div>
  )
}
