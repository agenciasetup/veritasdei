'use client'

import AuthGuard from '@/components/auth/AuthGuard'
import CodexShowcase from '@/components/colecao/CodexShowcase'

export default function CodexPage() {
  return (
    <AuthGuard>
      <main className="min-h-screen px-4 md:px-8 py-8 relative">
        <div className="bg-glow" />
        <div className="relative z-10 max-w-[1600px] mx-auto">
          <header className="mb-6">
            <h1
              className="text-2xl font-bold tracking-wider uppercase"
              style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
            >
              Coleção
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
            >
              Sua coleção de cartas. Cada estudo, cada constância, cada passo na
              fé revela uma nova face do mistério — e ninguém sabe qual carta
              vem até desbloqueá-la.
            </p>
          </header>
          <CodexShowcase />
        </div>
      </main>
    </AuthGuard>
  )
}
