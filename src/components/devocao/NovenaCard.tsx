'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { CalendarHeart, Check, Loader2 } from 'lucide-react'
import NovenaProgresso from './NovenaProgresso'
import type { NovenaComSanto } from '@/types/devocao'

/**
 * Card de novena ativa. Aparece em /rezar quando há uma novena em curso.
 * Permite marcar o dia como rezado (um por dia). Copy respeitosa — nunca
 * "você quebrou a novena!" ou "streak perdido". Ver docs/copy-catolica.md §1.
 */
export default function NovenaCard() {
  const [novena, setNovena] = useState<NovenaComSanto | null>(null)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)
  const [justMarked, setJustMarked] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/novenas?ativa=1', { cache: 'no-store' })
      if (!res.ok) throw new Error(String(res.status))
      const j = await res.json() as { novenas: NovenaComSanto[] }
      setNovena(j.novenas?.[0] ?? null)
    } catch {
      setNovena(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleMarcar() {
    if (!novena || marking) return
    setMarking(true)
    try {
      const res = await fetch('/api/novenas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novena_id: novena.id, action: 'marcar_dia' }),
      })
      if (res.ok) {
        setJustMarked(true)
        setTimeout(() => setJustMarked(false), 2400)
        await load()
      }
    } finally {
      setMarking(false)
    }
  }

  if (loading || !novena || !novena.santo) return null

  const rezouHoje = (novena.progresso ?? []).some(ts => {
    return new Date(ts).toDateString() === new Date().toDateString()
  })

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(16,16,16,0.7)',
        border: '1px solid rgba(201,168,76,0.25)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(201,168,76,0.12)',
            border: '1px solid rgba(201,168,76,0.25)',
          }}
        >
          <CalendarHeart className="w-5 h-5" style={{ color: '#C9A84C' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            style={{
              fontFamily: 'Poppins, sans-serif',
              color: 'rgba(201,168,76,0.85)',
              fontSize: '0.65rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 2,
            }}
          >
            Novena · Dia {Math.min(novena.dia_atual, 9)}/9
          </div>
          <Link
            href={`/santos/${novena.santo.slug}`}
            style={{
              fontFamily: 'Cinzel, Georgia, serif',
              color: '#F2EDE4',
              fontSize: '1rem',
              lineHeight: 1.2,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Em companhia de {novena.santo.nome}
          </Link>
        </div>
      </div>

      <NovenaProgresso progresso={(novena.progresso as string[]) ?? []} diaAtual={novena.dia_atual} />

      {novena.santo.oracao_curta && (
        <div
          className="mt-4 whitespace-pre-wrap text-center"
          style={{
            color: 'rgba(242,237,228,0.85)',
            fontFamily: 'Cinzel, Georgia, serif',
            fontSize: '0.88rem',
            lineHeight: 1.7,
            fontStyle: 'italic',
          }}
        >
          {novena.santo.oracao_curta}
        </div>
      )}

      <button
        type="button"
        onClick={handleMarcar}
        disabled={marking || rezouHoje}
        className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold tracking-wider uppercase transition-transform active:scale-[0.99] disabled:opacity-70"
        style={{
          background: rezouHoje
            ? 'rgba(201,168,76,0.15)'
            : '#C9A84C',
          color: rezouHoje ? '#C9A84C' : '#0A0A0A',
          fontFamily: 'Cinzel, Georgia, serif',
          border: rezouHoje ? '1px solid rgba(201,168,76,0.4)' : 'none',
        }}
      >
        {marking ? (
          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
        ) : rezouHoje || justMarked ? (
          <span className="inline-flex items-center gap-2">
            <Check className="w-4 h-4" />
            {justMarked ? 'Dia marcado' : 'Rezado hoje · volte amanhã'}
          </span>
        ) : (
          'Rezei o dia de hoje'
        )}
      </button>
    </div>
  )
}
