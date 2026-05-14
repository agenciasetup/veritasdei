'use client'

import { useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { Lock, Star } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { RARIDADE_META, type Carta, type CartaMoldura } from '@/types/colecao'

interface Props {
  carta: Carta
  /** Quando true, renderiza a silhueta misteriosa (não desbloqueada). */
  locked?: boolean
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
 * O tratamento visual escala com a raridade:
 *   comum / rara              → arte numa "janela" superior, texto em painel
 *                               sólido abaixo (limpo)
 *   épica / lendária / suprema → arte cobre a carta inteira; o texto fica
 *                               sobre um véu no rodapé. Mais ouro, brilho,
 *                               moldura ornada e holográfico nas mais altas.
 *
 * `escala_fonte` (0.5–2.0) ajusta a diagramação por carta.
 */
export default function CartaView({
  carta,
  locked = false,
  onClick,
  className,
  width = 280,
  escalaFonte,
}: Props) {
  const meta = RARIDADE_META[carta.raridade]
  const accent = carta.cor_accent || meta.cor
  const esc = Math.min(2, Math.max(0.5, escalaFonte ?? carta.escala_fonte ?? 1))
  const cheia = meta.artMode === 'cheia'
  const cardRef = useRef<HTMLDivElement>(null)
  const [holo, setHolo] = useState({ x: 50, y: 50, active: false })

  const handlePointer = (e: React.PointerEvent) => {
    if (!meta.holo || locked || !cardRef.current) return
    const r = cardRef.current.getBoundingClientRect()
    setHolo({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
      active: true,
    })
  }

  const fs = (px: number) => Math.round(px * esc * 10) / 10
  const big = width > 200

  const outerStyle: CSSProperties = {
    width,
    aspectRatio: '5 / 7',
    borderRadius: 18,
    border: `2px solid ${locked ? 'rgba(242,237,228,0.1)' : meta.borda}`,
    background: 'linear-gradient(160deg, #1b1812 0%, #0b0a08 100%)',
    boxShadow: locked
      ? 'inset 0 1px 0 rgba(255,255,255,0.03)'
      : `0 18px 46px rgba(0,0,0,0.6)${meta.glow ? `, ${meta.glow}` : ''}`,
  }

  // --- Bloqueada -------------------------------------------------------------
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
          <Lock style={{ width: width * 0.1, height: width * 0.1, color: '#4A463F' }} />
        </div>
        <p
          className="uppercase tracking-[0.18em]"
          style={{ fontFamily: 'Cinzel, serif', color: '#5A554C', fontSize: 13 }}
        >
          Carta selada
        </p>
        {carta.dica_desbloqueio && (
          <p
            className="leading-snug"
            style={{ color: '#6E685D', fontFamily: 'Poppins, sans-serif', fontSize: 11 }}
          >
            {carta.dica_desbloqueio}
          </p>
        )}
        <Moldura tipo="classica" accent="rgba(242,237,228,0.18)" compact={width < 140} />
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

  // --- Desbloqueada ----------------------------------------------------------
  const artFracao = cheia ? 1 : meta.artFracao

  const ilustracao =
    carta.ilustracao_url != null ? (
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
            'radial-gradient(circle at 50% 38%, rgba(242,237,228,0.07), rgba(0,0,0,0) 70%)',
        }}
      >
        <span style={{ color: accent, fontSize: width * 0.24, opacity: 0.45 }}>
          {carta.simbolo || '✛'}
        </span>
      </div>
    )

  const textoZona = (
    <div
      className="flex flex-col"
      style={{
        padding: `${big ? 12 : 9}px ${big ? 14 : 10}px ${big ? 14 : 11}px`,
        gap: big ? 5 : 3,
      }}
    >
      <div>
        <h3
          className="leading-tight"
          style={{
            fontFamily: 'Cinzel, serif',
            color: '#F6F1E5',
            fontSize: fs(big ? 19 : 14),
            fontWeight: 600,
            textShadow: cheia ? '0 2px 10px rgba(0,0,0,0.95)' : 'none',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {carta.nome}
        </h3>
        {carta.subtitulo && (
          <p
            className="uppercase tracking-[0.16em]"
            style={{
              color: accent,
              fontFamily: 'Poppins, sans-serif',
              fontSize: fs(big ? 9 : 7.5),
              marginTop: 2,
              textShadow: cheia ? '0 1px 6px rgba(0,0,0,0.9)' : 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {carta.subtitulo}
          </p>
        )}
      </div>

      {carta.frase_central && (
        <div
          className="rounded-md"
          style={{
            padding: `${big ? 7 : 5}px ${big ? 10 : 7}px`,
            background: 'rgba(0,0,0,0.5)',
            border: `1px solid ${accent}33`,
            backdropFilter: 'blur(2px)',
          }}
        >
          <p
            className="italic leading-snug"
            style={{
              color: '#EBE5D8',
              fontFamily: 'Cinzel, serif',
              fontSize: fs(big ? 10.5 : 8.5),
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
                color: '#9A9388',
                fontFamily: 'Poppins, sans-serif',
                fontSize: fs(big ? 8 : 6.5),
                marginTop: 2,
              }}
            >
              {carta.frase_referencia}
            </p>
          )}
        </div>
      )}

      {(carta.categoria || carta.simbolo) && (
        <div className="flex items-center justify-between" style={{ marginTop: 1 }}>
          <span
            className="uppercase tracking-[0.14em]"
            style={{
              color: cheia ? '#C9C2B4' : '#8A8378',
              fontFamily: 'Poppins, sans-serif',
              fontSize: fs(big ? 8 : 6.5),
              textShadow: cheia ? '0 1px 4px rgba(0,0,0,0.9)' : 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {carta.categoria}
          </span>
          {carta.simbolo && (
            <span style={{ color: accent, fontSize: fs(big ? 13 : 10), flexShrink: 0 }}>
              {carta.simbolo}
            </span>
          )}
        </div>
      )}
    </div>
  )

  const body = (
    <div
      ref={cardRef}
      onPointerMove={handlePointer}
      onPointerLeave={() => setHolo((h) => ({ ...h, active: false }))}
      className={cn(
        'relative overflow-hidden',
        onClick && 'transition-transform active:scale-[0.98]',
        className,
      )}
      style={outerStyle}
    >
      {/* Ilustração */}
      <div
        className="absolute left-0 right-0 top-0 overflow-hidden"
        style={{
          height: `${artFracao * 100}%`,
          borderBottom: cheia ? 'none' : `1.5px solid ${meta.borda}`,
        }}
      >
        {ilustracao}
        {/* véu de leitura no rodapé da arte */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: cheia ? '62%' : '34%',
            background: cheia
              ? 'linear-gradient(to top, rgba(8,7,5,0.97) 0%, rgba(8,7,5,0.82) 32%, rgba(8,7,5,0) 100%)'
              : 'linear-gradient(to bottom, rgba(11,10,8,0) 0%, rgba(11,10,8,0.9) 78%, rgba(11,10,8,1) 100%)',
          }}
        />
      </div>

      {/* Painel sólido (apenas modo janela) */}
      {!cheia && (
        <div
          className="absolute left-0 right-0 bottom-0"
          style={{
            height: `${(1 - artFracao) * 100}%`,
            background: 'linear-gradient(180deg, #221d15 0%, #131009 100%)',
          }}
        />
      )}

      {/* Topo: raridade + estrelas + número */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-2.5">
        <div className="flex flex-col gap-1">
          <span
            className="font-semibold uppercase tracking-[0.14em]"
            style={{
              fontFamily: 'Poppins, sans-serif',
              color: '#15120C',
              background: accent,
              fontSize: 9,
              padding: '2px 7px',
              borderRadius: 5,
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
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
                  color: i < carta.estrelas ? accent : 'rgba(0,0,0,0.45)',
                  fill: i < carta.estrelas ? accent : 'rgba(0,0,0,0.4)',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
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
              textShadow: '0 1px 4px rgba(0,0,0,0.95)',
            }}
          >
            Nº {String(carta.numero).padStart(3, '0')}
          </span>
        )}
      </div>

      {/* Texto: ancorado no rodapé */}
      <div className="absolute inset-x-0 bottom-0 z-10">{textoZona}</div>

      {/* Moldura ornamental — estilo definido pelo admin */}
      <Moldura tipo={carta.moldura} accent={accent} compact={width < 140} />

      {/* Holográfico (lendária / suprema) */}
      {meta.holo && (
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            borderRadius: 18,
            opacity: holo.active ? 0.5 : 0.2,
            transition: 'opacity 0.2s',
            background: `radial-gradient(circle at ${holo.x}% ${holo.y}%, ${accent}66 0%, transparent 45%), linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.12) 50%, transparent 62%)`,
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

/**
 * Moldura — frame ornamental sobreposto. O ESTILO é definido pelo admin
 * (campo `moldura`); a cor vem do accent da carta. Quatro estilos bem
 * distintos:
 *   minimalista → fio único fino
 *   classica    → fio duplo limpo
 *   vitral      → fio + "joias" nos cantos e meios das bordas
 *   ornamentada → fio duplo + cantos em "L" dourados + florões ✦
 *
 * `compact` (cartas miniatura) reduz tudo a um fio só.
 */
function Moldura({
  tipo,
  accent,
  compact,
}: {
  tipo: CartaMoldura
  accent: string
  compact?: boolean
}) {
  const wrap = 'absolute inset-0 pointer-events-none z-[15]'

  if (compact) {
    return (
      <div className={wrap}>
        <div
          className="absolute rounded-[12px]"
          style={{ inset: 5, border: `1px solid ${accent}66` }}
        />
      </div>
    )
  }

  if (tipo === 'minimalista') {
    return (
      <div className={wrap}>
        <div
          className="absolute rounded-[12px]"
          style={{ inset: 7, border: `1px solid ${accent}88` }}
        />
      </div>
    )
  }

  if (tipo === 'classica') {
    return (
      <div className={wrap}>
        <div
          className="absolute rounded-[13px]"
          style={{ inset: 5, border: `1.5px solid ${accent}` }}
        />
        <div
          className="absolute rounded-[10px]"
          style={{ inset: 9, border: `1px solid ${accent}44` }}
        />
      </div>
    )
  }

  if (tipo === 'vitral') {
    // "joias" nos 4 cantos + 4 meios de borda
    const joias = [
      { top: 7, left: 7 },
      { top: 7, right: 7 },
      { bottom: 7, left: 7 },
      { bottom: 7, right: 7 },
      { top: 5, left: '50%', mx: true },
      { bottom: 5, left: '50%', mx: true },
      { left: 5, top: '50%', my: true },
      { right: 5, top: '50%', my: true },
    ] as const
    return (
      <div className={wrap}>
        <div
          className="absolute rounded-[12px]"
          style={{ inset: 6, border: `2px solid ${accent}AA` }}
        />
        {joias.map((j, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              width: 7,
              height: 7,
              background: accent,
              boxShadow: `0 0 6px ${accent}`,
              top: 'top' in j ? j.top : undefined,
              bottom: 'bottom' in j ? j.bottom : undefined,
              left: 'left' in j ? j.left : undefined,
              right: 'right' in j ? j.right : undefined,
              transform:
                'mx' in j ? 'translateX(-50%)' : 'my' in j ? 'translateY(-50%)' : undefined,
            }}
          />
        ))}
      </div>
    )
  }

  // ornamentada
  const cantosL = [
    { top: 8, left: 8, bt: true, bl: true },
    { top: 8, right: 8, bt: true, br: true },
    { bottom: 8, left: 8, bb: true, bl: true },
    { bottom: 8, right: 8, bb: true, br: true },
  ] as const
  const cantosFlor = [
    { top: 1, left: 5 },
    { top: 1, right: 5 },
    { bottom: 1, left: 5 },
    { bottom: 1, right: 5 },
  ] as const
  return (
    <div className={wrap}>
      <div
        className="absolute rounded-[14px]"
        style={{ inset: 4, border: `2px solid ${accent}` }}
      />
      <div
        className="absolute rounded-[10px]"
        style={{ inset: 9, border: `1px solid ${accent}66` }}
      />
      {cantosL.map((c, i) => (
        <span
          key={`l${i}`}
          className="absolute"
          style={{
            width: 17,
            height: 17,
            top: 'top' in c ? c.top : undefined,
            bottom: 'bottom' in c ? c.bottom : undefined,
            left: 'left' in c ? c.left : undefined,
            right: 'right' in c ? c.right : undefined,
            borderTop: 'bt' in c && c.bt ? `2px solid ${accent}` : undefined,
            borderBottom: 'bb' in c && c.bb ? `2px solid ${accent}` : undefined,
            borderLeft: 'bl' in c && c.bl ? `2px solid ${accent}` : undefined,
            borderRight: 'br' in c && c.br ? `2px solid ${accent}` : undefined,
          }}
        />
      ))}
      {cantosFlor.map((c, i) => (
        <span
          key={`f${i}`}
          className="absolute"
          style={{
            color: accent,
            fontSize: 11,
            lineHeight: 1,
            top: 'top' in c ? c.top : undefined,
            bottom: 'bottom' in c ? c.bottom : undefined,
            left: 'left' in c ? c.left : undefined,
            right: 'right' in c ? c.right : undefined,
            textShadow: `0 0 6px ${accent}`,
          }}
        >
          ✦
        </span>
      ))}
    </div>
  )
}
