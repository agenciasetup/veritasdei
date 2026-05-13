'use client'

/**
 * Sala de debate — chat estilo telegram, mobile-first.
 *
 * Fluxo:
 *  1. Usuário escolhe um tema (grade de cards).
 *  2. Sistema dispara `/api/educa/debate` com history vazio → IA abre o
 *     debate com a frase canônica do tema.
 *  3. Usuário responde → POST com histórico → IA replica + envia eval.
 *  4. Após cada turno, mostramos um scorecard discreto (bíblico, magistério,
 *     caridade) com a frase de feedback.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpenCheck,
  Book,
  ChevronRight,
  Crown,
  Flame,
  Heart,
  Loader2,
  Send,
  Shield,
  Sparkles,
  Swords,
  Wine,
} from 'lucide-react'
import GlassCard from '@/components/educa/GlassCard'

type Topic = { slug: string; title: string; subtitle: string }

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type Evaluation = {
  biblical: number
  magisterium: number
  charity: number
  comment: string
}

type DebateApiResponse = {
  reply: string
  eval: Evaluation
  conceded: boolean
  error?: string
}

const MAX_USER_CHARS = 1000

function mkId() {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

export default function DebateRoom({ topics }: { topics: Topic[] }) {
  const [topic, setTopic] = useState<Topic | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [evals, setEvals] = useState<Record<string, Evaluation>>({})
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  // Scroll to bottom on new message
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, loading])

  const callApi = useCallback(
    async (topicSlug: string, history: ChatMessage[]) => {
      setError(null)
      setLoading(true)
      try {
        const res = await fetch('/api/educa/debate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: topicSlug,
            messages: history.map((m) => ({ role: m.role, content: m.content })),
          }),
        })
        const data = (await res.json()) as DebateApiResponse
        if (!res.ok) {
          throw new Error(data?.error || 'Falha ao chamar o oponente.')
        }
        const id = mkId()
        setMessages((cur) => [
          ...cur,
          { id, role: 'assistant', content: data.reply },
        ])
        // O eval que vem na resposta avalia a ÚLTIMA mensagem do user.
        // Encontra esse id pra associar a nota:
        if (history.length > 0) {
          const lastUserMsg = [...history].reverse().find((m) => m.role === 'user')
          if (lastUserMsg) {
            setEvals((prev) => ({ ...prev, [lastUserMsg.id]: data.eval }))
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  function selectTopic(t: Topic) {
    setTopic(t)
    setMessages([])
    setEvals({})
    setError(null)
    callApi(t.slug, [])
  }

  function reset() {
    setTopic(null)
    setMessages([])
    setEvals({})
    setError(null)
    setDraft('')
  }

  async function sendUser() {
    const txt = draft.trim()
    if (!topic || !txt || loading) return
    if (txt.length < 3) {
      setError('Mensagem muito curta.')
      return
    }
    const userMsg: ChatMessage = {
      id: mkId(),
      role: 'user',
      content: txt.slice(0, MAX_USER_CHARS),
    }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    setDraft('')
    await callApi(topic.slug, newHistory)
  }

  // ── PICKER DE TEMA ────────────────────────────────────────────────────
  if (!topic) {
    return (
      <div
        className="min-h-screen relative"
        style={{
          background:
            'radial-gradient(ellipse 800px 500px at 50% -10%, color-mix(in srgb, var(--wine) 18%, transparent), transparent 70%), radial-gradient(ellipse 600px 400px at 80% 100%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 70%), var(--surface-1)',
        }}
      >
        <main className="max-w-3xl mx-auto px-4 pt-6 pb-24 md:py-12">
          <Link
            href="/educa"
            className="inline-flex items-center gap-1 text-xs mb-6"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao painel
          </Link>

          <header className="mb-8 md:mb-10 text-center">
            <div
              className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-3xl mb-4 relative"
              style={{
                background:
                  'linear-gradient(135deg, color-mix(in srgb, var(--wine-light) 50%, rgba(0,0,0,0.4)) 0%, rgba(0,0,0,0.6) 100%)',
                border:
                  '1.5px solid color-mix(in srgb, var(--accent) 35%, transparent)',
                boxShadow:
                  '0 12px 32px -12px color-mix(in srgb, var(--wine) 40%, transparent), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <Swords
                className="w-7 h-7 md:w-9 md:h-9"
                style={{ color: 'var(--accent)' }}
              />
            </div>
            <p
              className="text-[10px] md:text-xs tracking-[0.3em] uppercase mb-2"
              style={{
                color: 'var(--accent)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Apologética católica
            </p>
            <h1
              className="text-3xl md:text-5xl mb-3"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--text-1)',
                textShadow: '0 2px 12px rgba(0,0,0,0.4)',
              }}
            >
              Modo Debate
            </h1>
            <p
              className="text-sm md:text-base max-w-lg mx-auto"
              style={{
                color: 'var(--text-2)',
                fontFamily: 'var(--font-body)',
              }}
            >
              A IA encarna um protestante bem formado. Você defende a fé
              católica. Cada resposta recebe uma nota — bíblica, magistério e caridade.
            </p>
          </header>

          <p
            className="text-[10px] tracking-[0.2em] uppercase text-center mb-4"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-display)',
            }}
          >
            Escolha o tema do debate
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {topics.map((t) => (
              <li key={t.slug}>
                <button
                  type="button"
                  onClick={() => selectTopic(t)}
                  className="w-full text-left active:scale-[0.99] transition-transform"
                >
                  <TopicCard slug={t.slug} title={t.title} subtitle={t.subtitle} />
                </button>
              </li>
            ))}
          </ul>

          <p
            className="mt-8 text-[11px] text-center px-3"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            O oponente não ataca a pessoa e admite quando você argumenta bem.
            Limite de 30 turnos por dia.
          </p>
        </main>
      </div>
    )
  }

  // ── SALA DE DEBATE ────────────────────────────────────────────────────
  return (
    <div
      className="relative"
      style={{
        background:
          'radial-gradient(ellipse 600px 400px at 50% 0%, color-mix(in srgb, var(--wine) 14%, transparent), transparent 70%), var(--surface-1)',
        minHeight: '100dvh',
      }}
    >
    <main className="max-w-2xl mx-auto px-3 pt-3 pb-28 md:px-4 md:py-6 flex flex-col h-[100dvh] relative">
      {/* Header */}
      <header
        className="flex items-center justify-between gap-2 mb-3 px-1"
        style={{ flexShrink: 0 }}
      >
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1 text-xs"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Trocar tema
        </button>
        <div className="text-center min-w-0">
          <p
            className="text-[10px] tracking-[0.2em] uppercase"
            style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
          >
            Debate
          </p>
          <p
            className="text-sm truncate"
            style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
          >
            {topic.title}
          </p>
        </div>
        <span className="w-12" />
      </header>

      {/* Chat */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto rounded-2xl p-3 space-y-3"
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-1)',
        }}
      >
        {messages.length === 0 && loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2
              className="w-5 h-5 animate-spin"
              style={{ color: 'var(--accent)' }}
            />
          </div>
        )}

        {messages.map((m) => {
          const ev = m.role === 'user' ? evals[m.id] : null
          return (
            <div key={m.id}>
              <div
                className={`flex ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap"
                  style={{
                    background:
                      m.role === 'user'
                        ? 'var(--accent)'
                        : 'var(--surface-2)',
                    color:
                      m.role === 'user'
                        ? 'var(--accent-contrast)'
                        : 'var(--text-1)',
                    border:
                      m.role === 'assistant'
                        ? '1px solid var(--border-1)'
                        : undefined,
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {m.content}
                </div>
              </div>
              {ev && <Scorecard ev={ev} />}
            </div>
          )
        })}

        {loading && messages.length > 0 && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl px-3 py-2 text-xs flex items-center gap-2"
              style={{
                background: 'var(--surface-2)',
                color: 'var(--text-3)',
                border: '1px solid var(--border-1)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <Loader2 className="w-3 h-3 animate-spin" /> pensando...
            </div>
          </div>
        )}
      </div>

      {error && (
        <p
          className="mt-2 text-xs px-3 py-2 rounded-xl"
          style={{
            background: 'color-mix(in srgb, var(--warning) 12%, transparent)',
            color: 'var(--warning)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {error}
        </p>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          sendUser()
        }}
        className="mt-3 flex items-end gap-2"
        style={{ flexShrink: 0 }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_USER_CHARS))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendUser()
            }
          }}
          placeholder="Responda em PT. Use a Bíblia, o Magistério e a razão."
          rows={2}
          className="flex-1 rounded-2xl px-3 py-2.5 text-sm outline-none resize-none"
          style={{
            background: 'var(--surface-inset)',
            border: '1px solid var(--border-1)',
            color: 'var(--text-1)',
            fontFamily: 'var(--font-body)',
          }}
        />
        <button
          type="submit"
          disabled={loading || draft.trim().length < 3}
          className="rounded-2xl w-12 h-12 flex items-center justify-center flex-shrink-0 disabled:opacity-50 transition-opacity"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-contrast)',
          }}
          aria-label="Enviar"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </main>
    </div>
  )
}

/** Ícone + gradient sutil por tema. Paleta sacra (ouro/vinho/bronze). */
const TOPIC_VISUAL: Record<
  string,
  { icon: React.ElementType; accent: string; gradient: string }
> = {
  'sola-scriptura': {
    icon: Book,
    accent: '#C9A84C',
    gradient:
      'linear-gradient(135deg, color-mix(in srgb, #C9A84C 14%, rgba(20,18,16,0.7)) 0%, rgba(15,14,12,0.65) 100%)',
  },
  'sola-fide': {
    icon: Flame,
    accent: '#E5C97A',
    gradient:
      'linear-gradient(135deg, color-mix(in srgb, #E5C97A 12%, rgba(20,18,16,0.7)) 0%, rgba(15,14,12,0.65) 100%)',
  },
  'maria': {
    icon: Heart,
    accent: '#C66B7E',
    gradient:
      'linear-gradient(135deg, color-mix(in srgb, var(--wine-light) 22%, rgba(20,18,16,0.7)) 0%, rgba(15,14,12,0.65) 100%)',
  },
  'eucaristia': {
    icon: Wine,
    accent: '#A33247',
    gradient:
      'linear-gradient(135deg, color-mix(in srgb, var(--wine) 32%, rgba(20,18,16,0.7)) 0%, rgba(15,14,12,0.65) 100%)',
  },
  'papado': {
    icon: Crown,
    accent: '#C9A84C',
    gradient:
      'linear-gradient(135deg, color-mix(in srgb, #C9A84C 16%, rgba(20,18,16,0.7)) 0%, rgba(15,14,12,0.65) 100%)',
  },
}

function TopicCard({
  slug,
  title,
  subtitle,
}: {
  slug: string
  title: string
  subtitle: string
}) {
  const v = TOPIC_VISUAL[slug] ?? {
    icon: Shield,
    accent: '#C9A84C',
    gradient:
      'linear-gradient(135deg, rgba(20,18,16,0.7) 0%, rgba(15,14,12,0.65) 100%)',
  }
  const Icon = v.icon
  return (
    <div
      className="rounded-2xl p-4 md:p-5 relative overflow-hidden"
      style={{
        background: v.gradient,
        border: `1px solid color-mix(in srgb, ${v.accent} 22%, transparent)`,
        backdropFilter: 'blur(16px) saturate(140%)',
        boxShadow: `0 6px 24px -10px color-mix(in srgb, ${v.accent} 30%, transparent), inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {/* Glow decorativo */}
      <div
        aria-hidden
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-50"
        style={{
          background: `radial-gradient(circle, ${v.accent}33 0%, transparent 70%)`,
        }}
      />
      <div className="relative flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(0,0,0,0.45)',
            border: `1px solid color-mix(in srgb, ${v.accent} 35%, transparent)`,
          }}
        >
          <Icon className="w-5 h-5" style={{ color: v.accent }} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-base md:text-lg leading-tight mb-1"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-1)',
            }}
          >
            {title}
          </p>
          <p
            className="text-xs leading-relaxed"
            style={{
              color: 'var(--text-2)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {subtitle}
          </p>
        </div>
        <ChevronRight
          className="w-4 h-4 flex-shrink-0 self-center"
          style={{ color: v.accent }}
        />
      </div>
    </div>
  )
}

function Scorecard({ ev }: { ev: Evaluation }) {
  const total = ev.biblical + ev.magisterium + ev.charity
  return (
    <div
      className="flex justify-end mt-1.5"
      aria-label={`Avaliação da sua resposta: ${total}/9`}
    >
      <div
        className="max-w-[85%] rounded-xl px-3 py-2 text-[11px]"
        style={{
          background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent) 22%, transparent)',
          color: 'var(--text-2)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <div className="flex items-center gap-3 mb-1">
          <Pill icon={BookOpenCheck} label="Bíblia" score={ev.biblical} />
          <Pill icon={Sparkles} label="Magistério" score={ev.magisterium} />
          <Pill icon={Shield} label="Caridade" score={ev.charity} />
        </div>
        {ev.comment && ev.comment !== '—' && (
          <p style={{ color: 'var(--text-3)' }}>{ev.comment}</p>
        )}
      </div>
    </div>
  )
}

function Pill({
  icon: Icon,
  label,
  score,
}: {
  icon: React.ElementType
  label: string
  score: number
}) {
  return (
    <span
      className="inline-flex items-center gap-1"
      title={`${label}: ${score}/3`}
      style={{ color: 'var(--accent)' }}
    >
      <Icon className="w-3 h-3" />
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
        {score}/3
      </span>
      <span className="sr-only">{label}</span>
    </span>
  )
}
