'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getDisplayName } from '@/lib/greetings'
import {
  ChevronLeft, ChevronRight, Home, Church, Droplets, ScrollText,
  Tablets, BookOpen, Scale, Heart, GraduationCap, MapPin, Map,
  LogIn, User, LogOut, Shield, Users,
} from 'lucide-react'

/* ─── Navigation structure with groups ─── */

interface NavItem {
  href: string
  icon: React.ElementType
  label: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_MAIN: NavItem[] = [
  { href: '/', icon: Home, label: 'Início' },
  { href: '/paroquias', icon: MapPin, label: 'Paróquias' },
  { href: '/comunidade', icon: Users, label: 'Comunidade' },
]

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Aprender',
    items: [
      { href: '/trilhas', icon: GraduationCap, label: 'Trilhas de Estudo' },
      { href: '/mapa', icon: Map, label: 'Mapa da Fé' },
      { href: '/dogmas', icon: Church, label: 'Dogmas' },
      { href: '/sacramentos', icon: Droplets, label: 'Sacramentos' },
    ],
  },
  {
    label: 'Referência',
    items: [
      { href: '/mandamentos', icon: Tablets, label: 'Mandamentos' },
      { href: '/preceitos', icon: ScrollText, label: 'Preceitos' },
      { href: '/oracoes', icon: BookOpen, label: 'Orações' },
      { href: '/virtudes-pecados', icon: Scale, label: 'Virtudes e Pecados' },
      { href: '/obras-misericordia', icon: Heart, label: 'Misericórdia' },
    ],
  },
]

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false)
  const pathname = usePathname()
  const { isAuthenticated, profile, signOut, isLoading } = useAuth()

  const avatarUrl = profile?.profile_image_url

  return (
    <nav
      className="fixed top-0 left-0 z-[100] h-full flex flex-col transition-all duration-300 ease-out"
      style={{
        width: expanded ? '220px' : '64px',
        background: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(201,168,76,0.08)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-16 flex-shrink-0">
        {expanded ? (
          <span
            className="text-sm font-bold tracking-widest uppercase"
            style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
          >
            Veritas Dei
          </span>
        ) : (
          <span style={{ color: '#C9A84C', fontSize: '1.1rem' }}>&#10013;</span>
        )}
      </div>

      <div className="mx-3 h-px" style={{ background: 'rgba(201,168,76,0.1)' }} />

      {/* Scrollable nav area */}
      <div className="flex-1 flex flex-col px-2 pt-3 overflow-y-auto">

        {/* ── Main nav items ── */}
        <div className="flex flex-col gap-0.5">
          {NAV_MAIN.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              pathname={pathname}
              expanded={expanded}
            />
          ))}
        </div>

        {/* ── Grouped sections ── */}
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mt-4">
            {/* Group label */}
            {expanded ? (
              <p
                className="text-[10px] tracking-[0.15em] uppercase px-3 mb-1.5"
                style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
              >
                {group.label}
              </p>
            ) : (
              <div className="mx-3 h-px my-2" style={{ background: 'rgba(201,168,76,0.06)' }} />
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <SidebarLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  expanded={expanded}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── User section ── */}
      <div className="flex-shrink-0 px-2 pb-2">
        <div className="mx-1 h-px mb-2" style={{ background: 'rgba(201,168,76,0.1)' }} />

        {!isLoading && (
          <>
            {isAuthenticated && profile ? (
              <>
                {/* Admin */}
                {profile.role === 'admin' && (
                  <SidebarLink
                    item={{ href: '/admin/conteudos', icon: Shield, label: 'Admin' }}
                    pathname={pathname}
                    expanded={expanded}
                    matchPrefix="/admin"
                    forceGold
                  />
                )}

                {/* Profile */}
                <Link
                  href="/perfil"
                  title="Meu Perfil"
                  className="flex items-center gap-3 rounded-xl transition-all duration-200 group relative mb-0.5"
                  style={{
                    padding: expanded ? '10px 14px' : '10px 0',
                    justifyContent: expanded ? 'flex-start' : 'center',
                    background: pathname === '/perfil' ? 'rgba(201,168,76,0.1)' : 'transparent',
                    color: pathname === '/perfil' ? '#C9A84C' : '#7A7368',
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-[18px] h-[18px] rounded-full object-cover flex-shrink-0"
                      style={{ border: '1px solid rgba(201,168,76,0.3)' }}
                    />
                  ) : (
                    <User className="w-[18px] h-[18px] flex-shrink-0" />
                  )}
                  {expanded && (
                    <span className="text-sm whitespace-nowrap truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {getDisplayName(profile.vocacao, profile.name) || 'Meu Perfil'}
                    </span>
                  )}
                  <SidebarTooltip expanded={expanded} label="Meu Perfil" />
                </Link>

                {/* Logout */}
                <button
                  onClick={() => signOut()}
                  title="Sair"
                  className="w-full flex items-center gap-3 rounded-xl transition-all duration-200 group relative"
                  style={{
                    padding: expanded ? '10px 14px' : '10px 0',
                    justifyContent: expanded ? 'flex-start' : 'center',
                    color: '#7A7368',
                  }}
                >
                  <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
                  {expanded && (
                    <span className="text-sm whitespace-nowrap" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Sair
                    </span>
                  )}
                  <SidebarTooltip expanded={expanded} label="Sair" />
                </button>
              </>
            ) : (
              <SidebarLink
                item={{ href: '/login', icon: LogIn, label: 'Entrar' }}
                pathname={pathname}
                expanded={expanded}
                forceGold
              />
            )}
          </>
        )}
      </div>

      {/* Collapse toggle */}
      <div className="flex-shrink-0 px-2 pb-4">
        <div className="mx-1 h-px mb-2" style={{ background: 'rgba(201,168,76,0.1)' }} />
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-3 rounded-xl py-2 transition-all duration-200"
          style={{
            justifyContent: expanded ? 'flex-start' : 'center',
            padding: expanded ? '8px 14px' : '8px 0',
            color: '#7A7368',
          }}
          aria-label={expanded ? 'Encolher menu' : 'Expandir menu'}
        >
          {expanded ? (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs" style={{ fontFamily: 'Poppins, sans-serif' }}>Encolher</span>
            </>
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </nav>
  )
}

/* ─── Reusable sidebar link ─── */

function SidebarLink({
  item,
  pathname,
  expanded,
  matchPrefix,
  forceGold,
}: {
  item: NavItem
  pathname: string
  expanded: boolean
  matchPrefix?: string
  forceGold?: boolean
}) {
  const isActive = matchPrefix
    ? pathname.startsWith(matchPrefix)
    : pathname === item.href
  const Icon = item.icon
  const textColor = forceGold ? '#C9A84C' : isActive ? '#C9A84C' : '#7A7368'

  return (
    <Link
      href={item.href}
      title={item.label}
      className="flex items-center gap-3 rounded-xl transition-all duration-200 group relative"
      style={{
        padding: expanded ? '10px 14px' : '10px 0',
        justifyContent: expanded ? 'flex-start' : 'center',
        background: isActive ? 'rgba(201,168,76,0.1)' : 'transparent',
        color: textColor,
      }}
    >
      <Icon className="w-[18px] h-[18px] flex-shrink-0" />
      {expanded && (
        <span className="text-sm whitespace-nowrap truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {item.label}
        </span>
      )}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
          style={{ height: '20px', background: '#C9A84C' }}
        />
      )}
      <SidebarTooltip expanded={expanded} label={item.label} />
    </Link>
  )
}

/* ─── Tooltip for collapsed state ─── */

function SidebarTooltip({ expanded, label }: { expanded: boolean; label: string }) {
  if (expanded) return null
  return (
    <span
      className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200"
      style={{
        background: 'rgba(10,10,10,0.95)',
        border: '1px solid rgba(201,168,76,0.15)',
        color: '#C9A84C',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {label}
    </span>
  )
}
