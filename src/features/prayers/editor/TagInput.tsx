'use client'

import { X } from 'lucide-react'
import { useState } from 'react'

/**
 * Input de chips: enter ou vírgula cria uma tag, clique no X remove.
 */
export default function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState('')

  const addTag = (raw: string) => {
    const clean = raw.trim()
    if (!clean) return
    if (value.includes(clean)) return
    onChange([...value, clean])
  }

  const removeTag = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx))
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(draft)
      setDraft('')
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      removeTag(value.length - 1)
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 rounded-xl px-2.5 py-2 min-h-[42px]"
      style={{
        background: '#0A0A0A',
        border: '1px solid rgba(201,168,76,0.15)',
      }}
    >
      {value.map((tag, idx) => (
        <span
          key={`${tag}-${idx}`}
          className="inline-flex items-center gap-1 rounded-full pl-2 pr-1 py-0.5 text-xs"
          style={{
            fontFamily: 'Poppins, sans-serif',
            color: '#F2EDE4',
            background: 'rgba(201,168,76,0.12)',
            border: '1px solid rgba(201,168,76,0.28)',
          }}
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(idx)}
            aria-label={`Remover ${tag}`}
            className="inline-flex items-center justify-center rounded-full w-4 h-4 active:scale-90"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#8A8378',
            }}
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (draft.trim()) {
            addTag(draft)
            setDraft('')
          }
        }}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[80px] bg-transparent outline-none text-sm"
        style={{
          fontFamily: 'Poppins, sans-serif',
          color: '#F2EDE4',
        }}
      />
    </div>
  )
}
