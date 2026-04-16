'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  slug: string
  titulo: string
}

export function NovenaStartButton({ slug, titulo }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comTerco, setComTerco] = useState(false)

  async function handleStart() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/novenas/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ builtin_slug: slug, com_terco: comTerco }),
      })

      if (res.status === 401) {
        router.push(`/login?redirectTo=/novenas/${slug}`)
        return
      }

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Erro ao iniciar novena')
        return
      }

      router.push(`/novenas/${slug}/progresso`)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Terço toggle */}
      <button
        type="button"
        onClick={() => setComTerco((v) => !v)}
        className="flex items-center gap-3 rounded-xl px-4 py-3 transition active:scale-[0.98]"
        style={{
          background: comTerco
            ? 'rgba(201, 168, 76, 0.1)'
            : 'rgba(255, 255, 255, 0.03)',
          border: `1px solid ${comTerco ? 'rgba(201, 168, 76, 0.3)' : 'rgba(201, 168, 76, 0.1)'}`,
        }}
        aria-pressed={comTerco}
      >
        <span
          className="flex items-center justify-center w-5 h-5 rounded border text-[11px]"
          style={{
            borderColor: comTerco ? '#C9A84C' : 'rgba(122, 115, 104, 0.4)',
            background: comTerco ? '#C9A84C' : 'transparent',
            color: comTerco ? '#0F0E0C' : 'transparent',
          }}
          aria-hidden
        >
          {comTerco ? '✓' : ''}
        </span>
        <div className="text-left">
          <span className="block text-sm" style={{ color: '#F2EDE4' }}>
            Rezar com o terço
          </span>
          <span className="block text-[11px]" style={{ color: '#7A7368' }}>
            Incluir o Santo Rosário em cada dia
          </span>
        </div>
      </button>

      <button
        onClick={handleStart}
        disabled={loading}
        className="rounded-lg px-6 py-3 text-sm font-semibold transition disabled:opacity-50 active:scale-[0.97]"
        style={{
          background: 'linear-gradient(180deg, #C9A84C, #A88437)',
          color: '#0F0E0C',
        }}
      >
        {loading ? 'Iniciando...' : `Iniciar ${titulo}`}
      </button>
      {error && (
        <p className="text-xs" style={{ color: '#E57373' }}>
          {error}
        </p>
      )}
    </div>
  )
}
