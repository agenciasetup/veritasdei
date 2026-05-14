'use client'

import { useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { Lock, Star } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { RARIDADE_META, type Carta } from '@/types/colecao'

interface Props {
  carta: Carta
  /** Quando true, renderiza a silhueta misteriosa (não desbloqueada). */
  locked?: boolean
  /** Mostra os painéis de efeito/recompensa abaixo da frase. */
  showDetails?: boolean
  onClick?: () => void
  className?: string
  /** Largura em px; a altura segue a proporção 5/7. */
  width?: number
  /** Sobrescreve a escala de fonte da carta (preview do editor). */
  escalaFonte?: number
}

/**
 * CartaView — face de uma carta colecionável da Coleção.
 *
 * Layout fixo em duas metades, inspirado em manuscrito iluminado:
 *   topo (50%)  → ilustração do personagem
 *   base (50%)  → painel de pergaminho com todo o texto (overflow oculto)
 *
 * A raridade muda moldura, brilho e o efeito holográfico — nunca a área de
 * texto. `escala_fonte` (0.5–2.0) ajusta a diagramação por carta.
 */
export default function CartaView({
  carta,
  locked = false,
  showDetails = false,
  onClick,
  className,
  width = 280,
  escalaFonte,
}: Props) {
  const meta = RARIDADE_META[carta.raridade]
  const accent = carta.cor_accent || meta.cor
  const esc = Math.min(
    2,
    Math.max(0.5, escalaFonte ?? carta.escala_fonte ?? 1),
  )
  const cardRef = useRef<HTMLDivElement>(null)
  const [holo, setHolo] = useState<{ x: number; y: number; active: boolean }>({
    x: 50,
    y: 50,
    active: false,
  })

  const handlePointer = (e: React.PointerEvent) => {
    if (!meta.holo || locked || !cardRef.current) return
    const r = cardRef.current.getBoundingClientRect()
    setHolo({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
      active: true,
    })
  }

  // px → escalado pela fonte da carta
  const fs = (px: number) => Math.round(px * esc * 10) / 10

  const outerStyle: CSSProperties = {
    width,
    aspectRatio: '5 / 7',
    borderRadius: 16,
    border: `2px solid ${locked ? 'rgba(242,237,228,0.08)' : meta.borda}`,
    background:
      'linear-gradient(160deg, rgba(24,21,16,0.99) 0%, rgba(12,11,9,1) 100%)',
    boxShadow: locked
      ? 'inset 0 1px 0 rgba(255,255,255,0.03)'
      : `0 16px 44px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(0,0,0,0.6)${
          meta.glow ? `, ${meta.glow}` : ''
        }`,
  }

  // --- Estado bloqueado: silhueta misteriosa --------------------------------
  if (locked) {
    const body = (
      <div
        className={cn(
          'relative overflow-hidden flex flex-col items-center justify-center gap-3 p-6 text-center',
          onClick && 'transition-transform active:scale-[0.98]',
          className,
        )}
        style={outerStyle}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: width * 0.26,
            height: width * 0.26,
            background: 'rgba(242,237,228,0.04)',
            border: '1px solid rgba(242,237,228,0.08)',
          }}
        >
          <Lock
            style={{ width: width * 0.1, height: width * 0.1, color: '#4A463F' }}
          />
        </div>
        <p
          className="uppercase tracking-[0.18em]"
          style={{
            fontFamily: 'Cinzel, serif',
            color: '#5A554C',
            fontSize: 13,
          }}
        >
          Carta selada
        </p>
        {carta.dica_desbloqueio && (
          <p
            className="leading-snug"
            style={{
              color: '#6E685D',
              fontFamily: 'Poppins, sans-serif',
              fontSize: 11,
            }}
          >
            {carta.dica_desbloqueio}
          </p>
        )}
      </div>
    )
    return onClick ? (
      <button type="button" onClick={onClick} className="block">
        {body}
      </button>
    ) : (
      body
    )
  }

  // --- Estado desbloqueado: ilustração 50% + painel 50% ---------------------
  const body = (
    <div
      ref={cardRef}
      onPointerMove={handlePointer}
      onPointerLeave={() => setHolo((h) => ({ ...h, active: false }))}
      className={cn(
        'relative overflow-hidden flex flex-col',
        onClick && 'transition-transform active:scale-[0.98]',
        className,
      )}
      style={outerStyle}
    >
      {/* ── Metade superior: ilustração ── */}
      <div
        className="absolute left-0 right-0 top-0 overflow-hidden"
        style={{ height: '50%' }}
      >
        {carta.ilustracao_url ? (
          <Image
            src={carta.ilustracao_url}
            alt={carta.nome}
            fill
            sizes={`${width}px`}
            className="object-cover"
            style={{ objectPosition: 'center top' }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background:
                'radial-gradient(circle at 50% 35%, rgba(242,237,228,0.06), rgba(0,0,0,0) 70%)',
            }}
          >
            <span style={{ color: accent, fontSize: width * 0.22, opacity: 0.4 }}>
              {carta.simbolo || '✛'}
            </span>
          </div>
        )}
        {/* fade da arte para o painel */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: '38%',
            background:
              'linear-gradient(to bottom, rgba(12,11,9,0) 0%, rgba(12,11,9,0.85) 70%, rgba(12,11,9,1) 100%)',
          }}
        />

        {/* overlays sobre a arte */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          <div className="flex flex-col gap-1">
            <span
              className="rounded font-semibold uppercase tracking-[0.14em]"
              style={{
                fontFamily: 'Poppins, sans-serif',
                color: '#15120C',
                background: accent,
                fontSize: 9,
                padding: '2px 6px',
              }}
            >
              {meta.label}
            </span>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  style={{
                    width: 11,
                    height: 11,
                    color: i < carta.estrelas ? accent : 'rgba(0,0,0,0.4)',
                    fill: i < carta.estrelas ? accent : 'rgba(0,0,0,0.35)',
                    filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.6))',
                  }}
                />
              ))}
            </div>
          </div>
          {carta.numero != null && (
            <span
              className="tabular-nums"
              style={{
                fontFamily: 'Cinzel, serif',
                color: accent,
                fontSize: 12,
                textShadow: '0 1px 3px rgba(0,0,0,0.9)',
              }}
            >
              Nº {String(carta.numero).padStart(3, '0')}
            </span>
          )}
        </div>
      </div>

      {/* ── Metade inferior: painel de pergaminho ── */}
      <div
        className="absolute left-0 right-0 bottom-0 overflow-hidden"
        style={{
          height: '50%',
          background:
            'linear-gradient(180deg, rgba(32,27,20,0.98) 0%, rgba(18,15,11,1) 100%)',
          borderTop: `1px solid ${meta.borda}`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {/* régua ornamental no topo do painel (estilo manuscrito) */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <span
            style={{ height: 1, width: '28%', background: `${accent}55` }}
          />
          <span style={{ color: accent, fontSize: 8 }}>✦</span>
          <span
            style={{ height: 1, width: '28%', background: `${accent}55` }}
          />
        </div>

        <div
          className="flex flex-col px-3.5 pb-3 pt-1.5"
          style={{ height: 'calc(100% - 18px)' }}
        >
          {/* título */}
          <h3
            className="leading-tight"
            style={{
              fontFamily: 'Cinzel, serif',
              color: '#F4EFE3',
              fontSize: fs(width > 240 ? 19 : 15),
              fontWeight: 600,
            }}
          >
            {carta.nome}
          </h3>
          {carta.subtitulo && (
            <p
              className="uppercase tracking-[0.14em] mt-0.5"
              style={{
                color: accent,
                fontFamily: 'Poppins, sans-serif',
                fontSize: fs(9),
              }}
            >
              {carta.subtitulo}
            </p>
          )}

          {/* frase central */}
          {carta.frase_central && (
            <div
              className="rounded-md mt-2 px-2.5 py-1.5"
              style={{
                background: 'rgba(0,0,0,0.35)',
                border: `1px solid ${accent}22`,
              }}
            >
              <p
                className="italic leading-snug"
                style={{
                  color: '#E8E2D6',
                  fontFamily: 'Cinzel, serif',
                  fontSize: fs(11),
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                “{carta.frase_central}”
              </p>
              {carta.frase_referencia && (
                <p
                  style={{
                    color: '#8A8378',
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: fs(8),
                    marginTop: 2,
                  }}
                >
                  {carta.frase_referencia}
                </p>
              )}
            </div>
          )}

          {/* efeito + recompensa (modo detalhe) */}
          {showDetails && (
            <div className="flex flex-col gap-1.5 mt-2">
              {carta.efeito_simbolico && (
                <Detalhe
                  titulo="Efeito"
                  texto={carta.efeito_simbolico}
                  accent={accent}
                  fs={fs}
                />
              )}
              {carta.recompensa.length > 0 && (
                <Detalhe
                  titulo="Recompensa"
                  texto={carta.recompensa.join(' · ')}
                  accent={accent}
                  fs={fs}
                />
              )}
            </div>
          )}

          {/* rodapé fixado embaixo */}
          {(carta.categoria || carta.simbolo) && (
            <div className="flex items-center justify-between mt-auto pt-1.5">
              <span
                className="uppercase tracking-[0.14em]"
                style={{
                  color: '#8A8378',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: fs(8),
                }}
              >
                {carta.categoria}
              </span>
              {carta.simbolo && (
                <span style={{ color: accent, fontSize: fs(12) }}>
                  {carta.simbolo}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cantos ornamentais (raridades altas) */}
      {meta.ornamento >= 2 &&
        (['tl', 'tr', 'bl', 'br'] as const).map((c) => (
          <span
            key={c}
            className="absolute"
            style={{
              color: accent,
              fontSize: 11,
              opacity: 0.7,
              top: c[0] === 't' ? 4 : undefined,
              bottom: c[0] === 'b' ? 4 : undefined,
              left: c[1] === 'l' ? 6 : undefined,
              right: c[1] === 'r' ? 6 : undefined,
            }}
          >
            ✦
          </span>
        ))}

      {/* Camada holográfica (lendária / suprema) */}
      {meta.holo && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: 16,
            opacity: holo.active ? 0.5 : 0.18,
            transition: 'opacity 0.2s',
            background: `radial-gradient(circle at ${holo.x}% ${holo.y}%, ${accent}55 0%, transparent 45%), linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.1) 50%, transparent 62%)`,
            mixBlendMode: 'overlay',
          }}
        />
      )}
    </div>
  )

  return onClick ? (
    <button type="button" onClick={onClick} className="block">
      {body}
    </button>
  ) : (
    body
  )
}

function Detalhe({
  titulo,
  texto,
  accent,
  fs,
}: {
  titulo: string
  texto: string
  accent: string
  fs: (px: number) => number
}) {
  return (
    <div>
      <p
        className="uppercase tracking-[0.18em]"
        style={{
          color: accent,
          fontFamily: 'Poppins, sans-serif',
          fontSize: fs(8),
        }}
      >
        {titulo}
      </p>
      <p
        className="leading-snug"
        style={{
          color: '#C9C2B4',
          fontFamily: 'Poppins, sans-serif',
          fontSize: fs(9.5),
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {texto}
      </p>
    </div>
  )
}
