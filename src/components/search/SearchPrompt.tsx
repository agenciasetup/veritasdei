'use client'

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUp } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getGreetingPhrase,
  getDisplayName,
  getSubtitlePhrase,
} from '@/lib/greetings'
import { getDailyIceBreakers } from '@/lib/icebreakers'
import { useHaptic } from '@/hooks/useHaptic'

interface SearchPromptProps {
  autoFocus?: boolean
  /** Chamado com a query após o submit. Se ausente, navega pra /buscar?q=... */
  onSubmit?: (query: string) => void
  /** Mostra 3 pills de sugestões pastorais abaixo do input. */
  showSuggestions?: boolean
  /** Força um placeholder custom no input. */
  placeholder?: string
}

/**
 * Cabeçalho conversacional de busca — usado em `/aprender` e no
 * overlay do ícone de lupa da home. Saudação curta em cima,
 * pergunta grande em serif (Cormorant) e input pill iOS.
 *
 * Exemplos de saída:
 *   "A paz de Cristo, Filipe"
 *   "Qual sua dúvida hoje?"
 *   [ input ... ↑ ]
 */
export default function SearchPrompt({
  autoFocus = false,
  onSubmit,
  showSuggestions = false,
  placeholder = 'Pergunte, busque, converse…',
}: SearchPromptProps) {
  const router = useRouter()
  const haptic = useHaptic()
  const { profile } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')

  const greeting = getGreetingPhrase(profile?.vocacao)
  const firstName = getDisplayName(profile?.vocacao, profile?.name ?? null) || 'irmão'
  const subtitle = useMemo(() => getSubtitlePhrase(), [])
  const suggestions = useMemo(() => getDailyIceBreakers(3), [])

  useEffect(() => {
    if (!autoFocus) return
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [autoFocus])

  function commit(q: string) {
    const trimmed = q.trim()
    if (!trimmed) return
    haptic.pulse('selection')
    if (onSubmit) {
      onSubmit(trimmed)
    } else {
      router.push(`/buscar?q=${encodeURIComponent(trimmed)}`)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    commit(value)
  }

  const hasValue = value.trim().length > 0

  return (
    <div className="max-w-2xl mx-auto px-5">
      <div className="pt-5 pb-4 text-center">
        <p
          className="text-[14px]"
          style={{
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.01em',
          }}
        >
          {greeting} {firstName}
        </p>
        <h2
          className="mt-1.5 text-[26px] leading-[1.15]"
          style={{
            fontFamily: 'var(--font-elegant)',
            color: 'var(--text-primary)',
            fontWeight: 500,
            letterSpacing: '-0.005em',
          }}
        >
          {subtitle}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          enterKeyHint="search"
          aria-label="Buscar"
          className="w-full h-[56px] rounded-[28px] pl-5 pr-[58px] outline-none text-[15px]"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.012) 100%), rgba(20,18,14,0.6)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow:
              '0 1px 0 rgba(255,255,255,0.05) inset, 0 10px 28px rgba(0,0,0,0.35)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
          }}
        />
        <button
          type="submit"
          aria-label="Enviar"
          disabled={!hasValue}
          className="absolute right-1.5 top-1.5 w-[44px] h-[44px] rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
          style={{
            background: hasValue
              ? 'linear-gradient(180deg, #E4C56E 0%, #C9A84C 50%, #A88332 100%)'
              : 'rgba(255,255,255,0.05)',
            color: hasValue ? '#1C140C' : 'var(--text-muted)',
            boxShadow: hasValue
              ? '0 1px 0 rgba(255,255,255,0.3) inset, 0 -1px 0 rgba(0,0,0,0.15) inset, 0 6px 14px rgba(0,0,0,0.3)'
              : 'none',
          }}
        >
          <ArrowUp className="w-[18px] h-[18px]" strokeWidth={2.4} />
        </button>
      </form>

      {showSuggestions && (
        <div className="mt-3 flex flex-wrap gap-2 justify-center">
          {suggestions.map((s) => (
            <button
              key={s.question}
              type="button"
              onClick={() => commit(s.question)}
              className="text-[12.5px] px-3 py-1.5 rounded-full active:scale-95 transition-transform"
              style={{
                background: 'rgba(255,255,255,0.035)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {s.question}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
