'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Search, Bell } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getDisplayName } from '@/lib/greetings'
import SearchOverlay from '@/components/mobile/SearchOverlay'
import LevelBadge from '@/components/gamification/LevelBadge'
import { useGamification } from '@/lib/gamification/useGamification'

/**
 * Header da tela "Hoje" — estilo Instagram/WhatsApp:
 * avatar à esquerda, saudação, ícones de busca/sino à direita.
 *
 * No mobile, o ícone de busca abre `<SearchOverlay />` (overlay full-screen).
 * No desktop, leva para `/buscar` (página completa).
 */

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function HojeHeader() {
  const { profile, user } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)
  const displayName = getDisplayName(profile?.vocacao, profile?.name ?? null) || 'Irmão(ã)'
  const avatarUrl = profile?.profile_image_url
  const { level } = useGamification(user?.id)

  const iconBtnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: 'var(--text-primary)',
    boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset',
  }

  return (
    <>
      <header className="flex items-center justify-between px-5 pt-5 pb-4 md:px-0 md:pt-0 md:pb-6">
        <Link href="/perfil" className="flex items-center gap-3 min-w-0 flex-1 active:scale-[0.99] transition-transform">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Avatar"
              loading="lazy"
              className="w-11 h-11 md:w-12 md:h-12 rounded-full object-cover flex-shrink-0"
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.08) inset, 0 4px 12px rgba(0,0,0,0.3)',
              }}
            />
          ) : (
            <div
              className="w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 text-[15px] md:text-base"
              style={{
                background: 'linear-gradient(180deg, rgba(201,168,76,0.28) 0%, rgba(201,168,76,0.1) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset, 0 4px 12px rgba(0,0,0,0.3)',
                color: 'var(--gold-light)',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
              }}
            >
              {(profile?.name?.[0] || '✝').toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p
              className="text-[11px]"
              style={{
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
                letterSpacing: '0.04em',
                fontWeight: 500,
              }}
            >
              {getGreeting()}
            </p>
            <div className="flex items-center gap-2 -mt-0.5">
              <p
                className="text-[17px] md:text-[19px] truncate"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                }}
              >
                {displayName}
              </p>
              <LevelBadge level={level} size="xs" />
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mobile: abre overlay. Desktop: link para /buscar */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar"
            className="md:hidden w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={iconBtnStyle}
          >
            <Search className="w-[17px] h-[17px]" strokeWidth={2} />
          </button>
          <Link
            href="/buscar"
            aria-label="Buscar"
            className="hidden md:flex w-10 h-10 rounded-full items-center justify-center"
            style={iconBtnStyle}
          >
            <Search className="w-[17px] h-[17px]" strokeWidth={2} />
          </Link>
          <Link
            href="/notificacoes"
            aria-label="Notificações"
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={iconBtnStyle}
          >
            <Bell className="w-[17px] h-[17px]" strokeWidth={2} />
          </Link>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
