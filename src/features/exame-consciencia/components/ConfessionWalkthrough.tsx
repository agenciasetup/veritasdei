'use client'

import { CONFESSION_STEPS } from '../data/confession-guide'
import { SINS } from '../data/sins'
import { User, Church } from 'lucide-react'

interface ConfessionWalkthroughProps {
  selectedSins: Set<number>
  customSins: string[]
  lastConfession: string | null
}

export default function ConfessionWalkthrough({
  selectedSins,
  customSins,
  lastConfession,
}: ConfessionWalkthroughProps) {
  const selected = SINS.filter(s => selectedSins.has(s.id))

  function formatTimeSince(): string {
    if (!lastConfession) return 'há algum tempo'
    try {
      const date = new Date(lastConfession)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      if (days < 7) return `há ${days} dia${days !== 1 ? 's' : ''}`
      if (days < 30) return `há ${Math.floor(days / 7)} semana${Math.floor(days / 7) !== 1 ? 's' : ''}`
      if (days < 365) return `há ${Math.floor(days / 30)} ${Math.floor(days / 30) !== 1 ? 'meses' : 'mês'}`
      return `há ${Math.floor(days / 365)} ano${Math.floor(days / 365) !== 1 ? 's' : ''}`
    } catch {
      return 'há algum tempo'
    }
  }

  function renderText(step: typeof CONFESSION_STEPS[0]): string {
    let text = step.text
    if (step.dynamic) {
      text = text.replace('{lastConfession}', formatTimeSince())
      if (text.includes('{sins}')) {
        const sinTexts = [
          ...selected.map(s => s.textPast),
          ...customSins,
        ]
        text = sinTexts.length > 0
          ? sinTexts.map((s, i) => `${i + 1}. ${s}`).join('\n')
          : 'Acuso-me dos meus pecados...'
      }
    }
    return text
  }

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {/* Introduction */}
      <div
        className="rounded-xl p-4 text-center mb-6"
        style={{
          background: 'rgba(201,168,76,0.05)',
          border: '1px solid rgba(201,168,76,0.1)',
        }}
      >
        <p
          className="text-xs leading-relaxed"
          style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}
        >
          Siga este guia passo a passo durante a confissão. Os textos em destaque são as suas falas.
        </p>
      </div>

      {CONFESSION_STEPS.map((step) => {
        const text = renderText(step)

        if (step.speaker === 'instruction') {
          return (
            <div key={step.id} className="px-2 py-3">
              <p
                className="text-xs leading-relaxed text-center italic"
                style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
              >
                {text}
              </p>
            </div>
          )
        }

        const isPenitent = step.speaker === 'penitent'

        return (
          <div
            key={step.id}
            className={`flex gap-3 ${isPenitent ? '' : 'flex-row-reverse'}`}
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
              style={{
                background: isPenitent ? 'rgba(201,168,76,0.1)' : 'rgba(107,29,42,0.15)',
                border: `1px solid ${isPenitent ? 'rgba(201,168,76,0.2)' : 'rgba(107,29,42,0.25)'}`,
              }}
            >
              {isPenitent ? (
                <User className="w-4 h-4" style={{ color: '#C9A84C' }} />
              ) : (
                <Church className="w-4 h-4" style={{ color: '#8B3145' }} />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`flex-1 rounded-2xl p-4 ${isPenitent ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}
              style={{
                background: isPenitent ? 'rgba(201,168,76,0.06)' : 'rgba(107,29,42,0.08)',
                border: `1px solid ${isPenitent ? 'rgba(201,168,76,0.12)' : 'rgba(107,29,42,0.15)'}`,
              }}
            >
              <p
                className="text-[10px] tracking-[0.15em] uppercase mb-2"
                style={{
                  color: isPenitent ? '#C9A84C' : '#8B3145',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {isPenitent ? 'Você' : 'Sacerdote'}
              </p>
              <p
                className="text-sm leading-[1.9] whitespace-pre-line"
                style={{
                  color: '#F2EDE4',
                  fontFamily: step.id === 'contrition' || step.id === 'absolution'
                    ? 'Cormorant Garamond, serif'
                    : 'Poppins, sans-serif',
                  fontWeight: 300,
                  fontStyle: step.id === 'absolution' ? 'italic' : 'normal',
                }}
              >
                {text}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
