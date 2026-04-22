'use client'

import { Gem } from 'lucide-react'
import { SectionTitle } from './shared'
import ReliquiaShowcase from '@/components/gamification/ReliquiaShowcase'

export default function ReliquiasSection() {
  return (
    <div className="space-y-4">
      <SectionTitle icon={Gem} title="Selos de Devoção" />
      <p
        className="text-sm"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
      >
        Seus selos de fé. Cada um marca uma etapa na sua jornada de estudo,
        oração e comunhão. Toque num selo desbloqueado para equipar —
        ele aparecerá ao lado do seu nome.
      </p>
      <p
        className="text-xs italic"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', opacity: 0.75 }}
      >
        Estes selos são marcadores simbólicos da sua jornada no app. Não se confundem
        com relíquias no sentido canônico (restos mortais ou objetos de santos, venerados
        pela Igreja em seus locais próprios).
      </p>
      <ReliquiaShowcase />
    </div>
  )
}
