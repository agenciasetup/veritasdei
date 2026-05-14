'use client'

/**
 * TrilhasProgressCard — o mapa do currículo. Para um aluno de doutrina,
 * é o card mais importante: mostra os pilares da fé e quanto ele já
 * percorreu em cada um.
 *
 * Dados: useKnowledgeMap (content_groups + progresso do usuário).
 *
 * - desktop (default): lista de pilares com barra de progresso individual
 * - compact (mobile):  barra geral + 3 pilares mais avançados + CTA
 */

import Link from 'next/link'
import { useMemo } from 'react'
import { ArrowRight, GraduationCap } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useKnowledgeMap, type MapNode } from '@/lib/content/useKnowledgeMap'

const SHELL_STYLE = {
  background: 'var(--surface-2)',
  border: '1px solid rgba(255,255,255,0.05)',
}

function pct(node: MapNode): number {
  if (node.total <= 0) return 0
  return Math.min(100, Math.round((node.studied / node.total) * 100))
}

export default function TrilhasProgressCard({
  compact = false,
}: {
  compact?: boolean
}) {
  const { user } = useAuth()
  const { nodes, loading } = useKnowledgeMap(user?.id)

  const { totalStudied, totalAll, overallPct, ordered } = useMemo(() => {
    const studied = nodes.reduce((s, n) => s + Math.min(n.studied, n.total), 0)
    const all = nodes.reduce((s, n) => s + n.total, 0)
    const ord = nodes
      .slice()
      .sort((a, b) => pct(b) - pct(a) || b.total - a.total)
    return {
      totalStudied: studied,
      totalAll: all,
      overallPct: all > 0 ? Math.round((studied / all) * 100) : 0,
      ordered: ord,
    }
  }, [nodes])

  const header = (
    <div className="flex items-center gap-2.5">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <GraduationCap
          className="w-4 h-4"
          style={{ color: 'var(--accent)' }}
          strokeWidth={1.6}
        />
      </div>
      <div className="min-w-0">
        <p
          className="text-base leading-tight"
          style={{
            color: 'var(--text-1)',
            fontFamily: 'var(--font-elegant)',
            fontWeight: 500,
          }}
        >
          Seus pilares da fé
        </p>
        <p
          className="text-[11px]"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          {loading
            ? 'Carregando trilhas…'
            : totalAll > 0
              ? `${totalStudied} de ${totalAll} lições · ${overallPct}%`
              : 'Trilhas doutrinais'}
        </p>
      </div>
      <Link
        href="/educa/estudo"
        className="ml-auto inline-flex items-center gap-1 text-[11px] flex-shrink-0"
        style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
      >
        Ver trilhas
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  )

  if (loading) {
    return (
      <div className="h-full rounded-[24px] p-6 lg:p-7" style={SHELL_STYLE}>
        {header}
        <div className="mt-5 space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-9 rounded-xl animate-pulse"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (ordered.length === 0) {
    return (
      <Link
        href="/educa/estudo"
        className="block h-full rounded-[24px] p-6 lg:p-7 transition-colors hover:bg-white/[0.01]"
        style={SHELL_STYLE}
      >
        {header}
        <p
          className="text-sm mt-4"
          style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
        >
          Comece pelos pilares da fé católica — escolha uma trilha e dê o
          primeiro passo na sua formação doutrinal.
        </p>
      </Link>
    )
  }

  // compact (mobile): barra geral + 3 pilares
  const list = compact ? ordered.slice(0, 3) : ordered

  return (
    <div className="h-full rounded-[24px] p-6 lg:p-7" style={SHELL_STYLE}>
      {header}

      {compact && (
        <div className="mt-4">
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(242,237,228,0.06)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${overallPct}%`, background: 'var(--accent)' }}
            />
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {list.map((node) => {
          const p = pct(node)
          return (
            <Link
              key={node.slug}
              href={`/estudo/${node.slug}`}
              className="block group"
            >
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span
                  className="text-[13px] truncate"
                  style={{
                    color: 'var(--text-1)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {node.title}
                </span>
                <span
                  className="text-[11px] flex-shrink-0"
                  style={{
                    color: p === 100 ? 'var(--accent)' : 'var(--text-3)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {node.studied}/{node.total}
                </span>
              </div>
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ background: 'rgba(242,237,228,0.06)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${p}%`, background: 'var(--accent)' }}
                />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
