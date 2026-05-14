'use client'

/**
 * DashboardSelosStrip — preview compacto de relíquias desbloqueadas pro
 * grid da dashboard. Mostra até 6 selos (raros primeiro), com contador
 * "X/Y desbloqueados" e CTA pra /perfil#selos onde tem o showcase completo.
 *
 * Caso ainda não tenha nenhum: mostra placeholder convidativo.
 */

import Link from 'next/link'
import { useMemo } from 'react'
import { ArrowRight, Gem, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useReliquias } from '@/lib/gamification/useReliquias'
import { type ReliquiaRarity } from '@/types/gamification'
import GlassCard from './GlassCard'
import ReliquiaIcon from '@/components/gamification/ReliquiaIcon'

const RARITY_ORDER: ReliquiaRarity[] = ['lendaria', 'epica', 'rara', 'comum']
const PREVIEW_COUNT = 6

export default function DashboardSelosStrip() {
  const { user } = useAuth()
  const { catalog, unlockedIds, loading } = useReliquias(user?.id)

  const previewItems = useMemo(() => {
    const unlocked = catalog.filter((r) => unlockedIds.has(r.id))
    return unlocked
      .slice()
      .sort((a, b) => {
        const aR = RARITY_ORDER.indexOf(a.rarity)
        const bR = RARITY_ORDER.indexOf(b.rarity)
        if (aR !== bR) return aR - bR
        return a.sort_order - b.sort_order
      })
      .slice(0, PREVIEW_COUNT)
  }, [catalog, unlockedIds])

  // Próximo selo a desbloquear — o mais "alcançável" (comum primeiro).
  // Dá direção: em vez de caixas vazias, mostra um objetivo concreto.
  const nextLocked = useMemo(() => {
    const locked = catalog.filter((r) => !unlockedIds.has(r.id))
    return locked
      .slice()
      .sort((a, b) => {
        const aR = RARITY_ORDER.indexOf(a.rarity)
        const bR = RARITY_ORDER.indexOf(b.rarity)
        if (aR !== bR) return bR - aR
        return a.sort_order - b.sort_order
      })[0]
  }, [catalog, unlockedIds])

  const unlockedCount = unlockedIds.size
  const totalCount = catalog.length

  return (
    <Link href="/perfil#selos" className="block h-full">
      <GlassCard variant="flat" interactive className="h-full">
        <div className="p-5 md:p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gem
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
                Selos
              </h3>
            </div>
            <span
              className="text-xs"
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {loading ? '…' : `${unlockedCount}/${totalCount}`}
            </span>
          </div>

          {loading ? (
            <div className="flex-1 grid grid-cols-3 gap-2">
              {Array.from({ length: PREVIEW_COUNT }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                />
              ))}
            </div>
          ) : previewItems.length === 0 ? (
            <div className="flex-1 flex items-center gap-3 py-2">
              {nextLocked ? (
                <>
                  <div style={{ opacity: 0.5 }}>
                    <ReliquiaIcon reliquia={nextLocked} size="md" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-[10px] tracking-[0.14em] uppercase"
                      style={{
                        color: 'var(--accent)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      Próximo selo
                    </p>
                    <p
                      className="text-sm leading-tight"
                      style={{
                        color: 'var(--text-1)',
                        fontFamily: 'var(--font-elegant)',
                        fontWeight: 500,
                      }}
                    >
                      {nextLocked.name}
                    </p>
                    <p
                      className="text-[11px] mt-0.5 line-clamp-2"
                      style={{
                        color: 'var(--text-3)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {nextLocked.description}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles
                    className="w-6 h-6"
                    style={{ color: 'var(--accent)', opacity: 0.6 }}
                  />
                  <p
                    className="text-xs"
                    style={{
                      color: 'var(--text-2)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    Estude e reze pra desbloquear seus primeiros selos.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-3 gap-2 content-start justify-items-center">
              {previewItems.map((rel) => (
                <ReliquiaIcon key={rel.id} reliquia={rel} size="md" />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 gap-2">
            {previewItems.length > 0 && nextLocked ? (
              <span
                className="text-[11px] truncate"
                style={{
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Próximo: {nextLocked.name}
              </span>
            ) : (
              <span />
            )}
            <span
              className="inline-flex items-center gap-1 flex-shrink-0"
            >
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
