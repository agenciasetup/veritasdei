'use client'

import {
  GraduationCap, Map, Network, Church, Droplets, BookMarked,
  Library, Tablets, ScrollText, Scale, Heart,
} from 'lucide-react'
import HubHeader from '@/components/hubs/HubHeader'
import HubTile from '@/components/hubs/HubTile'
import HubGroup from '@/components/hubs/HubGroup'
import SearchPrompt from '@/components/search/SearchPrompt'
import { useRouter } from 'next/navigation'
import PullToRefresh from '@/components/mobile/PullToRefresh'

/**
 * Hub de aprendizado.
 *
 * Layout enxuto (iOS/Claude-like):
 *   1. Cabeçalho grande "Aprender"
 *   2. Prompt de busca conversacional (lidera a intenção do usuário)
 *   3. Três grupos colapsáveis: Trilhas, Doutrina, Referência
 *
 * Deliberadamente SEM "recentemente acessado", ProgressOverview ou chips
 * de ice-breaker isolados — a intenção principal ("pesquisar/aprender")
 * centraliza tudo no input, e os blocos abaixo são só para navegação direta.
 */
export default function AprenderContent() {
  const router = useRouter()

  function handleSearch(query: string) {
    router.push(`/buscar?q=${encodeURIComponent(query)}`)
  }

  return (
    <main className="min-h-screen pb-24">
      <HubHeader
        title="Aprender"
        subtitle="Trilhas de estudo, dogmas e doutores da Igreja"
      />

      <PullToRefresh onRefresh={() => router.refresh()}>
        <div className="mt-2 mb-6">
          <SearchPrompt onSubmit={handleSearch} showSuggestions />
        </div>

        <div className="px-4 max-w-2xl mx-auto">
          <HubGroup id="aprender-trilhas" label="Trilhas & Visual" icon={GraduationCap}>
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
          </HubGroup>

          <HubGroup id="aprender-doutrina" label="Doutrina" icon={Church}>
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
          </HubGroup>

          <HubGroup id="aprender-referencia" label="Referência" icon={ScrollText}>
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
          </HubGroup>
        </div>
      </PullToRefresh>
    </main>
  )
}
