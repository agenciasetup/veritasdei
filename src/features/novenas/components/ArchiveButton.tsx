'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ArchiveButton({ novenaId, arquivada }: { novenaId: string; arquivada: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    try {
      await fetch(`/api/novenas/custom/${novenaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arquivada: !arquivada }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="rounded-lg border px-3 py-1.5 text-xs transition disabled:opacity-50"
      style={{ borderColor: 'rgba(242, 237, 228, 0.08)', color: '#7A7368' }}
    >
      {loading ? '...' : arquivada ? 'Desarquivar' : 'Arquivar'}
    </button>
  )
}
