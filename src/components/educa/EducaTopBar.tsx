'use client'

/**
 * EducaTopBar — barra fina no topo do Veritas Educa.
 *
 * Logo "Veritas Educa" à esquerda, avatar à direita. O avatar abre um
 * submenu (Perfil, Configurações, Assinatura, Sair) — antes era um link
 * direto pro /perfil, o que não dava acesso a logout nem assinatura.
 */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { HelpCircle, LogOut, Settings, Sparkles, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/contexts/SubscriptionContext'
import CrossIcon from '@/components/icons/CrossIcon'

export default function EducaTopBar() {
  const router = useRouter()
  const { profile, signOut } = useAuth()
  const { isPremium } = useSubscription()
  const avatarUrl = profile?.profile_image_url
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // "Assinatura" inteligente: quem ainda não assinou vai pra tela de
  // assinatura do Educa; quem já é premium vai pro painel self-service.
  const assinaturaHref = isPremium ? '/perfil?tab=assinatura' : '/educa/assine'

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', esc)
    }
  }, [menuOpen])

  const handleLogout = useCallback(async () => {
    setMenuOpen(false)
    await signOut()
    router.push('/login')
  }, [signOut, router])

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

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Menu do usuário"
          onClick={() => setMenuOpen((v) => !v)}
          className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center active:scale-[0.94] transition-transform"
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
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-56 rounded-2xl p-1.5 z-[70]"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-1)',
              boxShadow: '0 10px 32px rgba(0,0,0,0.18)',
            }}
          >
            <MenuLink
              href="/perfil"
              icon={<User className="w-4 h-4" />}
              label="Perfil"
              onClick={() => setMenuOpen(false)}
            />
            <MenuLink
              href="/perfil/seguranca"
              icon={<Settings className="w-4 h-4" />}
              label="Configurações"
              onClick={() => setMenuOpen(false)}
            />
            <MenuLink
              href={assinaturaHref}
              icon={<Sparkles className="w-4 h-4" />}
              label="Assinatura"
              onClick={() => setMenuOpen(false)}
            />
            <MenuLink
              href="/ajuda"
              icon={<HelpCircle className="w-4 h-4" />}
              label="Ajuda"
              onClick={() => setMenuOpen(false)}
            />
            <div
              className="my-1 h-px"
              style={{ background: 'var(--border-2)' }}
              aria-hidden="true"
            />
            <button
              role="menuitem"
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left active:scale-[0.98]"
              style={{ color: 'var(--danger)', fontFamily: 'var(--font-body)' }}
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

function MenuLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string
  icon: React.ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm active:scale-[0.98]"
      style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
    >
      <span style={{ color: 'var(--text-3)' }}>{icon}</span>
      {label}
    </Link>
  )
}
