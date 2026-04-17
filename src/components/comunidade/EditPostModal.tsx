'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { VeritasPost } from '@/lib/community/types'
import { VERITAS_MAX_BODY } from '@/lib/community/constants'
import MentionAutocomplete from '@/components/comunidade/MentionAutocomplete'

interface Props {
  post: VeritasPost | null
  open: boolean
  onClose: () => void
  onSubmit: (body: string) => Promise<void>
}

export default function EditPostModal({ post, open, onClose, onSubmit }: Props) {
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (open && post) {
      setBody(post.body)
      setError(null)
      setSubmitting(false)
    }
  }, [open, post])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !post) return null

  const remaining = VERITAS_MAX_BODY - body.trim().length
  const unchanged = body.trim() === post.body.trim()
  const canSubmit = body.trim().length > 0 && remaining >= 0 && !submitting && !unchanged

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(body.trim())
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl p-5"
        style={{
          background: 'rgba(16,16,16,0.95)',
          border: '1px solid rgba(201,168,76,0.25)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-lg"
            style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
          >
            Editar Veritas
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1"
            style={{ color: '#8A8378' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <textarea
            ref={inputRef}
            value={body}
            onChange={e => setBody(e.target.value.slice(0, VERITAS_MAX_BODY + 50))}
            autoFocus
            className="w-full min-h-28 resize-y rounded-xl p-3 text-sm"
            style={{
              background: 'rgba(10,10,10,0.65)',
              border: '1px solid rgba(201,168,76,0.15)',
              color: '#F2EDE4',
              fontFamily: 'Poppins, sans-serif',
              outline: 'none',
            }}
          />
          <MentionAutocomplete
            inputRef={inputRef}
            value={body}
            onInsert={(next) => setBody(next.slice(0, VERITAS_MAX_BODY + 50))}
          />
        </div>

        {error && (
          <p className="mt-3 text-xs" style={{ color: '#D94F5C', fontFamily: 'Poppins, sans-serif' }}>
            {error}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span
            className="text-xs"
            style={{
              color: remaining < 0 ? '#D94F5C' : '#7A7368',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {body.trim().length}/{VERITAS_MAX_BODY}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs"
              style={{
                background: 'rgba(16,16,16,0.6)',
                border: '1px solid rgba(201,168,76,0.15)',
                color: '#8A8378',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs uppercase tracking-[0.12em] disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
                color: '#0A0A0A',
                fontFamily: 'Cinzel, serif',
              }}
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
