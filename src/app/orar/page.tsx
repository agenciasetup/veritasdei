'use client'

import { useRouter } from 'next/navigation'
import { Cross, BookOpen, ClipboardCheck, Clock, CalendarHeart } from 'lucide-react'
import HubHeader from '@/components/hubs/HubHeader'
import HubTile from '@/components/hubs/HubTile'
import AuthGuard from '@/components/auth/AuthGuard'
import PullToRefresh from '@/components/mobile/PullToRefresh'

/**
 * Hub de Oração — tela simples com os 4 blocos essenciais do leigo.
 *
 * Liturgia das Horas ainda não existe como feature, mas já aparece
 * como placeholder "em breve" para sinalizar o roteiro.
 */
export default function OrarPage() {
  const router = useRouter()
  return (
    <AuthGuard>
      <main className="min-h-screen pb-24">
        <HubHeader
          title="Rezar"
          subtitle="Momentos de oração para fortalecer sua fé"
        />

        <PullToRefresh onRefresh={() => router.refresh()}>
          <div className="px-4 flex flex-col gap-3 max-w-2xl mx-auto stagger-in">
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
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed rgba(201,168,76,0.15)',
                minHeight: '76px',
              }}
            >
              <div
                className="flex items-center justify-center rounded-xl flex-shrink-0 animate-pulse"
                style={{
                  width: '52px',
                  height: '52px',
                  background: 'rgba(201,168,76,0.04)',
                  color: 'var(--text-muted)',
                  animationDuration: '2.5s',
                }}
              >
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-base font-medium"
                  style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
                >
                  Liturgia das Horas
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: '#5A5348', fontFamily: 'Poppins, sans-serif' }}
                >
                  Em breve
                </p>
              </div>
            </div>
          </div>
        </PullToRefresh>
      </main>
    </AuthGuard>
  )
}
