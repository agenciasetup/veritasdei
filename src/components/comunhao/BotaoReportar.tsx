'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Flag, X, Loader2, Check } from 'lucide-react'
import type { ConteudoTipo, DenunciaCategoria } from '@/types/comunhao'

const CATEGORIAS: { value: DenunciaCategoria; label: string; description: string }[] = [
  { value: 'heterodoxo',      label: 'Doutrinariamente errado',    description: 'Afirma algo contra a fé católica' },
  { value: 'supersticao',     label: 'Superstição',                description: 'Promessa mágica, transação com o sagrado' },
  { value: 'sensacionalista', label: 'Sensacionalista',            description: '"Milagre" sem base, exagero' },
  { value: 'ofensivo',        label: 'Ofensivo',                   description: 'Contra a fé, heresia, escarnio' },
  { value: 'spam',            label: 'Spam / propaganda',          description: 'Conteúdo fora de contexto' },
  { value: 'outro',           label: 'Outro',                      description: 'Descreva nos detalhes' },
]

export default function BotaoReportar({
  conteudoTipo,
  conteudoId,
  className = '',
}: {
  conteudoTipo: ConteudoTipo
  conteudoId: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [categoria, setCategoria] = useState<DenunciaCategoria | null>(null)
  const [detalhes, setDetalhes] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!categoria) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/denuncias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conteudo_tipo: conteudoTipo,
          conteudo_id: conteudoId,
          categoria,
          detalhes: detalhes.trim() || null,
        }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setDone(true)
      setTimeout(() => { setOpen(false); setDone(false); setCategoria(null); setDetalhes('') }, 1400)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao reportar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 text-[11px] opacity-60 hover:opacity-100 transition-opacity ${className}`}
        style={{ color: 'rgba(242,237,228,0.7)', fontFamily: 'Poppins, sans-serif' }}
        aria-label="Reportar conteúdo"
      >
        <Flag className="w-3 h-3" />
        Reportar
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Fechar"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
              style={{
                background: 'rgba(16,16,16,0.96)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(242,237,228,0.15)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4', fontSize: '1rem' }}>
                  Reportar conteúdo
                </h2>
                <button type="button" onClick={() => setOpen(false)} aria-label="Fechar">
                  <X className="w-5 h-5" style={{ color: '#8A8378' }} />
                </button>
              </div>

              <p
                className="text-xs mb-4"
                style={{ color: 'rgba(242,237,228,0.7)', fontFamily: 'Poppins, sans-serif', lineHeight: 1.5 }}
              >
                Por que este conteúdo é impróprio? Sua denúncia é anônima pro autor. 2 denúncias tiram o conteúdo do feed até revisão humana.
              </p>

              <div className="space-y-1.5 mb-4">
                {CATEGORIAS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategoria(c.value)}
                    disabled={saving || done}
                    className="w-full text-left px-3 py-2 rounded-lg transition-colors"
                    style={{
                      background: categoria === c.value ? 'rgba(201,168,76,0.12)' : 'rgba(242,237,228,0.04)',
                      border: `1px solid ${categoria === c.value ? 'rgba(201,168,76,0.4)' : 'rgba(242,237,228,0.1)'}`,
                    }}
                  >
                    <div
                      className="text-xs font-medium"
                      style={{ color: categoria === c.value ? '#C9A84C' : '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
                    >
                      {c.label}
                    </div>
                    <div
                      className="text-[11px] mt-0.5"
                      style={{ color: 'rgba(242,237,228,0.5)', fontFamily: 'Poppins, sans-serif' }}
                    >
                      {c.description}
                    </div>
                  </button>
                ))}
              </div>

              <textarea
                value={detalhes}
                onChange={e => setDetalhes(e.target.value.slice(0, 500))}
                disabled={saving || done}
                placeholder="Detalhes (opcional)"
                rows={2}
                className="w-full px-3 py-2 rounded-lg text-xs resize-none"
                style={{
                  background: 'rgba(10,10,10,0.5)',
                  border: '1px solid rgba(242,237,228,0.12)',
                  color: '#F2EDE4',
                  fontFamily: 'Poppins, sans-serif',
                  outline: 'none',
                }}
              />

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
                onClick={submit}
                disabled={!categoria || saving || done}
                className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold tracking-wider uppercase transition-transform active:scale-95 disabled:opacity-60"
                style={{
                  background: done ? 'rgba(201,168,76,0.2)' : '#C9A84C',
                  color: done ? '#C9A84C' : '#0A0A0A',
                  fontFamily: 'Cinzel, Georgia, serif',
                }}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : done ? (
                  <span className="inline-flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Reportado
                  </span>
                ) : (
                  'Enviar denúncia'
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
