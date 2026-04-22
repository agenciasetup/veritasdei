'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarHeart, Heart, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import OferecerIntencaoSheet from '@/components/devocao/OferecerIntencaoSheet'

/**
 * Ações de devoção exibidas em /santos/[slug]:
 * 1. Oferecer intenção ao Senhor pela intercessão do santo
 * 2. Iniciar novena de 9 dias em companhia do santo
 *
 * Copy rigorosamente ortodoxa (ver docs/copy-catolica.md §1).
 */
export default function AcoesDevocaoCliente({
  santoId,
  santoNome,
}: {
  santoId: string
  santoNome: string
}) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [startingNovena, setStartingNovena] = useState(false)
  const [novenaStarted, setNovenaStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function requireAuth() {
    if (isAuthenticated) return true
    router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`)
    return false
  }

  function handleOferecer() {
    if (!requireAuth()) return
    setSheetOpen(true)
  }

  async function handleIniciarNovena() {
    if (!requireAuth()) return
    if (startingNovena || novenaStarted) return
    setStartingNovena(true)
    setError(null)
    try {
      const res = await fetch('/api/novenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ santo_id: santoId }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setNovenaStarted(true)
      setTimeout(() => router.push('/rezar'), 1200)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao iniciar novena')
    } finally {
      setStartingNovena(false)
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-stretch gap-2">
        <button
          type="button"
          onClick={handleOferecer}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-transform active:scale-95"
          style={{
            background: 'rgba(201,168,76,0.12)',
            border: '1px solid rgba(201,168,76,0.35)',
            color: '#C9A84C',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 500,
          }}
        >
          <Heart className="w-4 h-4" />
          Oferecer intenção
        </button>
        <button
          type="button"
          onClick={handleIniciarNovena}
          disabled={startingNovena || novenaStarted}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-transform active:scale-95 disabled:opacity-70"
          style={{
            background: 'rgba(201,168,76,0.12)',
            border: '1px solid rgba(201,168,76,0.35)',
            color: '#C9A84C',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 500,
          }}
        >
          {startingNovena ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : novenaStarted ? (
            'Novena iniciada'
          ) : (
            <>
              <CalendarHeart className="w-4 h-4" />
              Iniciar novena de 9 dias
            </>
          )}
        </button>
      </div>
      {error && (
        <div
          className="mt-2 text-xs text-center"
          style={{ color: 'rgb(220,140,140)', fontFamily: 'Poppins, sans-serif' }}
        >
          {error}
        </div>
      )}

      <OferecerIntencaoSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        santoId={santoId}
        santoNome={santoNome}
      />
    </>
  )
}
