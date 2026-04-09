'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getDisplayName } from '@/lib/greetings'
import {
  ChevronLeft, ChevronRight, Home, Church, Droplets, ScrollText,
  Tablets, BookOpen, Scale, Heart, GraduationCap, MapPin,
  LogIn, User, LogOut, Shield, Users,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Início' },
  { href: '/paroquias', icon: MapPin, label: 'Paróquias' },
  { href: '/trilhas', icon: GraduationCap, label: 'Trilhas' },
  { href: '/comunidade', icon: Users, label: 'Comunidade' },
  { href: '/dogmas', icon: Church, label: 'Dogmas' },
  { href: '/sacramentos', icon: Droplets, label: 'Sacramentos' },
  { href: '/preceitos', icon: ScrollText, label: 'Preceitos' },
  { href: '/mandamentos', icon: Tablets, label: 'Mandamentos' },
  { href: '/oracoes', icon: BookOpen, label: 'Orações' },
  { href: '/virtudes-pecados', icon: Scale, label: 'Virtudes e Pecados' },
  { href: '/obras-misericordia', icon: Heart, label: 'Obras de Misericórdia' },
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
      {/* Logo area */}
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

      {/* Divider */}
      <div className="mx-3 h-px" style={{ background: 'rgba(201,168,76,0.1)' }} />

      {/* Nav items */}
      <div className="flex-1 flex flex-col gap-1 px-2 pt-4 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className="flex items-center gap-3 rounded-xl transition-all duration-200 group relative"
              style={{
                padding: expanded ? '10px 14px' : '10px 0',
                justifyContent: expanded ? 'flex-start' : 'center',
                background: isActive ? 'rgba(201,168,76,0.1)' : 'transparent',
                color: isActive ? '#C9A84C' : '#7A7368',
              }}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {expanded && (
                <span
                  className="text-sm whitespace-nowrap"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  {item.label}
                </span>
              )}
              {/* Active indicator */}
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
                  style={{ height: '20px', background: '#C9A84C' }}
                />
              )}
              {/* Tooltip when collapsed */}
              {!expanded && (
                <span
                  className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200"
                  style={{
                    background: 'rgba(10,10,10,0.95)',
                    border: '1px solid rgba(201,168,76,0.15)',
                    color: '#C9A84C',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* User Section */}
      <div className="flex-shrink-0 px-2 pb-2">
        <div className="mx-1 h-px mb-3" style={{ background: 'rgba(201,168,76,0.1)' }} />

        {!isLoading && (
          <>
            {isAuthenticated && profile ? (
              <>
                {/* Profile Link */}
                <Link
                  href="/perfil"
                  title="Meu Perfil"
                  className="flex items-center gap-3 rounded-xl transition-all duration-200 group relative mb-1"
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
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-sm whitespace-nowrap block truncate"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        {getDisplayName(profile.vocacao, profile.name) || 'Meu Perfil'}
                      </span>
                      {profile.role === 'admin' && (
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: '#C9A84C' }}>
                          <Shield className="w-2.5 h-2.5" /> Admin
                        </span>
                      )}
                    </div>
                  )}
                  {pathname === '/perfil' && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
                      style={{ height: '20px', background: '#C9A84C' }}
                    />
                  )}
                  {!expanded && (
                    <span
                      className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200"
                      style={{
                        background: 'rgba(10,10,10,0.95)',
                        border: '1px solid rgba(201,168,76,0.15)',
                        color: '#C9A84C',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      Meu Perfil
                    </span>
                  )}
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
                  {!expanded && (
                    <span
                      className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200"
                      style={{
                        background: 'rgba(10,10,10,0.95)',
                        border: '1px solid rgba(201,168,76,0.15)',
                        color: '#C9A84C',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      Sair
                    </span>
                  )}
                </button>
              </>
            ) : (
              /* Login Button */
              <Link
                href="/login"
                title="Entrar"
                className="flex items-center gap-3 rounded-xl transition-all duration-200 group relative"
                style={{
                  padding: expanded ? '10px 14px' : '10px 0',
                  justifyContent: expanded ? 'flex-start' : 'center',
                  background: pathname === '/login' ? 'rgba(201,168,76,0.1)' : 'transparent',
                  color: pathname === '/login' ? '#C9A84C' : '#C9A84C',
                }}
              >
                <LogIn className="w-[18px] h-[18px] flex-shrink-0" />
                {expanded && (
                  <span
                    className="text-sm whitespace-nowrap font-medium"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Entrar
                  </span>
                )}
                {!expanded && (
                  <span
                    className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200"
                    style={{
                      background: 'rgba(10,10,10,0.95)',
                      border: '1px solid rgba(201,168,76,0.15)',
                      color: '#C9A84C',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    Entrar
                  </span>
                )}
              </Link>
            )}
          </>
        )}
      </div>

      {/* Expand/Collapse toggle */}
      <div className="flex-shrink-0 px-2 pb-4">
        <div className="mx-1 h-px mb-3" style={{ background: 'rgba(201,168,76,0.1)' }} />
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
