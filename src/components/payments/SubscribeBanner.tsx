'use client'

/**
 * SubscribeBanner — banner fixo (não-modal) que convida o usuário logado
 * não-premium a assinar. Aparece no topo do conteúdo (não no header) e
 * pode ser dispensado pelo usuário; lembramos via localStorage por 14 dias.
 *
 * Exibe um produto por vez:
 *   - dentro do `/educa`: convida pro Veritas Educa (/educa/assine).
 *   - fora: convida pro Veritas Dei Premium (/planos).
 *
 * Não aparece quando:
 *   - usuário não está logado;
 *   - entitlement ainda carregando (evita pisca);
 *   - usuário já é premium;
 *   - usuário dispensou nos últimos 14 dias.
 */

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/contexts/SubscriptionContext'

const DISMISS_KEY = 'subscribe-banner-dismissed-at'
const DISMISS_WINDOW_MS = 14 * 24 * 60 * 60 * 1000 // 14 dias

// Pequeno event bus em memória pra notificar componentes do mesmo tab
// quando o usuário dispensar (eventos `storage` do DOM só disparam em
// outras abas, não na própria).
const dismissBus = new EventTarget()

function readDismissed(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY)
    const ts = raw ? Number(raw) : 0
    return !!ts && Date.now() - ts < DISMISS_WINDOW_MS
  } catch {
    return false
  }
}

function subscribeDismissed(cb: () => void) {
  const handler = () => cb()
  dismissBus.addEventListener('change', handler)
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handler)
  }
  return () => {
    dismissBus.removeEventListener('change', handler)
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handler)
    }
  }
}

export default function SubscribeBanner() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const { isPremium, loading: subLoading } = useSubscription()
  const dismissed = useSyncExternalStore(
    subscribeDismissed,
    readDismissed,
    () => true, // SSR: assume dismissed para não renderizar
  )

  if (!isAuthenticated || subLoading || isPremium || dismissed) return null
  if (pathname.startsWith('/planos') || pathname.startsWith('/educa/assine')) {
    return null
  }
  if (pathname.startsWith('/checkout/') || pathname.startsWith('/admin')) {
    return null
  }

  const isEduca = pathname.startsWith('/educa')
  const href = isEduca ? '/educa/assine' : '/planos'
  const title = isEduca
    ? 'Assine o Veritas Educa'
    : 'Desbloqueie o Veritas Dei Premium'
  const subtitle = isEduca
    ? 'Trilhas, quizzes e IA católica — R$ 19,90/mês.'
    : 'Trilhas, modo debate e biblioteca completa.'

  function handleDismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // localStorage indisponível: dispensar só na sessão atual.
    }
    dismissBus.dispatchEvent(new Event('change'))
  }

  return (
    <div
      className="mx-auto max-w-3xl mt-3 mx-3 md:mx-auto rounded-2xl flex items-center gap-3 px-4 py-3"
      role="status"
      style={{
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--accent) 18%, transparent), color-mix(in srgb, var(--accent) 8%, transparent))',
        border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: 'color-mix(in srgb, var(--accent) 25%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)',
        }}
      >
        <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium leading-tight"
          style={{
            color: 'var(--text-1)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {title}
        </p>
        <p
          className="text-[11px] mt-0.5"
          style={{
            color: 'var(--text-2)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {subtitle}
        </p>
      </div>
      <Link
        href={href}
        className="text-xs px-3 py-2 rounded-lg whitespace-nowrap font-medium"
        style={{
          background: 'var(--accent)',
          color: 'var(--accent-contrast, #0F0E0C)',
          fontFamily: 'var(--font-body)',
        }}
      >
        Assinar
      </Link>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dispensar"
        className="flex-shrink-0 p-1 rounded-md"
        style={{ color: 'var(--text-3)' }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
