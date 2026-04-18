'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/auth/AuthGuard'
import { Bell, CheckCheck, Inbox, Trash2 } from 'lucide-react'
import type { NotificacaoFeedItem } from '@/types/notifications'
import { useHaptic } from '@/hooks/useHaptic'

const SWIPE_THRESHOLD = 72
const SWIPE_MAX = 140

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

/**
 * Converte URLs antigas de notificação de comunidade para a rota
 * dedicada da VD (thread). Garantimos que o clique leva direto ao
 * Veritas em questão, mesmo pra notificações criadas antes da mudança.
 */
function normalizeTargetUrl(url: string): string {
  try {
    const m = url.match(/^\/comunidade\?(?:.*&)?vd=([0-9a-f-]{36})/i)
    if (m && m[1]) return `/comunidade/veritas/${m[1]}`
    return url
  } catch {
    return url
  }
}

/** Data compacta: "agora", "2 min", "1h", "ontem", "18 abr", "18/04/25". */
function relativeTime(iso: string): string {
  const d = new Date(iso)
  const now = Date.now()
  const diff = Math.max(0, now - d.getTime())
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min} min`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const dayDiff = Math.floor(hr / 24)
  if (dayDiff === 1) return 'ontem'
  if (dayDiff < 7) return `${dayDiff}d`
  const sameYear = d.getFullYear() === new Date().getFullYear()
  if (sameYear) {
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
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
        <div className="flex items-center gap-2.5">
          <Bell className="w-[18px] h-[18px]" strokeWidth={1.8} style={{ color: 'var(--gold-light)' }} />
          <h1
            className="text-[30px] leading-none"
            style={{
              fontFamily: 'var(--font-elegant)',
              color: 'var(--text-primary)',
              fontWeight: 500,
              letterSpacing: '-0.005em',
            }}
          >
            Notificações
          </h1>
        </div>
        <p
          className="text-[12.5px] mt-2 leading-snug"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
        >
          Deslize para a direita para marcar como lida, para a esquerda para apagar.
        </p>
      </header>

      <div className="px-4 max-w-2xl mx-auto">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span
            className="text-[11px] uppercase"
            style={{
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.14em',
              fontWeight: 500,
            }}
          >
            {unreadCount} não lida{unreadCount === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            onClick={() => void fetchNotifications()}
            className="text-[12px] px-3 py-1.5 rounded-full active:scale-95 transition-transform"
            style={{
              color: 'var(--gold-light)',
              fontFamily: 'var(--font-body)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            Atualizar
          </button>
        </div>

        {loading && (
          <div className="text-center py-10">
            <div
              className="w-6 h-6 border-2 rounded-full animate-spin mx-auto"
              style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: 'var(--gold)' }}
            />
          </div>
        )}

        {empty && (
          <div
            className="ios-surface p-8 text-center"
          >
            <Inbox className="w-8 h-8 mx-auto mb-3" strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
              Nenhuma notificação no momento.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <SwipeableNotificationItem
              key={item.id}
              item={item}
              busy={busyIds.has(item.id)}
              onAction={updateItemAction}
              onOpen={() => {
                if (!item.target_url) return
                if (!item.read_at) void updateItemAction(item.id, 'mark_read')
                router.push(normalizeTargetUrl(item.target_url))
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
  const haptic = useHaptic()
  const [offsetX, setOffsetX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startXRef = useRef<number | null>(null)
  const startYRef = useRef<number | null>(null)
  const movedRef = useRef(false)
  const horizontalRef = useRef<boolean | null>(null)

  const actionRight: 'mark_read' | 'mark_unread' = item.read_at ? 'mark_unread' : 'mark_read'
  const rightLabel = item.read_at ? 'Marcar não lida' : 'Marcar lida'

  const triggerRight = offsetX >= SWIPE_THRESHOLD
  const triggerLeft = offsetX <= -SWIPE_THRESHOLD

  function resetDrag() {
    setDragging(false)
    setOffsetX(0)
    startXRef.current = null
    startYRef.current = null
    movedRef.current = false
    horizontalRef.current = null
  }

  async function resolveSwipe(delta: number) {
    if (delta >= SWIPE_THRESHOLD) {
      haptic.pulse('selection')
      await onAction(item.id, actionRight)
    } else if (delta <= -SWIPE_THRESHOLD) {
      haptic.pulse('complete')
      await onAction(item.id, 'archive')
    }
  }

  const isClickable = Boolean(item.target_url)

  return (
    <div className="relative rounded-[20px] overflow-hidden" style={{ touchAction: 'pan-y' }}>
      {/* Fundo de ações — só renderiza enquanto arrastando */}
      {dragging && (
        <div
          className="absolute inset-0 flex items-center justify-between px-5 pointer-events-none"
          aria-hidden
          style={{
            background:
              offsetX > 0
                ? `linear-gradient(90deg, rgba(102,187,106,${triggerRight ? 0.22 : 0.1}) 0%, transparent 60%)`
                : offsetX < 0
                  ? `linear-gradient(270deg, rgba(217,79,92,${triggerLeft ? 0.22 : 0.1}) 0%, transparent 60%)`
                  : 'transparent',
          }}
        >
          <div
            className="inline-flex items-center gap-2 text-[12px]"
            style={{
              color: '#66BB6A',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              opacity: offsetX > 12 ? 1 : 0,
              transform: `scale(${triggerRight ? 1.06 : 1})`,
              transition: 'transform 120ms ease-out, opacity 120ms',
            }}
          >
            <CheckCheck className="w-4 h-4" strokeWidth={2} />
            {rightLabel}
          </div>
          <div
            className="inline-flex items-center gap-2 text-[12px]"
            style={{
              color: '#D94F5C',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              opacity: offsetX < -12 ? 1 : 0,
              transform: `scale(${triggerLeft ? 1.06 : 1})`,
              transition: 'transform 120ms ease-out, opacity 120ms',
            }}
          >
            Apagar
            <Trash2 className="w-4 h-4" strokeWidth={2} />
          </div>
        </div>
      )}

      <div
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onPointerDown={(e) => {
          if (busy) return
          setDragging(true)
          startXRef.current = e.clientX
          startYRef.current = e.clientY
          movedRef.current = false
          horizontalRef.current = null
        }}
        onPointerMove={(e) => {
          if (!dragging || startXRef.current == null || startYRef.current == null) return
          const dx = e.clientX - startXRef.current
          const dy = e.clientY - startYRef.current
          const absDx = Math.abs(dx)
          const absDy = Math.abs(dy)

          // Lock na direção no primeiro movimento significativo — evita
          // roubar scroll vertical do usuário.
          if (horizontalRef.current === null && absDx + absDy > 6) {
            horizontalRef.current = absDx > absDy
          }
          if (horizontalRef.current === false) {
            // Scroll vertical — cancela drag horizontal.
            resetDrag()
            return
          }

          if (absDx > 5) movedRef.current = true
          setOffsetX(Math.max(-SWIPE_MAX, Math.min(SWIPE_MAX, dx)))
        }}
        onPointerUp={async () => {
          if (!dragging) return
          const delta = offsetX
          resetDrag()
          await resolveSwipe(delta)
        }}
        onPointerCancel={resetDrag}
        onClick={() => {
          if (movedRef.current || !isClickable) return
          onOpen()
        }}
        onKeyDown={(e) => {
          if (!isClickable) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpen()
          }
        }}
        className="relative p-4 transition-transform duration-150"
        style={{
          transform: `translateX(${offsetX}px)`,
          background: item.read_at
            ? 'linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.008) 100%), rgba(18,16,12,0.96)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%), rgba(22,20,14,0.98)',
          border: item.read_at
            ? '1px solid rgba(255,255,255,0.05)'
            : '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.04) inset, 0 -1px 0 rgba(0,0,0,0.25) inset, 0 8px 22px rgba(0,0,0,0.3)',
          opacity: busy ? 0.65 : 1,
          cursor: isClickable ? 'pointer' : 'default',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3 mb-0.5">
              <p
                className="text-[14px] leading-snug truncate flex-1"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: item.read_at ? 500 : 600,
                }}
              >
                {item.title}
              </p>
              <span
                className="text-[11px] flex-shrink-0 mt-0.5"
                style={{
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {relativeTime(item.created_at)}
              </span>
            </div>
            <p
              className="text-[13px] leading-snug"
              style={{
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {item.body}
            </p>
          </div>
          {!item.read_at && (
            <span
              className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
              style={{
                background: 'var(--gold)',
                boxShadow: '0 0 0 3px rgba(201,168,76,0.12)',
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
