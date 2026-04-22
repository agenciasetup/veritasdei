'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, Sparkles } from 'lucide-react'
import type { FestaHojeInfo } from '@/types/devocao'

/**
 * Banner mostrado em /rezar quando hoje é a festa litúrgica do santo
 * de devoção do usuário. Pronto fica invisível nos outros 364 dias.
 *
 * Copy: "Hoje a Igreja celebra a memória de São X" (linguagem da
 * Liturgia das Horas). Ver docs/copy-catolica.md §1.
 */
export default function FestaDoDiaBanner() {
  const [info, setInfo] = useState<FestaHojeInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/santos/festa-hoje', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(String(r.status))))
      .then((j: { info: FestaHojeInfo | null }) => {
        if (!cancelled) setInfo(j.info ?? null)
      })
      .catch(() => {/* silencioso — nada crítico */})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading || !info || !info.ehHoje) return null

  return (
    <Link
      href={`/santos/${info.santo.slug}`}
      className="relative block overflow-hidden rounded-2xl p-5 active:scale-[0.99] transition-transform"
      style={{
        background:
          'radial-gradient(ellipse at 20% 20%, rgba(201,168,76,0.35) 0%, transparent 55%), linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(60,30,10,0.75) 55%, rgba(10,10,10,0.85) 100%)',
        border: '1px solid rgba(201,168,76,0.45)',
        boxShadow: '0 0 36px rgba(201,168,76,0.18)',
      }}
    >
      <div className="flex items-center gap-4">
        {info.santo.imagem_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={info.santo.imagem_url}
            alt={info.santo.nome}
            className="w-14 h-14 rounded-full object-cover flex-shrink-0"
            style={{ border: '2px solid rgba(201,168,76,0.6)' }}
          />
        ) : (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(201,168,76,0.18)',
              border: '2px solid rgba(201,168,76,0.6)',
            }}
          >
            <Heart className="w-6 h-6" style={{ color: '#C9A84C' }} fill="currentColor" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div
            className="flex items-center gap-1.5 mb-1"
            style={{
              fontFamily: 'Poppins, sans-serif',
              color: 'rgba(201,168,76,0.9)',
              fontSize: '0.7rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            <Sparkles className="w-3 h-3" />
            Hoje
          </div>
          <div
            style={{
              fontFamily: 'Cinzel, Georgia, serif',
              color: '#F2EDE4',
              fontSize: '1.1rem',
              lineHeight: 1.2,
              fontWeight: 600,
            }}
          >
            Memória de {info.santo.nome}
          </div>
          {info.santo.invocacao && (
            <div
              className="mt-1 italic truncate"
              style={{
                fontFamily: 'Cinzel, Georgia, serif',
                color: 'rgba(242,237,228,0.75)',
                fontSize: '0.85rem',
              }}
            >
              «{info.santo.invocacao}»
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
