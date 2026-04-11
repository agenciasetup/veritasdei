'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { VERBUM_COLORS } from '../design-tokens'
import type { RelationType } from '../types/verbum.types'

interface ConnectionTypeSelectorProps {
  visible: boolean
  sourceName: string
  targetName: string
  onSelect: (relationType: RelationType) => void
  onCancel: () => void
}

const RELATION_OPTIONS: { type: RelationType; icon: string; label: string; description: string; color: string }[] = [
  {
    type: 'tipologia',
    icon: '🔗',
    label: 'Tipologia',
    description: 'O AT prefigura o NT (tipo → antítipo)',
    color: VERBUM_COLORS.edge_tipologia,
  },
  {
    type: 'doutrina',
    icon: '📚',
    label: 'Doutrina',
    description: 'Conexão doutrinária fundamentada no CCC',
    color: VERBUM_COLORS.edge_doutrina,
  },
  {
    type: 'citacao_direta',
    icon: '📖',
    label: 'Citação Direta',
    description: 'Um texto cita outro explicitamente',
    color: VERBUM_COLORS.edge_doutrina,
  },
  {
    type: 'profetica',
    icon: '🔮',
    label: 'Profética',
    description: 'Profecia e seu cumprimento',
    color: VERBUM_COLORS.edge_profetica,
  },
  {
    type: 'magistério',
    icon: '⛪',
    label: 'Magistério',
    description: 'Definido por Concílio ou documento papal',
    color: VERBUM_COLORS.edge_magisterio,
  },
  {
    type: 'patristica',
    icon: '✝',
    label: 'Patrística',
    description: 'Atestado pelos Padres da Igreja',
    color: VERBUM_COLORS.edge_patristica,
  },
]

export default function ConnectionTypeSelector({
  visible,
  sourceName,
  targetName,
  onSelect,
  onCancel,
}: ConnectionTypeSelectorProps) {
  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400]"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={onCancel}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[401] rounded-2xl overflow-hidden"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 420,
              background: VERBUM_COLORS.ui_bg,
              border: `1px solid ${VERBUM_COLORS.ui_border}`,
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.7)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${VERBUM_COLORS.ui_border}` }}
            >
              <div>
                <div
                  className="text-sm font-semibold tracking-wide"
                  style={{ fontFamily: 'Cinzel, serif', color: VERBUM_COLORS.text_primary }}
                >
                  Tipo de Conexão
                </div>
                <div
                  className="text-xs mt-1"
                  style={{ color: VERBUM_COLORS.text_muted, fontFamily: 'Poppins, sans-serif' }}
                >
                  <span style={{ color: VERBUM_COLORS.ui_gold }}>{sourceName}</span>
                  {' → '}
                  <span style={{ color: VERBUM_COLORS.ui_gold }}>{targetName}</span>
                </div>
              </div>
              <button onClick={onCancel} style={{ color: VERBUM_COLORS.text_muted }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Options */}
            <div className="py-2">
              {RELATION_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => onSelect(opt.type)}
                  className="w-full flex items-start gap-3 px-5 py-3 transition-colors text-left"
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,168,76,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span className="text-base mt-0.5">{opt.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-medium"
                        style={{ color: VERBUM_COLORS.text_primary, fontFamily: 'Poppins, sans-serif' }}
                      >
                        {opt.label}
                      </span>
                      <div
                        className="w-8 h-0.5 rounded"
                        style={{ background: opt.color }}
                      />
                    </div>
                    <div
                      className="text-xs mt-0.5"
                      style={{ color: VERBUM_COLORS.text_muted, fontFamily: 'Poppins, sans-serif' }}
                    >
                      {opt.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
