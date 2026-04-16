'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Search, Bell } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getDisplayName } from '@/lib/greetings'
import SearchOverlay from '@/components/mobile/SearchOverlay'

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
  const { profile } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)
  const displayName = getDisplayName(profile?.vocacao, profile?.name ?? null) || 'Irmão(ã)'
  const avatarUrl = profile?.profile_image_url

  return (
    <>
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <Link href="/perfil" className="flex items-center gap-3 min-w-0 flex-1 active:scale-[0.99]">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Avatar"
              loading="lazy"
              className="w-11 h-11 rounded-full object-cover flex-shrink-0"
              style={{ border: '1.5px solid rgba(201,168,76,0.4)' }}
            />
          ) : (
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-base font-medium"
              style={{
                background: 'linear-gradient(135deg, rgba(201,168,76,0.25), rgba(201,168,76,0.08))',
                border: '1.5px solid rgba(201,168,76,0.35)',
                color: 'var(--gold)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {(profile?.name?.[0] || '✝').toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p
              className="text-[11px] uppercase tracking-[0.12em]"
              style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
            >
              {getGreeting()}
            </p>
            <p
              className="text-base font-medium truncate"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
            >
              {displayName}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mobile: abre overlay. Desktop: link para /buscar */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar"
            className="md:hidden w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{
              background: 'rgba(201,168,76,0.06)',
              border: '1px solid rgba(201,168,76,0.12)',
              color: 'var(--gold)',
            }}
          >
            <Search className="w-[18px] h-[18px]" />
          </button>
          <Link
            href="/buscar"
            aria-label="Buscar"
            className="hidden md:flex w-11 h-11 rounded-full items-center justify-center"
            style={{
              background: 'rgba(201,168,76,0.06)',
              border: '1px solid rgba(201,168,76,0.12)',
              color: 'var(--gold)',
            }}
          >
            <Search className="w-[18px] h-[18px]" />
          </Link>
          <Link
            href="/notificacoes"
            aria-label="Notificações"
            className="w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{
              background: 'rgba(201,168,76,0.06)',
              border: '1px solid rgba(201,168,76,0.12)',
              color: 'var(--gold)',
            }}
          >
            <Bell className="w-[18px] h-[18px]" />
          </Link>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
