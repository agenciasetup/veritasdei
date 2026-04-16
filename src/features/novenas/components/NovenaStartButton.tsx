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

  async function handleStart() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/novenas/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ builtin_slug: slug }),
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
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleStart}
        disabled={loading}
        className="rounded-lg px-6 py-3 text-sm font-semibold transition disabled:opacity-50"
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
