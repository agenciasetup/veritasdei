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
  ChevronRight,
  Loader2,
  Send,
  Shield,
  Sparkles,
  Swords,
} from 'lucide-react'

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
      <main className="max-w-2xl mx-auto px-4 pt-6 pb-24 md:py-10">
        <Link
          href="/educa"
          className="inline-flex items-center gap-1 text-xs mb-5"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao painel
        </Link>

        <header className="mb-6 text-center">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
            style={{
              background: 'var(--accent-soft)',
              border: '1px solid var(--border-1)',
            }}
          >
            <Swords className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          </div>
          <h1
            className="text-2xl md:text-3xl mb-1"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-1)',
            }}
          >
            Modo Debate
          </h1>
          <p
            className="text-sm max-w-md mx-auto"
            style={{
              color: 'var(--text-2)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Treine sua apologética. A IA encarna um protestante bem formado e
            você defende a fé católica. Cada resposta sua recebe uma nota.
          </p>
        </header>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {topics.map((t) => (
            <li key={t.slug}>
              <button
                type="button"
                onClick={() => selectTopic(t)}
                className="w-full text-left rounded-2xl p-4 active:scale-[0.99] transition-transform"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-1)',
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: 'var(--text-1)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {t.title}
                  </span>
                  <ChevronRight
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: 'var(--accent)' }}
                  />
                </div>
                <p
                  className="text-xs"
                  style={{
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {t.subtitle}
                </p>
              </button>
            </li>
          ))}
        </ul>

        <p
          className="mt-6 text-[11px] text-center px-3"
          style={{
            color: 'var(--text-3)',
            fontFamily: 'var(--font-body)',
          }}
        >
          O oponente não ataca a pessoa e admite quando você argumenta bem.
          Limite de 30 turnos por dia.
        </p>
      </main>
    )
  }

  // ── SALA DE DEBATE ────────────────────────────────────────────────────
  return (
    <main className="max-w-2xl mx-auto px-3 pt-3 pb-28 md:px-4 md:py-6 flex flex-col h-[100dvh]">
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
