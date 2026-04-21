/* eslint-disable @next/next/no-img-element, react-hooks/set-state-in-effect */
'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Copy, Download, Share2, Check, Loader2, Square, Smartphone } from 'lucide-react'
import type { VeritasPost } from '@/lib/community/types'
import {
  renderShareCard,
  SHARE_IMAGE_WIDTH,
  getShareImageHeight,
  type ShareCardFormat,
} from '@/lib/image/share-card'

interface Props {
  post: VeritasPost | null
  open: boolean
  onClose: () => void
  /** Chamado ao efetuar qualquer ação (copy/save/share) pra registrar métrica. */
  onAction?: (post: VeritasPost, action: 'copy' | 'save' | 'share') => void
}

type Status = 'idle' | 'rendering' | 'ready' | 'error'
type ActionFeedback = 'copy-ok' | 'save-ok' | 'share-ok' | 'copy-err' | null

export default function ShareImageModal({ post, open, onClose, onAction }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [blob, setBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<ActionFeedback>(null)
  const [format, setFormat] = useState<ShareCardFormat>('post')
  const imgRef = useRef<HTMLImageElement | null>(null)

  // Reseta pro formato post sempre que reabre.
  useEffect(() => {
    if (open) setFormat('post')
  }, [open])

  // (Re)gera a imagem ao abrir ou trocar de formato. Libera a URL ao trocar/fechar.
  useEffect(() => {
    if (!open || !post) return
    let url: string | null = null
    let cancelled = false

    setStatus('rendering')
    setBlob(null)
    setPreviewUrl(null)
    setFeedback(null)

    void renderShareCard({ post, format })
      .then(b => {
        if (cancelled) return
        url = URL.createObjectURL(b)
        setBlob(b)
        setPreviewUrl(url)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [open, post, format])

  // Esc fecha.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !post) return null
  // Render condicional ao DOM client: precisa portalizar fora da arvore
  // de VeritasCard (que tem `content-visibility: auto` — cria containing
  // block e clipa position: fixed).
  if (typeof document === 'undefined') return null

  async function handleCopy() {
    if (!blob || !post) return
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
        setFeedback('copy-ok')
        onAction?.(post, 'copy')
      } else {
        setFeedback('copy-err')
      }
    } catch {
      setFeedback('copy-err')
    }
    setTimeout(() => setFeedback(null), 2400)
  }

  function handleSave() {
    if (!blob || !post) return
    const handle = post.author.public_handle ?? post.author.user_number ?? 'veritas'
    const suffix = format === 'story' ? '-story' : ''
    const filename = `veritas-${handle}-${post.id.slice(0, 8)}${suffix}.png`
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    // Revoga logo depois — o download já está em curso.
    setTimeout(() => URL.revokeObjectURL(url), 500)
    setFeedback('save-ok')
    onAction?.(post, 'save')
    setTimeout(() => setFeedback(null), 2400)
  }

  async function handleShare() {
    if (!blob || !post) return
    const handle = post.author.public_handle ?? post.author.user_number ?? 'veritas'
    const suffix = format === 'story' ? '-story' : ''
    const filename = `veritas-${handle}${suffix}.png`
    const file = new File([blob], filename, { type: blob.type })

    const shareData: ShareData = {
      title: `Veritas de ${post.author.name ?? 'Membro Veritas'}`,
      text: `${post.author.name ?? 'Membro Veritas'} no Veritas Dei`,
      files: [file],
    }

    try {
      if (navigator.canShare?.(shareData) && navigator.share) {
        await navigator.share(shareData)
        setFeedback('share-ok')
        onAction?.(post, 'share')
        setTimeout(() => setFeedback(null), 2400)
        return
      }
    } catch {
      // Usuário pode ter cancelado — não mostra erro.
      return
    }
    // Fallback: se não suporta Web Share com arquivo, cai no save.
    handleSave()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Compartilhar Veritas"
    >
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(20,18,14,0.98)',
          border: '1px solid rgba(201,168,76,0.22)',
          boxShadow: '0 32px 96px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid rgba(201,168,76,0.12)' }}
        >
          <h2
            className="text-[13px] uppercase tracking-[0.14em]"
            style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}
          >
            Compartilhar
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-full"
            style={{ color: '#8A8378' }}
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <div
          role="tablist"
          aria-label="Formato"
          className="flex items-center gap-2 px-4 py-2.5"
          style={{ borderBottom: '1px solid rgba(201,168,76,0.08)' }}
        >
          <FormatTab
            active={format === 'post'}
            onClick={() => setFormat('post')}
            icon={<Square className="w-4 h-4" strokeWidth={1.5} />}
            label="Post"
            hint="1080×1350"
          />
          <FormatTab
            active={format === 'story'}
            onClick={() => setFormat('story')}
            icon={<Smartphone className="w-4 h-4" strokeWidth={1.5} />}
            label="Story"
            hint="1080×1920"
          />
        </div>

        <div
          className="relative flex items-center justify-center"
          style={{
            aspectRatio: `${SHARE_IMAGE_WIDTH} / ${getShareImageHeight(format)}`,
            background: '#0F0E0C',
            maxHeight: '62vh',
          }}
        >
          {status === 'rendering' && (
            <div className="flex flex-col items-center gap-2" style={{ color: '#8A8378' }}>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Gerando imagem…
              </span>
            </div>
          )}
          {status === 'error' && (
            <div className="px-6 text-center" style={{ color: '#D94F5C', fontFamily: 'Poppins, sans-serif' }}>
              <p className="text-sm">Não foi possível gerar a imagem agora.</p>
            </div>
          )}
          {status === 'ready' && previewUrl && (
            <img
              ref={imgRef}
              src={previewUrl}
              alt="Prévia do Veritas para compartilhar"
              className="w-full h-full object-contain"
            />
          )}
        </div>

        <div
          className="px-4 py-3 flex items-center gap-2"
          style={{ borderTop: '1px solid rgba(201,168,76,0.12)' }}
        >
          <ActionButton
            label={feedback === 'copy-ok' ? 'Copiado!' : feedback === 'copy-err' ? 'Sem suporte' : 'Copiar'}
            icon={feedback === 'copy-ok' ? <Check className="w-4 h-4" strokeWidth={1.75} /> : <Copy className="w-4 h-4" strokeWidth={1.5} />}
            onClick={handleCopy}
            disabled={status !== 'ready'}
            flash={feedback === 'copy-ok'}
          />
          <ActionButton
            label={feedback === 'save-ok' ? 'Salva' : 'Salvar'}
            icon={feedback === 'save-ok' ? <Check className="w-4 h-4" strokeWidth={1.75} /> : <Download className="w-4 h-4" strokeWidth={1.5} />}
            onClick={handleSave}
            disabled={status !== 'ready'}
            flash={feedback === 'save-ok'}
          />
          <ActionButton
            label="Compartilhar"
            icon={<Share2 className="w-4 h-4" strokeWidth={1.5} />}
            onClick={handleShare}
            disabled={status !== 'ready'}
            primary
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}

interface ActionButtonProps {
  label: string
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
  primary?: boolean
  flash?: boolean
}

interface FormatTabProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  hint: string
}

function FormatTab({ active, onClick, icon, label, hint }: FormatTabProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] uppercase tracking-[0.12em] transition-colors"
      style={{
        background: active ? 'rgba(201,168,76,0.14)' : 'rgba(16,16,16,0.45)',
        border: active ? '1px solid rgba(201,168,76,0.45)' : '1px solid rgba(201,168,76,0.12)',
        color: active ? '#F2EDE4' : '#8A8378',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <span style={{ color: active ? '#C9A84C' : '#8A8378' }}>{icon}</span>
      <span className="font-medium">{label}</span>
      <span className="opacity-60 normal-case tracking-normal text-[10px]">{hint}</span>
    </button>
  )
}

function ActionButton({ label, icon, onClick, disabled, primary, flash }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[12px] uppercase tracking-[0.12em] disabled:opacity-50 transition-colors"
      style={{
        background: primary
          ? 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)'
          : flash
            ? 'rgba(102,187,106,0.18)'
            : 'rgba(16,16,16,0.65)',
        border: primary
          ? '1px solid rgba(201,168,76,0.6)'
          : flash
            ? '1px solid rgba(102,187,106,0.45)'
            : '1px solid rgba(201,168,76,0.22)',
        color: primary ? '#0A0A0A' : flash ? '#66BB6A' : '#F2EDE4',
        fontFamily: primary ? 'Cinzel, serif' : 'Poppins, sans-serif',
      }}
    >
      {icon}
      {label}
    </button>
  )
}
