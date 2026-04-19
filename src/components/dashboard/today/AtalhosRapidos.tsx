'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Cross, BookOpen, MapPin, MessagesSquare, ChevronRight } from 'lucide-react'

/**
 * Atalhos rápidos. Mobile: 4 squircles iOS (grid 4-cols). Desktop:
 * lista vertical de cards icon + label + chevron, encaixando no side
 * rail (col-span-4) — evita o problema dos squares gigantes.
 */
const ATALHOS = [
  { href: '/rosario', icon: Cross, label: 'Terço', desc: 'Os mistérios do dia' },
  { href: '/oracoes', icon: BookOpen, label: 'Orações', desc: 'Coletânea da Igreja' },
  { href: '/paroquias/buscar', icon: MapPin, label: 'Igrejas', desc: 'Perto de você' },
  { href: '/comunidade', icon: MessagesSquare, label: 'Comunidade', desc: 'Feed dos fiéis' },
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
    <section className="px-4 mb-5 md:!px-0 md:mb-6">
      {/* MOBILE — squircles 4-cols */}
      <div className="grid grid-cols-4 gap-2.5 stagger-in md:hidden">
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

      {/* DESKTOP — lista vertical no side rail */}
      <div className="hidden md:block">
        <h2 className="ios-eyebrow uppercase mb-3 px-1" style={{ letterSpacing: '0.06em' }}>
          Atalhos
        </h2>
        <div className="flex flex-col gap-2 stagger-in">
          {ATALHOS.map((a) => {
            const Icon = a.icon
            const showDot = a.href === '/comunidade' && unread > 0
            return (
              <Link
                key={a.href}
                href={a.href}
                className="ios-tile group flex items-center gap-3 px-3.5 py-3 transition-all"
                aria-label={a.label}
              >
                <div
                  className="relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(201,168,76,0.08)',
                    border: '1px solid rgba(201,168,76,0.16)',
                    color: 'var(--gold-light)',
                  }}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={1.7} />
                  {showDot && (
                    <span
                      aria-label={`${unread} não lidas`}
                      className="absolute"
                      style={{
                        top: -2,
                        right: -2,
                        width: 9,
                        height: 9,
                        borderRadius: 9999,
                        background: '#D94F5C',
                        boxShadow: '0 0 0 2px rgba(20,18,14,1)',
                      }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[13.5px] leading-tight"
                    style={{
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 500,
                    }}
                  >
                    {a.label}
                  </p>
                  <p
                    className="text-[11.5px] truncate mt-0.5"
                    style={{
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {a.desc}
                  </p>
                </div>
                <ChevronRight
                  className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                  style={{ color: 'var(--text-muted)' }}
                />
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
