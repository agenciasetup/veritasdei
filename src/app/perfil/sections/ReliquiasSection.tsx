'use client'

import { Gem } from 'lucide-react'
import { SectionTitle } from './shared'
import ReliquiaShowcase from '@/components/gamification/ReliquiaShowcase'

export default function ReliquiasSection() {
  return (
    <div className="space-y-4">
      <SectionTitle icon={Gem} title="Reliquário" />
      <p
        className="text-sm mb-2"
        style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
      >
        Seus selos de fé. Cada um marca uma conquista na sua jornada de estudo,
        oração e comunhão. Toque numa relíquia desbloqueada para equipar —
        ela aparecerá ao lado do seu nome.
      </p>
      <ReliquiaShowcase />
    </div>
  )
}
