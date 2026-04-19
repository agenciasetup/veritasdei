'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

import LandingPage from '@/components/landing/LandingPage'
import HojeHeader from '@/components/dashboard/today/HojeHeader'
import LiturgiaHojeCard from '@/components/dashboard/today/LiturgiaHojeCard'
import PropositosStrip from '@/components/dashboard/today/PropositosStrip'
import AtalhosRapidos from '@/components/dashboard/today/AtalhosRapidos'
import LembretesCard from '@/components/dashboard/today/LembretesCard'
import ContinueLearning from '@/components/dashboard/ContinueLearning'
import PullToRefresh from '@/components/mobile/PullToRefresh'
import FloatingActionButton from '@/components/mobile/FloatingActionButton'
import { Cross, BookOpen, Heart } from 'lucide-react'
import {
  SkeletonAvatar,
  SkeletonCard,
  SkeletonText,
} from '@/components/mobile/Skeleton'

/**
 * Home "Hoje" — perfil pessoal diário do católico.
 *
 * Ordem deliberada (mobile-first):
 *   1. Header (avatar + saudação + busca + sino)
 *   2. Card de Liturgia do dia
 *   3. Strip de propósitos (rezar o terço, confissão, missa)
 *   4. Atalhos rápidos (Terço · Orações · Paróquia)
 *   5. Retomar (última trilha/estudo visto)
 *   6. Lembretes (confissão, sexta-feira, terço do dia)
 *
 * A antiga FeatureGrid com 15 botões foi removida — o conteúdo
 * foi distribuído nos hubs /orar, /liturgia, /aprender.
 */
export default function Home() {
  const { isAuthenticated, isLoading: authLoading, profile, user } = useAuth()
  const router = useRouter()

  // ── Auth guards ──
  if (!authLoading && !isAuthenticated) {
    return <LandingPage />
  }

  if (!authLoading && isAuthenticated && profile && !profile.onboarding_completed) {
    router.push('/onboarding')
    return null
  }

  if (authLoading) {
    return (
      <main className="flex flex-col min-h-screen relative pb-24">
        <header className="flex items-center justify-between px-5 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <SkeletonAvatar size={44} />
            <div>
              <SkeletonText width={70} height={10} />
              <div className="mt-2">
                <SkeletonText width={120} height={16} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <SkeletonAvatar size={40} />
            <SkeletonAvatar size={40} />
          </div>
        </header>
        <div className="px-4 mb-3">
          <SkeletonCard height={140} rounded={24} />
        </div>
        <div className="px-4 flex gap-3 overflow-hidden mb-4">
          <SkeletonCard className="flex-shrink-0" height={170} rounded={20} style={{ width: 224 }} />
          <SkeletonCard className="flex-shrink-0" height={170} rounded={20} style={{ width: 224 }} />
        </div>
        <div className="px-5 flex justify-around mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonAvatar key={i} size={64} />
          ))}
        </div>
      </main>
    )
  }

  return (
    <main
      className="flex flex-col min-h-screen relative pb-24"
      role="main"
    >
      <div className="bg-glow" />

      <PullToRefresh onRefresh={() => router.refresh()}>
        {/* Mobile: stack vertical (default).
            Desktop: container max-w + 2-col dashboard layout.
            mx-auto + max-w-6xl impede o efeito de "mobile esticado". */}
        <div className="md:max-w-6xl md:mx-auto md:px-6 md:pt-3">
          <HojeHeader />

          <LiturgiaHojeCard />

          <div className="md:grid md:grid-cols-12 md:gap-6">
            {/* Coluna principal */}
            <div className="md:col-span-8 flex flex-col">
              <PropositosStrip />
              <LembretesCard />
            </div>

            {/* Side rail (atalhos + continuar) */}
            <aside className="md:col-span-4 flex flex-col">
              <AtalhosRapidos />
              <ContinueLearning userId={user?.id} />
            </aside>
          </div>
        </div>
      </PullToRefresh>

      <footer className="relative z-10 py-4 text-center mt-auto">
        <div className="flex items-center justify-center gap-3 mb-2 max-w-[180px] mx-auto">
          <span className="flex-1 h-px bg-gradient-to-r from-transparent to-[rgba(201,168,76,0.15)]" />
          <span style={{ color: 'var(--gold)', opacity: 0.4, fontSize: '0.7rem' }}>✦</span>
          <span className="flex-1 h-px bg-gradient-to-l from-transparent to-[rgba(201,168,76,0.15)]" />
        </div>
        <p
          className="text-[11px] tracking-[0.1em]"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
        >
          Veritas Dei — Fiel ao Magistério
        </p>
      </footer>

      <FloatingActionButton
        label="Orar agora"
        actions={[
          {
            icon: <Cross className="w-5 h-5" />,
            label: 'Rosário',
            onPress: () => router.push('/rosario'),
          },
          {
            icon: <BookOpen className="w-5 h-5" />,
            label: 'Leituras do dia',
            onPress: () => router.push('/liturgia/hoje'),
          },
          {
            icon: <Heart className="w-5 h-5" />,
            label: 'Orações',
            onPress: () => router.push('/oracoes'),
          },
        ]}
      />
    </main>
  )
}
