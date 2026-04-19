'use client'

import { useEffect } from 'react'
import { Sparkles } from 'lucide-react'

export interface XpToastItem {
  id: number
  xp: number
}

export function XpToastStack({
  toasts,
  onDismiss,
}: {
  toasts: XpToastItem[]
  onDismiss: (id: number) => void
}) {
  return (
    <div
      className="fixed inset-x-0 top-20 z-[60] flex flex-col items-center gap-2 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: XpToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 2800)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      className="xp-toast flex items-center gap-2 px-4 py-2 rounded-full pointer-events-auto"
      style={{
        background: 'linear-gradient(135deg, rgba(201,168,76,0.95), rgba(168,139,58,0.95))',
        border: '1px solid rgba(201,168,76,0.5)',
        color: '#0F0E0C',
        fontFamily: 'Cinzel, serif',
        fontWeight: 600,
        fontSize: '0.85rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
      }}
    >
      <Sparkles className="w-4 h-4" />+{toast.xp} XP
    </div>
  )
}
