'use client'

import Link from 'next/link'
import { Search, Bell } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getDisplayName } from '@/lib/greetings'

/**
 * Header da tela "Hoje" — estilo Instagram/WhatsApp:
 * avatar à esquerda, saudação, ícones de busca/sino à direita.
 *
 * O sino é placeholder — lógica de notificações reais chega em Fase 2.
 */

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function HojeHeader() {
  const { profile } = useAuth()
  const displayName = getDisplayName(profile?.vocacao, profile?.name ?? null) || 'Irmão(ã)'
  const avatarUrl = profile?.profile_image_url

  return (
    <header className="flex items-center justify-between px-5 pt-6 pb-4">
      <Link href="/perfil" className="flex items-center gap-3 min-w-0 flex-1">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-11 h-11 rounded-full object-cover flex-shrink-0"
            style={{ border: '1.5px solid rgba(201,168,76,0.4)' }}
          />
        ) : (
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-base font-medium"
            style={{
              background: 'linear-gradient(135deg, rgba(201,168,76,0.25), rgba(201,168,76,0.08))',
              border: '1.5px solid rgba(201,168,76,0.35)',
              color: '#C9A84C',
              fontFamily: 'Cinzel, serif',
            }}
          >
            {(profile?.name?.[0] || '✝').toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p
            className="text-[11px] uppercase tracking-[0.12em]"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
          >
            {getGreeting()}
          </p>
          <p
            className="text-base font-medium truncate"
            style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
          >
            {displayName}
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/buscar"
          aria-label="Buscar"
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{
            background: 'rgba(201,168,76,0.06)',
            border: '1px solid rgba(201,168,76,0.12)',
            color: '#C9A84C',
          }}
        >
          <Search className="w-4.5 h-4.5" />
        </Link>
        <Link
          href="/perfil?tab=notificacoes"
          aria-label="Notificações"
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{
            background: 'rgba(201,168,76,0.06)',
            border: '1px solid rgba(201,168,76,0.12)',
            color: '#C9A84C',
          }}
        >
          <Bell className="w-4.5 h-4.5" />
        </Link>
      </div>
    </header>
  )
}
