'use client'

/**
 * Banner in-app que renderiza a notificação push de foreground.
 *
 * Slide-in do topo, auto-dismiss em 5s. Tocar leva pra `url` da
 * notificação. Botão X dismissa imediatamente.
 *
 * Renderiza null em SSR / sem toast — não polui DOM.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, X } from 'lucide-react'
import { useNotificationToast } from '@/contexts/NotificationToastContext'

const AUTO_DISMISS_MS = 5000

export default function NotificationToast() {
  const { current, dismiss } = useNotificationToast()
  const router = useRouter()

  useEffect(() => {
    if (!current) return
    const t = setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [current, dismiss])

  if (!current) return null

  const handleTap = () => {
    if (current.url) router.push(current.url)
    dismiss()
  }

  return (
    <div
      role="alert"
      className="fixed top-3 left-3 right-3 z-[100] rounded-2xl shadow-lg animate-[slide-in-top_0.25s_ease-out]"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-1)',
        backdropFilter: 'blur(12px)',
        maxWidth: '480px',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      <button
        type="button"
        onClick={handleTap}
        className="flex items-start gap-3 w-full p-4 text-left"
      >
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'var(--accent-soft)' }}
        >
          <Bell className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="text-sm font-medium truncate"
            style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
          >
            {current.title}
          </div>
          <div
            className="text-xs mt-0.5 line-clamp-2"
            style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
          >
            {current.body}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            dismiss()
          }}
          className="flex-shrink-0 p-1 rounded-md"
          aria-label="Fechar notificação"
        >
          <X className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
        </button>
      </button>
    </div>
  )
}
