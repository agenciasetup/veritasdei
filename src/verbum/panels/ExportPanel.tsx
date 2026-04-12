'use client'

import { useState, useCallback } from 'react'
import { type Node, type Edge } from '@xyflow/react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, FileText, Check } from 'lucide-react'
import { VERBUM_COLORS } from '../design-tokens'
import { generateTextSynthesis, copyToClipboard, downloadAsFile } from '../services/export.service'

interface ExportPanelProps {
  visible: boolean
  flowName: string
  nodes: Node[]
  edges: Edge[]
  onClose: () => void
}

export default function ExportPanel({ visible, flowName, nodes, edges, onClose }: ExportPanelProps) {
  const [copied, setCopied] = useState(false)

  const synthesis = visible ? generateTextSynthesis({ flowName, nodes, edges }) : ''

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(synthesis)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [synthesis])

  const handleDownloadTxt = useCallback(() => {
    const safeName = flowName.replace(/[^a-zA-Z0-9\u00C0-\u017F ]/g, '').trim() || 'verbum'
    downloadAsFile(synthesis, `${safeName}.txt`)
  }, [synthesis, flowName])

  return (
    <AnimatePresence>
      {visible && (
        <>
          <div className="fixed inset-0 z-[300] bg-black/40" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-[10%] bottom-[10%] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[560px] sm:max-h-[80vh] z-[301] flex flex-col rounded-xl overflow-hidden"
            style={{
              background: VERBUM_COLORS.ui_bg,
              border: `1px solid ${VERBUM_COLORS.ui_border}`,
              boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ borderBottom: `1px solid ${VERBUM_COLORS.ui_border}` }}
            >
              <span
                className="text-sm font-semibold"
                style={{ fontFamily: 'Cinzel, serif', color: VERBUM_COLORS.ui_gold }}
              >
                Exportar Mapa
              </span>
              <button onClick={onClose} style={{ color: VERBUM_COLORS.text_muted }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <div
              className="flex items-center gap-2 px-4 py-3 shrink-0"
              style={{ borderBottom: `1px solid ${VERBUM_COLORS.ui_border}` }}
            >
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-colors"
                style={{
                  background: copied ? 'rgba(100,180,100,0.15)' : 'rgba(201,168,76,0.1)',
                  border: `1px solid ${copied ? 'rgba(100,180,100,0.4)' : 'rgba(201,168,76,0.3)'}`,
                  color: copied ? '#64B464' : VERBUM_COLORS.ui_gold,
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>

              <button
                onClick={handleDownloadTxt}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${VERBUM_COLORS.ui_border}`,
                  color: VERBUM_COLORS.text_secondary,
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                <FileText className="w-3.5 h-3.5" />
                Baixar .txt
              </button>
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <pre
                className="text-[11px] leading-relaxed whitespace-pre-wrap"
                style={{
                  color: VERBUM_COLORS.text_secondary,
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {synthesis}
              </pre>
            </div>

            {/* Footer */}
            <div
              className="px-4 py-2 text-[10px] text-center shrink-0"
              style={{
                color: VERBUM_COLORS.text_muted,
                borderTop: `1px solid ${VERBUM_COLORS.ui_border}`,
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {nodes.length} nos - {edges.length} conexoes
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
