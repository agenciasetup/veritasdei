'use client'

/**
 * DashboardCartasStrip — preview compacto da Coleção de cartas no grid da
 * dashboard. Mostra até 6 cartas desbloqueadas (raras primeiro), contador
 * "X/Y" e CTA pra /colecao. Substituiu a antiga faixa de selos.
 */

import Link from 'next/link'
import { useMemo } from 'react'
import { ArrowRight, Layers, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCodex } from '@/lib/colecao/useCodex'
import { RARIDADE_ORDEM, type CartaColecao } from '@/types/colecao'
import GlassCard from './GlassCard'
import CartaView from '@/components/colecao/CartaView'

const PREVIEW_COUNT = 6

export default function DashboardCartasStrip() {
  const { user } = useAuth()
  const { personagens, totalCartas, totalDesbloqueadas, loading } = useCodex(
    user?.id,
  )

  const preview = useMemo(() => {
    const todas: CartaColecao[] = personagens.flatMap((p) => p.cartas)
    return todas
      .slice()
      .sort((a, b) => {
        const ra = RARIDADE_ORDEM.indexOf(a.raridade)
        const rb = RARIDADE_ORDEM.indexOf(b.raridade)
        if (ra !== rb) return ra - rb
        return a.ordem - b.ordem
      })
      .slice(0, PREVIEW_COUNT)
  }, [personagens])

  return (
    <Link href="/colecao" className="block h-full">
      <GlassCard variant="flat" interactive className="h-full">
        <div className="p-5 md:p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers
                className="w-4 h-4"
                strokeWidth={1.6}
                style={{ color: 'var(--accent)' }}
              />
              <h3
                className="text-sm"
                style={{
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-elegant)',
                  fontWeight: 500,
                }}
              >
                Coleção
              </h3>
            </div>
            <span
              className="text-xs"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              {loading ? '…' : `${totalDesbloqueadas}/${totalCartas}`}
            </span>
          </div>

          {loading ? (
            <div className="flex-1 grid grid-cols-3 gap-2">
              {Array.from({ length: PREVIEW_COUNT }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl animate-pulse"
                  style={{
                    aspectRatio: '5 / 7',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                />
              ))}
            </div>
          ) : preview.length === 0 ? (
            <div className="flex-1 flex items-center gap-2 py-2">
              <Sparkles
                className="w-6 h-6"
                style={{ color: 'var(--accent)', opacity: 0.6 }}
              />
              <p
                className="text-xs"
                style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
              >
                Estude e reze pra desbloquear suas primeiras cartas.
              </p>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-3 gap-2 content-start justify-items-center">
              {preview.map((c) => (
                <CartaView key={c.id} carta={c} width={86} />
              ))}
            </div>
          )}

          <div className="flex items-center justify-end mt-3">
            <span className="inline-flex items-center gap-1">
              <span
                className="text-[11px]"
                style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
              >
                Ver coleção
              </span>
              <ArrowRight className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            </span>
          </div>
        </div>
      </GlassCard>
    </Link>
  )
}
