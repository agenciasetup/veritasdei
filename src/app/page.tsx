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
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }}
        />
      </div>
    )
  }

  return (
    <main
      id="main-content"
      className="flex flex-col min-h-screen relative pb-24"
      role="main"
    >
      <div className="bg-glow" />

      <HojeHeader />

      <LiturgiaHojeCard />

      <PropositosStrip />

      <AtalhosRapidos />

      <ContinueLearning userId={user?.id} />

      <LembretesCard />

      <footer className="relative z-10 py-8 text-center mt-auto">
        <div className="flex items-center justify-center gap-3 mb-3 max-w-[200px] mx-auto">
          <span className="flex-1 h-px bg-gradient-to-r from-transparent to-[rgba(201,168,76,0.15)]" />
          <span style={{ color: '#C9A84C', opacity: 0.4, fontSize: '0.6rem' }}>✦</span>
          <span className="flex-1 h-px bg-gradient-to-l from-transparent to-[rgba(201,168,76,0.15)]" />
        </div>
        <p
          className="text-xs tracking-wider"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif', letterSpacing: '0.1em' }}
        >
          Veritas Dei — Fiel ao Magistério
        </p>
      </footer>
    </main>
  )
}
