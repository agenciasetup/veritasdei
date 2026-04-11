'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { SumaArticle } from '../data/types'

interface ArticleViewProps {
  article: SumaArticle
  partAbbr: string
  highlight?: string
  /** When true, start with all sections open */
  expandAll?: boolean
}

type ArticleSection = 'objections' | 'sedContra' | 'respondeo' | 'replies'

function highlightText(text: string, term?: string) {
  if (!term || term.length < 2) return text
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} style={{ background: 'rgba(201,168,76,0.3)', color: '#F2EDE4', borderRadius: '2px', padding: '0 2px' }}>
        {part}
      </mark>
    ) : (
      part
    )
  )
}

export default function ArticleView({ article, partAbbr, highlight, expandAll }: ArticleViewProps) {
  const [openSections, setOpenSections] = useState<Set<ArticleSection>>(
    new Set(expandAll ? ['objections', 'sedContra', 'respondeo', 'replies'] : ['respondeo'])
  )

  function toggleSection(s: ArticleSection) {
    setOpenSections(prev => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })
  }

  const ref = `S.Th. ${partAbbr}, q.${article.question}, a.${article.article}`

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(20,18,14,0.5)',
        border: '1px solid rgba(201,168,76,0.1)',
      }}
    >
      {/* Article header */}
      <div className="p-5">
        <span
          className="text-[10px] tracking-[0.2em] uppercase block mb-2"
          style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
        >
          {ref}
        </span>
        <h3
          className="text-base font-semibold leading-snug"
          style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
        >
          {highlightText(article.title, highlight)}
        </h3>
      </div>

      {/* Sections */}
      <div className="space-y-px">
        <CollapsibleSection
          title="Objeções"
          isOpen={openSections.has('objections')}
          onToggle={() => toggleSection('objections')}
          accentColor="#E08090"
        >
          {article.objections.map((obj, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <span
                className="text-[10px] font-bold block mb-1"
                style={{ color: '#E08090', fontFamily: 'Cinzel, serif' }}
              >
                Objeção {i + 1}
              </span>
              <p
                className="text-sm leading-[1.9]"
                style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
              >
                {highlightText(obj, highlight)}
              </p>
            </div>
          ))}
        </CollapsibleSection>

        <CollapsibleSection
          title="Sed Contra"
          isOpen={openSections.has('sedContra')}
          onToggle={() => toggleSection('sedContra')}
          accentColor="#8BA4D9"
        >
          <p
            className="text-sm leading-[1.9] italic"
            style={{ color: '#B8AFA2', fontFamily: 'Cormorant Garamond, serif' }}
          >
            {highlightText(article.sedContra, highlight)}
          </p>
        </CollapsibleSection>

        <CollapsibleSection
          title="Respondeo"
          subtitle="Corpo do artigo"
          isOpen={openSections.has('respondeo')}
          onToggle={() => toggleSection('respondeo')}
          accentColor="#C9A84C"
          highlight
        >
          <p
            className="text-sm leading-[1.9]"
            style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
          >
            {highlightText(article.respondeo, highlight)}
          </p>
        </CollapsibleSection>

        {article.replies.length > 0 && (
          <CollapsibleSection
            title="Respostas às Objeções"
            isOpen={openSections.has('replies')}
            onToggle={() => toggleSection('replies')}
            accentColor="#66BB6A"
          >
            {article.replies.map((reply, i) => (
              <div key={i} className="mb-3 last:mb-0">
                <span
                  className="text-[10px] font-bold block mb-1"
                  style={{ color: '#66BB6A', fontFamily: 'Cinzel, serif' }}
                >
                  Ad {i + 1}
                </span>
                <p
                  className="text-sm leading-[1.9]"
                  style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
                >
                  {highlightText(reply, highlight)}
                </p>
              </div>
            ))}
          </CollapsibleSection>
        )}
      </div>
    </div>
  )
}

function CollapsibleSection({
  title,
  subtitle,
  isOpen,
  onToggle,
  accentColor,
  highlight,
  children,
}: {
  title: string
  subtitle?: string
  isOpen: boolean
  onToggle: () => void
  accentColor: string
  highlight?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        borderTop: '1px solid rgba(201,168,76,0.06)',
        background: highlight && isOpen ? 'rgba(201,168,76,0.03)' : 'transparent',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3"
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: accentColor }}
          />
          <span
            className="text-xs font-semibold tracking-wide"
            style={{ fontFamily: 'Cinzel, serif', color: isOpen ? accentColor : '#7A7368' }}
          >
            {title}
          </span>
          {subtitle && (
            <span
              className="text-[10px]"
              style={{ color: '#7A736860', fontFamily: 'Poppins, sans-serif' }}
            >
              — {subtitle}
            </span>
          )}
        </div>
        <ChevronDown
          className="w-3.5 h-3.5 transition-transform duration-300"
          style={{ color: '#7A7368', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      <div
        className="overflow-hidden transition-all duration-500"
        style={{ maxHeight: isOpen ? '5000px' : '0', opacity: isOpen ? 1 : 0 }}
      >
        <div
          className="px-5 pb-4 ml-4"
          style={{ borderLeft: `2px solid ${accentColor}20` }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
