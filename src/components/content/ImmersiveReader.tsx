'use client'

import { useState } from 'react'
import { Copy, Check, BookOpen, Quote, Scroll, List, Image as ImageIcon } from 'lucide-react'
import type { ContentItem } from '@/lib/content/useContentGroup'

interface ImmersiveReaderProps {
  title: string
  subtitle?: string
  description?: string
  items: ContentItem[]
  /** Callback when user marks content as studied */
  onMarkStudied?: () => void
  /** Whether already marked as studied */
  isStudied?: boolean
}

/**
 * Immersive vertical scroll reader — replaces the carousel.
 * Renders content items as a continuous, scrollable article
 * with visual sections for each content type.
 */
export default function ImmersiveReader({
  title,
  subtitle,
  description,
  items,
  onMarkStudied,
  isStudied,
}: ImmersiveReaderProps) {
  return (
    <article className="max-w-3xl mx-auto px-4 md:px-6 pb-16">
      {/* ── Title section ── */}
      <header className="text-center py-10 md:py-14 fade-in">
        {subtitle && (
          <span
            className="inline-block px-4 py-1.5 rounded-full text-xs tracking-[0.2em] uppercase mb-6"
            style={{
              background: 'rgba(201,168,76,0.1)',
              border: '1px solid rgba(201,168,76,0.2)',
              color: 'var(--gold)',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {subtitle}
          </span>
        )}

        <h1
          className="text-3xl md:text-4xl font-bold leading-tight mb-4"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-primary)' }}
        >
          {title}
        </h1>

        {description && (
          <p
            className="text-base md:text-lg leading-relaxed max-w-xl mx-auto"
            style={{ color: 'var(--text-secondary)', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
          >
            {description}
          </p>
        )}

        {/* Ornament */}
        <div className="flex items-center gap-4 my-6 w-48 mx-auto">
          <span className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.2)' }} />
          <Scroll className="w-4 h-4" style={{ color: 'var(--gold)', opacity: 0.5 }} />
          <span className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.2)' }} />
        </div>
      </header>

      {/* ── Content sections ── */}
      <div className="space-y-8">
        {renderGroupedItems(items)}
      </div>

      {/* ── Mark as studied button ── */}
      {onMarkStudied && (
        <div className="mt-12 text-center fade-in">
          <button
            onClick={onMarkStudied}
            disabled={isStudied}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm tracking-wider uppercase transition-all duration-300"
            style={{
              background: isStudied
                ? 'rgba(76,175,80,0.15)'
                : 'linear-gradient(135deg, #C9A84C, #A88B3A)',
              border: isStudied
                ? '1px solid rgba(76,175,80,0.3)'
                : '1px solid rgba(201,168,76,0.3)',
              color: isStudied ? '#66BB6A' : '#0F0E0C',
              fontFamily: 'Cinzel, serif',
              fontWeight: 600,
              cursor: isStudied ? 'default' : 'pointer',
            }}
          >
            {isStudied ? (
              <>
                <Check className="w-4 h-4" />
                Conteúdo estudado
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4" />
                Marcar como estudado
              </>
            )}
          </button>
        </div>
      )}
    </article>
  )
}

/* ─── Render content items, grouping consecutive definitions ─── */

function renderGroupedItems(items: ContentItem[]): React.ReactNode[] {
  const sections: React.ReactNode[] = []
  let i = 0

  while (i < items.length) {
    const item = items[i]

    // Group consecutive definitions
    if (item.kind === 'definition') {
      const defs: ContentItem[] = []
      while (i < items.length && items[i].kind === 'definition') {
        defs.push(items[i])
        i++
      }
      sections.push(
        <DefinitionSection key={`defs-${defs[0].id}`} items={defs} />
      )
      continue
    }

    switch (item.kind) {
      case 'text':
        sections.push(<TextSection key={item.id} item={item} />)
        break
      case 'verse':
        sections.push(<VerseSection key={item.id} item={item} />)
        break
      case 'list':
        sections.push(<ListSection key={item.id} item={item} />)
        break
      case 'prayer':
        sections.push(<PrayerSection key={item.id} item={item} />)
        break
      case 'image':
        sections.push(<ImageSection key={item.id} item={item} />)
        break
      default:
        sections.push(<TextSection key={item.id} item={item} />)
    }
    i++
  }

  return sections
}

/* ─── Section components ─── */

function TextSection({ item }: { item: ContentItem }) {
  return (
    <section className="fade-in">
      {item.title && (
        <div className="flex items-center gap-2.5 mb-4">
          <BookOpen className="w-4 h-4" style={{ color: 'var(--gold)' }} />
          <h3
            className="text-xs tracking-[0.15em] uppercase"
            style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)' }}
          >
            {item.title}
          </h3>
        </div>
      )}
      <p
        className="text-base md:text-lg leading-[2] tracking-wide"
        style={{ color: '#E8E2D8', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
      >
        {item.body}
      </p>
    </section>
  )
}

function VerseSection({ item }: { item: ContentItem }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${item.reference}\n\n"${item.body}"`)
    } catch { /* ok */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="fade-in">
      <div className="flex items-center gap-2.5 mb-4">
        <Quote className="w-4 h-4" style={{ color: 'var(--wine-light)' }} />
        <h3
          className="text-xs tracking-[0.15em] uppercase"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--wine-light)' }}
        >
          Fundamentação Bíblica
        </h3>
      </div>

      <div className="verse-block relative">
        {/* Reference */}
        <span className="verse-reference">{item.reference}</span>

        {/* Text */}
        <blockquote
          className="text-lg md:text-xl leading-[1.8] italic mt-3"
          style={{ fontFamily: 'Cormorant Garamond, serif', color: '#E8E2D8' }}
        >
          &ldquo;{item.body}&rdquo;
        </blockquote>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="copy-btn"
          aria-label="Copiar versículo"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </section>
  )
}

function DefinitionSection({ items }: { items: ContentItem[] }) {
  return (
    <section className="fade-in">
      <div className="flex items-center gap-2.5 mb-5">
        <Scroll className="w-4 h-4" style={{ color: 'var(--gold)' }} />
        <h3
          className="text-xs tracking-[0.15em] uppercase"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)' }}
        >
          Elementos Essenciais
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl p-5"
            style={{
              background: 'rgba(20,18,14,0.5)',
              border: '1px solid var(--border-gold)',
            }}
          >
            <span
              className="text-[10px] tracking-[0.15em] uppercase block mb-2"
              style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)', opacity: 0.8 }}
            >
              {item.title}
            </span>
            <p
              className="text-sm leading-relaxed"
              style={{ color: '#E8E2D8', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
            >
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ListSection({ item }: { item: ContentItem }) {
  const listItems = item.body.split('\n').filter(Boolean)
  return (
    <section className="fade-in">
      {item.title && (
        <div className="flex items-center gap-2.5 mb-4">
          <List className="w-4 h-4" style={{ color: 'var(--gold)' }} />
          <h3
            className="text-xs tracking-[0.15em] uppercase"
            style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)' }}
          >
            {item.title}
          </h3>
        </div>
      )}
      <ul className="space-y-3">
        {listItems.map((li, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <span className="mt-2 w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--gold)' }} />
            <span
              className="text-base leading-relaxed"
              style={{ color: '#E8E2D8', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
            >
              {li}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function PrayerSection({ item }: { item: ContentItem }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try { await navigator.clipboard.writeText(item.body) } catch { /* ok */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="fade-in text-center">
      {item.title && (
        <h3
          className="text-lg font-semibold mb-6"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)' }}
        >
          {item.title}
        </h3>
      )}

      <p
        className="text-xl md:text-2xl leading-[2.2] whitespace-pre-line"
        style={{ fontFamily: 'Cormorant Garamond, serif', color: '#E8E2D8', fontWeight: 400 }}
      >
        {item.body}
      </p>

      <button
        onClick={handleCopy}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all duration-200"
        style={{
          background: copied ? 'rgba(201,168,76,0.15)' : 'rgba(201,168,76,0.06)',
          border: '1px solid rgba(201,168,76,0.15)',
          color: copied ? 'var(--gold)' : 'var(--text-muted)',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copiado' : 'Copiar oração'}
      </button>
    </section>
  )
}

function ImageSection({ item }: { item: ContentItem }) {
  return (
    <section className="fade-in text-center">
      {item.image_url && (
        <img
          src={item.image_url}
          alt={item.title || ''}
          className="max-w-full max-h-[50vh] rounded-2xl object-contain mx-auto"
        />
      )}
      {item.title && (
        <p className="text-sm mt-4" style={{ color: 'var(--text-secondary)', fontFamily: 'Poppins, sans-serif' }}>
          {item.title}
        </p>
      )}
    </section>
  )
}
