'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Cross, BookOpen, MapPin, MessagesSquare } from 'lucide-react'

/**
 * Atalhos circulares no estilo "stories" do Instagram:
 * as ações que 90% dos católicos usam diariamente + Comunidade.
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
    <section className="px-5 mb-3">
      <div className="flex items-center justify-around stagger-in">
        {ATALHOS.map(a => {
          const Icon = a.icon
          const showDot = a.href === '/comunidade' && unread > 0
          return (
            <Link
              key={a.href}
              href={a.href}
              className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
              style={{ minWidth: '68px' }}
            >
              <div
                className="relative w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.03))',
                  border: '2px solid rgba(201,168,76,0.35)',
                  boxShadow: '0 4px 20px rgba(201,168,76,0.15)',
                  color: '#C9A84C',
                }}
              >
                <Icon className="w-6 h-6" strokeWidth={1.5} />
                {showDot && (
                  <span
                    aria-label={`${unread} não lidas`}
                    className="absolute"
                    style={{
                      top: 4,
                      right: 4,
                      width: 10,
                      height: 10,
                      borderRadius: 9999,
                      background: '#C9A84C',
                      boxShadow: '0 0 0 2px #0F0E0C',
                    }}
                  />
                )}
              </div>
              <span
                className="text-[11px]"
                style={{ color: '#A8A096', fontFamily: 'Poppins, sans-serif' }}
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
