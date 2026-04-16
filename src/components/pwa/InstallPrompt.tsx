'use client'

/**
 * Prompt de instalação do PWA.
 *
 * Para Android / Chromium: escuta `beforeinstallprompt` e mostra um
 * banner discreto convidando o usuário a "Adicionar à tela inicial".
 *
 * Para iOS Safari: o sistema não dispara `beforeinstallprompt`, então
 * detectamos iOS + fora do standalone e delegamos para `IosInstallGuide`
 * (visual separado com instrução Compartilhar → Tela de Início).
 *
 * Regras de exibição:
 *  - Nunca mostra se já estamos em standalone (já instalado).
 *  - Nunca mostra em rotas públicas (login, onboarding, etc.).
 *  - Se o usuário fechar com "Agora não", guarda dismiss por 7 dias em
 *    localStorage e fica quieto.
 *  - Se o usuário instalar, esconde para sempre.
 */

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Download, X } from 'lucide-react'
import { isStandalone, isIos } from '@/lib/pwa/push'
import IosInstallGuide from './IosInstallGuide'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'veritasdei:install-dismissed-at'
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 dias

const HIDDEN_PATHS = [
  '/login',
  '/auth',
  '/onboarding',
  '/privacidade',
  '/termos',
  '/verbum',
]

function isRecentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    const when = Number(raw)
    if (!Number.isFinite(when)) return false
    return Date.now() - when < DISMISS_TTL_MS
  } catch {
    return false
  }
}

export default function InstallPrompt() {
  const pathname = usePathname()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [showIos, setShowIos] = useState(false)
  const [ready, setReady] = useState(false)

  const hidden = HIDDEN_PATHS.some(p => pathname?.startsWith(p))

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (hidden) return
    if (isStandalone()) return
    if (isRecentlyDismissed()) return

    setReady(true)

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    const onInstalled = () => {
      setVisible(false)
      setDeferred(null)
      try { localStorage.removeItem(DISMISS_KEY) } catch {}
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [hidden])

  // Fallback iOS: mostra um ponteiro depois de ~15s na primeira visita,
  // porque Safari nunca dispara beforeinstallprompt.
  useEffect(() => {
    if (!ready) return
    if (deferred) return
    if (!isIos()) return
    const t = window.setTimeout(() => setVisible(true), 15_000)
    return () => window.clearTimeout(t)
  }, [ready, deferred])

  function dismiss() {
    setVisible(false)
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch {}
  }

  async function install() {
    if (deferred) {
      await deferred.prompt()
      const choice = await deferred.userChoice
      if (choice.outcome === 'accepted') {
        setVisible(false)
        setDeferred(null)
      }
      return
    }
    if (isIos()) {
      setShowIos(true)
      return
    }
    dismiss()
  }

  if (hidden || !ready || !visible) {
    return showIos ? <IosInstallGuide onClose={() => setShowIos(false)} /> : null
  }

  return (
    <>
      <div
        className="fixed left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md"
        style={{
          bottom: 'calc(var(--bottom-nav-h, 72px) + 16px + env(safe-area-inset-bottom, 0px))',
        }}
        role="dialog"
        aria-label="Instalar Veritas Dei"
      >
        <div
          className="flex items-center gap-3 p-4 rounded-2xl shadow-lg backdrop-blur"
          style={{
            background: 'rgba(15,14,12,0.92)',
            border: '1px solid rgba(201,168,76,0.25)',
          }}
        >
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
              color: '#0F0E0C',
            }}
          >
            <Download className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-medium truncate"
              style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
            >
              Instalar Veritas Dei
            </p>
            <p
              className="text-[11px] truncate"
              style={{ color: '#A8A096', fontFamily: 'Poppins, sans-serif' }}
            >
              Receba lembretes e abra mais rápido
            </p>
          </div>
          <button
            type="button"
            onClick={install}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs"
            style={{
              background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
              color: '#0F0E0C',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
            }}
          >
            Instalar
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Fechar"
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.04)',
              color: '#7A7368',
            }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {showIos && <IosInstallGuide onClose={() => setShowIos(false)} />}
    </>
  )
}
