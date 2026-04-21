'use client'

import { useRouter } from 'next/navigation'
import {
  Search,
  BookOpen,
  Calendar,
  Cross,
  Scale,
  Heart,
  Shield,
  HandHeart,
  UserCheck,
} from 'lucide-react'
import HubHeader from '@/components/hubs/HubHeader'
import HubTile from '@/components/hubs/HubTile'
import AuthGuard from '@/components/auth/AuthGuard'
import PullToRefresh from '@/components/mobile/PullToRefresh'

/**
 * `/biblioteca` — hub de consulta gratuita. Agrega todo o material
 * de referência da fé católica que hoje estava disperso em rotas
 * diferentes (buscar, liturgia do dia, catecismo, dogmas, mandamentos,
 * preceitos, virtudes, obras de misericórdia, santos via calendário).
 *
 * Conteúdo gratuito — ≠ `/formacao`, que é trilhas pagas com
 * progressão e quizzes.
 */
export default function BibliotecaPage() {
  const router = useRouter()
  return (
    <AuthGuard>
      <main className="min-h-screen pb-24">
        <HubHeader
          title="Biblioteca"
          subtitle="Consulte a fé: Bíblia, catecismo, dogmas e respostas."
        />

        <PullToRefresh onRefresh={() => router.refresh()}>
          <div className="px-4 flex flex-col gap-3 max-w-2xl mx-auto stagger-in">
            <HubTile
              href="/buscar"
              icon={<Search className="w-6 h-6" />}
              title="Tirar dúvidas"
              subtitle="Busca assistida por IA — pergunte sobre a fé"
              featured
            />
            <HubTile
              href="/liturgia"
              icon={<BookOpen className="w-6 h-6" />}
              title="Leituras do dia"
              subtitle="Missa, salmos e evangelho comentado"
            />
            <HubTile
              href="/calendario"
              icon={<Calendar className="w-6 h-6" />}
              title="Calendário litúrgico"
              subtitle="Santos, solenidades e tempos litúrgicos"
            />
            <HubTile
              href="/catecismo-pio-x"
              icon={<Cross className="w-6 h-6" />}
              title="Catecismo de São Pio X"
              subtitle="Perguntas e respostas da doutrina"
            />
            <HubTile
              href="/estudo/mandamentos"
              icon={<Scale className="w-6 h-6" />}
              title="Dez Mandamentos"
              subtitle="A lei de Deus em detalhe"
            />
            <HubTile
              href="/estudo/preceitos"
              icon={<Shield className="w-6 h-6" />}
              title="Preceitos da Igreja"
              subtitle="Obrigações do fiel católico"
            />
            <HubTile
              href="/estudo/virtudes-pecados"
              icon={<Heart className="w-6 h-6" />}
              title="Virtudes e pecados"
              subtitle="Teologais, cardeais, capitais"
            />
            <HubTile
              href="/estudo/obras-misericordia"
              icon={<HandHeart className="w-6 h-6" />}
              title="Obras de Misericórdia"
              subtitle="Corporais e espirituais"
            />
            <HubTile
              href="/sao-tomas"
              icon={<UserCheck className="w-6 h-6" />}
              title="Doutores da Igreja"
              subtitle="Santo Tomás e outros mestres"
            />
          </div>
        </PullToRefresh>
      </main>
    </AuthGuard>
  )
}
