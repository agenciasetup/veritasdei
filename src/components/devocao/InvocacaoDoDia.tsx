'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import type { SantoResumo } from '@/types/santo'
import { getFamiliaMeta } from '@/lib/santos/familia-religiosa'

/**
 * Banner discreto com a invocação do santo de devoção — 1 linha.
 * Aparece em /rezar quando user tem santo e nenhum banner mais forte
 * está ativo (festa do dia tem prioridade).
 *
 * Acento visual herda da família religiosa do santo (ver
 * docs/copy-catolica.md e lib/santos/familia-religiosa.ts).
 */
export default function InvocacaoDoDia({ hideWhenFesta = false }: { hideWhenFesta?: boolean }) {
  const { profile } = useAuth()
  const [santo, setSanto] = useState<(SantoResumo & { familia_religiosa: string | null }) | null>(null)
  const [hojeEhFesta, setHojeEhFesta] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.santo_devocao_id) {
      setLoading(false)
      return
    }
    let cancelled = false
    const supabase = createClient()
    if (!supabase) { setLoading(false); return }
    void (async () => {
      const { data } = await supabase
        .from('santos')
        .select('id, slug, nome, invocacao, patronatos, imagem_url, popularidade_rank, festa_texto, tipo_culto, familia_religiosa')
        .eq('id', profile.santo_devocao_id!)
        .maybeSingle()
      if (!cancelled && data) setSanto(data as SantoResumo & { familia_religiosa: string | null })
      if (!cancelled) setLoading(false)
    })()

    if (hideWhenFesta) {
      fetch('/api/santos/festa-hoje', { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null)
        .then(j => { if (!cancelled && j?.info?.ehHoje) setHojeEhFesta(true) })
        .catch(() => {})
    }

    return () => { cancelled = true }
  }, [profile?.santo_devocao_id, hideWhenFesta])

  if (loading || !santo || hojeEhFesta) return null

  const familia = getFamiliaMeta(santo.familia_religiosa)
  const invocacao = santo.invocacao ?? `${santo.nome}, rogai por nós`
  const acento = familia?.acento ?? '#C9A84C'
  const acentoSoft = familia?.acentoSoft ?? 'rgba(201,168,76,0.15)'

  return (
    <Link
      href={`/santos/${santo.slug}`}
      className="flex items-center gap-3 px-4 py-3 rounded-xl active:scale-[0.99] transition-transform"
      style={{
        background: acentoSoft,
        border: `1px solid ${acento}40`,
        textDecoration: 'none',
      }}
    >
      <Heart className="w-3.5 h-3.5 flex-shrink-0" style={{ color: acento }} fill={acento} />
      <span
        className="flex-1 truncate italic"
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          color: '#F2EDE4',
          fontSize: '0.92rem',
          letterSpacing: '0.01em',
        }}
      >
        «{invocacao}»
      </span>
    </Link>
  )
}
