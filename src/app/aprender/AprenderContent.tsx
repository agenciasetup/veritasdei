'use client'

import {
  GraduationCap, Map, Network, Church, Droplets, BookMarked,
  Library, Tablets, ScrollText, Scale, Heart, Clock, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import HubHeader from '@/components/hubs/HubHeader'
import HubTile from '@/components/hubs/HubTile'
import HubGroup from '@/components/hubs/HubGroup'
import { useAuth } from '@/contexts/AuthContext'
import IceBreakers from '@/components/dashboard/IceBreakers'
import ProgressOverview from '@/components/dashboard/ProgressOverview'
import { useRouter } from 'next/navigation'
import { useRecentRoutes } from '@/hooks/useRecentRoutes'

/**
 * Hub de aprendizado — agora organizado em 3 grupos colapsáveis:
 *  - Trilhas & Visual: experiências guiadas / mapas
 *  - Doutrina: verdades centrais (Dogmas, Sacramentos, Catecismo, Sto. Tomás)
 *  - Referência: listas práticas (Mandamentos, Preceitos, Virtudes, Misericórdia)
 *
 * Mostra também "Recentemente acessado" no topo, populado pela navegação.
 */
export default function AprenderContent() {
  const { user } = useAuth()
  const router = useRouter()
  const { recents } = useRecentRoutes()

  function handleIceBreaker(query: string) {
    router.push(`/buscar?q=${encodeURIComponent(query)}`)
  }

  return (
    <main className="min-h-screen pb-24">
      <HubHeader
        title="Aprender"
        subtitle="Trilhas de estudo, dogmas e doutores da Igreja"
      />

      <div className="max-w-2xl mx-auto">
        <IceBreakers onSelect={handleIceBreaker} />
      </div>

      <div className="max-w-2xl mx-auto">
        <ProgressOverview userId={user?.id} />
      </div>

      <div className="px-4 max-w-2xl mx-auto mt-4">
        {/* Recentemente acessado */}
        {recents.length > 0 && (
          <section className="mb-4">
            <div className="flex items-center gap-2 px-1 py-2">
              <Clock className="w-3.5 h-3.5" style={{ color: 'var(--gold)' }} />
              <h2
                className="text-xs uppercase tracking-[0.18em]"
                style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
              >
                Recentemente acessado
              </h2>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
              {recents.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="flex-shrink-0 px-3 py-2 rounded-xl text-xs whitespace-nowrap active:scale-95 transition-transform"
                  style={{
                    background: 'rgba(201,168,76,0.06)',
                    border: '1px solid rgba(201,168,76,0.15)',
                    color: 'var(--gold)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {r.label}
                  <ChevronRight className="w-3 h-3 inline ml-1 -mr-0.5" />
                </Link>
              ))}
            </div>
          </section>
        )}

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
    </main>
  )
}
