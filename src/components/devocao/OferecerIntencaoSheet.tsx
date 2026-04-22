'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Loader2, X } from 'lucide-react'

/**
 * Modal bottom-sheet para oferecer uma intenção.
 *
 * Copy doutrinária: "oferecer" (ato do user), não "acender vela"
 * (confusão com sacramental material). Ver docs/copy-catolica.md §1 P4.
 */
export default function OferecerIntencaoSheet({
  open,
  onClose,
  santoId,
  santoNome,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  santoId?: string | null
  santoNome?: string
  onCreated?: () => void
}) {
  const [texto, setTexto] = useState('')
  const [lembrete, setLembrete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!open) {
      setTexto('')
      setLembrete(false)
      setError(null)
      setDone(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  async function handleSave() {
    const t = texto.trim()
    if (t.length < 3) { setError('Escreva ao menos algumas palavras.'); return }
    if (t.length > 500) { setError('Máximo 500 caracteres.'); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/intencoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: t, santo_id: santoId ?? null, lembrete_semanal: lembrete }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setDone(true)
      onCreated?.()
      setTimeout(() => { onClose() }, 1400)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao oferecer intenção')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto"
            style={{
              background: 'rgba(16,16,16,0.96)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(201,168,76,0.22)',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
          >
            <div className="max-w-xl mx-auto px-5 pt-5 pb-[calc(env(safe-area-inset-bottom)+24px)]">
              <div className="flex justify-center mb-4">
                <span className="w-10 h-1 rounded-full" style={{ background: 'rgba(242,237,228,0.15)' }} />
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4" style={{ color: '#C9A84C' }} />
                  <h2
                    style={{
                      fontFamily: 'Cinzel, serif',
                      color: '#C9A84C',
                      fontSize: '1.05rem',
                    }}
                  >
                    Oferecer intenção
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fechar"
                  className="p-2 rounded-full touch-target-lg active:opacity-70"
                  style={{ color: '#8A8378' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p
                className="text-xs mb-4"
                style={{ color: 'rgba(242,237,228,0.7)', fontFamily: 'Poppins, sans-serif', lineHeight: 1.6 }}
              >
                Apresente ao Senhor uma intenção{santoNome ? `, pedindo a intercessão de ${santoNome}` : ''}. A intenção fica só pra você —
                sem contagem pública, sem ranking.
              </p>

              <textarea
                value={texto}
                onChange={e => setTexto(e.target.value.slice(0, 500))}
                disabled={saving || done}
                placeholder="Por quem ou pelo que você reza?"
                rows={5}
                className="w-full px-3 py-3 rounded-xl text-sm resize-none"
                style={{
                  background: 'rgba(10,10,10,0.5)',
                  border: '1px solid rgba(242,237,228,0.14)',
                  color: '#F2EDE4',
                  fontFamily: 'Poppins, sans-serif',
                  outline: 'none',
                }}
              />
              <div
                className="text-right text-[11px] mt-1"
                style={{ color: 'rgba(242,237,228,0.45)', fontFamily: 'Poppins, sans-serif' }}
              >
                {texto.length}/500
              </div>

              <label className="mt-4 flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={lembrete}
                  onChange={e => setLembrete(e.target.checked)}
                  disabled={saving || done}
                  className="mt-1"
                />
                <span
                  className="text-xs"
                  style={{ color: 'rgba(242,237,228,0.7)', fontFamily: 'Poppins, sans-serif' }}
                >
                  Lembre-me de rezar por esta intenção semanalmente
                </span>
              </label>

              {error && (
                <div
                  className="mt-3 px-3 py-2 rounded-lg text-xs"
                  style={{
                    background: 'rgba(180,40,40,0.15)',
                    color: 'rgb(220,140,140)',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || done || texto.trim().length < 3}
                className="w-full mt-5 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-transform active:scale-95 disabled:opacity-60"
                style={{
                  background: done ? 'rgba(201,168,76,0.2)' : '#C9A84C',
                  color: done ? '#C9A84C' : '#0A0A0A',
                  fontFamily: 'Cinzel, Georgia, serif',
                }}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : done ? (
                  'Intenção oferecida'
                ) : (
                  'Oferecer ao Senhor'
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
