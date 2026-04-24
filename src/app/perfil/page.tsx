'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  User,
  Target,
  Bell,
  Sparkles,
  CreditCard,
  ChevronLeft,
  Shield,
  ShieldCheck,
  Lock,
  LogOut,
  Users,
  Gem,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

import { useAuth } from '@/contexts/AuthContext'
import AuthGuard from '@/components/auth/AuthGuard'
import { useHaptic } from '@/hooks/useHaptic'
import ProfileHeaderCard from '@/components/perfil/ProfileHeaderCard'

// EditProfileSheet é pesado (form + upload de avatar/capa) e só
// abre sob demanda. Lazy-load tira do bundle inicial de /perfil.
const EditProfileSheet = dynamic(
  () => import('@/components/perfil/EditProfileSheet'),
  { ssr: false },
)

import ContaSection from './sections/ContaSection'
import PropositosSection from './sections/PropositosSection'
import NotificacoesSection from './sections/NotificacoesSection'
import AssinaturaSection from './sections/AssinaturaSection'
import CarteirinhaSection from './sections/CarteirinhaSection'
import ReliquiasSection from './sections/ReliquiasSection'

type Tab = 'conta' | 'propositos' | 'reliquias' | 'notificacoes' | 'assinatura' | 'carteirinha'

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'conta',        label: 'Conta',         icon: User },
  { key: 'propositos',   label: 'Propósitos',    icon: Target },
  { key: 'reliquias',    label: 'Selos',         icon: Gem },
  { key: 'notificacoes', label: 'Notificações',  icon: Bell },
  { key: 'assinatura',   label: 'Assinatura',    icon: Sparkles },
  { key: 'carteirinha',  label: 'Carteirinha',   icon: CreditCard },
]

export default function PerfilPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="min-h-screen" />}>
        <PerfilContent />
      </Suspense>
    </AuthGuard>
  )
}

function PerfilContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { profile, signOut } = useAuth()
  const haptic = useHaptic()

  const initialTab = (() => {
    const t = searchParams.get('tab')
    if (
      t === 'conta' ||
      t === 'propositos' ||
      t === 'reliquias' ||
      t === 'notificacoes' ||
      t === 'assinatura' ||
      t === 'carteirinha'
    ) {
      return t as Tab
    }
    return 'conta'
  })()

  const [tab, setTab] = useState<Tab>(initialTab)
  // Abre o sheet quando `?edit=1` vier na URL — links externos da
  // Comunidade apontam pra cá. Só lemos no mount; fechamentos limpam
  // o query param pra back-button não reabrir.
  const [editOpen, setEditOpen] = useState(() => searchParams.get('edit') === '1')

  function closeEdit() {
    setEditOpen(false)
    // Limpa o query param pra o back-button não reabrir.
    if (searchParams.get('edit')) {
      const url = new URL(window.location.href)
      url.searchParams.delete('edit')
      router.replace(url.pathname + (url.search ? url.search : ''))
    }
  }

  function selectTab(next: Tab) {
    haptic.pulse('selection')
    setTab(next)
  }

  return (
    <div className="min-h-screen relative pb-24 md:pb-12">
      <div className="max-w-3xl mx-auto relative z-10 px-4 md:px-6 pt-4">
        {/* Header Instagram-like — sempre visível, com quick-edit de avatar/capa. */}
        <ProfileHeaderCard onEditClick={() => setEditOpen(true)} />

        {/* Tabs — layout horizontal scrollable, marcando a aba ativa. */}
        <div
          className="mt-6 -mx-4 md:mx-0 px-4 md:px-0 flex gap-2 overflow-x-auto pb-2 no-scrollbar"
          style={{
            borderBottom: '1px solid var(--border-2)',
          }}
        >
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => selectTab(key)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs tracking-[0.12em] uppercase whitespace-nowrap active:scale-95 transition-colors"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: active ? 'var(--text-1)' : 'var(--text-3)',
                  borderBottom: active
                    ? '2px solid var(--accent)'
                    : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            )
          })}
        </div>

        {/* Conteúdo da tab atual. AnimatePresence dá um fade suave entre
            trocas sem atrapalhar a percepção de continuidade do header. */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              <RenderTab tab={tab} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Secundário: segurança, verificação, catequistas, sair. Fica
            como lista simples no fim — são raramente usados e a tab bar
            já está cheia. */}
        <div className="mt-10 space-y-3">
          <SecondaryGroup>
            <SecondaryLink
              href="/perfil/seguranca"
              icon={<Lock className="w-4 h-4" />}
              label="Segurança"
            />
            <SecondaryLink
              href="/perfil/privacidade"
              icon={<ShieldCheck className="w-4 h-4" />}
              label="Privacidade e dados"
            />
            {profile?.vocacao && profile.vocacao !== 'leigo' && (
              <SecondaryLink
                href="/perfil/verificacao"
                icon={<Shield className="w-4 h-4" />}
                label={profile.verified ? 'Verificação' : 'Verificar perfil'}
                badge={profile.verified ? 'verificado' : undefined}
              />
            )}
            {profile?.verified &&
              ['padre', 'bispo', 'cardeal', 'papa'].includes(profile?.vocacao ?? '') && (
                <SecondaryLink
                  href="/perfil/catequistas"
                  icon={<Users className="w-4 h-4" />}
                  label="Catequistas"
                  isLast
                />
              )}
          </SecondaryGroup>

          <SecondaryGroup>
            <button
              type="button"
              onClick={async () => {
                haptic.pulse('warning')
                await signOut()
                router.push('/login')
              }}
              className="w-full flex items-center gap-3 px-4 py-4 touch-target-lg transition-colors"
            >
              <LogOut className="w-4 h-4" style={{ color: 'var(--danger)' }} />
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--danger)', fontFamily: 'var(--font-body)' }}
              >
                Sair
              </span>
              <span className="ml-auto">
                <ChevronLeft
                  className="w-4 h-4 rotate-180"
                  style={{ color: 'var(--text-3)' }}
                />
              </span>
            </button>
          </SecondaryGroup>
        </div>
      </div>

      <EditProfileSheet open={editOpen} onClose={closeEdit} />
    </div>
  )
}

function RenderTab({ tab }: { tab: Tab }) {
  if (tab === 'conta') return <ContaSection />
  if (tab === 'propositos') return <PropositosSection />
  if (tab === 'reliquias') return <ReliquiasSection />
  if (tab === 'notificacoes') return <NotificacoesSection />
  if (tab === 'assinatura') return <AssinaturaSection />
  if (tab === 'carteirinha') return <CarteirinhaSection />
  return null
}

function SecondaryGroup({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-1)',
      }}
    >
      {children}
    </div>
  )
}

function SecondaryLink({
  href,
  icon,
  label,
  badge,
  isLast,
}: {
  href: string
  icon: React.ReactNode
  label: string
  badge?: string
  isLast?: boolean
}) {
  return (
    <Link
      href={href}
      className="w-full flex items-center gap-3 px-4 py-4 touch-target-lg transition-colors"
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--border-2)',
        textDecoration: 'none',
      }}
    >
      <span style={{ color: 'var(--accent)' }}>{icon}</span>
      <span
        className="flex-1 text-sm font-medium"
        style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
      >
        {label}
      </span>
      {badge && (
        <span
          className="text-[10px] px-2 py-0.5 rounded-full"
          style={{
            background: 'color-mix(in srgb, var(--success) 16%, transparent)',
            color: 'var(--success)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {badge}
        </span>
      )}
      <ChevronLeft
        className="w-4 h-4 rotate-180"
        style={{ color: 'var(--text-3)' }}
      />
    </Link>
  )
}
