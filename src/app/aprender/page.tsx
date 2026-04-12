'use client'

import {
  GraduationCap, Map, Network, Church, Droplets, BookMarked,
  Library, Tablets, ScrollText, Scale, Heart,
} from 'lucide-react'
import HubHeader from '@/components/hubs/HubHeader'
import HubTile from '@/components/hubs/HubTile'
import AuthGuard from '@/components/auth/AuthGuard'
import { useAuth } from '@/contexts/AuthContext'
import IceBreakers from '@/components/dashboard/IceBreakers'
import ProgressOverview from '@/components/dashboard/ProgressOverview'
import { useRouter } from 'next/navigation'

/**
 * Hub de Aprendizado.
 *
 * Público-alvo: 10% dos usuários que querem formação. O conteúdo pago
 * (plano mensal) entra na Fase 3 — aqui só existe a arquitetura.
 *
 * Inclui IceBreakers e ProgressOverview que antes poluíam a home.
 */
export default function AprenderPage() {
  const { user } = useAuth()
  const router = useRouter()

  function handleIceBreaker(query: string) {
    router.push(`/buscar?q=${encodeURIComponent(query)}`)
  }

  return (
    <AuthGuard>
      <main className="min-h-screen pb-24">
        <HubHeader
          title="Aprender"
          subtitle="Trilhas de estudo, dogmas e doutores da Igreja"
        />

        {/* Perguntas quebra-gelo para começar a estudar */}
        <div className="max-w-2xl mx-auto">
          <IceBreakers onSelect={handleIceBreaker} />
        </div>

        {/* Progresso — só se o usuário já começou algo */}
        <div className="max-w-2xl mx-auto">
          <ProgressOverview userId={user?.id} />
        </div>

        {/* Tiles dos caminhos de estudo */}
        <div className="px-4 flex flex-col gap-3 max-w-2xl mx-auto mt-4">
          <HubTile
            href="/trilhas"
            icon={<GraduationCap className="w-6 h-6" />}
            title="Trilhas de Estudo"
            subtitle="Roteiros guiados por tema"
            featured
          />
          <HubTile
            href="/mapa"
            icon={<Map className="w-6 h-6" />}
            title="Mapa da Fé"
            subtitle="Visão geral visual dos ensinamentos"
          />
          <HubTile
            href="/verbum"
            icon={<Network className="w-6 h-6" />}
            title="Verbum"
            subtitle="Explore conexões entre conceitos"
          />
          <HubTile
            href="/dogmas"
            icon={<Church className="w-6 h-6" />}
            title="Dogmas"
            subtitle="As verdades definidas da fé"
          />
          <HubTile
            href="/sacramentos"
            icon={<Droplets className="w-6 h-6" />}
            title="Sacramentos"
            subtitle="Os 7 sinais sensíveis da graça"
          />
          <HubTile
            href="/catecismo-pio-x"
            icon={<BookMarked className="w-6 h-6" />}
            title="Catecismo Pio X"
            subtitle="Ensinamento claro e conciso"
          />
          <HubTile
            href="/sao-tomas"
            icon={<Library className="w-6 h-6" />}
            title="São Tomás de Aquino"
            subtitle="Suma Teológica e doutrina"
          />
          <HubTile
            href="/mandamentos"
            icon={<Tablets className="w-6 h-6" />}
            title="Mandamentos"
            subtitle="A Lei de Deus"
          />
          <HubTile
            href="/preceitos"
            icon={<ScrollText className="w-6 h-6" />}
            title="Preceitos da Igreja"
            subtitle="Os 5 preceitos da vida cristã"
          />
          <HubTile
            href="/virtudes-pecados"
            icon={<Scale className="w-6 h-6" />}
            title="Virtudes e Pecados"
            subtitle="O que edifica e o que destrói"
          />
          <HubTile
            href="/obras-misericordia"
            icon={<Heart className="w-6 h-6" />}
            title="Obras de Misericórdia"
            subtitle="Corporais e espirituais"
          />
        </div>
      </main>
    </AuthGuard>
  )
}
