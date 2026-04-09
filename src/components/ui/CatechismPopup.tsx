'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Copy, Check, Loader2 } from 'lucide-react'

interface CatechismPopupProps {
  reference: string
  onClose: () => void
  anchorRect?: DOMRect | null
}

export default function CatechismPopup({ reference, onClose, anchorRect }: CatechismPopupProps) {
  const [text, setText] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchCatechism() {
      try {
        const res = await fetch(`/api/catechism?ref=${encodeURIComponent(reference)}`)
        if (!res.ok) {
          setError(true)
          return
        }
        const data = await res.json()
        setText(data.text)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchCatechism()
  }, [reference])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  async function handleCopy() {
    if (!text) return
    try {
      await navigator.clipboard.writeText(`${reference}\n\n${text}`)
    } catch { /* ok */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Position: center on mobile, near anchor on desktop
  const style: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9998,
    maxWidth: '560px',
    width: 'calc(100vw - 2rem)',
  }

  if (anchorRect && window.innerWidth >= 768) {
    const top = Math.min(anchorRect.bottom + 8, window.innerHeight - 400)
    const left = Math.max(16, Math.min(anchorRect.left, window.innerWidth - 576))
    style.top = `${top}px`
    style.left = `${left}px`
  } else {
    style.top = '50%'
    style.left = '50%'
    style.transform = 'translate(-50%, -50%)'
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9997]"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      />

      {/* Popup */}
      <div
        ref={popupRef}
        className="rounded-2xl overflow-hidden fade-in"
        style={{
          ...style,
          background: 'rgba(16,14,12,0.97)',
          border: '1px solid rgba(201,168,76,0.2)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}
        >
          <div className="flex items-center gap-3">
            <span
              className="text-2xl flex items-center justify-center w-9 h-9 rounded-lg"
              style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.15)' }}
            >
              ⛪
            </span>
            <div>
              <h3
                className="text-sm font-bold tracking-wider uppercase"
                style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
              >
                {reference}
              </h3>
              <p className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                Catecismo da Igreja Católica
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: '#7A7368', background: 'rgba(201,168,76,0.06)' }}
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 max-h-[50vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#C9A84C' }} />
              <span className="text-sm" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                Buscando no Catecismo...
              </span>
            </div>
          )}

          {error && (
            <p className="text-sm py-6 text-center" style={{ color: '#8B3145', fontFamily: 'Poppins, sans-serif' }}>
              Não foi possível carregar este trecho do Catecismo.
            </p>
          )}

          {text && (
            <p
              className="text-base leading-[2]"
              style={{ color: '#E8E2D8', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
            >
              {text}
            </p>
          )}
        </div>

        {/* Footer */}
        {text && (
          <div
            className="px-6 py-4 flex items-center justify-end"
            style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}
          >
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm tracking-wider transition-all duration-200"
              style={{
                background: copied ? 'rgba(201,168,76,0.15)' : 'rgba(201,168,76,0.06)',
                border: '1px solid rgba(201,168,76,0.15)',
                color: copied ? '#C9A84C' : '#7A7368',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
