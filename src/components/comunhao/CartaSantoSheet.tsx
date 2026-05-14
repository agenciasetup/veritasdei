'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Feather, Loader2, X } from 'lucide-react'

// Traduz o status HTTP do /api/cartas numa mensagem que o usuário entende.
function messageForStatus(status: number): string {
  if (status === 401) return 'Sua sessão expirou. Atualize a página e entre de novo.'
  if (status === 400) return 'Texto inválido. Revise e tente de novo.'
  if (status === 429) return 'Muitas tentativas. Aguarde um instante.'
  if (status >= 500) return 'Tivemos um problema ao guardar. Tente novamente.'
  return 'Não foi possível guardar agora. Tente novamente.'
}

/**
 * Sheet pra escrever uma carta a um santo — espaço contemplativo privado.
 * Inspiração: Santa Teresinha do Menino Jesus, cartas a Jesus e santos.
 */
export default function CartaSantoSheet({
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
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setTexto('')
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
    if (t.length < 10) { setError('Escreva um pouco mais.'); return }
    if (t.length > 4000) { setError('Muito longo (máximo 4000 caracteres).'); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/cartas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: t, santo_id: santoId ?? null }),
      })
      if (!res.ok) throw new Error(messageForStatus(res.status))
      setDone(true)
      onCreated?.()
      setTimeout(() => onClose(), 1400)
    } catch (e) {
      // Falha de rede (fetch rejeita) cai aqui sem status — mensagem genérica.
      setError(
        e instanceof Error && e.message
          ? e.message
          : 'Não foi possível guardar agora. Tente novamente.',
      )
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            role="dialog" aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto"
            style={{
              background: 'rgba(16,16,16,0.97)',
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
                  <Feather className="w-4 h-4" style={{ color: '#C9A84C' }} />
                  <h2 style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C', fontSize: '1.05rem' }}>
                    {santoNome ? `Carta a ${santoNome}` : 'Carta ao santo'}
                  </h2>
                </div>
                <button type="button" onClick={onClose} aria-label="Fechar">
                  <X className="w-5 h-5" style={{ color: '#8A8378' }} />
                </button>
              </div>

              <p
                className="text-xs mb-4 italic"
                style={{ color: 'rgba(242,237,228,0.65)', fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.55, fontSize: '0.85rem' }}
              >
                Espaço privado de escrita contemplativa. Só você vê. Inspirado em Santa Teresinha,
                que escrevia cartas a Jesus e aos santos.
              </p>

              <textarea
                value={texto}
                onChange={e => setTexto(e.target.value.slice(0, 4000))}
                disabled={saving || done}
                placeholder={santoNome ? `Querido ${santoNome}...` : 'Comece sua carta...'}
                rows={10}
                className="w-full px-3 py-3 rounded-xl text-sm resize-none"
                style={{
                  background: 'rgba(10,10,10,0.5)',
                  border: '1px solid rgba(242,237,228,0.14)',
                  color: '#F2EDE4',
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '0.95rem',
                  lineHeight: 1.65,
                  outline: 'none',
                }}
              />
              <div
                className="text-right text-[11px] mt-1"
                style={{ color: 'rgba(242,237,228,0.45)', fontFamily: 'Poppins, sans-serif' }}
              >
                {texto.length}/4000
              </div>

              {error && (
                <div
                  className="mt-3 px-3 py-2 rounded-lg text-xs"
                  style={{ background: 'rgba(180,40,40,0.15)', color: 'rgb(220,140,140)', fontFamily: 'Poppins, sans-serif' }}
                >
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || done || texto.trim().length < 10}
                className="w-full mt-5 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-transform active:scale-95 disabled:opacity-60"
                style={{
                  background: done ? 'rgba(201,168,76,0.2)' : '#C9A84C',
                  color: done ? '#C9A84C' : '#0A0A0A',
                  fontFamily: 'Cinzel, Georgia, serif',
                }}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : done ? 'Carta guardada' : 'Guardar carta'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
