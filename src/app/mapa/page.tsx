'use client'

import { useAuth } from '@/contexts/AuthContext'
import KnowledgeMap from '@/components/dashboard/KnowledgeMap'
import StudyStreak from '@/components/dashboard/StudyStreak'
import MapaHero from '@/components/dashboard/mapa/MapaHero'
import ContinueStudying from '@/components/dashboard/mapa/ContinueStudying'
import AchievementsGrid from '@/components/dashboard/mapa/AchievementsGrid'
import JourneyHero from '@/components/gamification/JourneyHero'
import DailyMissionCard from '@/components/gamification/DailyMissionCard'
import StreakFlames from '@/components/gamification/StreakFlames'
import CodexShowcase from '@/components/colecao/CodexShowcase'

export default function MapaPage() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col min-h-screen relative pb-16">
      <div className="bg-glow" />

      <MapaHero />

      <main className="relative z-10 flex-1 px-4">
        <div className="md:max-w-6xl md:mx-auto md:px-2">
          {/* Jornada — full width em ambos os breakpoints, peça central */}
          <div className="mb-5 md:mb-6">
            <JourneyHero />
          </div>

          {/* Chamas dos últimos 7 dias */}
          <div
            className="rounded-2xl p-4 mb-5 md:mb-6 fade-in"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-1)',
              animationDelay: '0.15s',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[10px] uppercase tracking-[0.2em]"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)' }}
              >
                Últimos 7 dias
              </span>
            </div>
            <StreakFlames />
          </div>

          {/* Mobile: empilhado. Desktop: mapa à esquerda (8/12), rail direito (4/12). */}
          <div className="md:grid md:grid-cols-12 md:gap-6 md:items-start">
            {/* Mobile-only: missão + retomar antes do mapa */}
            <div className="md:hidden mb-5 space-y-3">
              <DailyMissionCard />
              <ContinueStudying userId={user?.id} />
            </div>

            {/* Coluna principal: mapa + conquistas + reliquário */}
            <div className="md:col-span-8 space-y-8 md:space-y-10">
              <KnowledgeMap userId={user?.id} />

              <AchievementsGrid userId={user?.id} />

              <CodexShowcase />
            </div>

            {/* Side rail desktop */}
            <aside className="hidden md:flex md:col-span-4 flex-col gap-4 md:sticky md:top-4">
              <DailyMissionCard />
              <ContinueStudying userId={user?.id} />
              <StudyStreak userId={user?.id} />
            </aside>

            {/* Mobile-only: streak depois */}
            <div className="md:hidden mt-2">
              <StudyStreak userId={user?.id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
