'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, LogOut, Settings, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications'
import { useHaptic } from '@/hooks/useHaptic'

/**
 * Título da tela atual exibido ao centro do header. Mantemos um mapa
 * simples — se a rota não estiver listada, não mostra título.
 */
const ROUTE_TITLES: Array<{ prefix: string; title: string }> = [
  { prefix: '/rezar', title: 'Rezar' },
  { prefix: '/orar', title: 'Rezar' },
  { prefix: '/rosario', title: 'Terço' },
  { prefix: '/novenas', title: 'Novenas' },
  { prefix: '/oracoes', title: 'Orações' },
  { prefix: '/exame-consciencia', title: 'Exame' },
  { prefix: '/formacao', title: 'Formação' },
  { prefix: '/aprender', title: 'Formação' },
  { prefix: '/trilhas', title: 'Trilhas' },
  { prefix: '/estudo/dogmas', title: 'Dogmas' },
  { prefix: '/estudo/sacramentos', title: 'Sacramentos' },
  { prefix: '/estudo/mandamentos', title: 'Mandamentos' },
  { prefix: '/estudo/preceitos', title: 'Preceitos' },
  { prefix: '/estudo/virtudes-pecados', title: 'Virtudes' },
  { prefix: '/estudo/obras-misericordia', title: 'Misericórdia' },
  { prefix: '/catecismo-pio-x', title: 'Pio X' },
  { prefix: '/sao-tomas', title: 'São Tomás' },
  { prefix: '/mapa', title: 'Mapa' },
  { prefix: '/verbum', title: 'Verbum' },
  { prefix: '/meu-estudo', title: 'Meu Estudo' },
  { prefix: '/estudo/grupos', title: 'Grupos' },
  { prefix: '/igrejas', title: 'Igrejas' },
  { prefix: '/paroquias', title: 'Igrejas' },
  { prefix: '/comunidade', title: 'Comunidade' },
  { prefix: '/biblioteca', title: 'Biblioteca' },
  { prefix: '/liturgia', title: 'Liturgia' },
  { prefix: '/calendario', title: 'Calendário' },
  { prefix: '/buscar', title: 'Buscar' },
  { prefix: '/perfil', title: 'Perfil' },
  { prefix: '/notificacoes', title: 'Notificações' },
  { prefix: '/carteirinha', title: 'Carteirinha' },
]

function resolveTitle(pathname: string): string | null {
  if (pathname === '/' || pathname === '') return null
  const match = ROUTE_TITLES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + '/'))
  return match?.title ?? null
}

function initialsFromName(name: string | null | undefined): string {
  if (!name) return '—'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export default function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, isAuthenticated } = useAuth()
  const haptic = useHaptic()
  const unread = useUnreadNotifications()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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
    const supabase = createClient()
    if (!supabase) return
    await supabase.auth.signOut()
    router.push('/login')
  }, [router])

  if (!isAuthenticated) return null

  const title = resolveTitle(pathname)
  const name = profile?.name ?? profile?.email ?? null
  const photo = profile?.profile_image_url ?? null

  return (
    <header
      className="sticky top-0 z-[60] w-full flex items-center justify-between h-12 px-3 safe-top-standalone"
      style={{
        background: 'color-mix(in srgb, var(--surface-2) 90%, transparent)',
        borderBottom: '1px solid var(--border-1)',
        backdropFilter: 'saturate(130%) blur(8px)',
        WebkitBackdropFilter: 'saturate(130%) blur(8px)',
      }}
      aria-label="Cabeçalho do app"
    >
      {/* Avatar + menu */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={name ? `Menu do usuário ${name}` : 'Menu do usuário'}
          onClick={() => {
            haptic.pulse('tap')
            setMenuOpen((v) => !v)
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden active:scale-[0.94] transition-transform"
          style={{
            background: 'var(--surface-3)',
            border: '1px solid var(--border-1)',
            color: 'var(--text-1)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-semibold">{initialsFromName(name)}</span>
          )}
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute left-0 top-full mt-2 w-56 rounded-2xl p-1.5 z-[70]"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-1)',
              boxShadow: '0 10px 32px rgba(0,0,0,0.18)',
            }}
          >
            <MenuItem
              href="/perfil"
              icon={<UserIcon className="w-4 h-4" />}
              onClick={() => setMenuOpen(false)}
              label="Perfil"
            />
            <MenuItem
              href="/perfil/seguranca"
              icon={<Settings className="w-4 h-4" />}
              onClick={() => setMenuOpen(false)}
              label="Configurações"
            />
            <div
              className="my-1 h-px"
              style={{ background: 'var(--border-2)' }}
              aria-hidden="true"
            />
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                setMenuOpen(false)
                handleLogout()
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left active:scale-[0.98]"
              style={{
                color: 'var(--danger)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        )}
      </div>

      {/* Título central (Cinzel) */}
      {title && (
        <h1
          className="absolute left-1/2 -translate-x-1/2 text-sm tracking-[0.12em] uppercase truncate max-w-[50%]"
          style={{
            color: 'var(--text-1)',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
          }}
        >
          {title}
        </h1>
      )}

      {/* Sino de notificações */}
      <Link
        href="/notificacoes"
        aria-label={
          unread > 0
            ? `Notificações (${unread} não lida${unread === 1 ? '' : 's'})`
            : 'Notificações'
        }
        className="relative w-9 h-9 rounded-full flex items-center justify-center active:scale-[0.94] transition-transform"
        style={{
          color: 'var(--text-2)',
        }}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full px-1 text-[9px] font-semibold flex items-center justify-center"
            style={{
              background: 'var(--danger)',
              color: '#fff',
              border: '2px solid var(--surface-2)',
            }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Link>
    </header>
  )
}

function MenuItem({
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
      style={{
        color: 'var(--text-1)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <span style={{ color: 'var(--text-3)' }}>{icon}</span>
      {label}
    </Link>
  )
}
