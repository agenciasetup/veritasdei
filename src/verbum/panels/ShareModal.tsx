'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Share2, Mail, Globe, Lock, Copy, Check, Trash2, UserPlus } from 'lucide-react'
import { VERBUM_COLORS } from '../design-tokens'
import { shareFlow, getFlowShares, revokeShare } from '../services/flow.service'
import { useAuth } from '@/contexts/AuthContext'
import type { VerbumFlow, VerbumFlowShare } from '../types/verbum.types'

interface ShareModalProps {
  visible: boolean
  flow: VerbumFlow
  onClose: () => void
  onTogglePublic: (isPublic: boolean) => void
}

export default function ShareModal({ visible, flow, onClose, onTogglePublic }: ShareModalProps) {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<'view' | 'edit'>('view')
  const [shares, setShares] = useState<VerbumFlowShare[]>([])
  const [isSending, setIsSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (visible && flow.id) {
      getFlowShares(flow.id).then(setShares)
    }
  }, [visible, flow.id])

  const handleShare = useCallback(async () => {
    if (!email.trim() || !user?.id) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email inválido')
      return
    }

    setIsSending(true)
    setError('')

    const result = await shareFlow(flow.id, user.id, email.trim(), permission)
    if (result) {
      setShares((prev) => [result, ...prev])
      setEmail('')
    } else {
      setError('Este email já tem acesso ao fluxo')
    }

    setIsSending(false)
  }, [email, permission, flow.id, user?.id])

  const handleRevoke = useCallback(async (shareId: string) => {
    await revokeShare(shareId)
    setShares((prev) => prev.filter((s) => s.id !== shareId))
  }, [])

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}/verbum/canvas?flow=${flow.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [flow.id])

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
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed z-[401] rounded-2xl overflow-hidden"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(440px, calc(100vw - 2rem))',
              maxHeight: '80vh',
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
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4" style={{ color: VERBUM_COLORS.ui_gold }} />
                <span
                  className="text-sm font-semibold"
                  style={{ fontFamily: 'Cinzel, serif', color: VERBUM_COLORS.text_primary }}
                >
                  Compartilhar
                </span>
              </div>
              <button onClick={onClose} style={{ color: VERBUM_COLORS.text_muted }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Visibility toggle */}
              <div
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${VERBUM_COLORS.ui_border}` }}
              >
                <div className="flex items-center gap-2">
                  {flow.is_public ? (
                    <Globe className="w-4 h-4" style={{ color: VERBUM_COLORS.ui_gold }} />
                  ) : (
                    <Lock className="w-4 h-4" style={{ color: VERBUM_COLORS.text_muted }} />
                  )}
                  <div>
                    <div className="text-xs font-medium" style={{ color: VERBUM_COLORS.text_primary, fontFamily: 'Poppins, sans-serif' }}>
                      {flow.is_public ? 'Público' : 'Privado'}
                    </div>
                    <div className="text-[10px]" style={{ color: VERBUM_COLORS.text_muted }}>
                      {flow.is_public ? 'Qualquer pessoa pode ver' : 'Somente você e convidados'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onTogglePublic(!flow.is_public)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors"
                  style={{
                    background: flow.is_public ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${flow.is_public ? VERBUM_COLORS.ui_gold : VERBUM_COLORS.ui_border}`,
                    color: flow.is_public ? VERBUM_COLORS.ui_gold : VERBUM_COLORS.text_muted,
                  }}
                >
                  {flow.is_public ? 'Tornar privado' : 'Tornar público'}
                </button>
              </div>

              {/* Copy link */}
              {flow.is_public && (
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs transition-colors"
                  style={{
                    background: 'rgba(201,168,76,0.06)',
                    border: `1px solid rgba(201,168,76,0.2)`,
                    color: VERBUM_COLORS.ui_gold,
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Link copiado!' : 'Copiar link público'}
                </button>
              )}

              {/* Invite by email */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="w-3.5 h-3.5" style={{ color: VERBUM_COLORS.text_muted }} />
                  <span className="text-xs font-medium" style={{ color: VERBUM_COLORS.text_secondary, fontFamily: 'Poppins, sans-serif' }}>
                    Convidar por email
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    placeholder="email@exemplo.com"
                    className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${VERBUM_COLORS.ui_border}`,
                      color: VERBUM_COLORS.text_primary,
                      fontFamily: 'Poppins, sans-serif',
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleShare()}
                  />
                  <select
                    value={permission}
                    onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
                    className="px-2 py-2 rounded-lg text-xs outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${VERBUM_COLORS.ui_border}`,
                      color: VERBUM_COLORS.text_secondary,
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    <option value="view">Ver</option>
                    <option value="edit">Editar</option>
                  </select>
                  <button
                    onClick={handleShare}
                    disabled={isSending || !email.trim()}
                    className="px-4 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                    style={{
                      background: 'rgba(201,168,76,0.15)',
                      color: VERBUM_COLORS.ui_gold,
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </button>
                </div>
                {error && (
                  <div className="text-[10px] mt-1" style={{ color: '#D4884A', fontFamily: 'Poppins, sans-serif' }}>
                    {error}
                  </div>
                )}
              </div>

              {/* Existing shares */}
              {shares.length > 0 && (
                <div>
                  <div className="text-[10px] font-medium mb-2" style={{ color: VERBUM_COLORS.text_muted }}>
                    Compartilhado com ({shares.length})
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {shares.map((share) => (
                      <div
                        key={share.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.02)' }}
                      >
                        <div>
                          <div className="text-xs" style={{ color: VERBUM_COLORS.text_primary, fontFamily: 'Poppins, sans-serif' }}>
                            {share.shared_with_email}
                          </div>
                          <div className="text-[9px]" style={{ color: VERBUM_COLORS.text_muted }}>
                            {share.permission === 'edit' ? 'Pode editar' : 'Somente ver'}
                            {share.accepted ? '' : ' · Pendente'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRevoke(share.id)}
                          className="p-1 rounded transition-colors"
                          style={{ color: VERBUM_COLORS.text_muted }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
