'use client'

import { useEffect, useState } from 'react'
import { Crown, Calendar } from 'lucide-react'
import { getLiturgicalDay, type LiturgicalDay } from '@/lib/liturgical-calendar'

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; label: string }> = {
  branco: { bg: 'rgba(242,237,228,0.08)', border: 'rgba(242,237,228,0.2)', text: '#F2EDE4', label: 'Branco' },
  vermelho: { bg: 'rgba(217,79,92,0.08)', border: 'rgba(217,79,92,0.2)', text: '#D94F5C', label: 'Vermelho' },
  verde: { bg: 'rgba(76,175,80,0.08)', border: 'rgba(76,175,80,0.2)', text: '#66BB6A', label: 'Verde' },
  roxo: { bg: 'rgba(156,39,176,0.08)', border: 'rgba(156,39,176,0.2)', text: '#BA68C8', label: 'Roxo' },
  rosa: { bg: 'rgba(244,143,177,0.08)', border: 'rgba(244,143,177,0.2)', text: '#F48FB1', label: 'Rosa' },
  dourado: { bg: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.2)', text: '#C9A84C', label: 'Dourado' },
}

const GRADE_LABEL: Record<string, string> = {
  solenidade: 'Solenidade',
  festa: 'Festa',
  memorial: 'Memória',
  memorial_facultativo: 'Memória Facultativa',
  feria: 'Féria',
}

function computeToday(): LiturgicalDay {
  return getLiturgicalDay(new Date())
}

export default function SantoDoDia() {
  // Compute liturgical day immediately — pure algorithm, no API needed
  const [data, setData] = useState<LiturgicalDay>(computeToday)

  // Re-compute at midnight if the page stays open
  useEffect(() => {
    const now = new Date()
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const msUntilMidnight = tomorrow.getTime() - now.getTime()

    const timer = setTimeout(() => {
      setData(computeToday())
    }, msUntilMidnight)

    return () => clearTimeout(timer)
  }, [])

  const hoje = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  })

  const colorInfo = COLOR_MAP[data.color] ?? COLOR_MAP.verde

  return (
    <div
      className="rounded-2xl p-6 md:p-7 transition-all duration-300"
      style={{
        background: 'rgba(16,16,16,0.75)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${colorInfo.border}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      {/* Date + Color */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" style={{ color: '#C9A84C' }} />
          <span className="text-xs tracking-wider uppercase"
            style={{ fontFamily: 'Poppins, sans-serif', color: '#7A7368' }}>
            {hoje}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ background: colorInfo.text }} />
          <span className="text-[10px] tracking-wider uppercase"
            style={{ fontFamily: 'Poppins, sans-serif', color: colorInfo.text }}>
            {colorInfo.label}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: colorInfo.bg, border: `1px solid ${colorInfo.border}` }}>
          <Crown className="w-5 h-5" style={{ color: colorInfo.text }} />
        </div>
        <div>
          <h3 className="text-xs tracking-[0.15em] uppercase mb-1"
            style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>
            Calendário Litúrgico
          </h3>
          <h2 className="text-lg font-bold leading-tight"
            style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
            {data.name}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
            {data.title}
          </p>
        </div>
      </div>

      {/* Season + Grade badges */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] px-2.5 py-1 rounded-full tracking-wider uppercase"
          style={{ background: colorInfo.bg, border: `1px solid ${colorInfo.border}`, color: colorInfo.text, fontFamily: 'Poppins, sans-serif' }}>
          {GRADE_LABEL[data.grade] ?? data.grade}
        </span>
        <span className="text-[10px] px-2.5 py-1 rounded-full tracking-wider uppercase"
          style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.12)', color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          {data.season}
        </span>
      </div>
    </div>
  )
}
