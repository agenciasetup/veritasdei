'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function StartCustomNovenaButton({ novenaId }: { novenaId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleStart() {
    setLoading(true)
    try {
      const res = await fetch('/api/novenas/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_novena_id: novenaId }),
      })
      if (res.ok) {
        router.push('/novenas/minhas')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className="rounded-lg border px-3 py-1.5 text-xs transition disabled:opacity-50"
      style={{ borderColor: 'rgba(201, 168, 76, 0.25)', color: '#C9A84C' }}
    >
      {loading ? '...' : 'Iniciar'}
    </button>
  )
}
