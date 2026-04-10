'use client'

import { useAuth } from '@/contexts/AuthContext'
import KnowledgeMap from '@/components/dashboard/KnowledgeMap'

export default function MapaPage() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="bg-glow" />

      <section className="page-header relative z-10">
        <h1>Mapa do Conhecimento</h1>
        <p className="subtitle">
          Visualize sua jornada pela fé católica
        </p>
        <div className="ornament-divider max-w-sm mx-auto mt-4">
          <span>&#10022;</span>
        </div>
      </section>

      <main className="relative z-10 flex-1 pb-16 px-4">
        <KnowledgeMap userId={user?.id} />
      </main>
    </div>
  )
}
