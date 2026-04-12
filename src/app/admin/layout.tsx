'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect } from 'react'
import { Users, FileText, CheckSquare, ArrowLeft, Shield, GraduationCap, Brain, CreditCard } from 'lucide-react'

const ADMIN_NAV = [
  { href: '/admin/usuarios', icon: Users, label: 'Usuários' },
  { href: '/admin/conteudos', icon: FileText, label: 'Conteúdos' },
  { href: '/admin/trilhas', icon: GraduationCap, label: 'Trilhas' },
  { href: '/admin/aprovacoes', icon: CheckSquare, label: 'Aprovações' },
  { href: '/admin/ia-knowledge', icon: Brain, label: 'Base IA' },
  { href: '/admin/planos', icon: CreditCard, label: 'Planos' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, profile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || profile?.role !== 'admin')) {
      router.push('/')
    }
  }, [isLoading, isAuthenticated, profile, router])

  if (isLoading || !isAuthenticated || profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
      {/* Admin Top Bar */}
      <header
        className="sticky top-0 z-50 px-4 md:px-6 py-3 flex items-center gap-4"
        style={{
          background: 'rgba(13,13,13,0.95)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(201,168,76,0.12)',
        }}
      >
        <Link href="/" className="flex items-center gap-2 text-sm mr-4" style={{ color: '#7A7368' }}>
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline" style={{ fontFamily: 'Poppins, sans-serif' }}>Voltar</span>
        </Link>

        <div className="flex items-center gap-2 mr-6">
          <Shield className="w-4 h-4" style={{ color: '#C9A84C' }} />
          <span className="text-sm font-bold tracking-widest uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>
            Admin
          </span>
        </div>

        <nav className="flex items-center gap-1">
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
                  color: isActive ? '#C9A84C' : '#7A7368',
                  border: isActive ? '1px solid rgba(201,168,76,0.2)' : '1px solid transparent',
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            )
          })}
        </nav>
      </header>

      {/* Content */}
      <main className="px-4 md:px-6 py-6">
        {children}
      </main>
    </div>
  )
}
