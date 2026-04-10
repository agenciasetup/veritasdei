'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { CatechismSection } from '../data/types'
import QuestionCard from './QuestionCard'

interface SectionAccordionProps {
  section: CatechismSection
  depth?: number
  defaultOpen?: boolean
  searchTerm?: string
  /** Força abrir (quando há resultado de busca) */
  forceOpen?: boolean
}

export default function SectionAccordion({
  section,
  depth = 0,
  defaultOpen = false,
  searchTerm,
  forceOpen = false,
}: SectionAccordionProps) {
  const [open, setOpen] = useState(defaultOpen || forceOpen)

  const isOpen = open || forceOpen
  const indent = depth > 0

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: depth === 0 ? 'rgba(20,18,14,0.5)' : 'rgba(20,18,14,0.3)',
        border: `1px solid ${isOpen ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.06)'}`,
        marginLeft: indent ? '0' : undefined,
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4"
      >
        <h3
          className="text-left leading-snug"
          style={{
            fontFamily: 'Cinzel, serif',
            color: isOpen ? '#C9A84C' : '#F2EDE4',
            fontSize: depth === 0 ? '0.9rem' : '0.8rem',
            fontWeight: depth === 0 ? 600 : 500,
          }}
        >
          {section.title}
        </h3>
        <ChevronDown
          className="w-4 h-4 flex-shrink-0 ml-3 transition-transform duration-300"
          style={{ color: '#7A7368', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      <div
        className="overflow-hidden transition-all duration-500"
        style={{ maxHeight: isOpen ? '50000px' : '0', opacity: isOpen ? 1 : 0 }}
      >
        <div className="px-4 pb-4 space-y-3">
          {/* Description */}
          {section.description && (
            <p
              className="text-xs leading-relaxed p-3 rounded-lg italic"
              style={{
                color: '#B8AFA2',
                fontFamily: 'Cormorant Garamond, serif',
                background: 'rgba(15,14,12,0.4)',
              }}
            >
              {section.description}
            </p>
          )}

          {/* Questions */}
          {section.questions && section.questions.length > 0 && (
            <div className="space-y-2">
              {section.questions.map((q, i) => (
                <QuestionCard key={i} question={q} index={i} highlighted={searchTerm} />
              ))}
            </div>
          )}

          {/* Nested subsections */}
          {section.subsections && section.subsections.length > 0 && (
            <div className="space-y-2 mt-2">
              {section.subsections.map((sub, i) => (
                <SectionAccordion
                  key={i}
                  section={sub}
                  depth={depth + 1}
                  searchTerm={searchTerm}
                  forceOpen={forceOpen}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
