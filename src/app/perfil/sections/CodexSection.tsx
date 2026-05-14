'use client'

import { Sparkles } from 'lucide-react'
import { SectionTitle } from './shared'
import CodexShowcase from '@/components/colecao/CodexShowcase'

export default function CodexSection() {
  return (
    <div className="space-y-4">
      <SectionTitle icon={Sparkles} title="Coleção" />
      <p
        className="text-sm"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
      >
        Sua coleção de cartas colecionáveis. Cada personagem reúne variações
        que se revelam conforme você avança nos estudos, na oração e na
        comunhão. Toque num personagem para ver suas variações — as ainda não
        conquistadas permanecem seladas, em surpresa.
      </p>
      <CodexShowcase />
    </div>
  )
}
