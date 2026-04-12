'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getLiturgicalDay } from '@/lib/liturgical-calendar'

const COLOR_STYLES: Record<string, { bg: string; border: string; dot: string; glow: string }> = {
  branco:   { bg: 'rgba(242,237,228,0.04)', border: 'rgba(242,237,228,0.2)',  dot: '#F2EDE4', glow: 'rgba(242,237,228,0.15)' },
  vermelho: { bg: 'rgba(217,79,92,0.05)',    border: 'rgba(217,79,92,0.25)',   dot: '#D94F5C', glow: 'rgba(217,79,92,0.2)'   },
  verde:    { bg: 'rgba(76,175,80,0.04)',    border: 'rgba(102,187,106,0.22)', dot: '#66BB6A', glow: 'rgba(102,187,106,0.15)'},
  roxo:     { bg: 'rgba(156,39,176,0.05)',   border: 'rgba(186,104,200,0.25)', dot: '#BA68C8', glow: 'rgba(186,104,200,0.18)'},
  rosa:     { bg: 'rgba(244,143,177,0.05)',  border: 'rgba(244,143,177,0.25)', dot: '#F48FB1', glow: 'rgba(244,143,177,0.18)'},
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
 * Fonte de dados: cálculo local (`getLiturgicalDay`) — já usado pela
 * LiturgicalBar. Integração com leituras reais (Evangelho etc.) fica pra
 * Fase 2.
 */
export default function LiturgiaHojeCard() {
  const day = getLiturgicalDay(new Date())
  const style = COLOR_STYLES[day.color] ?? COLOR_STYLES.verde
  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <Link
      href="/liturgia"
      className="block mx-4 mb-4 rounded-3xl p-5 transition-all active:scale-[0.99]"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        boxShadow: `0 0 32px ${style.glow}`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ background: style.dot, boxShadow: `0 0 8px ${style.dot}` }}
        />
        <span
          className="text-[10px] uppercase tracking-[0.18em]"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          Liturgia de hoje · {GRADE_LABELS[day.grade] ?? ''}
        </span>
      </div>

      <p
        className="text-2xl leading-tight mb-2"
        style={{ color: '#F2EDE4', fontFamily: 'Cormorant Garamond, serif' }}
      >
        {day.title || day.name}
      </p>
      <p
        className="text-sm capitalize"
        style={{ color: '#A8A096', fontFamily: 'Poppins, sans-serif' }}
      >
        {hoje}
      </p>

      <div className="flex items-center justify-between mt-4">
        <span
          className="text-xs"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          {day.season}
        </span>
        <span
          className="inline-flex items-center gap-1 text-xs"
          style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
        >
          Ver liturgia <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  )
}
