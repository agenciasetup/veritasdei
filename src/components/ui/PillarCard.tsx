'use client'

import type { Pillar, SearchResult } from '@/types'

const PILLAR_CONFIG: Record<Pillar, { icon: string; title: string; subtitle: string }> = {
  biblia: {
    icon: '\u{1F4D6}',
    title: 'Bíblia Católica',
    subtitle: 'Escritura Sagrada',
  },
  magisterio: {
    icon: '\u{1F4DC}',
    title: 'Catecismo e Magistério',
    subtitle: 'Ensinamento da Igreja',
  },
  patristica: {
    icon: '\u{1F3DB}\uFE0F',
    title: 'Patrística',
    subtitle: 'Padres e Doutores',
  },
}

interface PillarCardProps {
  pillar: Pillar
  results: SearchResult[]
  isLoading: boolean
}

function SkeletonBlock() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-5/6" />
    </div>
  )
}

export default function PillarCard({ pillar, results, isLoading }: PillarCardProps) {
  const config = PILLAR_CONFIG[pillar]

  return (
    <div className="rounded-xl border bg-white p-5" style={{ borderColor: '#E5E7EB' }}>
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl" role="img" aria-label={config.title}>
          {config.icon}
        </span>
        <div>
          <h2
            className="text-lg font-semibold"
            style={{ fontFamily: 'Crimson Pro, serif', color: '#5C2D0E' }}
          >
            {config.title}
          </h2>
          <p className="text-xs text-gray-500">{config.subtitle}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonBlock />
          <SkeletonBlock />
        </div>
      ) : results.length === 0 ? (
        <p className="text-sm text-gray-400 italic">
          Nenhuma fonte encontrada para este tema neste pilar.
        </p>
      ) : (
        <div className="space-y-4">
          {results.map((result) => (
            <div key={result.id} className="border-l-2 pl-3" style={{ borderColor: '#D4A96A' }}>
              <p
                className="text-sm font-medium mb-1"
                style={{ color: '#5C2D0E' }}
              >
                {result.reference}
              </p>
              <p
                className="text-sm leading-relaxed italic text-gray-700"
                style={{ fontFamily: 'Crimson Pro, serif' }}
              >
                {result.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
