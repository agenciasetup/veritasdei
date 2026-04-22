'use client'

import { useEffect, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import GracaPublicaCard from '@/components/comunhao/GracaPublicaCard'
import type { GracaPublica } from '@/types/comunhao'

export default function GracasFeed({ santoId }: { santoId?: string }) {
  const [gracas, setGracas] = useState<GracaPublica[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const qs = santoId ? `?santo_id=${encodeURIComponent(santoId)}` : ''
    fetch(`/api/gracas${qs}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(j => {
        if (!cancelled && j) setGracas(j.gracas ?? [])
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [santoId])

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'rgba(201,168,76,0.6)' }} />
      </div>
    )
  }

  if (gracas.length === 0) {
    return (
      <div
        className="text-center py-10 rounded-xl"
        style={{
          background: 'rgba(16,16,16,0.3)',
          border: '1px dashed rgba(242,237,228,0.1)',
          color: 'rgba(242,237,228,0.55)',
          fontFamily: 'Poppins, sans-serif',
          fontSize: '0.85rem',
        }}
      >
        <Sparkles className="w-6 h-6 mx-auto mb-2" style={{ color: 'rgba(201,168,76,0.4)' }} />
        Ainda não há testemunhos publicados. Você pode compartilhar a sua graça
        recebida em <em>Minhas Intenções</em>.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {gracas.map(g => (
        <GracaPublicaCard key={g.id} graca={g} />
      ))}
    </div>
  )
}
