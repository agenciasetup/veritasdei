/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import CrossIcon from '@/components/icons/CrossIcon'
import type { VeritasPost } from '@/lib/community/types'
import { renderVeritasBody } from '@/lib/community/body-renderer'
import { VERITAS_MAX_BODY } from '@/lib/community/constants'
import MentionAutocomplete from '@/components/comunidade/MentionAutocomplete'

interface Props {
  post: VeritasPost | null
  open: boolean
  onClose: () => void
  onSubmit: (body: string) => Promise<void>
}

export default function QuoteModal({ post, open, onClose, onSubmit }: Props) {
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!open) {
      setBody('')
      setError(null)
      setSubmitting(false)
    }
  }, [open])

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
  const canSubmit = body.trim().length > 0 && remaining >= 0 && !submitting

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(body.trim())
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao citar Veritas.')
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
            Citar Veritas
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
            placeholder="Escreva seu comentário... Use @menção."
            autoFocus
            className="w-full min-h-24 resize-y rounded-xl p-3 text-sm"
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

        <div
          className="mt-3 rounded-xl p-3"
          style={{
            background: 'rgba(10,10,10,0.55)',
            border: '1px solid rgba(201,168,76,0.12)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center"
              style={{
                background: post.author.profile_image_url ? 'transparent' : 'rgba(201,168,76,0.1)',
                border: '1px solid rgba(201,168,76,0.2)',
              }}
            >
              {post.author.profile_image_url ? (
                <img src={post.author.profile_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <CrossIcon size="xs" />
              )}
            </div>
            <span
              className="text-xs"
              style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
            >
              {post.author.name ?? 'Membro Veritas'}
              {post.author.public_handle ? ` · @${post.author.public_handle}` : ''}
            </span>
          </div>
          <p
            className="text-xs whitespace-pre-line leading-relaxed line-clamp-4"
            style={{ color: '#B8B0A2', fontFamily: 'Poppins, sans-serif' }}
          >
            {renderVeritasBody(post.body)}
          </p>
        </div>

        {error && (
          <p
            className="mt-3 text-xs"
            style={{ color: '#D94F5C', fontFamily: 'Poppins, sans-serif' }}
          >
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
              Citar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
