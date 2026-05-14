'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Sparkles, Loader2, ChevronRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCodex, type PersonagemColecao } from '@/lib/codex/useCodex'
import { Sheet } from '@/components/ui/Sheet'
import CartaView from './CartaView'
import CartaSlotBloqueada from './CartaSlotBloqueada'
import CartaDetailSheet from './CartaDetailSheet'
import CartaUnlockModal from './CartaUnlockModal'
import type { CartaColecao } from '@/types/codex'

// Vitrine da coleção: grade de personagens → ao tocar, abre o carrossel de
// variações (desbloqueadas + silhuetas seladas) → ao tocar numa carta, o
// detalhe completo. Cartas recém-desbloqueadas disparam o modal de celebração.

export default function CodexShowcase() {
  const { user } = useAuth()
  const {
    personagens,
    novas,
    totalCartas,
    totalDesbloqueadas,
    loading,
    error,
    marcarVista,
    alternarFavorita,
  } = useCodex(user?.id)

  const [aberto, setAberto] = useState<PersonagemColecao | null>(null)
  const [detalhe, setDetalhe] = useState<CartaColecao | null>(null)

  const novaCarta = novas[0] ?? null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#C9A84C' }} />
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-sm" style={{ color: '#D64F5C' }}>
        {error}
      </p>
    )
  }

  return (
    <div>
      {/* Progresso geral */}
      <div
        className="flex items-center justify-between rounded-xl px-4 py-3 mb-4"
        style={{
          background: 'rgba(201,168,76,0.06)',
          border: '1px solid rgba(201,168,76,0.15)',
        }}
      >
        <span
          className="text-xs uppercase tracking-[0.14em]"
          style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
        >
          Coleção
        </span>
        <span
          className="text-sm"
          style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}
        >
          {totalDesbloqueadas} / {totalCartas} cartas
        </span>
      </div>

      {personagens.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(201,168,76,0.2)',
          }}
        >
          <Sparkles className="w-8 h-8 mx-auto mb-2" style={{ color: '#8A8378' }} />
          <p
            className="text-sm"
            style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
          >
            O Códex ainda está sendo preparado. Continue seus estudos — em breve
            as primeiras cartas aparecem aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {personagens.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setAberto(p)}
              className="flex items-center gap-3 rounded-xl p-3 text-left active:scale-[0.98] transition-transform"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(201,168,76,0.14)',
              }}
            >
              <div
                className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{
                  background: 'rgba(201,168,76,0.08)',
                  border: '1px solid rgba(201,168,76,0.15)',
                  filter: p.desbloqueadas === 0 ? 'grayscale(1)' : 'none',
                  opacity: p.desbloqueadas === 0 ? 0.5 : 1,
                }}
              >
                {p.icone_url ? (
                  <Image
                    src={p.icone_url}
                    alt={p.nome}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <Sparkles className="w-5 h-5" style={{ color: '#C9A84C' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm truncate"
                  style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                >
                  {p.desbloqueadas === 0 ? '???' : p.nome}
                </p>
                <p
                  className="text-[11px]"
                  style={{
                    color: '#8A8378',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  {p.desbloqueadas} / {p.total_cartas} variações
                </p>
              </div>
              <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: '#8A8378' }} />
            </button>
          ))}
        </div>
      )}

      {/* Carrossel de variações do personagem */}
      <Sheet
        open={aberto !== null}
        onDismiss={() => setAberto(null)}
        label="Variações do personagem"
        detents={[0.7, 0.95]}
      >
        {aberto && (
          <div className="px-4 pb-8">
            <h3
              className="text-lg mb-1"
              style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
            >
              {aberto.desbloqueadas === 0 ? 'Personagem selado' : aberto.nome}
            </h3>
            <p
              className="text-xs mb-4"
              style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
            >
              {aberto.desbloqueadas} / {aberto.total_cartas} variações desbloqueadas
              {aberto.subtitulo && aberto.desbloqueadas > 0
                ? ` · ${aberto.subtitulo}`
                : ''}
            </p>
            <div
              className="flex gap-4 overflow-x-auto pb-3"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {aberto.cartas.map((c) => (
                <div key={c.id} style={{ scrollSnapAlign: 'center' }}>
                  <CartaView
                    carta={c}
                    width={220}
                    onClick={() => setDetalhe(c)}
                  />
                </div>
              ))}
              {Array.from({
                length: Math.max(
                  0,
                  aberto.total_cartas - aberto.desbloqueadas,
                ),
              }).map((_, i) => (
                <div key={`lock-${i}`} style={{ scrollSnapAlign: 'center' }}>
                  <CartaSlotBloqueada width={220} />
                </div>
              ))}
            </div>
          </div>
        )}
      </Sheet>

      {/* Detalhe da carta */}
      <CartaDetailSheet
        carta={detalhe}
        open={detalhe !== null}
        onClose={() => setDetalhe(null)}
        onToggleFavorita={(id) => {
          void alternarFavorita(id)
          setDetalhe((d) => (d ? { ...d, favorita: !d.favorita } : d))
        }}
      />

      {/* Celebração de carta nova */}
      {novaCarta && (
        <CartaUnlockModal
          carta={novaCarta}
          onClose={() => void marcarVista(novaCarta.id)}
        />
      )}
    </div>
  )
}
