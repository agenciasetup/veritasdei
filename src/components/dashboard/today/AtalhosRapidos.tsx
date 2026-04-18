'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Cross, BookOpen, MapPin, MessagesSquare } from 'lucide-react'

/**
 * Atalhos em squircles estilo iOS — ações que 90% dos católicos usam
 * diariamente + Comunidade. Usa `ios-tile` para consistência visual
 * com o resto do feed da home.
 */
const ATALHOS = [
  { href: '/rosario', icon: Cross, label: 'Terço' },
  { href: '/oracoes', icon: BookOpen, label: 'Orações' },
  { href: '/paroquias/buscar', icon: MapPin, label: 'Igrejas' },
  { href: '/comunidade', icon: MessagesSquare, label: 'Comunidade' },
]

export default function AtalhosRapidos() {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/notificacoes?limit=1', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json() as { unread_count?: number }
        if (!cancelled) setUnread(data.unread_count ?? 0)
      } catch {
        // Silencioso — badge é só affordance, não deve quebrar a UI.
      }
    }
    void load()
    const timer = setInterval(load, 60_000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return (
    <section className="px-4 mb-5">
      <div className="grid grid-cols-4 gap-2.5 stagger-in">
        {ATALHOS.map((a) => {
          const Icon = a.icon
          const showDot = a.href === '/comunidade' && unread > 0
          return (
            <Link
              key={a.href}
              href={a.href}
              className="flex flex-col items-center gap-2"
              aria-label={a.label}
            >
              <div
                className="ios-tile relative w-full aspect-square flex items-center justify-center"
                style={{ color: 'var(--gold-light)' }}
              >
                <Icon className="w-[22px] h-[22px]" strokeWidth={1.6} />
                {showDot && (
                  <span
                    aria-label={`${unread} não lidas`}
                    className="absolute"
                    style={{
                      top: 10,
                      right: 10,
                      width: 8,
                      height: 8,
                      borderRadius: 9999,
                      background: '#D94F5C',
                      boxShadow: '0 0 0 2px rgba(20,18,14,1)',
                    }}
                  />
                )}
              </div>
              <span
                className="text-[11.5px]"
                style={{
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                }}
              >
                {a.label}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
