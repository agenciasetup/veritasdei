'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/auth/AuthGuard'
import { Bell, CheckCheck, Inbox, Trash2 } from 'lucide-react'
import type { NotificacaoFeedItem } from '@/types/notifications'

const SWIPE_THRESHOLD = 72
const SWIPE_MAX = 120

interface NotificationsResponse {
  items: NotificacaoFeedItem[]
  unread_count: number
}

export default function NotificacoesPage() {
  return (
    <AuthGuard>
      <NotificacoesView />
    </AuthGuard>
  )
}

function NotificacoesView() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<NotificacaoFeedItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notificacoes?limit=80', { cache: 'no-store' })
      if (!res.ok) throw new Error('Erro ao carregar notificações')
      const data = (await res.json()) as NotificationsResponse
      setItems(data.items ?? [])
      setUnreadCount(data.unread_count ?? 0)
    } catch {
      setItems([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchNotifications()
  }, [fetchNotifications])

  async function updateItemAction(id: string, action: 'mark_read' | 'mark_unread' | 'archive') {
    setBusyIds((prev) => new Set(prev).add(id))
    try {
      if (action === 'archive') {
        const res = await fetch(`/api/notificacoes/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Erro ao arquivar')
        setItems((prev) => prev.filter((item) => item.id !== id))
      } else {
        const res = await fetch(`/api/notificacoes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        })
        if (!res.ok) throw new Error('Erro ao atualizar')
        const data = (await res.json()) as { item: NotificacaoFeedItem }
        setItems((prev) => prev.map((item) => (item.id === id ? data.item : item)))
      }
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  useEffect(() => {
    const unread = items.filter((item) => !item.read_at).length
    setUnreadCount(unread)
  }, [items])

  const empty = useMemo(() => !loading && items.length === 0, [loading, items.length])

  return (
    <main className="min-h-screen pb-24">
      <header className="px-5 pt-8 pb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" style={{ color: '#C9A84C' }} />
          <h1
            className="text-3xl font-semibold"
            style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F2EDE4' }}
          >
            Notificações
          </h1>
        </div>
        <p
          className="text-sm mt-2"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          Arraste para a direita para marcar como lida e para a esquerda para apagar.
        </p>
      </header>

      <div className="px-4 max-w-2xl mx-auto">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span
            className="text-xs uppercase tracking-[0.12em]"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
          >
            {unreadCount} não lida{unreadCount === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            onClick={() => void fetchNotifications()}
            className="text-xs px-3 py-2 rounded-xl"
            style={{
              color: '#C9A84C',
              fontFamily: 'Poppins, sans-serif',
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.2)',
            }}
          >
            Atualizar
          </button>
        </div>

        {loading && (
          <div className="text-center py-10">
            <div
              className="w-6 h-6 border-2 rounded-full animate-spin mx-auto"
              style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }}
            />
          </div>
        )}

        {empty && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.12)' }}
          >
            <Inbox className="w-8 h-8 mx-auto mb-3" style={{ color: '#7A7368' }} />
            <p style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
              Nenhuma notificação no momento.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {items.map((item) => (
            <SwipeableNotificationItem
              key={item.id}
              item={item}
              busy={busyIds.has(item.id)}
              onAction={updateItemAction}
              onOpen={() => {
                if (item.target_url) {
                  if (!item.read_at) void updateItemAction(item.id, 'mark_read')
                  router.push(item.target_url)
                }
              }}
            />
          ))}
        </div>
      </div>
    </main>
  )
}

function SwipeableNotificationItem({
  item,
  busy,
  onAction,
  onOpen,
}: {
  item: NotificacaoFeedItem
  busy: boolean
  onAction: (id: string, action: 'mark_read' | 'mark_unread' | 'archive') => Promise<void>
  onOpen: () => void
}) {
  const [offsetX, setOffsetX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startXRef = useRef<number | null>(null)
  const movedRef = useRef(false)

  const actionRight: 'mark_read' | 'mark_unread' = item.read_at ? 'mark_unread' : 'mark_read'

  function resetDrag() {
    setDragging(false)
    setOffsetX(0)
    startXRef.current = null
    movedRef.current = false
  }

  async function resolveSwipe(delta: number) {
    if (delta >= SWIPE_THRESHOLD) {
      await onAction(item.id, actionRight)
    } else if (delta <= -SWIPE_THRESHOLD) {
      await onAction(item.id, 'archive')
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 flex items-center justify-between px-4" aria-hidden>
        <div
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em]"
          style={{ color: '#66BB6A', fontFamily: 'Poppins, sans-serif' }}
        >
          <CheckCheck className="w-3.5 h-3.5" />
          {item.read_at ? 'Marcar não lida' : 'Marcar lida'}
        </div>
        <div
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em]"
          style={{ color: '#D94F5C', fontFamily: 'Poppins, sans-serif' }}
        >
          Apagar
          <Trash2 className="w-3.5 h-3.5" />
        </div>
      </div>

      <div
        onPointerDown={(e) => {
          if (busy) return
          setDragging(true)
          startXRef.current = e.clientX
          movedRef.current = false
        }}
        onPointerMove={(e) => {
          if (!dragging || startXRef.current == null) return
          const delta = e.clientX - startXRef.current
          if (Math.abs(delta) > 5) movedRef.current = true
          setOffsetX(Math.max(-SWIPE_MAX, Math.min(SWIPE_MAX, delta)))
        }}
        onPointerUp={async () => {
          if (!dragging) return
          const delta = offsetX
          resetDrag()
          await resolveSwipe(delta)
        }}
        onPointerCancel={resetDrag}
        onClick={() => {
          if (movedRef.current || !item.target_url) return
          onOpen()
        }}
        className="relative p-4 transition-transform duration-150"
        style={{
          transform: `translateX(${offsetX}px)`,
          touchAction: 'pan-y',
          background: item.read_at ? 'rgba(16,16,16,0.6)' : 'rgba(201,168,76,0.06)',
          border: item.read_at
            ? '1px solid rgba(201,168,76,0.08)'
            : '1px solid rgba(201,168,76,0.2)',
          opacity: busy ? 0.65 : 1,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p
              className="text-sm"
              style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', fontWeight: item.read_at ? 400 : 600 }}
            >
              {item.title}
            </p>
            <p
              className="text-xs mt-1 leading-relaxed"
              style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}
            >
              {item.body}
            </p>
            <p
              className="text-[10px] mt-2 uppercase tracking-[0.11em]"
              style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
            >
              {new Date(item.created_at).toLocaleString('pt-BR')}
            </p>
          </div>
          {!item.read_at && (
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
              style={{ background: '#C9A84C' }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
