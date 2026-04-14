'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Music, Sparkles } from 'lucide-react'
import type { LiturgiaDia, LeituraRef } from '@/types/liturgia'

type LeituraTabKey = 'primeira' | 'salmo' | 'segunda' | 'aclamacao' | 'evangelho'

interface LiturgiaReaderClientProps {
  liturgia: LiturgiaDia | null
  titulo: string
  accent: string
  bg: string
  hoje: string
  season: string
}

interface LeituraSection {
  key: LeituraTabKey
  label: string
  referencia?: string
  texto: string
  icon: React.ReactNode
}

const FONT_STORAGE_KEY = 'liturgia_font_scale_v1'
const FONT_STEP = 0.05
const FONT_MIN = 0.9
const FONT_MAX = 1.35
const FONT_BASE = 1

function clampFontScale(value: number): number {
  if (Number.isNaN(value)) return FONT_BASE
  return Math.max(FONT_MIN, Math.min(FONT_MAX, Number(value.toFixed(2))))
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\n+|\n(?=[A-ZÀ-Ý\-])/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function renderVerseNumbers(text: string): React.ReactNode {
  const regex = /(^|[\s([{"'“‘-])(\d{1,3})(?=\s+[A-Za-zÀ-ÿ])/g
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let supKey = 0
  let match: RegExpExecArray | null = null

  while ((match = regex.exec(text)) !== null) {
    const prefix = match[1]
    const number = match[2]
    const fullMatchStart = match.index
    const numberStart = fullMatchStart + prefix.length
    const numberEnd = numberStart + number.length

    if (numberStart > lastIndex) nodes.push(text.slice(lastIndex, numberStart))
    nodes.push(
      <sup
        key={`verse-${supKey++}`}
        className="align-super select-none"
        style={{
          fontSize: '0.62em',
          fontWeight: 600,
          color: 'rgba(168,160,150,0.85)',
          marginRight: '0.2em',
          letterSpacing: '0.01em',
        }}
        aria-hidden="true"
      >
        {number}
      </sup>,
    )
    lastIndex = numberEnd
  }

  if (nodes.length === 0) return text
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

function LeituraTexto({ text, fontScale }: { text: string; fontScale: number }) {
  const paragraphs = useMemo(() => splitParagraphs(text), [text])

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, idx) => (
        <p
          key={idx}
          className="tracking-[0.01em]"
          style={{
            color: '#ECE6DA',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 300,
            fontSize: `${1.08 * fontScale}rem`,
            lineHeight: 1.95,
          }}
        >
          {renderVerseNumbers(paragraph)}
        </p>
      ))}
    </div>
  )
}

function mapLeituraSections(liturgia: LiturgiaDia): LeituraSection[] {
  const sections: Array<{ key: LeituraTabKey; label: string; leitura: LeituraRef | null; icon: React.ReactNode }> = [
    {
      key: 'primeira',
      label: 'Primeira Leitura',
      leitura: liturgia.primeira_leitura,
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      key: 'salmo',
      label: 'Salmo Responsorial',
      leitura: liturgia.salmo,
      icon: <Music className="w-4 h-4" />,
    },
    {
      key: 'segunda',
      label: 'Segunda Leitura',
      leitura: liturgia.segunda_leitura,
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      key: 'aclamacao',
      label: 'Aclamação ao Evangelho',
      leitura: liturgia.aclamacao,
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      key: 'evangelho',
      label: 'Evangelho',
      leitura: liturgia.evangelho,
      icon: <BookOpen className="w-4 h-4" />,
    },
  ]

  return sections
    .filter((item) => item.leitura && item.leitura.texto?.trim())
    .map((item) => ({
      key: item.key,
      label: item.label,
      referencia: item.leitura?.referencia,
      texto: item.leitura?.texto ?? '',
      icon: item.icon,
    }))
}

export default function LiturgiaReaderClient({
  liturgia,
  titulo,
  accent,
  bg,
  hoje,
  season,
}: LiturgiaReaderClientProps) {
  const sections = useMemo(() => (liturgia ? mapLeituraSections(liturgia) : []), [liturgia])
  const [manualTab, setManualTab] = useState<LeituraTabKey | null>(null)
  const [fontScale, setFontScale] = useState<number>(() => {
    if (typeof window === 'undefined') return FONT_BASE
    try {
      const raw = window.localStorage.getItem(FONT_STORAGE_KEY)
      if (!raw) return FONT_BASE
      return clampFontScale(Number(raw))
    } catch {
      return FONT_BASE
    }
  })
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    try {
      window.localStorage.setItem(FONT_STORAGE_KEY, String(fontScale))
    } catch {
      // no-op
    }
  }, [fontScale])

  const activeTab: LeituraTabKey | null =
    manualTab && sections.some((section) => section.key === manualTab)
      ? manualTab
      : sections[0]?.key ?? null

  const activeSection = activeTab
    ? sections.find((section) => section.key === activeTab) ?? null
    : null

  const adjustFont = (delta: number) => {
    setFontScale((current) => clampFontScale(current + delta))
  }

  const onTabsKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (!sections.length) return
    let targetIndex = currentIndex

    if (event.key === 'ArrowRight') targetIndex = (currentIndex + 1) % sections.length
    if (event.key === 'ArrowLeft') targetIndex = (currentIndex - 1 + sections.length) % sections.length
    if (event.key === 'Home') targetIndex = 0
    if (event.key === 'End') targetIndex = sections.length - 1

    if (targetIndex !== currentIndex) {
      event.preventDefault()
      const target = sections[targetIndex]
      setManualTab(target.key)
      tabRefs.current[targetIndex]?.focus()
    }
  }

  return (
    <>
      <header
        className="sticky top-0 z-30 backdrop-blur-md border-b"
        style={{
          background: bg,
          borderColor: `${accent}22`,
        }}
      >
        <div className="px-4 pt-4 pb-3 max-w-5xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs"
              style={{ color: '#A8A096', fontFamily: 'Poppins, sans-serif' }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar
            </Link>

            <div className="inline-flex items-center rounded-xl border px-1 py-1" style={{ borderColor: `${accent}33` }}>
              <button
                type="button"
                onClick={() => adjustFont(-FONT_STEP)}
                className="px-2.5 py-1 rounded-lg text-xs transition-colors"
                style={{ color: '#D4CCBE', fontFamily: 'Poppins, sans-serif' }}
                aria-label="Diminuir tamanho da fonte"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => adjustFont(FONT_STEP)}
                className="px-2.5 py-1 rounded-lg text-xs transition-colors"
                style={{ color: '#D4CCBE', fontFamily: 'Poppins, sans-serif' }}
                aria-label="Aumentar tamanho da fonte"
              >
                A+
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 mb-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
            />
            <span
              className="text-[10px] uppercase tracking-[0.18em]"
              style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
            >
              Liturgia de hoje · {season}
            </span>
          </div>

          <h1
            className="text-[1.6rem] sm:text-3xl leading-tight"
            style={{ color: '#F2EDE4', fontFamily: 'Cormorant Garamond, serif' }}
          >
            {titulo}
          </h1>
          <p
            className="text-sm capitalize mt-1"
            style={{ color: '#A8A096', fontFamily: 'Poppins, sans-serif' }}
          >
            {hoje}
          </p>

          {liturgia?.stale && (
            <p
              className="mt-2 text-[10px]"
              style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
            >
              Conteúdo em cache — atualização indisponível no momento
            </p>
          )}
        </div>

        {!!sections.length && (
          <div className="px-3 pb-3 max-w-5xl mx-auto">
            <div
              role="tablist"
              aria-label="Leituras da liturgia diária"
              className="flex gap-2 overflow-x-auto no-scrollbar p-1 rounded-2xl"
              style={{
                background: 'rgba(10,10,10,0.55)',
                border: '1px solid rgba(201,168,76,0.12)',
              }}
            >
              {sections.map((section, index) => {
                const active = section.key === activeTab
                const tabId = `liturgia-tab-${section.key}`
                const panelId = `liturgia-panel-${section.key}`

                return (
                  <button
                    key={section.key}
                    ref={(element) => {
                      tabRefs.current[index] = element
                    }}
                    id={tabId}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls={panelId}
                    tabIndex={active ? 0 : -1}
                    onClick={() => setManualTab(section.key)}
                    onKeyDown={(event) => onTabsKeyDown(event, index)}
                    className="inline-flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-xl text-xs transition-all"
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      background: active ? 'rgba(201,168,76,0.16)' : 'transparent',
                      border: active ? '1px solid rgba(201,168,76,0.3)' : '1px solid transparent',
                      color: active ? '#D9C077' : '#A8A096',
                    }}
                  >
                    <span aria-hidden="true">{section.icon}</span>
                    <span>{section.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </header>

      <article className="px-5 pt-6 pb-24 max-w-5xl mx-auto">
        {!liturgia ? (
          <div
            className="rounded-2xl p-5 text-center"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p
              className="text-sm"
              style={{ color: '#A8A096', fontFamily: 'Poppins, sans-serif' }}
            >
              Não foi possível carregar as leituras agora. Tente novamente em instantes.
            </p>
            <p
              className="mt-2 text-xs"
              style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
            >
              Fonte: Liturgia Diária — Canção Nova
            </p>
          </div>
        ) : !activeSection ? (
          <div
            className="rounded-2xl p-5 text-center"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p
              className="text-sm"
              style={{ color: '#A8A096', fontFamily: 'Poppins, sans-serif' }}
            >
              Leituras indisponíveis para esta data.
            </p>
          </div>
        ) : (
          <section
            id={`liturgia-panel-${activeSection.key}`}
            role="tabpanel"
            aria-labelledby={`liturgia-tab-${activeSection.key}`}
            className="rounded-2xl p-5 sm:p-6 md:p-7"
            style={{
              background: 'rgba(20,18,14,0.7)',
              border: '1px solid rgba(201,168,76,0.14)',
              boxShadow: '0 10px 32px rgba(0,0,0,0.25)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: `${accent}16`, color: accent }}
                aria-hidden="true"
              >
                {activeSection.icon}
              </span>
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
                >
                  {activeSection.label}
                </p>
                {activeSection.referencia && (
                  <p
                    className="text-sm"
                    style={{ color: accent, fontFamily: 'Poppins, sans-serif' }}
                  >
                    {activeSection.referencia}
                  </p>
                )}
              </div>
            </div>

            <div className="max-w-[70ch]">
              <LeituraTexto text={activeSection.texto} fontScale={fontScale} />
            </div>
          </section>
        )}

        <footer
          className="mt-10 pt-6 border-t text-center"
          style={{ borderColor: 'rgba(201,168,76,0.12)' }}
        >
          <p
            className="text-[11px] tracking-wider"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
          >
            Leituras extraídas da Liturgia Diária — Canção Nova
          </p>
        </footer>
      </article>
    </>
  )
}
