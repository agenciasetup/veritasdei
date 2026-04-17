/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { RefObject } from 'react'
import CrossIcon from '@/components/icons/CrossIcon'
import type { CommunityRole } from '@/lib/community/types'
import VerifiedBadge from '@/components/comunidade/VerifiedBadge'

interface MentionMatch {
  id: string
  handle: string
  name: string
  avatar_url: string | null
  community_role: CommunityRole
  verified: boolean
}

interface ActiveMention {
  // Char index no valor onde começou o "@"
  start: number
  // Texto atual depois do @ (sem o @)
  query: string
}

/**
 * Detecta se o caret do textarea/input está dentro de uma menção ativa
 * (precedida por "@"), retornando início + query. Retorna null se não.
 */
export function detectMention(value: string, caret: number): ActiveMention | null {
  if (caret === 0) return null
  // Olha pra trás até achar espaço ou @ ou início.
  let i = caret - 1
  while (i >= 0) {
    const ch = value[i]
    if (ch === '@') {
      // Char antes do @ precisa ser início ou whitespace (senão é email-like).
      const prev = i === 0 ? ' ' : value[i - 1]
      if (/\s/.test(prev)) {
        const query = value.slice(i + 1, caret)
        // Limita o query a char set do handle.
        if (/^[a-zA-Z0-9_]*$/.test(query) && query.length <= 20) {
          return { start: i, query }
        }
      }
      return null
    }
    if (/\s/.test(ch)) return null
    i--
  }
  return null
}

interface Props {
  inputRef: RefObject<HTMLTextAreaElement | HTMLInputElement | null>
  value: string
  onInsert: (nextValue: string, nextCaret: number) => void
}

export default function MentionAutocomplete({ inputRef, value, onInsert }: Props) {
  const [active, setActive] = useState<ActiveMention | null>(null)
  const [matches, setMatches] = useState<MentionMatch[]>([])
  const [selected, setSelected] = useState(0)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // Checa posição do caret e atualiza "active".
  const reevaluate = useCallback(() => {
    const el = inputRef.current
    if (!el) {
      setActive(null)
      return
    }
    const caret = el.selectionStart ?? 0
    const next = detectMention(el.value, caret)
    setActive(next)
    setSelected(0)
  }, [inputRef])

  useEffect(() => {
    reevaluate()
  }, [value, reevaluate])

  // Busca matches quando query mudar (debounced 150ms).
  useEffect(() => {
    if (!active || active.query.length < 1) {
      setMatches([])
      setLoading(false)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/comunidade/mentions?q=${encodeURIComponent(active.query)}`,
          { signal: controller.signal, cache: 'no-store' },
        )
        if (!res.ok) throw new Error()
        const data = (await res.json()) as { matches: MentionMatch[] }
        setMatches(data.matches)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setMatches([])
        }
      } finally {
        setLoading(false)
      }
    }, 150)

    return () => {
      controller.abort()
      clearTimeout(t)
    }
  }, [active])

  const insertMention = useCallback(
    (handle: string) => {
      if (!active) return
      const el = inputRef.current
      if (!el) return

      const caret = el.selectionStart ?? value.length
      const before = value.slice(0, active.start)
      const after = value.slice(caret)
      const insert = `@${handle} `
      const next = before + insert + after
      const nextCaret = before.length + insert.length
      onInsert(next, nextCaret)
      setActive(null)
      setMatches([])
      // Foca de volta no input com caret na posição correta.
      requestAnimationFrame(() => {
        el.focus()
        try {
          if ('setSelectionRange' in el) {
            el.setSelectionRange(nextCaret, nextCaret)
          }
        } catch {
          /* ignore */
        }
      })
    },
    [active, value, inputRef, onInsert],
  )

  // Captura setas/Enter/Esc quando o dropdown está visível.
  useEffect(() => {
    const el = inputRef.current
    if (!el || !active || matches.length === 0) return

    const onKeyDown: EventListener = (event) => {
      const e = event as unknown as { key: string; preventDefault: () => void }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected(s => Math.min(s + 1, matches.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected(s => Math.max(s - 1, 0))
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        const pick = matches[selected]
        if (pick) insertMention(pick.handle)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setActive(null)
        setMatches([])
      }
    }

    el.addEventListener('keydown', onKeyDown)
    return () => el.removeEventListener('keydown', onKeyDown)
  }, [active, matches, selected, insertMention, inputRef])

  if (!active || (matches.length === 0 && !loading) || active.query.length < 1) {
    return null
  }

  return (
    <div
      className="absolute z-30 left-0 right-0 mt-1 rounded-xl overflow-hidden"
      style={{
        background: 'rgba(16,16,16,0.96)',
        border: '1px solid rgba(201,168,76,0.25)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {loading && matches.length === 0 && (
        <div
          className="px-3 py-2 text-xs"
          style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
        >
          Buscando @{active.query}...
        </div>
      )}

      {matches.map((m, idx) => (
        <button
          key={m.id}
          type="button"
          onMouseDown={e => {
            e.preventDefault()
            insertMention(m.handle)
          }}
          onMouseEnter={() => setSelected(idx)}
          className="w-full flex items-center gap-3 px-3 py-2 text-left"
          style={{
            background: idx === selected ? 'rgba(201,168,76,0.12)' : 'transparent',
            borderBottom: idx < matches.length - 1 ? '1px solid rgba(201,168,76,0.08)' : undefined,
          }}
        >
          <div
            className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0"
            style={{
              background: m.avatar_url ? 'transparent' : 'rgba(201,168,76,0.1)',
              border: '1px solid rgba(201,168,76,0.2)',
            }}
          >
            {m.avatar_url ? (
              <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <CrossIcon size="xs" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span
                className="text-sm truncate"
                style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
              >
                {m.name || `@${m.handle}`}
              </span>
              {m.verified && <VerifiedBadge size={12} />}
            </div>
            <p
              className="text-xs truncate"
              style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
            >
              @{m.handle}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}
