'use client'

import { Check, Share2 } from 'lucide-react'
import { useState } from 'react'
import { useHaptic } from '@/hooks/useHaptic'

/**
 * Share via Web Share API quando disponível (mobile/Safari/Edge),
 * senão copia a URL para o clipboard com feedback visual.
 * Não depende de auth.
 */
export default function ShareButton({
  title,
  text,
  url,
}: {
  title: string
  text?: string
  url?: string
}) {
  const [copied, setCopied] = useState(false)
  const haptic = useHaptic()

  const handleClick = async () => {
    const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '')
    const payload = { title, text: text ?? title, url: shareUrl }

    // 1) Web Share API — open native sheet on mobile
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(payload)
        haptic.pulse('selection')
        return
      } catch (err) {
        // AbortError = usuário cancelou — não cai no fallback
        if ((err as { name?: string })?.name === 'AbortError') return
      }
    }

    // 2) Clipboard fallback
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      haptic.pulse('complete')
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard might be blocked (iframe/insecure context) */
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={copied ? 'Link copiado' : 'Compartilhar oração'}
      className="inline-flex items-center justify-center rounded-full w-9 h-9 transition-colors active:scale-90"
      style={{
        background: copied ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${copied ? 'rgba(76,175,80,0.4)' : 'rgba(201,168,76,0.15)'}`,
      }}
    >
      {copied ? (
        <Check className="w-4 h-4" style={{ color: '#66BB6A' }} />
      ) : (
        <Share2 className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
      )}
    </button>
  )
}
