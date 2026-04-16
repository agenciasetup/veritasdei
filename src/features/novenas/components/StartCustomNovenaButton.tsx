'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function StartCustomNovenaButton({ novenaId }: { novenaId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [comTerco, setComTerco] = useState(false)

  async function handleStart() {
    setLoading(true)
    try {
      const res = await fetch('/api/novenas/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_novena_id: novenaId, com_terco: comTerco }),
      })
      if (res.ok) {
        router.push('/novenas/minhas')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  if (!showOptions) {
    return (
      <button
        onClick={() => setShowOptions(true)}
        className="rounded-lg border px-3 py-1.5 text-xs transition active:scale-[0.97]"
        style={{ borderColor: 'rgba(201, 168, 76, 0.25)', color: '#C9A84C' }}
      >
        Iniciar
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setComTerco((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] transition active:scale-[0.97]"
        style={{
          borderColor: comTerco ? 'rgba(201, 168, 76, 0.3)' : 'rgba(122, 115, 104, 0.3)',
          color: comTerco ? '#C9A84C' : '#7A7368',
        }}
        aria-pressed={comTerco}
        title="Incluir o Santo Rosário em cada dia"
      >
        <span
          className="inline-block w-3 h-3 rounded border text-[8px] leading-3 text-center"
          style={{
            borderColor: comTerco ? '#C9A84C' : 'rgba(122, 115, 104, 0.4)',
            background: comTerco ? '#C9A84C' : 'transparent',
            color: comTerco ? '#0F0E0C' : 'transparent',
          }}
          aria-hidden
        >
          ✓
        </span>
        Com terço
      </button>
      <button
        onClick={handleStart}
        disabled={loading}
        className="rounded-lg border px-3 py-1.5 text-xs transition disabled:opacity-50 active:scale-[0.97]"
        style={{ borderColor: 'rgba(201, 168, 76, 0.25)', color: '#C9A84C' }}
      >
        {loading ? '...' : 'Iniciar'}
      </button>
    </div>
  )
}
