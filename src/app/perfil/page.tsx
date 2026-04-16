'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User,
  Target,
  Bell,
  Sparkles,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Shield,
  ShieldCheck,
  LogOut,
  Users,
  Lock,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

import { useAuth } from '@/contexts/AuthContext'
import AuthGuard from '@/components/auth/AuthGuard'
import { VOCACOES } from '@/types/auth'
import { VocacaoIcon } from '@/components/icons/VocacaoIcons'
import { useHaptic } from '@/hooks/useHaptic'

import EditarPerfilSection from './sections/EditarPerfilSection'
import PropositosSection from './sections/PropositosSection'
import NotificacoesSection from './sections/NotificacoesSection'
import AssinaturaSection from './sections/AssinaturaSection'
import CarteirinhaSection from './sections/CarteirinhaSection'

type MainTab = 'editar' | 'propositos' | 'notificacoes' | 'assinatura' | 'carteirinha'

interface TabDef {
  key: MainTab
  label: string
  icon: React.ElementType
}

const TABS: TabDef[] = [
  { key: 'editar',       label: 'Editar Perfil',     icon: User },
  { key: 'propositos',   label: 'Propósitos',        icon: Target },
  { key: 'notificacoes', label: 'Notificações',      icon: Bell },
  { key: 'assinatura',   label: 'Assinatura',        icon: Sparkles },
  { key: 'carteirinha',  label: 'Carteirinha Digital', icon: CreditCard },
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
      t === 'propositos' ||
      t === 'notificacoes' ||
      t === 'carteirinha' ||
      t === 'editar' ||
      t === 'assinatura'
    ) {
      return t as MainTab
    }
    return null // null = mostra a lista no mobile
  })()

  const [mobileTab, setMobileTab] = useState<MainTab | null>(initialTab)
  // No desktop, sempre tem uma tab selecionada
  const [desktopTab, setDesktopTab] = useState<MainTab>(initialTab ?? 'editar')

  function openMobileTab(tab: MainTab) {
    haptic.pulse('selection')
    setMobileTab(tab)
  }

  function backToList() {
    haptic.pulse('tap')
    setMobileTab(null)
  }

  return (
    <div className="min-h-screen relative pb-24 md:pb-12">
      <div className="bg-glow" aria-hidden />

      <div className="max-w-5xl mx-auto relative z-10 px-4 md:px-8 pt-6">
        {/* ─── Mobile: iOS Settings list OR section view ─── */}
        <div className="md:hidden">
          <AnimatePresence mode="wait" initial={false}>
            {mobileTab === null ? (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
              >
                <ProfileHeader profile={profile} />

                {/* Lista principal */}
                <div className="mt-5">
                  <SettingsGroup>
                    {TABS.map((t, i) => (
                      <SettingsRow
                        key={t.key}
                        icon={<t.icon className="w-5 h-5" style={{ color: '#C9A84C' }} />}
                        label={t.label}
                        onClick={() => openMobileTab(t.key)}
                        isLast={i === TABS.length - 1}
                      />
                    ))}
                  </SettingsGroup>
                </div>

                {/* Lista secundária */}
                <div className="mt-5">
                  <SettingsGroup>
                    <SettingsLinkRow
                      href="/perfil/seguranca"
                      icon={<Lock className="w-5 h-5" style={{ color: '#C9A84C' }} />}
                      label="Segurança"
                    />
                    {profile?.vocacao && profile.vocacao !== 'leigo' && (
                      <SettingsLinkRow
                        href="/perfil/verificacao"
                        icon={<Shield className="w-5 h-5" style={{ color: '#C9A84C' }} />}
                        label={profile.verified ? 'Verificação' : 'Verificar perfil'}
                        badge={profile.verified ? 'verificado' : undefined}
                      />
                    )}
                    {profile?.verified &&
                      ['padre', 'bispo', 'cardeal', 'papa'].includes(
                        profile?.vocacao ?? '',
                      ) && (
                        <SettingsLinkRow
                          href="/perfil/catequistas"
                          icon={
                            <Users className="w-5 h-5" style={{ color: '#C9A84C' }} />
                          }
                          label="Catequistas"
                          isLast
                        />
                      )}
                  </SettingsGroup>
                </div>

                {/* Sair */}
                <div className="mt-5 mb-4">
                  <SettingsGroup>
                    <button
                      type="button"
                      onClick={async () => {
                        haptic.pulse('warning')
                        await signOut()
                        router.push('/login')
                      }}
                      className="w-full flex items-center gap-3 px-4 py-4 touch-target-lg active:opacity-70"
                    >
                      <LogOut className="w-5 h-5" style={{ color: '#D94F5C' }} />
                      <span
                        className="text-sm font-medium"
                        style={{
                          color: '#D94F5C',
                          fontFamily: 'Poppins, sans-serif',
                        }}
                      >
                        Sair
                      </span>
                    </button>
                  </SettingsGroup>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={mobileTab}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  type="button"
                  onClick={backToList}
                  className="flex items-center gap-1 text-sm mb-4 active:opacity-70 touch-target-lg"
                  style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Perfil
                </button>
                <h1
                  className="text-2xl font-semibold mb-4"
                  style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    color: '#F2EDE4',
                  }}
                >
                  {TABS.find((t) => t.key === mobileTab)?.label}
                </h1>
                <RenderTab tab={mobileTab} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Desktop: tabs horizontais ─── */}
        <div className="hidden md:block">
          <ProfileHeader profile={profile} />

          <div className="flex gap-3 mt-6 mb-6 overflow-x-auto pb-2 no-scrollbar">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setDesktopTab(key)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all flex-shrink-0"
                style={{
                  fontFamily: 'Cinzel, serif',
                  background:
                    desktopTab === key
                      ? 'linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(201,168,76,0.08) 100%)'
                      : 'rgba(16,16,16,0.6)',
                  border:
                    desktopTab === key
                      ? '1px solid rgba(201,168,76,0.35)'
                      : '1px solid rgba(201,168,76,0.08)',
                  color: desktopTab === key ? '#C9A84C' : '#8A8378',
                }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <RenderTab tab={desktopTab} />
        </div>
      </div>
    </div>
  )
}

function RenderTab({ tab }: { tab: MainTab }) {
  if (tab === 'editar') return <EditarPerfilSection />
  if (tab === 'propositos') return <PropositosSection />
  if (tab === 'notificacoes') return <NotificacoesSection />
  if (tab === 'assinatura') return <AssinaturaSection />
  if (tab === 'carteirinha') return <CarteirinhaSection />
  return null
}

function ProfileHeader({ profile }: { profile: ReturnType<typeof useAuth>['profile'] }) {
  const avatarUrl = profile?.profile_image_url
  const initial = (profile?.name?.[0] || '✝').toUpperCase()
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-4"
      style={{
        background: 'rgba(20,18,14,0.6)',
        border: '1px solid rgba(201,168,76,0.12)',
      }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden text-xl font-medium"
        style={{
          background: avatarUrl
            ? 'transparent'
            : 'linear-gradient(135deg, rgba(201,168,76,0.25), rgba(201,168,76,0.08))',
          border: '2px solid rgba(201,168,76,0.35)',
          color: '#C9A84C',
          fontFamily: 'Cinzel, serif',
        }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="Avatar"
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          initial
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h1
          className="text-xl font-semibold truncate"
          style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F2EDE4' }}
        >
          {profile?.name ?? 'Sem nome'}
        </h1>
        <p
          className="text-xs truncate"
          style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
        >
          {profile?.email}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {profile?.vocacao && (
            <span
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(201,168,76,0.1)',
                border: '1px solid rgba(201,168,76,0.15)',
                color: '#C9A84C',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <VocacaoIcon vocacao={profile.vocacao} size={10} />
              {VOCACOES.find((v) => v.value === profile.vocacao)?.label ?? 'Leigo'}
            </span>
          )}
          {profile?.verified && (
            <span
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(102,187,106,0.12)',
                border: '1px solid rgba(102,187,106,0.25)',
                color: '#66BB6A',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <ShieldCheck className="w-2.5 h-2.5" />
              Verificado
            </span>
          )}
          <span
            className="text-[10px] px-2 py-0.5 rounded-full uppercase"
            style={{
              background: 'rgba(201,168,76,0.06)',
              border: '1px solid rgba(201,168,76,0.1)',
              color: '#8A8378',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {profile?.plan ?? 'free'}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── iOS Settings primitives ── */

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(20,18,14,0.6)',
        border: '1px solid rgba(201,168,76,0.1)',
      }}
    >
      {children}
    </div>
  )
}

function SettingsRow({
  icon,
  label,
  onClick,
  isLast,
  badge,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  isLast?: boolean
  badge?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-4 touch-target-lg active:bg-white/5 transition-colors"
      style={{
        borderBottom: isLast ? 'none' : '1px solid rgba(201,168,76,0.08)',
      }}
    >
      <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <span
        className="flex-1 text-left text-sm font-medium"
        style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
      </span>
      {badge && (
        <span
          className="text-[10px] px-2 py-0.5 rounded-full"
          style={{
            background: 'rgba(102,187,106,0.12)',
            color: '#66BB6A',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {badge}
        </span>
      )}
      <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: '#8A8378' }} />
    </button>
  )
}

function SettingsLinkRow({
  href,
  icon,
  label,
  isLast,
  badge,
}: {
  href: string
  icon: React.ReactNode
  label: string
  isLast?: boolean
  badge?: string
}) {
  return (
    <Link
      href={href}
      className="w-full flex items-center gap-3 px-4 py-4 touch-target-lg active:bg-white/5 transition-colors"
      style={{
        borderBottom: isLast ? 'none' : '1px solid rgba(201,168,76,0.08)',
        textDecoration: 'none',
      }}
    >
      <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <span
        className="flex-1 text-sm font-medium"
        style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
      </span>
      {badge && (
        <span
          className="text-[10px] px-2 py-0.5 rounded-full"
          style={{
            background: 'rgba(102,187,106,0.12)',
            color: '#66BB6A',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {badge}
        </span>
      )}
      <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: '#8A8378' }} />
    </Link>
  )
}
