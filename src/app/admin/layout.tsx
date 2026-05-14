'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Users,
  FileText,
  CheckSquare,
  ArrowLeft,
  Shield,
  GraduationCap,
  Brain,
  CreditCard,
  Database,
  Menu,
  BookOpenText,
  Bell,
  Megaphone,
  Palette,
  PlusSquare,
  Sparkles,
} from 'lucide-react'
import AdminMobileNav from './AdminMobileNav'

const ADMIN_NAV = [
  { href: '/admin/usuarios',            icon: Users,          label: 'Usuários' },
  { href: '/admin/conteudos',           icon: FileText,       label: 'Conteúdos' },
  { href: '/admin/oracoes',             icon: BookOpenText,   label: 'Orações' },
  { href: '/admin/trilhas',             icon: GraduationCap,  label: 'Trilhas' },
  { href: '/admin/provas',              icon: GraduationCap,  label: 'Provas' },
  { href: '/admin/colecao',               icon: Sparkles,       label: 'Coleção' },
  { href: '/admin/educa/banners',       icon: Megaphone,      label: 'Banners' },
  { href: '/admin/aprovacoes',          icon: CheckSquare,    label: 'Aprovações' },
  { href: '/admin/ia-knowledge',        icon: Brain,          label: 'Base IA' },
  { href: '/admin/embeddings',          icon: Database,       label: 'Embeddings' },
  { href: '/admin/planos',              icon: CreditCard,     label: 'Planos' },
  { href: '/admin/order-bumps',         icon: PlusSquare,     label: 'Order bumps' },
  { href: '/admin/checkout',            icon: Palette,        label: 'Checkout' },
  { href: '/admin/notificacoes-teste',  icon: Bell,           label: 'Push teste' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, profile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || profile?.role !== 'admin')) {
      router.push('/')
    }
  }, [isLoading, isAuthenticated, profile, router])

  if (isLoading || !isAuthenticated || profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }}
        />
      </div>
    )
  }

  const currentSection = ADMIN_NAV.find((n) => pathname.startsWith(n.href))

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
      {/* Admin Top Bar */}
      <header
        className="sticky top-0 z-50 px-4 md:px-6 py-3 flex items-center gap-2 md:gap-4"
        style={{
          background: 'rgba(13,13,13,0.95)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(201,168,76,0.12)',
          paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-sm touch-target active:opacity-70"
          style={{ color: '#8A8378' }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Voltar
          </span>
        </Link>

        <div className="flex items-center gap-2 md:mr-6">
          <Shield className="w-4 h-4" style={{ color: '#C9A84C' }} />
          <span
            className="text-sm font-bold tracking-widest uppercase"
            style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
          >
            Admin
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {ADMIN_NAV.map(({ href, icon: Icon, label }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  background: isActive ? 'rgba(201,168,76,0.1)' : 'transparent',
                  color: isActive ? '#C9A84C' : '#8A8378',
                  border: isActive
                    ? '1px solid rgba(201,168,76,0.2)'
                    : '1px solid transparent',
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Mobile breadcrumb (centro) + hamburger (direita) */}
        <div className="flex-1 md:hidden flex items-center justify-end gap-2">
          {currentSection && (
            <span
              className="text-xs uppercase tracking-[0.12em] truncate"
              style={{
                color: '#8A8378',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {currentSection.label}
            </span>
          )}
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Abrir navegação admin"
            className="touch-target-lg flex items-center justify-center rounded-lg active:scale-95"
            style={{
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.18)',
              color: '#C9A84C',
              width: 40,
              height: 40,
            }}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile nav sheet */}
      <AdminMobileNav
        open={navOpen}
        onClose={() => setNavOpen(false)}
        items={ADMIN_NAV}
      />

      {/* Content */}
      <main className="px-4 md:px-6 py-6">{children}</main>
    </div>
  )
}
