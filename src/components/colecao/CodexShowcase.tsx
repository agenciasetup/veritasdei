'use client'

import { useMemo, useState } from 'react'
import { Search, Loader2, BookOpen, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCodex } from '@/lib/colecao/useCodex'
import CartaView from './CartaView'
import CartaSlotBloqueada from './CartaSlotBloqueada'
import CartaDetailSheet from './CartaDetailSheet'
import {
  RARIDADE_META,
  RARIDADE_ORDEM,
  type CartaColecao,
  type CartaRaridade,
} from '@/types/colecao'

// Coleção em formato de catálogo/álbum: um "livro" rolável com todas as
// cartas à vista, agrupadas por personagem (capítulos). Filtro por nome e
// por raridade. Tocar numa carta abre o detalhe completo.
//
// O popup de "carta nova" é disparado globalmente pelo GamificationEvents-
// Provider — aqui não repetimos.

const CARD_W = 158

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export default function CodexShowcase() {
  const { user } = useAuth()
  const {
    personagens,
    totalCartas,
    totalDesbloqueadas,
    loading,
    error,
    alternarFavorita,
  } = useCodex(user?.id)

  const [busca, setBusca] = useState('')
  const [raridade, setRaridade] = useState<'todas' | CartaRaridade>('todas')
  const [detalhe, setDetalhe] = useState<CartaColecao | null>(null)

  const filtrando = busca.trim() !== '' || raridade !== 'todas'

  const secoes = useMemo(() => {
    const q = normalizar(busca.trim())
    return personagens
      .map((p) => {
        const personagemBate = q !== '' && normalizar(p.nome).includes(q)
        let cartas = p.cartas
        if (raridade !== 'todas') {
          cartas = cartas.filter((c) => c.raridade === raridade)
        }
        if (q !== '') {
          cartas = cartas.filter(
            (c) =>
              personagemBate ||
              normalizar(c.nome).includes(q) ||
              normalizar(c.subtitulo ?? '').includes(q),
          )
        }
        // Silhuetas só quando não há filtro (não dá pra filtrar o que é segredo).
        const seladas = filtrando
          ? 0
          : Math.max(0, p.total_cartas - p.desbloqueadas)
        return { personagem: p, cartas, seladas }
      })
      .filter((s) => s.cartas.length > 0 || s.seladas > 0)
  }, [personagens, busca, raridade, filtrando])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
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
      {/* Barra de filtros */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div
            className="flex items-center gap-2 rounded-xl px-3 flex-1"
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(201,168,76,0.2)',
              height: 40,
            }}
          >
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#8A8378' }} />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome…"
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                aria-label="Limpar busca"
              >
                <X className="w-4 h-4" style={{ color: '#8A8378' }} />
              </button>
            )}
          </div>
          <span
            className="text-sm whitespace-nowrap"
            style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}
          >
            {totalDesbloqueadas} / {totalCartas}
          </span>
        </div>

        {/* Chips de raridade */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <Chip
            ativo={raridade === 'todas'}
            cor="#C9A84C"
            label="Todas"
            onClick={() => setRaridade('todas')}
          />
          {RARIDADE_ORDEM.map((r) => (
            <Chip
              key={r}
              ativo={raridade === r}
              cor={RARIDADE_META[r].cor}
              label={RARIDADE_META[r].label}
              onClick={() => setRaridade(r)}
            />
          ))}
        </div>
      </div>

      {/* O "livro" — catálogo rolável */}
      <div
        className="rounded-2xl p-4 md:p-5"
        style={{
          background:
            'linear-gradient(160deg, rgba(30,26,19,0.96) 0%, rgba(18,15,11,0.99) 100%)',
          border: '2px solid rgba(201,168,76,0.28)',
          boxShadow:
            '0 14px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {secoes.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen
              className="w-8 h-8 mx-auto mb-2"
              style={{ color: '#8A8378' }}
            />
            <p
              className="text-sm"
              style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
            >
              {filtrando
                ? 'Nenhuma carta encontrada com esse filtro.'
                : 'O catálogo ainda está sendo preparado. Continue seus estudos — as primeiras cartas aparecem aqui.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-7">
            {secoes.map(({ personagem, cartas, seladas }) => (
              <section key={personagem.id}>
                {/* Cabeçalho do capítulo */}
                <div className="flex items-center gap-3 mb-3">
                  <h3
                    className="whitespace-nowrap"
                    style={{
                      fontFamily: 'Cinzel, serif',
                      color: '#F2EDE4',
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                  >
                    {personagem.desbloqueadas === 0 && !filtrando
                      ? 'Personagem selado'
                      : personagem.nome}
                  </h3>
                  <span
                    className="h-px flex-1"
                    style={{ background: 'rgba(201,168,76,0.25)' }}
                  />
                  <span
                    className="text-[11px] whitespace-nowrap"
                    style={{
                      color: '#8A8378',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    {personagem.desbloqueadas}/{personagem.total_cartas}
                  </span>
                </div>

                {/* Grade de cartas */}
                <div
                  className="grid gap-3 justify-center sm:justify-start"
                  style={{
                    gridTemplateColumns: `repeat(auto-fill, ${CARD_W}px)`,
                  }}
                >
                  {cartas.map((c) => (
                    <CartaView
                      key={c.id}
                      carta={c}
                      width={CARD_W}
                      onClick={() => setDetalhe(c)}
                    />
                  ))}
                  {Array.from({ length: seladas }).map((_, i) => (
                    <CartaSlotBloqueada key={`s-${i}`} width={CARD_W} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <CartaDetailSheet
        carta={detalhe}
        open={detalhe !== null}
        onClose={() => setDetalhe(null)}
        onToggleFavorita={(id) => {
          void alternarFavorita(id)
          setDetalhe((d) => (d ? { ...d, favorita: !d.favorita } : d))
        }}
      />
    </div>
  )
}

function Chip({
  ativo,
  cor,
  label,
  onClick,
}: {
  ativo: boolean
  cor: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-[0.1em] whitespace-nowrap flex-shrink-0 transition-colors"
      style={{
        fontFamily: 'Poppins, sans-serif',
        background: ativo ? `${cor}22` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${ativo ? cor : 'rgba(242,237,228,0.1)'}`,
        color: ativo ? cor : '#8A8378',
      }}
    >
      {label}
    </button>
  )
}
