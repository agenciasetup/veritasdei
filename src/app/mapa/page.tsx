'use client'

import { useAuth } from '@/contexts/AuthContext'
import KnowledgeMap from '@/components/dashboard/KnowledgeMap'
import StudyStreak from '@/components/dashboard/StudyStreak'
import MapaHero from '@/components/dashboard/mapa/MapaHero'
import ContinueStudying from '@/components/dashboard/mapa/ContinueStudying'
import XpCard from '@/components/dashboard/mapa/XpCard'
import AchievementsGrid from '@/components/dashboard/mapa/AchievementsGrid'

export default function MapaPage() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col min-h-screen relative pb-16">
      <div className="bg-glow" />

      <MapaHero />

      <main className="relative z-10 flex-1 px-4">
        <div className="md:max-w-6xl md:mx-auto md:px-2">
          {/* Mobile: empilhado. Desktop: mapa à esquerda (8/12), rail direito (4/12). */}
          <div className="md:grid md:grid-cols-12 md:gap-6 md:items-start">
            {/* Mobile-only: retomar + XP antes do mapa */}
            <div className="md:hidden mb-5 space-y-3">
              <ContinueStudying userId={user?.id} />
              <XpCard userId={user?.id} />
            </div>

            {/* Coluna principal: mapa */}
            <div className="md:col-span-8">
              <KnowledgeMap userId={user?.id} />

              {/* Conquistas — abaixo do mapa em ambos os breakpoints */}
              <div className="mt-8 md:mt-10">
                <AchievementsGrid userId={user?.id} />
              </div>
            </div>

            {/* Side rail desktop */}
            <aside className="hidden md:flex md:col-span-4 flex-col gap-4 md:sticky md:top-4">
              <ContinueStudying userId={user?.id} />
              <XpCard userId={user?.id} />
              <div>
                <StudyStreak userId={user?.id} />
              </div>
            </aside>

            {/* Mobile-only: streak depois do mapa */}
            <div className="md:hidden mt-2">
              <StudyStreak userId={user?.id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
