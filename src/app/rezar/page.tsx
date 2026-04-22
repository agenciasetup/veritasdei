'use client'

import { useRouter } from 'next/navigation'
import { Cross, BookOpen, ClipboardCheck, Clock, CalendarHeart } from 'lucide-react'
import HubHeader from '@/components/hubs/HubHeader'
import HubTile from '@/components/hubs/HubTile'
import AuthGuard from '@/components/auth/AuthGuard'
import PullToRefresh from '@/components/mobile/PullToRefresh'
import LiturgiaHojeCard from '@/components/dashboard/today/LiturgiaHojeCard'
import PropositosBoard from '@/components/propositos/PropositosBoard'
import FestaDoDiaBanner from '@/components/devocao/FestaDoDiaBanner'
import NovenaCard from '@/components/devocao/NovenaCard'

/**
 * `/rezar` — hub canônico de oração.
 *
 * Inclui no topo o widget de Liturgia do dia (migrado da antiga Home
 * "Hoje") para dar contexto litúrgico antes dos atalhos de oração.
 */
export default function RezarPage() {
  const router = useRouter()
  return (
    <AuthGuard>
      <main className="min-h-screen pb-24">
        <HubHeader
          title="Rezar"
          subtitle="Sua casa de oração — propósitos, liturgia e devoções"
        />

        <PullToRefresh onRefresh={() => router.refresh()}>
          <div className="px-4 flex flex-col gap-5 max-w-2xl mx-auto stagger-in">
            {/* Festa do santo de devoção — visível apenas no dia */}
            <FestaDoDiaBanner />

            {/* Novena em curso — visível apenas quando há novena ativa */}
            <NovenaCard />

            {/* Liturgia do dia — contexto antes dos propósitos */}
            <LiturgiaHojeCard />

            {/* Propósitos — coração da home */}
            <PropositosBoard />

            <div className="flex flex-col gap-3">
              <HubTile
                href="/rosario"
                icon={<Cross className="w-6 h-6" />}
                title="Santo Rosário"
                subtitle="Reze os mistérios do dia"
                featured
              />
              <HubTile
                href="/novenas"
                icon={<CalendarHeart className="w-6 h-6" />}
                title="Novenas"
                subtitle="9 dias de oração com fé e devoção"
              />
              <HubTile
                href="/oracoes"
                icon={<BookOpen className="w-6 h-6" />}
                title="Orações"
                subtitle="Dia a dia, Missa, Essenciais e Ocasiões"
              />
              <HubTile
                href="/exame-consciencia"
                icon={<ClipboardCheck className="w-6 h-6" />}
                title="Exame de Consciência"
                subtitle="Prepare-se para a confissão"
              />

              {/* Placeholder — liturgia das horas chega na Fase 2/3 */}
              <div
                aria-disabled="true"
                className="flex items-center gap-4 p-4 rounded-2xl opacity-60"
                style={{
                  background: 'var(--surface-inset)',
                  border: '1px dashed var(--border-1)',
                  minHeight: '76px',
                }}
              >
                <div
                  className="flex items-center justify-center rounded-xl flex-shrink-0 animate-pulse"
                  style={{
                    width: '52px',
                    height: '52px',
                    background: 'var(--surface-3)',
                    color: 'var(--text-3)',
                    animationDuration: '2.5s',
                  }}
                >
                  <Clock className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-base font-medium"
                    style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
                  >
                    Liturgia das Horas
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
                  >
                    Em breve
                  </p>
                </div>
              </div>
            </div>
          </div>
        </PullToRefresh>
      </main>
    </AuthGuard>
  )
}
