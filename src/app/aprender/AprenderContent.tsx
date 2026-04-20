'use client'

import {
  GraduationCap, Map, Network, Church, Droplets, BookMarked,
  Library, Tablets, ScrollText, Scale, Heart, BookOpen,
  Gem, Flame, Calendar, Search,
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
 * Todos os tiles doutrinais agora apontam para `/estudo/[pilar]` —
 * rota canônica do StudyReader com deepdive + anotações + quiz.
 * As rotas antigas (`/dogmas`, etc.) continuam funcionando como
 * listagem simples, mas o hub promove a nova experiência.
 */
export default function AprenderContent() {
  const router = useRouter()

  function handleSearch(query: string) {
    router.push(`/buscar?q=${encodeURIComponent(query)}`)
  }

  return (
    <main className="min-h-screen pb-24">
      <HubHeader
        title="Formação"
        subtitle="Trilhas guiadas de doutrina, dogmas e doutores da Igreja"
      />

      <PullToRefresh onRefresh={() => router.refresh()}>
        <div className="mt-2 mb-6">
          <SearchPrompt onSubmit={handleSearch} showSuggestions />
        </div>

        <div className="px-4 max-w-2xl mx-auto">
          <HubGroup id="aprender-trilhas" label="Trilhas & Visual" icon={GraduationCap}>
            <HubTile
              href="/meu-estudo"
              icon={<Search className="w-6 h-6" />}
              title="Meu Estudo"
              subtitle="Nível, progresso por pilar e anotações"
              featured
            />
            <HubTile
              href="/estudo/trilhas"
              icon={<GraduationCap className="w-6 h-6" />}
              title="Trilhas de Estudo"
              subtitle="Roteiros guiados por tema"
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
              href="/estudo/dogmas"
              icon={<Church className="w-6 h-6" />}
              title="Dogmas"
              subtitle="As 44 verdades definidas da fé"
            />
            <HubTile
              href="/estudo/sacramentos"
              icon={<Droplets className="w-6 h-6" />}
              title="Sacramentos"
              subtitle="Os 7 sinais sensíveis da graça"
            />
            <HubTile
              href="/estudo/catecismo-pio-x"
              icon={<BookMarked className="w-6 h-6" />}
              title="Catecismo Pio X"
              subtitle="As 4 Partes: Fé, Oração, Sacramentos, Mandamentos"
            />
            <HubTile
              href="/estudo/sao-tomas"
              icon={<Library className="w-6 h-6" />}
              title="Suma Teológica"
              subtitle="As 4 Partes de São Tomás de Aquino"
            />
          </HubGroup>

          <HubGroup id="aprender-referencia" label="Moral e Vida Cristã" icon={ScrollText}>
            <HubTile
              href="/estudo/mandamentos"
              icon={<Tablets className="w-6 h-6" />}
              title="Mandamentos"
              subtitle="Os 10 mandamentos e sua vivência"
            />
            <HubTile
              href="/estudo/preceitos"
              icon={<ScrollText className="w-6 h-6" />}
              title="Preceitos da Igreja"
              subtitle="Os 5 preceitos da vida cristã"
            />
            <HubTile
              href="/estudo/virtudes-pecados"
              icon={<Scale className="w-6 h-6" />}
              title="Virtudes e Pecados"
              subtitle="Teologais, cardeais e os 7 capitais"
            />
            <HubTile
              href="/estudo/obras-misericordia"
              icon={<Heart className="w-6 h-6" />}
              title="Obras de Misericórdia"
              subtitle="7 corporais e 7 espirituais"
            />
            <HubTile
              href="/estudo/exame-consciencia"
              icon={<BookOpen className="w-6 h-6" />}
              title="Exame de Consciência"
              subtitle="Prática diária e preparação para a Confissão"
            />
          </HubGroup>

          <HubGroup id="aprender-oracao" label="Oração e Devoções" icon={Flame}>
            <HubTile
              href="/estudo/oracoes"
              icon={<BookOpen className="w-6 h-6" />}
              title="Orações"
              subtitle="Essenciais, dia a dia, Missa, ocasiões"
            />
            <HubTile
              href="/estudo/rosario"
              icon={<Gem className="w-6 h-6" />}
              title="Rosário"
              subtitle="20 mistérios meditados"
            />
            <HubTile
              href="/estudo/novenas"
              icon={<Flame className="w-6 h-6" />}
              title="Novenas"
              subtitle="Aparecida, São José, Sagrado Coração e mais"
            />
            <HubTile
              href="/estudo/liturgia-calendario"
              icon={<Calendar className="w-6 h-6" />}
              title="Liturgia e Calendário"
              subtitle="Santo do dia e Evangelho comentado"
            />
          </HubGroup>
        </div>
      </PullToRefresh>
    </main>
  )
}
