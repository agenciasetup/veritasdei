'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getLiturgicalDay } from '@/lib/liturgical-calendar'

const COLOR_DOT: Record<string, string> = {
  branco:   '#F2EDE4',
  vermelho: '#D94F5C',
  verde:    '#66BB6A',
  roxo:     '#BA68C8',
  rosa:     '#F48FB1',
}

const GRADE_LABELS: Record<string, string> = {
  solenidade: 'Solenidade',
  festa: 'Festa',
  memorial: 'Memória',
  memorial_facultativo: 'Memória facultativa',
  feria: 'Féria',
}

/**
 * Card principal da home: destaca o dia litúrgico atual.
 *
 * Fonte de dados para cor/nome/grau: cálculo local (`getLiturgicalDay`).
 * Leva o usuário para `/liturgia/hoje` onde as leituras reais do dia
 * (primeira leitura, salmo, evangelho) são trazidas da Edge Function
 * `liturgia-scrape` com cache de 24h.
 */
export default function LiturgiaHojeCard() {
  const day = getLiturgicalDay(new Date())
  const dot = COLOR_DOT[day.color] ?? COLOR_DOT.verde
  const grade = GRADE_LABELS[day.grade] ?? 'Liturgia diária'
  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <Link
      href="/liturgia/hoje"
      className="ios-surface-hero block mx-4 mb-4 p-5 overflow-hidden transition-transform active:scale-[0.985]"
      style={{ isolation: 'isolate' }}
    >
      {/* Camada de tint litúrgico: MUITO sutil, só um hint de cor no topo */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[26px] opacity-[0.35]"
        style={{
          background: `radial-gradient(120% 80% at 0% 0%, ${dot}22 0%, transparent 55%)`,
          mixBlendMode: 'screen',
          zIndex: -1,
        }}
      />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: dot }}
          />
          <span
            className="text-[11px] uppercase"
            style={{
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.14em',
              fontWeight: 500,
            }}
          >
            Liturgia de hoje
          </span>
        </div>

        <span
          className="text-[10px] uppercase px-2.5 py-1 rounded-full"
          style={{
            color: 'var(--text-secondary)',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.06)',
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.12em',
            fontWeight: 500,
          }}
        >
          {grade}
        </span>
      </div>

      <p
        className="text-[28px] leading-[1.1] mb-1.5"
        style={{
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-elegant)',
          fontWeight: 500,
          letterSpacing: '-0.005em',
        }}
      >
        {day.title || day.name}
      </p>

      <p
        className="text-[13px] capitalize"
        style={{
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-body)',
        }}
      >
        {hoje}
      </p>

      <div className="mt-5 flex items-center justify-between gap-3">
        <span
          className="text-[12px]"
          style={{
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {day.season}
        </span>

        <span
          className="ios-cta-gold inline-flex items-center gap-1.5 text-[12.5px] pl-3.5 pr-3 py-2 rounded-full"
        >
          Ler liturgia
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.25} />
        </span>
      </div>
    </Link>
  )
}
