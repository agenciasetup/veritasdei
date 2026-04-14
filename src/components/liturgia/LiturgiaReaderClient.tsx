'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Check, Copy, Music, Sparkles } from 'lucide-react'
import type { LiturgiaDia, LeituraRef } from '@/types/liturgia'
import { sanitizeLiturgicalText } from '@/lib/liturgia/text'

type ReadingTabKey = 'primeira' | 'salmo' | 'segunda' | 'aclamacao' | 'evangelho'
type LeituraTabKey = ReadingTabKey | 'reflexao'

interface LiturgiaReaderClientProps {
  liturgia: LiturgiaDia | null
  titulo: string
  accent: string
  bg: string
  hoje: string
  season: string
}

interface LeituraSection {
  key: ReadingTabKey
  label: string
  referencia?: string
  texto: string
  icon: React.ReactNode
}

interface ReflectionData {
  titulo: string
  conexao: string
  mensagem: string
  aplicacao: string
  oracao: string
  pontos: string[]
}

interface TabItem {
  key: LeituraTabKey
  label: string
  icon: React.ReactNode
}

type LiturgicalSegmentType = 'text' | 'call' | 'response' | 'rubric'

interface LiturgicalSegment {
  type: LiturgicalSegmentType
  content: string
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

function normalizeCompare(value: string): string {
  return value.toLowerCase().replace(/[\s.,;:()\-–—]/g, '')
}

function isReferenceOnlyText(text: string, referencia?: string): boolean {
  if (!text.trim()) return true
  if (!referencia?.trim()) return text.trim().length < 40
  return normalizeCompare(text) === normalizeCompare(referencia) || text.trim().length < 40
}

function sanitizeLeitura(leitura: LeituraRef | null): LeituraRef | null {
  if (!leitura) return null

  const referencia = leitura.referencia?.trim() ?? ''
  const texto = sanitizeLiturgicalText(leitura.texto ?? '')

  if (!texto) return null
  return { referencia, texto }
}

function extractEvangelhoChunk(rawText: string): {
  beforeText: string
  evangelhoRef?: string
  evangelhoText: string
} | null {
  const text = rawText.trim()
  if (!text) return null

  const markers = [
    text.search(/\n\s*Evangelho\s*\(/i),
    text.search(/\n\s*Proclamação do Evangelho/i),
  ].filter((index) => index >= 0)

  if (!markers.length) return null

  const markerIndex = Math.min(...markers)
  const beforeText = text.slice(0, markerIndex).trim()
  const chunk = text.slice(markerIndex).trim()

  const refMatch = chunk.match(/^Evangelho\s*\(([^)]+)\)/i) ?? chunk.match(/Evangelho\s*\(([^)]+)\)/i)
  const evangelhoRef = refMatch?.[1]?.trim()

  const evangelhoText = chunk
    .replace(/^Evangelho\s*\([^)]+\)\s*/i, '')
    .trim()

  if (!evangelhoText) return null

  return { beforeText, evangelhoRef, evangelhoText }
}

function normalizeLiturgia(liturgia: LiturgiaDia): {
  primeira: LeituraRef | null
  salmo: LeituraRef | null
  segunda: LeituraRef | null
  aclamacao: LeituraRef | null
  evangelho: LeituraRef | null
} {
  const primeira = sanitizeLeitura(liturgia.primeira_leitura)
  const segunda = sanitizeLeitura(liturgia.segunda_leitura)

  const salmoRef = liturgia.salmo?.referencia?.trim() ?? ''
  let salmoText = sanitizeLiturgicalText(liturgia.salmo?.texto ?? '')

  const aclamacaoRef = liturgia.aclamacao?.referencia?.trim() ?? ''
  let aclamacaoText = sanitizeLiturgicalText(liturgia.aclamacao?.texto ?? '')

  let evangelhoRef = liturgia.evangelho?.referencia?.trim() ?? ''
  let evangelhoText = sanitizeLiturgicalText(liturgia.evangelho?.texto ?? '')

  const salmoChunk = extractEvangelhoChunk(salmoText)
  if (salmoChunk) {
    salmoText = sanitizeLiturgicalText(salmoChunk.beforeText)

    if (isReferenceOnlyText(evangelhoText, evangelhoRef)) {
      evangelhoText = sanitizeLiturgicalText(salmoChunk.evangelhoText)
      if (!evangelhoRef && salmoChunk.evangelhoRef) evangelhoRef = salmoChunk.evangelhoRef
    }
  }

  const aclamacaoChunk = extractEvangelhoChunk(aclamacaoText)
  if (aclamacaoChunk) {
    aclamacaoText = sanitizeLiturgicalText(aclamacaoChunk.beforeText)

    if (isReferenceOnlyText(evangelhoText, evangelhoRef)) {
      evangelhoText = sanitizeLiturgicalText(aclamacaoChunk.evangelhoText)
      if (!evangelhoRef && aclamacaoChunk.evangelhoRef) evangelhoRef = aclamacaoChunk.evangelhoRef
    }
  }

  const salmo = salmoText.trim()
    ? { referencia: salmoRef, texto: salmoText.trim() }
    : null

  const aclamacao = aclamacaoText.trim()
    ? { referencia: aclamacaoRef, texto: aclamacaoText.trim() }
    : null

  const evangelho = evangelhoText.trim()
    ? { referencia: evangelhoRef, texto: evangelhoText.trim() }
    : null

  return {
    primeira,
    salmo,
    segunda,
    aclamacao,
    evangelho,
  }
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\n+|\n(?=[A-ZÀ-Ý\-])/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function normalizePhrase(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.,;:!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const LITURGICAL_RESPONSE_REGEX = /(Palavra da Salva[cç][aã]o|Palavra do Senhor|Gl[oó]ria a v[oó]s,\s*Senhor|Demos gra[cç]as a Deus|Gra[cç]as a Deus)\.?/gi

function splitLiturgicalSegments(paragraph: string): LiturgicalSegment[] {
  const content = paragraph.replace(/\s+/g, ' ').trim()
  if (!content) return []

  LITURGICAL_RESPONSE_REGEX.lastIndex = 0
  const segments: LiturgicalSegment[] = []
  let lastIndex = 0

  for (const match of content.matchAll(LITURGICAL_RESPONSE_REGEX)) {
    const matchText = match[0] ?? ''
    const start = match.index ?? 0

    const before = content
      .slice(lastIndex, start)
      .replace(/[—–-]+\s*$/g, '')
      .trim()
    if (before) {
      segments.push({
        type: /^Proclamação do Evangelho|^Aleluia/i.test(before) ? 'rubric' : 'text',
        content: before,
      })
    }

    const phrase = matchText.replace(/^[—–-\s]+/, '').replace(/[.,;:!?]+$/g, '').trim()
    const normalized = normalizePhrase(phrase)

    if (normalized === 'palavra da salvacao' || normalized === 'palavra do senhor') {
      segments.push({ type: 'call', content: phrase })
    } else {
      segments.push({ type: 'response', content: phrase })
    }

    lastIndex = start + matchText.length
  }

  const tail = content.slice(lastIndex).replace(/^[—–-\s]+/, '').trim()
  if (tail) {
    segments.push({
      type: /^Proclamação do Evangelho|^Aleluia/i.test(tail) ? 'rubric' : 'text',
      content: tail,
    })
  }

  return segments.length ? segments : [{ type: 'text', content }]
}

function renderVerseNumbers(text: string, accent: string): React.ReactNode {
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
          fontSize: '0.68em',
          fontWeight: 700,
          color: `${accent}CC`,
          marginRight: '0.22em',
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

function detectRefrain(lines: string[]): string | null {
  const counts = new Map<string, number>()

  for (const line of lines) {
    const key = line.toLowerCase().trim()
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  let best: { line: string; count: number } | null = null
  for (const line of lines) {
    const count = counts.get(line.toLowerCase().trim()) ?? 0
    if (count < 2) continue
    if (!best || count > best.count) best = { line, count }
  }

  return best?.line ?? null
}

function formatLiturgicalLine(raw: string): string {
  return raw.replace(/^\s*[-–—]\s*/, '').trim()
}

function SalmoTexto({ text, fontScale, accent }: { text: string; fontScale: number; accent: string }) {
  const lines = text
    .split('\n')
    .map((line) => formatLiturgicalLine(line))
    .filter(Boolean)

  const refrain = detectRefrain(lines)

  return (
    <div className="space-y-3.5">
      {lines.map((line, idx) => {
        const isRefrain = !!refrain && line.toLowerCase() === refrain.toLowerCase()
        return (
          <p
            key={`${idx}-${line.slice(0, 16)}`}
            className="tracking-[0.01em]"
            style={{
              color: isRefrain ? '#F2EDE4' : '#ECE6DA',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: isRefrain ? 700 : 400,
              fontSize: `${1.08 * fontScale}rem`,
              lineHeight: 1.85,
              borderLeft: isRefrain ? `2px solid ${accent}` : '2px solid transparent',
              paddingLeft: isRefrain ? '0.75rem' : '0.25rem',
            }}
          >
            {renderVerseNumbers(line, accent)}
          </p>
        )
      })}
    </div>
  )
}

function LeituraTexto({
  text,
  fontScale,
  accent,
  sectionKey,
}: {
  text: string
  fontScale: number
  accent: string
  sectionKey: ReadingTabKey
}) {
  if (sectionKey === 'salmo') {
    return <SalmoTexto text={text} fontScale={fontScale} accent={accent} />
  }

  const paragraphs = splitParagraphs(text)

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, idx) => {
        const segments = splitLiturgicalSegments(paragraph)

        return (
          <div key={idx} className="space-y-2">
            {segments.map((segment, segmentIndex) => {
              const baseStyle = {
                fontFamily: 'Poppins, sans-serif',
                fontSize: `${1.08 * fontScale}rem`,
                lineHeight: 1.95,
              }

              if (segment.type === 'call') {
                return (
                  <p
                    key={`${idx}-call-${segmentIndex}`}
                    className="tracking-[0.01em] font-semibold"
                    style={{ ...baseStyle, color: '#F2EDE4' }}
                  >
                    {renderVerseNumbers(segment.content, accent)}
                  </p>
                )
              }

              if (segment.type === 'response') {
                return (
                  <p
                    key={`${idx}-response-${segmentIndex}`}
                    className="tracking-[0.01em] italic"
                    style={{ ...baseStyle, color: '#E3D8C6', fontWeight: 500 }}
                  >
                    {renderVerseNumbers(segment.content, accent)}
                  </p>
                )
              }

              if (segment.type === 'rubric') {
                return (
                  <p
                    key={`${idx}-rubric-${segmentIndex}`}
                    className="tracking-[0.01em]"
                    style={{ ...baseStyle, color: '#F2EDE4', fontWeight: 600 }}
                  >
                    {renderVerseNumbers(segment.content, accent)}
                  </p>
                )
              }

              return (
                <p
                  key={`${idx}-text-${segmentIndex}`}
                  className="tracking-[0.01em]"
                  style={{ ...baseStyle, color: '#ECE6DA', fontWeight: 350 }}
                >
                  {renderVerseNumbers(segment.content, accent)}
                </p>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function mapLeituraSections(liturgia: LiturgiaDia): LeituraSection[] {
  const normalized = normalizeLiturgia(liturgia)

  const sections: Array<{ key: ReadingTabKey; label: string; leitura: LeituraRef | null; icon: React.ReactNode }> = [
    {
      key: 'primeira',
      label: 'Primeira Leitura',
      leitura: normalized.primeira,
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      key: 'salmo',
      label: 'Salmo Responsorial',
      leitura: normalized.salmo,
      icon: <Music className="w-4 h-4" />,
    },
    {
      key: 'segunda',
      label: 'Segunda Leitura',
      leitura: normalized.segunda,
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      key: 'aclamacao',
      label: 'Aclamação ao Evangelho',
      leitura: normalized.aclamacao,
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      key: 'evangelho',
      label: 'Evangelho',
      leitura: normalized.evangelho,
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

  const tabs = useMemo<TabItem[]>(() => {
    const readingTabs: TabItem[] = sections.map((section) => ({
      key: section.key,
      label: section.label,
      icon: section.icon,
    }))

    if (liturgia) {
      readingTabs.push({
        key: 'reflexao',
        label: 'Reflexão do Dia',
        icon: <Sparkles className="w-4 h-4" />,
      })
    }

    return readingTabs
  }, [sections, liturgia])

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

  const [reflection, setReflection] = useState<ReflectionData | null>(null)
  const [reflectionError, setReflectionError] = useState<string | null>(null)
  const [isReflectionLoading, setIsReflectionLoading] = useState(false)
  const [reflectionCopied, setReflectionCopied] = useState(false)

  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    try {
      window.localStorage.setItem(FONT_STORAGE_KEY, String(fontScale))
    } catch {
      // no-op
    }
  }, [fontScale])

  const activeTab: LeituraTabKey | null =
    manualTab && tabs.some((tab) => tab.key === manualTab)
      ? manualTab
      : tabs[0]?.key ?? null

  const activeSection =
    activeTab && activeTab !== 'reflexao'
      ? sections.find((section) => section.key === activeTab) ?? null
      : null

  const adjustFont = (delta: number) => {
    setFontScale((current) => clampFontScale(current + delta))
  }

  const copyReflection = async () => {
    if (!reflection) return

    const composed = [
      reflection.titulo,
      '',
      `Conexão das leituras:\n${reflection.conexao}`,
      '',
      `Mensagem do dia:\n${reflection.mensagem}`,
      '',
      `Aplicação na vida:\n${reflection.aplicacao}`,
      '',
      `Oração:\n${reflection.oracao}`,
      ...(reflection.pontos.length
        ? ['', 'Pontos-chave:', ...reflection.pontos.map((ponto) => `- ${ponto}`)]
        : []),
    ].join('\n')

    try {
      await navigator.clipboard.writeText(composed)
      setReflectionCopied(true)
      window.setTimeout(() => setReflectionCopied(false), 1600)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = composed
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'absolute'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setReflectionCopied(true)
      window.setTimeout(() => setReflectionCopied(false), 1600)
    }
  }

  const loadReflection = async () => {
    if (!liturgia || reflection || isReflectionLoading) return

    setIsReflectionLoading(true)
    setReflectionError(null)

    try {
      const res = await fetch('/api/liturgia/reflexao', {
        method: 'GET',
        cache: 'no-store',
      })

      const json = (await res.json()) as ReflectionData & { error?: string }
      if (!res.ok) {
        throw new Error(json?.error || 'Não foi possível gerar a reflexão agora.')
      }

      setReflection({
        titulo: json.titulo,
        conexao: json.conexao,
        mensagem: json.mensagem,
        aplicacao: json.aplicacao,
        oracao: json.oracao,
        pontos: Array.isArray(json.pontos) ? json.pontos : [],
      })
    } catch (error) {
      setReflectionError(error instanceof Error ? error.message : 'Erro ao gerar reflexão.')
    } finally {
      setIsReflectionLoading(false)
    }
  }

  const activateTab = (tabKey: LeituraTabKey) => {
    setManualTab(tabKey)
    if (tabKey === 'reflexao') {
      void loadReflection()
    }
  }

  const onTabsKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (!tabs.length) return
    let targetIndex = currentIndex

    if (event.key === 'ArrowRight') targetIndex = (currentIndex + 1) % tabs.length
    if (event.key === 'ArrowLeft') targetIndex = (currentIndex - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') targetIndex = 0
    if (event.key === 'End') targetIndex = tabs.length - 1

    if (targetIndex !== currentIndex) {
      event.preventDefault()
      const target = tabs[targetIndex]
      activateTab(target.key)
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

        {!!tabs.length && (
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
              {tabs.map((tab, index) => {
                const active = tab.key === activeTab
                const tabId = `liturgia-tab-${tab.key}`
                const panelId = `liturgia-panel-${tab.key}`

                return (
                  <button
                    key={tab.key}
                    ref={(element) => {
                      tabRefs.current[index] = element
                    }}
                    id={tabId}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls={panelId}
                    tabIndex={active ? 0 : -1}
                    onClick={() => activateTab(tab.key)}
                    onKeyDown={(event) => onTabsKeyDown(event, index)}
                    className="inline-flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-xl text-xs transition-all"
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      background: active ? 'rgba(201,168,76,0.16)' : 'transparent',
                      border: active ? '1px solid rgba(201,168,76,0.3)' : '1px solid transparent',
                      color: active ? '#D9C077' : '#A8A096',
                    }}
                  >
                    <span aria-hidden="true">{tab.icon}</span>
                    <span>{tab.label}</span>
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
        ) : activeTab === 'reflexao' ? (
          <section
            id="liturgia-panel-reflexao"
            role="tabpanel"
            aria-labelledby="liturgia-tab-reflexao"
            className="rounded-2xl p-5 sm:p-6 md:p-7"
            style={{
              background: 'rgba(20,18,14,0.7)',
              border: '1px solid rgba(201,168,76,0.14)',
              boxShadow: '0 10px 32px rgba(0,0,0,0.25)',
            }}
          >
            {!reflection && isReflectionLoading && (
              <div className="space-y-3">
                <p style={{ color: '#D4CCBE', fontFamily: 'Poppins, sans-serif' }}>
                  Gerando reflexão do dia...
                </p>
                <div className="h-3 rounded" style={{ background: 'rgba(201,168,76,0.18)' }} />
                <div className="h-3 rounded w-11/12" style={{ background: 'rgba(201,168,76,0.14)' }} />
                <div className="h-3 rounded w-10/12" style={{ background: 'rgba(201,168,76,0.1)' }} />
              </div>
            )}

            {!!reflectionError && (
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(217,79,92,0.08)',
                  border: '1px solid rgba(217,79,92,0.2)',
                }}
              >
                <p style={{ color: '#F2D7DA', fontFamily: 'Poppins, sans-serif' }}>
                  {reflectionError}
                </p>
              </div>
            )}

            {reflection && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={copyReflection}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors"
                    style={{
                      border: `1px solid ${accent}44`,
                      color: reflectionCopied ? '#F2EDE4' : '#D4CCBE',
                      background: reflectionCopied ? `${accent}22` : 'rgba(20,18,14,0.45)',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    {reflectionCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {reflectionCopied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>

                <h3
                  className="text-xl sm:text-2xl"
                  style={{ color: '#F2EDE4', fontFamily: 'Cormorant Garamond, serif' }}
                >
                  {reflection.titulo}
                </h3>

                <p style={{ color: '#ECE6DA', fontFamily: 'Poppins, sans-serif', lineHeight: 1.9 }}>
                  {reflection.conexao}
                </p>

                {!!reflection.pontos.length && (
                  <div className="space-y-2">
                    {reflection.pontos.map((ponto, idx) => (
                      <p
                        key={`${idx}-${ponto.slice(0, 12)}`}
                        className="pl-3"
                        style={{
                          color: '#ECE6DA',
                          borderLeft: `2px solid ${accent}`,
                          fontFamily: 'Poppins, sans-serif',
                          lineHeight: 1.8,
                        }}
                      >
                        {ponto}
                      </p>
                    ))}
                  </div>
                )}

                <p style={{ color: '#ECE6DA', fontFamily: 'Poppins, sans-serif', lineHeight: 1.9 }}>
                  <strong style={{ color: '#F2EDE4' }}>Mensagem do dia:</strong> {reflection.mensagem}
                </p>

                <p style={{ color: '#ECE6DA', fontFamily: 'Poppins, sans-serif', lineHeight: 1.9 }}>
                  <strong style={{ color: '#F2EDE4' }}>Aplicação prática:</strong> {reflection.aplicacao}
                </p>

                <p
                  style={{
                    color: '#F2EDE4',
                    fontFamily: 'Cormorant Garamond, serif',
                    fontStyle: 'italic',
                    fontSize: '1.1rem',
                    lineHeight: 1.8,
                  }}
                >
                  {reflection.oracao}
                </p>
              </div>
            )}
          </section>
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
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: `${accent}16`, color: accent }}
                aria-hidden="true"
              >
                {activeSection.icon}
              </span>
              <div className="flex flex-col gap-1">
                <p
                  className="text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
                >
                  {activeSection.label}
                </p>
                {activeSection.referencia && (
                  <p
                    className="text-[0.95rem] font-semibold inline-block w-fit px-2.5 py-1 rounded-full"
                    style={{
                      color: '#0F0E0C',
                      background: `${accent}E6`,
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    {activeSection.referencia}
                  </p>
                )}
              </div>
            </div>

            <div className="max-w-[70ch]">
              <LeituraTexto
                text={activeSection.texto}
                fontScale={fontScale}
                accent={accent}
                sectionKey={activeSection.key}
              />
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
