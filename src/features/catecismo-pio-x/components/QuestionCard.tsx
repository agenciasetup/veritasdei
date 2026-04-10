'use client'

import type { CatechismQuestion } from '../data/types'

interface QuestionCardProps {
  question: CatechismQuestion
  index: number
  highlighted?: string
}

function highlightText(text: string, term?: string) {
  if (!term || term.length < 2) return text
  const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} style={{ background: 'rgba(201,168,76,0.25)', color: '#F2EDE4', borderRadius: '2px', padding: '0 2px' }}>
        {part}
      </mark>
    ) : (
      part
    )
  )
}

export default function QuestionCard({ question, index, highlighted }: QuestionCardProps) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: 'rgba(20,18,14,0.4)',
        borderLeft: '3px solid rgba(201,168,76,0.2)',
      }}
    >
      <div className="flex items-start gap-3 mb-2">
        <span
          className="text-[10px] font-bold mt-0.5 flex-shrink-0"
          style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}
        >
          P.
        </span>
        <p
          className="text-sm font-semibold leading-relaxed"
          style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}
        >
          {highlightText(question.question, highlighted)}
        </p>
      </div>
      <div className="flex items-start gap-3 ml-0.5">
        <span
          className="text-[10px] font-bold mt-0.5 flex-shrink-0"
          style={{ color: '#D9C077', fontFamily: 'Cinzel, serif' }}
        >
          R.
        </span>
        <p
          className="text-sm leading-[1.9]"
          style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
        >
          {highlightText(question.answer, highlighted)}
        </p>
      </div>
    </div>
  )
}
