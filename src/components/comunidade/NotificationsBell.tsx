'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, Check, Loader2 } from 'lucide-react'

interface NotificationItem {
  id: string
  type: string
  title: string
  body: string
  target_url: string | null
  source: string
  created_at: string
  read_at: string | null
  archived_at: string | null
}

interface Response {
  items: NotificationItem[]
  unread_count: number
}

function formatRelative(iso: string): string {
  const ts = new Date(iso).getTime()
  const diffMin = Math.max(1, Math.floor((Date.now() - ts) / 60000))
  if (diffMin < 60) return `${diffMin}m`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}h`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 30) return `${diffDay}d`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  // Espelha `open` num ref pro interval de polling enxergar o valor atual
  // sem recriar o timer — antes a closure capturava `open=false` pra
  // sempre e o polling rodava mesmo com o dropdown aberto.
  const openRef = useRef(open)
  openRef.current = open

  async function loadNotifications() {
    setLoading(true)
    try {
      const res = await fetch('/api/notificacoes?limit=15', { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as Response
      setItems(data.items)
      setUnreadCount(data.unread_count)
    } finally {
      setLoading(false)
    }
  }

  // Polling leve: busca unread count a cada 60s quando dropdown fechado.
  useEffect(() => {
    void loadNotifications()
    const timer = setInterval(() => {
      if (!openRef.current) void loadNotifications()
    }, 60_000)
    return () => clearInterval(timer)
  }, [])

  // Recarrega quando abre.
  useEffect(() => {
    if (open) void loadNotifications()
  }, [open])

  // Click fora fecha o dropdown.
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      const t = e.target as Node
      if (
        dropdownRef.current && !dropdownRef.current.contains(t)
        && buttonRef.current && !buttonRef.current.contains(t)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  async function markAsRead(id: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, read_at: new Date().toISOString() } : i))
    setUnreadCount(c => Math.max(0, c - 1))
    await fetch(`/api/notificacoes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_read' }),
    })
  }

  async function markAllAsRead() {
    const unread = items.filter(i => !i.read_at)
    setItems(prev => prev.map(i => ({ ...i, read_at: i.read_at ?? new Date().toISOString() })))
    setUnreadCount(0)
    // Fire-and-forget
    await Promise.all(unread.map(item =>
      fetch(`/api/notificacoes/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read' }),
      }),
    ))
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Notificações"
        className="relative inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
        style={{
          background: 'rgba(16,16,16,0.65)',
          border: '1px solid rgba(201,168,76,0.12)',
          color: '#8A8378',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        <Bell className="w-3.5 h-3.5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full text-[10px] font-semibold"
            style={{
              minWidth: 18,
              height: 18,
              padding: '0 4px',
              background: '#D94F5C',
              color: '#fff',
              fontFamily: 'Poppins, sans-serif',
              boxShadow: '0 0 0 2px rgba(10,10,10,0.95)',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 md:w-96 rounded-2xl overflow-hidden z-50"
          style={{
            background: 'rgba(16,16,16,0.96)',
            border: '1px solid rgba(201,168,76,0.25)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'rgba(201,168,76,0.15)' }}
          >
            <h3
              className="text-sm uppercase tracking-[0.12em]"
              style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
            >
              Notificações
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1 text-xs"
                style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
              >
                <Check className="w-3 h-3" /> Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading && items.length === 0 && (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#8A8378' }} />
              </div>
            )}

            {!loading && items.length === 0 && (
              <div
                className="py-8 text-center text-xs"
                style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
              >
                Sem notificações.
              </div>
            )}

            {items.map(item => {
              const unread = !item.read_at
              const content = (
                <>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span
                      className="text-sm font-medium flex-1 min-w-0"
                      style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
                    >
                      {item.title}
                    </span>
                    <span
                      className="text-xs whitespace-nowrap"
                      style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
                    >
                      {formatRelative(item.created_at)}
                    </span>
                  </div>
                  <p
                    className="text-xs line-clamp-2"
                    style={{ color: '#B8B0A2', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {item.body}
                  </p>
                </>
              )

              const commonStyle = {
                background: unread ? 'rgba(201,168,76,0.06)' : 'transparent',
                borderBottom: '1px solid rgba(201,168,76,0.08)',
              }

              if (item.target_url) {
                return (
                  <Link
                    key={item.id}
                    href={item.target_url}
                    onClick={() => {
                      void markAsRead(item.id)
                      setOpen(false)
                    }}
                    className="block px-4 py-3 transition-colors hover:bg-[rgba(201,168,76,0.10)]"
                    style={commonStyle}
                  >
                    {content}
                  </Link>
                )
              }

              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => void markAsRead(item.id)}
                  className="block px-4 py-3 cursor-pointer transition-colors hover:bg-[rgba(201,168,76,0.10)]"
                  style={commonStyle}
                >
                  {content}
                </div>
              )
            })}
          </div>

          {items.length > 0 && (
            <Link
              href="/notificacoes"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-center text-xs"
              style={{
                color: '#C9A84C',
                fontFamily: 'Poppins, sans-serif',
                borderTop: '1px solid rgba(201,168,76,0.15)',
              }}
            >
              Ver todas
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
