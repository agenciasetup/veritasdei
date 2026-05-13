'use client'

/**
 * EducaTopBar — barra fina no topo do Veritas Educa.
 *
 * Logo "Veritas Educa" à esquerda, avatar à direita (link pro perfil).
 * Mantém presença mínima, sem hubs nem notificações — esses caem dentro
 * do Perfil ou ficam fora do MVP Educa.
 */

import Link from 'next/link'
import { User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import CrossIcon from '@/components/icons/CrossIcon'

export default function EducaTopBar() {
  const { profile } = useAuth()
  const avatarUrl = profile?.profile_image_url

  return (
    <header
      className="sticky top-0 z-40 h-12 flex items-center justify-between px-4"
      style={{
        background: 'color-mix(in srgb, var(--surface-1) 92%, transparent)',
        borderBottom: '1px solid var(--border-1)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Link
        href="/educa"
        className="flex items-center gap-2"
        aria-label="Veritas Educa — início"
      >
        <CrossIcon size="sm" />
        <span
          className="text-xs tracking-[0.2em] uppercase"
          style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
        >
          Veritas Educa
        </span>
      </Link>

      <Link
        href="/educa/perfil"
        aria-label="Meu perfil"
        className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-1)',
        }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <User className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
        )}
      </Link>
    </header>
  )
}
