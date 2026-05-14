'use client'

import { useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { Lock, Star } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { RARIDADE_META, type Carta } from '@/types/codex'

interface Props {
  carta: Carta
  /** Quando true, renderiza a silhueta misteriosa (não desbloqueada). */
  locked?: boolean
  /** Mostra os painéis de autoridade/efeito/recompensa abaixo da arte. */
  showDetails?: boolean
  onClick?: () => void
  className?: string
  /** Largura em px; a altura segue a proporção 5/7. */
  width?: number
}

/**
 * CartaView — face de uma carta colecionável do Códex Veritas.
 *
 * O tratamento visual muda por raridade (RARIDADE_META):
 *   comum  → sem brilho, ilustração na metade superior, clean
 *   rara   → ilustração cobre até atrás do texto
 *   épica  → idem + leve glow
 *   lendária/suprema → ilustração full-bleed, dourado, holográfico
 */
export default function CartaView({
  carta,
  locked = false,
  showDetails = false,
  onClick,
  className,
  width = 280,
}: Props) {
  const meta = RARIDADE_META[carta.raridade]
  const accent = carta.cor_accent || meta.cor
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

  const outerStyle: CSSProperties = {
    width,
    aspectRatio: '5 / 7',
    border: `2px solid ${locked ? 'rgba(242,237,228,0.08)' : meta.borda}`,
    background:
      'linear-gradient(155deg, rgba(22,21,17,0.98) 0%, rgba(13,13,13,0.99) 100%)',
    boxShadow: locked
      ? 'inset 0 1px 0 rgba(255,255,255,0.03)'
      : `0 16px 44px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)${
          meta.glow ? `, ${meta.glow}` : ''
        }`,
  }

  // --- Estado bloqueado: silhueta misteriosa --------------------------------
  if (locked) {
    const body = (
      <div
        className={cn(
          'relative rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-3 p-6 text-center',
          onClick && 'transition-transform active:scale-[0.98]',
          className,
        )}
        style={outerStyle}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: width * 0.28,
            height: width * 0.28,
            background: 'rgba(242,237,228,0.04)',
            border: '1px solid rgba(242,237,228,0.08)',
          }}
        >
          <Lock
            style={{ width: width * 0.1, height: width * 0.1, color: '#4A463F' }}
          />
        </div>
        <p
          className="text-sm uppercase tracking-[0.18em]"
          style={{ fontFamily: 'Cinzel, serif', color: '#5A554C' }}
        >
          Carta selada
        </p>
        {carta.dica_desbloqueio && (
          <p
            className="text-[11px] leading-snug"
            style={{ color: '#6E685D', fontFamily: 'Poppins, sans-serif' }}
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

  // --- Estado desbloqueado --------------------------------------------------
  const cobertura = meta.cobertura
  const ilustracaoTopo = cobertura === 'half'

  const body = (
    <div
      ref={cardRef}
      onPointerMove={handlePointer}
      onPointerLeave={() => setHolo((h) => ({ ...h, active: false }))}
      className={cn(
        'relative rounded-2xl overflow-hidden flex flex-col',
        onClick && 'transition-transform active:scale-[0.98]',
        className,
      )}
      style={outerStyle}
    >
      {/* Ilustração */}
      <div
        className="absolute inset-0"
        style={{
          bottom: cobertura === 'bleed' ? 0 : cobertura === 'full' ? '18%' : '52%',
        }}
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
            style={{ background: 'rgba(242,237,228,0.03)' }}
          >
            <span
              className="text-5xl opacity-30"
              style={{ color: accent }}
            >
              {carta.simbolo || '✛'}
            </span>
          </div>
        )}
        {/* Véu de leitura sobre a arte (mais forte onde há texto) */}
        <div
          className="absolute inset-0"
          style={{
            background: ilustracaoTopo
              ? 'linear-gradient(to bottom, rgba(13,13,13,0) 60%, rgba(13,13,13,0.95) 100%)'
              : 'linear-gradient(to bottom, rgba(13,13,13,0.55) 0%, rgba(13,13,13,0) 28%, rgba(13,13,13,0) 50%, rgba(13,13,13,0.92) 88%)',
          }}
        />
      </div>

      {/* Topo: raridade + número + estrelas */}
      <div className="relative z-10 flex items-start justify-between p-3">
        <span
          className="px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-[0.14em]"
          style={{
            fontFamily: 'Poppins, sans-serif',
            color: '#0D0D0D',
            background: accent,
          }}
        >
          {meta.label}
        </span>
        {carta.numero != null && (
          <span
            className="text-[11px] tabular-nums"
            style={{ fontFamily: 'Cinzel, serif', color: accent }}
          >
            Nº {String(carta.numero).padStart(3, '0')}
          </span>
        )}
      </div>
      <div className="relative z-10 flex gap-0.5 px-3 -mt-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className="w-3 h-3"
            style={{
              color: i < carta.estrelas ? accent : 'rgba(242,237,228,0.12)',
              fill: i < carta.estrelas ? accent : 'transparent',
            }}
          />
        ))}
      </div>

      {/* Rodapé: título + frase + meta */}
      <div className="relative z-10 mt-auto p-4 flex flex-col gap-2">
        <div>
          <h3
            className="leading-tight"
            style={{
              fontFamily: 'Cinzel, serif',
              color: '#F2EDE4',
              fontSize: width > 240 ? 20 : 16,
              fontWeight: 600,
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            }}
          >
            {carta.nome}
          </h3>
          {carta.subtitulo && (
            <p
              className="text-[10px] uppercase tracking-[0.16em] mt-0.5"
              style={{ color: accent, fontFamily: 'Poppins, sans-serif' }}
            >
              {carta.subtitulo}
            </p>
          )}
        </div>

        {carta.frase_central && (
          <div
            className="rounded-lg px-3 py-2"
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: `1px solid ${meta.borda}`,
            }}
          >
            <p
              className="text-[11px] italic leading-snug"
              style={{ color: '#E8E2D6', fontFamily: 'Cinzel, serif' }}
            >
              “{carta.frase_central}”
            </p>
            {carta.frase_referencia && (
              <p
                className="text-[9px] mt-1"
                style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
              >
                {carta.frase_referencia}
              </p>
            )}
          </div>
        )}

        {showDetails && (
          <div className="flex flex-col gap-1.5 mt-1">
            {carta.efeito_simbolico && (
              <Detalhe
                titulo="Efeito"
                texto={carta.efeito_simbolico}
                accent={accent}
              />
            )}
            {carta.recompensa.length > 0 && (
              <Detalhe
                titulo="Recompensa"
                texto={carta.recompensa.join(' · ')}
                accent={accent}
              />
            )}
          </div>
        )}

        {(carta.categoria || carta.simbolo) && (
          <div className="flex items-center justify-between pt-1">
            <span
              className="text-[9px] uppercase tracking-[0.14em]"
              style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
            >
              {carta.categoria}
            </span>
            {carta.simbolo && (
              <span style={{ color: accent, fontSize: 13 }}>{carta.simbolo}</span>
            )}
          </div>
        )}
      </div>

      {/* Camada holográfica (lendária / suprema) */}
      {meta.holo && (
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            opacity: holo.active ? 0.55 : 0.2,
            transition: 'opacity 0.2s',
            background: `radial-gradient(circle at ${holo.x}% ${holo.y}%, ${accent}55 0%, transparent 45%), linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.12) 48%, transparent 60%)`,
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
}: {
  titulo: string
  texto: string
  accent: string
}) {
  return (
    <div>
      <p
        className="text-[8px] uppercase tracking-[0.18em]"
        style={{ color: accent, fontFamily: 'Poppins, sans-serif' }}
      >
        {titulo}
      </p>
      <p
        className="text-[10px] leading-snug"
        style={{ color: '#C9C2B4', fontFamily: 'Poppins, sans-serif' }}
      >
        {texto}
      </p>
    </div>
  )
}
