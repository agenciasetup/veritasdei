'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Check, XIcon } from 'lucide-react'
import { VERBUM_COLORS } from '../design-tokens'
import type { ConnectionProposal } from '../types/verbum.types'

interface ProposalsPanelProps {
  proposals: ConnectionProposal[]
  visible: boolean
  onClose: () => void
  onApprove: (proposal: ConnectionProposal) => void
  onReject: (proposal: ConnectionProposal) => void
}

export function ProposalsBadge({
  count,
  onClick,
}: {
  count: number
  onClick: () => void
}) {
  if (count === 0) return null

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      onClick={onClick}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[250] flex items-center gap-2 px-4 py-2 rounded-full"
      style={{
        background: VERBUM_COLORS.ui_bg,
        border: `1px solid ${VERBUM_COLORS.edge_proposta}`,
        boxShadow: `0 4px 16px rgba(212, 136, 74, 0.2)`,
      }}
    >
      <Sparkles className="w-4 h-4" style={{ color: VERBUM_COLORS.edge_proposta }} />
      <span
        className="text-sm font-medium"
        style={{ color: VERBUM_COLORS.edge_proposta, fontFamily: 'Poppins, sans-serif' }}
      >
        {count} {count === 1 ? 'conexão sugerida' : 'conexões sugeridas'}
      </span>
    </motion.button>
  )
}

export default function ProposalsPanel({
  proposals,
  visible,
  onClose,
  onApprove,
  onReject,
}: ProposalsPanelProps) {
  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[350]"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={onClose}
          />

          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[351] rounded-t-2xl overflow-hidden"
            style={{
              width: 520,
              maxHeight: '60vh',
              background: VERBUM_COLORS.ui_bg,
              border: `1px solid ${VERBUM_COLORS.ui_border}`,
              borderBottom: 'none',
              boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3 sticky top-0"
              style={{
                background: VERBUM_COLORS.ui_bg,
                borderBottom: `1px solid ${VERBUM_COLORS.ui_border}`,
              }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: VERBUM_COLORS.edge_proposta }} />
                <span
                  className="text-sm font-semibold"
                  style={{ fontFamily: 'Cinzel, serif', color: VERBUM_COLORS.text_primary }}
                >
                  Conexões Sugeridas
                </span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(212,136,74,0.15)',
                    color: VERBUM_COLORS.edge_proposta,
                  }}
                >
                  {proposals.length}
                </span>
              </div>
              <button onClick={onClose} style={{ color: VERBUM_COLORS.text_muted }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Proposals list */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(60vh - 52px)' }}>
              {proposals.map((proposal, idx) => (
                <div
                  key={idx}
                  className="px-5 py-4"
                  style={{ borderBottom: `1px solid rgba(58,42,16,0.3)` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 mr-3">
                      <div
                        className="text-sm font-medium"
                        style={{
                          fontFamily: 'Cinzel, serif',
                          color: VERBUM_COLORS.ui_gold,
                        }}
                      >
                        {proposal.theological_name}
                      </div>
                      <div
                        className="text-xs mt-1"
                        style={{ color: VERBUM_COLORS.text_muted, fontFamily: 'Poppins, sans-serif' }}
                      >
                        → {proposal.target_node_title}
                      </div>
                      <div
                        className="text-xs mt-2 leading-relaxed"
                        style={{ color: VERBUM_COLORS.text_secondary, fontFamily: 'Poppins, sans-serif' }}
                      >
                        {proposal.explanation_short}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded"
                          style={{
                            background: 'rgba(201,168,76,0.1)',
                            color: VERBUM_COLORS.text_muted,
                          }}
                        >
                          {proposal.relation_type}
                        </span>
                        <span
                          className="text-[9px]"
                          style={{ color: VERBUM_COLORS.text_muted }}
                        >
                          {proposal.source === 'registry' ? 'Registro curado' : 'IA'}
                          {' • '}
                          Confiança: {Math.round(proposal.confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => onApprove(proposal)}
                        className="p-2 rounded-lg transition-colors"
                        title="Aprovar"
                        style={{
                          background: 'rgba(201,168,76,0.1)',
                          color: VERBUM_COLORS.ui_gold,
                        }}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onReject(proposal)}
                        className="p-2 rounded-lg transition-colors"
                        title="Rejeitar"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          color: VERBUM_COLORS.text_muted,
                        }}
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
