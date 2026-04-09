'use client'

import { useState } from 'react'
import { Copy, Check, BookOpen, Scroll, Quote } from 'lucide-react'

/* ─── Title Slide ─── */
export function TitleSlide({
  number,
  title,
  subtitle,
  description,
}: {
  number: string
  title: string
  subtitle?: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[45vh]">
      {/* Number badge */}
      <span
        className="inline-block px-4 py-1.5 rounded-full text-xs tracking-widest uppercase mb-6"
        style={{
          background: 'rgba(201,168,76,0.1)',
          border: '1px solid rgba(201,168,76,0.2)',
          color: '#C9A84C',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {number}
      </span>

      {/* Title */}
      <h2
        className="text-2xl md:text-3xl font-bold leading-tight mb-4"
        style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
      >
        {title}
      </h2>

      {subtitle && (
        <p
          className="text-sm italic mb-4"
          style={{ color: '#7A7368', fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem' }}
        >
          {subtitle}
        </p>
      )}

      {/* Ornament */}
      <div className="flex items-center gap-3 my-4 w-48">
        <span className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.2)' }} />
        <Scroll className="w-4 h-4" style={{ color: '#C9A84C', opacity: 0.5 }} />
        <span className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.2)' }} />
      </div>

      {/* Short description */}
      <p
        className="text-base leading-relaxed max-w-md"
        style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
      >
        {description}
      </p>
    </div>
  )
}

/* ─── Explanation Slide ─── */
export function ExplanationSlide({
  title,
  text,
}: {
  title: string
  text: string
}) {
  return (
    <div className="flex flex-col justify-center min-h-[45vh]">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-5 h-5" style={{ color: '#C9A84C' }} />
        <h3
          className="text-sm tracking-wider uppercase"
          style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
        >
          {title}
        </h3>
      </div>

      <p
        className="text-lg leading-[2] tracking-wide"
        style={{
          color: '#E8E2D8',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 300,
        }}
      >
        {text}
      </p>
    </div>
  )
}

/* ─── Verse Slide ─── */
export function VerseSlide({
  reference,
  text,
  copyText,
}: {
  reference: string
  text: string
  copyText?: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const content = copyText || `${reference}\n\n${text}`
    try { await navigator.clipboard.writeText(content) } catch { /* ok */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col justify-center min-h-[45vh]">
      <div className="flex items-center gap-3 mb-6">
        <Quote className="w-5 h-5" style={{ color: '#8B3145' }} />
        <h3
          className="text-sm tracking-wider uppercase"
          style={{ fontFamily: 'Cinzel, serif', color: '#8B3145' }}
        >
          Fundamentação Bíblica
        </h3>
      </div>

      {/* Reference */}
      <span
        className="text-base font-semibold tracking-wider uppercase mb-4 block"
        style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
      >
        {reference}
      </span>

      {/* Verse text */}
      <blockquote
        className="text-xl md:text-2xl leading-[1.9] italic"
        style={{
          color: '#E8E2D8',
          fontFamily: 'Cormorant Garamond, serif',
          borderLeft: '3px solid rgba(107,29,42,0.5)',
          paddingLeft: '1.5rem',
        }}
      >
        &ldquo;{text}&rdquo;
      </blockquote>

      {/* Copy */}
      <button
        onClick={handleCopy}
        className="mt-6 self-start flex items-center gap-2 px-4 py-2 rounded-xl text-xs tracking-wider transition-all duration-200"
        style={{
          background: copied ? 'rgba(201,168,76,0.15)' : 'rgba(201,168,76,0.06)',
          border: '1px solid rgba(201,168,76,0.15)',
          color: copied ? '#C9A84C' : '#7A7368',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copiado' : 'Copiar versículo'}
      </button>
    </div>
  )
}

/* ─── Info/Details Slide (for sacramentos etc) ─── */
export function DetailSlide({
  title,
  items,
}: {
  title: string
  items: { label: string; value: string }[]
}) {
  return (
    <div className="flex flex-col justify-center min-h-[45vh]">
      <h3
        className="text-sm tracking-wider uppercase mb-6 flex items-center gap-3"
        style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
      >
        <Scroll className="w-5 h-5" />
        {title}
      </h3>

      <div className="space-y-5">
        {items.map((item) => (
          <div key={item.label}>
            <span
              className="text-xs tracking-wider uppercase block mb-1.5"
              style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C', opacity: 0.8 }}
            >
              {item.label}
            </span>
            <p
              className="text-base leading-relaxed"
              style={{ color: '#E8E2D8', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── List Slide (for effects etc) ─── */
export function ListSlide({
  title,
  items,
}: {
  title: string
  items: string[]
}) {
  return (
    <div className="flex flex-col justify-center min-h-[45vh]">
      <h3
        className="text-sm tracking-wider uppercase mb-6 flex items-center gap-3"
        style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
      >
        <BookOpen className="w-5 h-5" />
        {title}
      </h3>

      <ul className="space-y-3">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-base leading-relaxed"
            style={{ color: '#E8E2D8', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
          >
            <span
              className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: '#C9A84C' }}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
