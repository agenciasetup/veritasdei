'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Church, Droplets, Tablets, BookOpen, ScrollText, Scale, Heart, Cross } from 'lucide-react'
import { useKnowledgeMap, type MapNode } from '@/lib/content/useKnowledgeMap'

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  dogmas: Church,
  sacramentos: Droplets,
  mandamentos: Tablets,
  oracoes: BookOpen,
  preceitos: ScrollText,
  'virtudes-pecados': Scale,
  'obras-misericordia': Heart,
}

const CATEGORY_LABELS: Record<string, string> = {
  dogmas: 'Dogmas',
  sacramentos: 'Sacramentos',
  mandamentos: 'Mandamentos',
  oracoes: 'Orações',
  preceitos: 'Preceitos',
  'virtudes-pecados': 'Virtudes',
  'obras-misericordia': 'Misericórdia',
}

interface KnowledgeMapProps {
  userId: string | undefined
}

export default function KnowledgeMap({ userId }: KnowledgeMapProps) {
  const { nodes, loading } = useKnowledgeMap(userId)

  // Calculate node positions in a radial layout
  const positioned = useMemo(() => {
    if (nodes.length === 0) return []
    const count = nodes.length
    const angleStep = (2 * Math.PI) / count
    // Start from top (-PI/2)
    const startAngle = -Math.PI / 2

    return nodes.map((node, i) => {
      const angle = startAngle + i * angleStep
      return {
        ...node,
        angle,
        // Positions as percentages for responsive layout
        x: 50 + 35 * Math.cos(angle), // 35% radius from center
        y: 50 + 35 * Math.sin(angle),
      }
    })
  }, [nodes])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }}
        />
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}>
          Nenhum conteúdo disponível ainda.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Radial map container */}
      <div className="relative w-full" style={{ paddingBottom: '100%' }}>
        <div className="absolute inset-0">
          {/* SVG connection lines */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            {positioned.map((node) => (
              <line
                key={`line-${node.slug}`}
                x1="50"
                y1="50"
                x2={node.x}
                y2={node.y}
                stroke="rgba(201,168,76,0.12)"
                strokeWidth="0.3"
                strokeDasharray="1,1"
              />
            ))}
            {/* Subtle orbit circle */}
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="none"
              stroke="rgba(201,168,76,0.06)"
              strokeWidth="0.2"
            />
          </svg>

          {/* Center hub */}
          <div
            className="absolute flex flex-col items-center justify-center"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80px',
              height: '80px',
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle, rgba(201,168,76,0.15), rgba(201,168,76,0.05))',
                border: '1px solid rgba(201,168,76,0.2)',
                boxShadow: '0 0 30px rgba(201,168,76,0.08)',
              }}
            >
              <Cross className="w-6 h-6" style={{ color: '#C9A84C' }} />
            </div>
            <span
              className="text-[9px] mt-1 tracking-[0.1em] uppercase whitespace-nowrap"
              style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-muted)' }}
            >
              Fé Católica
            </span>
          </div>

          {/* Category nodes */}
          {positioned.map((node, i) => (
            <MapNodeCard key={node.slug} node={node} index={i} />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: 'var(--gold)' }} />
          <span className="text-[11px]" style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}>
            Em progresso
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: '#66BB6A' }} />
          <span className="text-[11px]" style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}>
            Completo
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(242,237,228,0.1)' }} />
          <span className="text-[11px]" style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}>
            Não iniciado
          </span>
        </div>
      </div>
    </div>
  )
}

/* ─── Individual Map Node ─── */

function MapNodeCard({ node, index }: { node: MapNode & { x: number; y: number }; index: number }) {
  const Icon = CATEGORY_ICONS[node.slug] || BookOpen
  const label = CATEGORY_LABELS[node.slug] || node.title
  const pct = node.total > 0 ? Math.round((node.studied / node.total) * 100) : 0
  const isComplete = pct === 100
  const hasProgress = pct > 0

  const accentColor = isComplete ? '#66BB6A' : hasProgress ? '#C9A84C' : 'rgba(242,237,228,0.3)'

  return (
    <Link
      href={`/${node.slug}`}
      className="absolute flex flex-col items-center group fade-in"
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
        transform: 'translate(-50%, -50%)',
        animationDelay: `${index * 0.08}s`,
      }}
    >
      {/* Circular progress ring */}
      <div className="relative">
        <svg width="52" height="52" viewBox="0 0 52 52" className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx="26"
            cy="26"
            r="23"
            fill="none"
            stroke="rgba(242,237,228,0.06)"
            strokeWidth="2.5"
          />
          {/* Progress ring */}
          {hasProgress && (
            <circle
              cx="26"
              cy="26"
              r="23"
              fill="none"
              stroke={accentColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 144.5} 144.5`}
              className="transition-all duration-700"
            />
          )}
        </svg>
        {/* Icon in center */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110"
          style={{
            margin: '6px',
            background: hasProgress
              ? 'rgba(20,18,14,0.8)'
              : 'rgba(20,18,14,0.5)',
            border: `1px solid ${hasProgress ? accentColor + '40' : 'rgba(242,237,228,0.08)'}`,
          }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
      </div>
      {/* Label */}
      <span
        className="text-[10px] mt-1.5 text-center leading-tight max-w-[70px]"
        style={{
          fontFamily: 'Poppins, sans-serif',
          color: hasProgress ? 'var(--text-secondary)' : 'var(--text-muted)',
        }}
      >
        {label}
      </span>
      {/* Progress percentage */}
      {hasProgress && (
        <span
          className="text-[9px] font-medium"
          style={{
            color: accentColor,
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {pct}%
        </span>
      )}
    </Link>
  )
}
