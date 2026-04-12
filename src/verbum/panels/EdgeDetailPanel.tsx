'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, BookOpen, Church, Cross, Star } from 'lucide-react'
import { VERBUM_COLORS, EDGE_WEIGHT_STROKE } from '../design-tokens'
import CommentSection from './CommentSection'
import type { VerbumSource, EdgeStatus } from '../types/verbum.types'

interface EdgeDetailPanelProps {
  visible: boolean
  onClose: () => void
  data: {
    theologicalName: string
    sourceName: string
    targetName: string
    relationType: string
    explanation: string
    explanationShort: string
    sources: VerbumSource[]
    magisterialWeight: number
    status: EdgeStatus
  } | null
  edgeId?: string | null
  flowId?: string | null
  userId?: string | null
  isReadOnly?: boolean
  onApprove?: () => void
  onReject?: () => void
}

function SourceIcon({ type }: { type: string }) {
  switch (type) {
    case 'biblia':
      return <BookOpen className="w-3.5 h-3.5" style={{ color: VERBUM_COLORS.edge_tipologia }} />
    case 'CCC':
      return <Church className="w-3.5 h-3.5" style={{ color: VERBUM_COLORS.edge_doutrina }} />
    case 'patristica':
      return <Cross className="w-3.5 h-3.5" style={{ color: VERBUM_COLORS.edge_patristica }} />
    default:
      return <Star className="w-3.5 h-3.5" style={{ color: VERBUM_COLORS.edge_magisterio }} />
  }
}

export default function EdgeDetailPanel({ visible, onClose, data, edgeId, flowId, userId, isReadOnly, onApprove, onReject }: EdgeDetailPanelProps) {
  if (!data) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed right-0 top-0 h-full z-[350] overflow-y-auto"
          style={{
            width: 'min(380px, 100vw)',
            background: VERBUM_COLORS.ui_bg,
            borderLeft: `1px solid ${VERBUM_COLORS.ui_border}`,
            boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-start justify-between px-5 py-4 sticky top-0"
            style={{
              background: VERBUM_COLORS.ui_bg,
              borderBottom: `1px solid ${VERBUM_COLORS.ui_border}`,
            }}
          >
            <div>
              <div
                className="text-sm font-bold"
                style={{ fontFamily: 'Cinzel, serif', color: VERBUM_COLORS.ui_gold }}
              >
                {data.theologicalName}
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: VERBUM_COLORS.text_muted, fontFamily: 'Poppins, sans-serif' }}
              >
                {data.sourceName} → {data.targetName}
              </div>
            </div>
            <button onClick={onClose} style={{ color: VERBUM_COLORS.text_muted }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-4 space-y-5">
            {/* Status badge */}
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-medium"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  background: data.status === 'proposta'
                    ? 'rgba(212,136,74,0.15)'
                    : 'rgba(201,168,76,0.15)',
                  color: data.status === 'proposta'
                    ? VERBUM_COLORS.edge_proposta
                    : VERBUM_COLORS.ui_gold,
                }}
              >
                {data.status === 'proposta' ? 'Proposta' : 'Aprovada'}
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  background: 'rgba(255,255,255,0.05)',
                  color: VERBUM_COLORS.text_secondary,
                }}
              >
                {data.relationType}
              </span>
            </div>

            {/* Magisterial weight */}
            <div>
              <div
                className="text-[10px] uppercase tracking-wider mb-1.5"
                style={{ color: VERBUM_COLORS.text_muted, fontFamily: 'Poppins, sans-serif' }}
              >
                Peso Magisterial
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="w-4 h-4"
                    fill={i <= data.magisterialWeight ? VERBUM_COLORS.ui_gold : 'transparent'}
                    style={{
                      color: i <= data.magisterialWeight
                        ? VERBUM_COLORS.ui_gold
                        : VERBUM_COLORS.text_muted,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Short explanation */}
            {data.explanationShort && (
              <div
                className="text-sm italic leading-relaxed"
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  color: VERBUM_COLORS.text_primary,
                }}
              >
                &ldquo;{data.explanationShort}&rdquo;
              </div>
            )}

            {/* Full explanation */}
            <div>
              <div
                className="text-[10px] uppercase tracking-wider mb-2"
                style={{ color: VERBUM_COLORS.text_muted, fontFamily: 'Poppins, sans-serif' }}
              >
                Explicação Completa
              </div>
              <div
                className="text-xs leading-relaxed"
                style={{
                  color: VERBUM_COLORS.text_secondary,
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {data.explanation}
              </div>
            </div>

            {/* Sources */}
            {data.sources.length > 0 && (
              <div>
                <div
                  className="text-[10px] uppercase tracking-wider mb-2"
                  style={{ color: VERBUM_COLORS.text_muted, fontFamily: 'Poppins, sans-serif' }}
                >
                  Fontes
                </div>
                <div className="space-y-2">
                  {data.sources.map((source, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 px-3 py-2 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.03)' }}
                    >
                      <SourceIcon type={source.type} />
                      <div>
                        <div
                          className="text-xs font-medium"
                          style={{ color: VERBUM_COLORS.text_primary }}
                        >
                          {source.ref}
                        </div>
                        {source.text && (
                          <div
                            className="text-[11px] mt-0.5 italic"
                            style={{
                              color: VERBUM_COLORS.text_muted,
                              fontFamily: 'Cormorant Garamond, serif',
                            }}
                          >
                            {source.text}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approve/Reject buttons for proposals */}
            {data.status === 'proposta' && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onApprove}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    background: 'rgba(201,168,76,0.15)',
                    border: `1px solid ${VERBUM_COLORS.ui_gold}`,
                    color: VERBUM_COLORS.ui_gold,
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  Confirmar
                </button>
                <button
                  onClick={onReject}
                  className="flex-1 py-2.5 rounded-xl text-sm transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${VERBUM_COLORS.ui_border}`,
                    color: VERBUM_COLORS.text_muted,
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  Rejeitar
                </button>
              </div>
            )}

            {/* Comments */}
            {flowId && userId && edgeId && (
              <div style={{ borderTop: `1px solid ${VERBUM_COLORS.ui_border}`, paddingTop: '1rem' }}>
                <CommentSection
                  flowId={flowId}
                  userId={userId}
                  target={{ edgeId }}
                  isReadOnly={isReadOnly ?? false}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
