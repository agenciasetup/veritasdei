'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Heart, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function EscolherDevocaoButton({
  santoId,
  santoNome,
}: {
  santoId: string
  santoNome: string
}) {
  const { profile, refreshProfile, isAuthenticated } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isCurrent = profile?.santo_devocao_id === santoId

  async function handleEscolher() {
    if (!isAuthenticated) {
      router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/comunidade/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ santo_devocao_id: santoId }),
      })
      if (!res.ok) throw new Error(String(res.status))
      await refreshProfile()
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao escolher santo')
    } finally {
      setSaving(false)
    }
  }

  if (isCurrent) {
    return (
      <div
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
        style={{
          background: 'rgba(201,168,76,0.15)',
          border: '1px solid rgba(201,168,76,0.4)',
          color: '#C9A84C',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        <Check className="w-4 h-4" />
        Este é o seu santo de devoção
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleEscolher}
        disabled={saving || done}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-transform active:scale-95"
        style={{
          background: done ? 'rgba(201,168,76,0.15)' : '#C9A84C',
          color: done ? '#C9A84C' : '#0A0A0A',
          fontFamily: 'Cinzel, Georgia, serif',
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : done ? (
          <>
            <Check className="w-4 h-4" />
            {santoNome} é seu santo de devoção
          </>
        ) : (
          <>
            <Heart className="w-4 h-4" fill="currentColor" />
            Escolher como meu santo
          </>
        )}
      </button>
      {error && (
        <div
          className="text-xs"
          style={{ color: 'rgb(220,140,140)', fontFamily: 'Poppins, sans-serif' }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
