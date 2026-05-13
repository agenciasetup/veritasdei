'use client'

/**
 * EducaProfile — perfil enxuto do Veritas Educa.
 *
 * Mostra:
 *  - Avatar + nome + email
 *  - Status do plano (Veritas Educa / Veritas Dei Premium / sem plano)
 *  - XP + nível + sequência
 *  - Botão "Sair"
 *
 * Sem followers, sem feed, sem coisas de comunidade. Pra "gerenciar
 * assinatura" (Stripe portal, RevenueCat Center), por enquanto linka pra
 * /perfil?tab=assinatura no domínio principal — single-product abre
 * lá. Quando o portal for embutido em /educa direto, atualiza.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut, User, Sparkles, Flame, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useGamification } from '@/lib/gamification/useGamification'
import { useSubscription } from '@/contexts/SubscriptionContext'
import LevelBadge from '@/components/gamification/LevelBadge'
import XpBar from '@/components/gamification/XpBar'

function planLabel(plano: string | null, isPremium: boolean): string {
  if (!isPremium) return 'Sem plano ativo'
  if (plano === 'veritas-educa') return 'Veritas Educa'
  if (plano === 'premium') return 'Veritas Dei Premium'
  return plano ?? 'Plano ativo'
}

export default function EducaProfile() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const gami = useGamification(user?.id)
  const { isPremium, plano, fonte, expiraEm, cancelAtPeriodEnd } = useSubscription()
  const [signingOut, setSigningOut] = useState(false)

  const avatarUrl = profile?.profile_image_url
  const name = profile?.name || user?.email?.split('@')[0] || 'Estudante'
  const email = user?.email ?? profile?.email ?? null

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
    } finally {
      // AuthContext só limpa estado — redirecionamos pra /login
      // explicitamente. O hard reload garante que cookies de sessão
      // expiraram em todos os caches do app shell.
      router.replace('/login')
    }
  }

  return (
    <main className="max-w-xl mx-auto px-4 pt-5 pb-24 md:py-8 space-y-4">
      {/* Header: avatar + nome */}
      <section
        className="rounded-3xl p-5 flex items-center gap-4"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-1)',
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0"
          style={{
            background: 'var(--surface-inset)',
            border: '1px solid var(--border-1)',
          }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-7 h-7" style={{ color: 'var(--text-3)' }} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-lg truncate"
            style={{ color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}
          >
            {name}
          </p>
          {email && (
            <p
              className="text-xs truncate"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              {email}
            </p>
          )}
        </div>
        <LevelBadge level={gami.level} size="md" showLabel />
      </section>

      {/* Plano */}
      <section
        className="rounded-3xl p-5"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-1)',
        }}
      >
        <p
          className="text-[10px] tracking-[0.2em] uppercase mb-2"
          style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
        >
          Plano
        </p>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p
              className="text-base font-medium"
              style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
            >
              {planLabel(plano, isPremium)}
            </p>
            {isPremium && expiraEm && (
              <p
                className="text-xs mt-0.5"
                style={{
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {cancelAtPeriodEnd ? 'Encerra' : 'Renova'} em{' '}
                {new Date(expiraEm).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            )}
            {isPremium && fonte === 'admin_role' && (
              <p
                className="text-xs mt-0.5"
                style={{
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Acesso administrativo
              </p>
            )}
          </div>
          {!isPremium && (
            <a
              href="/educa/assine"
              className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl flex-shrink-0"
              style={{
                background: 'var(--accent)',
                color: 'var(--accent-contrast)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
              }}
            >
              Assinar <ArrowRight className="w-3 h-3" />
            </a>
          )}
        </div>
      </section>

      {/* Progresso (XP, streak) */}
      <section
        className="rounded-3xl p-5"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-1)',
        }}
      >
        <p
          className="text-[10px] tracking-[0.2em] uppercase mb-3"
          style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
        >
          Progresso
        </p>

        <XpBar
          level={gami.level}
          xpInLevel={gami.xpInLevel}
          xpToNextLevel={gami.xpToNextLevel}
          percentInLevel={gami.percentInLevel}
          size="md"
          showLabels
        />

        <div className="grid grid-cols-3 gap-2 mt-4">
          <Stat
            icon={Sparkles}
            label="XP total"
            value={`${gami.totalXp}`}
          />
          <Stat
            icon={Flame}
            label="Sequência"
            value={`${gami.currentStreak}d`}
            highlight={gami.currentStreak > 0}
          />
          <Stat
            icon={Sparkles}
            label="Recorde"
            value={`${gami.longestStreak}d`}
          />
        </div>
      </section>

      {/* Sair */}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full rounded-2xl py-3 flex items-center justify-center gap-2 disabled:opacity-60"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-1)',
          color: 'var(--text-2)',
          fontFamily: 'var(--font-body)',
        }}
      >
        {signingOut ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <LogOut className="w-4 h-4" />
        )}
        <span className="text-sm">Sair</span>
      </button>
    </main>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ElementType
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className="rounded-2xl p-3 text-center"
      style={{
        background: 'var(--surface-inset)',
        border: '1px solid var(--border-1)',
      }}
    >
      <Icon
        className="w-4 h-4 mx-auto mb-1"
        style={{ color: highlight ? 'var(--accent)' : 'var(--text-3)' }}
      />
      <p
        className="text-sm font-medium"
        style={{ color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}
      >
        {value}
      </p>
      <p
        className="text-[10px] tracking-wide uppercase mt-0.5"
        style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
      >
        {label}
      </p>
    </div>
  )
}
