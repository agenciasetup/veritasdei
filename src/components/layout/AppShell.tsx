'use client'

import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import LiturgicalBar from './LiturgicalBar'
import AppHeader from './AppHeader'
import { PropositosProvider } from '@/contexts/PropositosContext'
import { PropositoSheetProvider } from '@/components/propositos/PropositoSheet'
import { SubscriptionProvider } from '@/contexts/SubscriptionContext'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import PageTransition from '@/components/mobile/PageTransition'
import OfflineBanner from '@/components/mobile/OfflineBanner'
import dynamic from 'next/dynamic'

// CoachMarks só aparece na primeira sessão pós-onboarding (flag em
// localStorage). Lazy-load para não pesar o bundle inicial.
const CoachMarks = dynamic(() => import('@/components/onboarding/CoachMarks'), {
  ssr: false,
})

// NovidadesModal aparece uma vez por versão (flag veritas-last-seen-version).
const NovidadesModal = dynamic(() => import('@/components/NovidadesModal'), {
  ssr: false,
})

// Modal de check-in de propósitos — pergunta sobre os pendentes do período
// na primeira abertura do dia.
const PropositoCheckInGate = dynamic(
  () => import('@/components/propositos/PropositoCheckInGate'),
  { ssr: false },
)

// LegalGate — grava silenciosamente o aceite dos documentos legais pós-login,
// ou força re-aceite quando a versão de Termos/Privacidade/Diretrizes mudar.
const LegalGate = dynamic(
  () => import('@/components/legal/LegalGate').then((m) => m.LegalGate),
  { ssr: false },
)

const PUBLIC_PATHS = ['/login', '/auth', '/privacidade', '/termos', '/diretrizes', '/cookies', '/dmca', '/consentimento-parental', '/onboarding']
const FULLSCREEN_PATHS = ['/verbum', '/rosario', '/liturgia/hoje']
const FULLSCREEN_EXACT: string[] = []

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()

  const isPublicPage = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const isFullscreen = FULLSCREEN_PATHS.some(p => pathname.startsWith(p)) || FULLSCREEN_EXACT.includes(pathname)
  const showChrome = isAuthenticated && !isPublicPage && !isFullscreen
  const hideLiturgicalBar = pathname.startsWith('/liturgia/hoje')

  return (
    <SubscriptionProvider>
      <PropositosProvider>
        <PropositoSheetProvider>
          {/* Offline indicator (mobile-friendly, fixed top) */}
          {showChrome && <OfflineBanner />}

          {/* Liturgical bar at the very top */}
          {showChrome && !hideLiturgicalBar && <LiturgicalBar />}

          {/* Mobile header (avatar + sino) — mobile only, sticky below LiturgicalBar */}
          {showChrome && (
            <div className="md:hidden">
              <AppHeader />
            </div>
          )}

          {/* Sidebar only on md+ screens */}
          {showChrome && (
            <div className="hidden md:block">
              <Sidebar />
            </div>
          )}
          <div id="main-content" className={`${showChrome ? 'md:ml-16 pb-bottom-nav' : ''}`}>
            {showChrome ? <PageTransition>{children}</PageTransition> : children}
          </div>
          {/* Bottom nav only on mobile */}
          {showChrome && <BottomNav />}
          {/* Install PWA prompt (Android + iOS fallback) */}
          {showChrome && <InstallPrompt />}
          {/* CoachMarks — só primeira sessão pós-onboarding */}
          {showChrome && <CoachMarks />}
          {/* NovidadesModal — uma vez por versão */}
          {showChrome && <NovidadesModal />}
          {/* Check-in de propósitos — pergunta uma vez por dia */}
          {showChrome && <PropositoCheckInGate />}
          {/* Aceite legal silencioso / re-aceite quando mudar versão */}
          {isAuthenticated && <LegalGate />}
        </PropositoSheetProvider>
      </PropositosProvider>
    </SubscriptionProvider>
  )
}
