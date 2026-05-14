'use client'

/**
 * DashboardLiturgiaCard — versão compacta do dia litúrgico em GlassCard,
 * pra plugar na grid da dashboard /educa (col-span-4 no desktop).
 *
 * Renderização própria pra encaixar no design system glass dourado (em vez
 * de reusar `LiturgiaHojeCard` que tem outro shell — `ios-surface-hero`).
 * Dados continuam do mesmo `getLiturgicalDay()` local.
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getLiturgicalDay } from '@/lib/liturgical-calendar'
import GlassCard from './GlassCard'

const COLOR_DOT: Record<string, string> = {
  branco: '#F2EDE4',
  vermelho: '#D94F5C',
  verde: '#66BB6A',
  roxo: '#BA68C8',
  rosa: '#F48FB1',
}

const GRADE_LABELS: Record<string, string> = {
  solenidade: 'Solenidade',
  festa: 'Festa',
  memorial: 'Memória',
  memorial_facultativo: 'Memória facultativa',
  feria: 'Féria',
}

export default function DashboardLiturgiaCard() {
  const day = getLiturgicalDay(new Date())
  const dot = COLOR_DOT[day.color] ?? COLOR_DOT.verde
  const grade = GRADE_LABELS[day.grade] ?? 'Liturgia diária'
  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <Link href="/liturgia/hoje" className="block h-full">
      <GlassCard variant="default" interactive className="h-full">
        <div className="relative p-5 md:p-6 h-full flex flex-col">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              background: `radial-gradient(110% 60% at 0% 0%, ${dot}26 0%, transparent 55%)`,
              mixBlendMode: 'screen',
            }}
          />

          <div className="relative flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: dot, boxShadow: `0 0 8px ${dot}80` }}
              />
              <span
                className="text-[10px] tracking-[0.2em] uppercase"
                style={{
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-display)',
                  opacity: 0.85,
                }}
              >
                Liturgia de hoje
              </span>
            </div>
            <span
              className="text-[9px] uppercase px-2 py-0.5 rounded-full tracking-[0.12em]"
              style={{
                color: 'var(--text-2)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.06)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {grade}
            </span>
          </div>

          <p
            className="relative text-lg md:text-xl leading-tight mb-1.5 line-clamp-2"
            style={{
              color: 'var(--text-1)',
              fontFamily: 'var(--font-elegant)',
              fontWeight: 500,
            }}
          >
            {day.title || day.name}
          </p>

          <p
            className="relative text-xs capitalize"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {hoje}
          </p>

          <div className="relative flex items-center justify-between mt-auto pt-4 gap-2">
            <span
              className="text-[11px] truncate"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              {day.season}
            </span>
            <span
              className="inline-flex items-center gap-1 text-[11px]"
              style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
            >
              Ler
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </GlassCard>
    </Link>
  )
}
