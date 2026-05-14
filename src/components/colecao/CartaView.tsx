'use client'

import { useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { Lock, Star } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { RARIDADE_META, type Carta, type CartaMoldura } from '@/types/colecao'

// ── Tamanho de DESENHO fixo ──────────────────────────────────────────────
// A carta é desenhada SEMPRE em 300×420 e a peça inteira é escalada via
// transform: scale(). Assim toda instância (catálogo, editor, dashboard,
// modal) tem proporções pixel-idênticas — "diminui um, diminui tudo".
const DESIGN_W = 300
const DESIGN_H = 420

interface Props {
  carta: Carta
  /** Silhueta misteriosa (não desbloqueada). */
  locked?: boolean
  onClick?: () => void
  className?: string
  /** Largura final em px; a altura segue 5/7 e tudo escala junto. */
  width?: number
  /** Sobrescreve a escala de fonte da carta (preview do editor). */
  escalaFonte?: number
}

/**
 * CartaView — face de uma carta colecionável.
 *
 * Desenhada num canvas fixo 300×420 e escalada inteira. A raridade define
 * o modo da arte (janela/cheia), o brilho e o holográfico; o campo
 * `moldura` define o estilo do frame. `escala_fonte` ajusta só os textos.
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
  const scale = width / DESIGN_W
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

  /** Tamanho de fonte em unidades de desenho, com a escala da carta. */
  const fs = (px: number) => Math.round(px * esc * 10) / 10

  const designStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: DESIGN_W,
    height: DESIGN_H,
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    borderRadius: 20,
    overflow: 'hidden',
    border: `2.5px solid ${locked ? 'rgba(242,237,228,0.12)' : meta.borda}`,
    background: 'linear-gradient(160deg, #1b1812 0%, #0b0a08 100%)',
    boxShadow: locked
      ? 'inset 0 1px 0 rgba(255,255,255,0.03)'
      : `0 18px 46px rgba(0,0,0,0.6)${meta.glow ? `, ${meta.glow}` : ''}`,
  }

  // ── Conteúdo interno (em unidades de desenho) ──────────────────────────
  let inner: React.ReactNode

  if (locked) {
    inner = (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 78,
            height: 78,
            background: 'rgba(242,237,228,0.04)',
            border: '1px solid rgba(242,237,228,0.08)',
          }}
        >
          <Lock style={{ width: 30, height: 30, color: '#4A463F' }} />
        </div>
        <p
          className="uppercase"
          style={{
            fontFamily: 'Cinzel, serif',
            color: '#5A554C',
            fontSize: 14,
            letterSpacing: '0.18em',
          }}
        >
          Carta selada
        </p>
        {carta.dica_desbloqueio && (
          <p
            style={{
              color: '#6E685D',
              fontFamily: 'Poppins, sans-serif',
              fontSize: 12,
              lineHeight: 1.4,
            }}
          >
            {carta.dica_desbloqueio}
          </p>
        )}
        <Moldura tipo="classica" accent="rgba(242,237,228,0.2)" />
      </div>
    )
  } else {
    const artH = cheia ? DESIGN_H : Math.round(DESIGN_H * meta.artFracao)
    inner = (
      <>
        {/* Ilustração */}
        <div
          className="absolute left-0 right-0 top-0 overflow-hidden"
          style={{
            height: artH,
            borderBottom: cheia ? 'none' : `2px solid ${meta.borda}`,
          }}
        >
          {carta.ilustracao_url ? (
            <Image
              src={carta.ilustracao_url}
              alt={carta.nome}
              fill
              sizes={`${Math.ceil(width)}px`}
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
              <span style={{ color: accent, fontSize: 72, opacity: 0.45 }}>
                {carta.simbolo || '✛'}
              </span>
            </div>
          )}
          {/* véu de leitura */}
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: cheia ? '62%' : '36%',
              background: cheia
                ? 'linear-gradient(to top, rgba(8,7,5,0.97) 0%, rgba(8,7,5,0.82) 32%, rgba(8,7,5,0) 100%)'
                : 'linear-gradient(to bottom, rgba(11,10,8,0) 0%, rgba(11,10,8,0.9) 78%, rgba(11,10,8,1) 100%)',
            }}
          />
        </div>

        {/* Painel sólido (modo janela) */}
        {!cheia && (
          <div
            className="absolute left-0 right-0 bottom-0"
            style={{
              height: DESIGN_H - artH,
              background: 'linear-gradient(180deg, #221d15 0%, #131009 100%)',
            }}
          />
        )}

        {/* Topo: raridade + estrelas + número — recuado pra dentro da moldura */}
        <div
          className="absolute left-0 right-0 top-0 flex items-start justify-between"
          style={{ padding: 28, zIndex: 10 }}
        >
          <div className="flex flex-col" style={{ gap: 6 }}>
            <span
              className="font-semibold uppercase"
              style={{
                fontFamily: 'Poppins, sans-serif',
                color: '#15120C',
                background: accent,
                fontSize: 10,
                letterSpacing: '0.14em',
                padding: '3px 9px',
                borderRadius: 5,
                boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
              }}
            >
              {meta.label}
            </span>
            <div className="flex" style={{ gap: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  style={{
                    width: 13,
                    height: 13,
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
                fontSize: 13,
                textShadow: '0 1px 4px rgba(0,0,0,0.95)',
              }}
            >
              Nº {String(carta.numero).padStart(3, '0')}
            </span>
          )}
        </div>

        {/* Texto: ancorado no rodapé */}
        <div
          className="absolute left-0 right-0 bottom-0 flex flex-col"
          style={{ padding: '18px 28px 24px', gap: 6, zIndex: 10 }}
        >
          <div>
            <h3
              style={{
                fontFamily: 'Cinzel, serif',
                color: '#F6F1E5',
                fontSize: fs(21),
                fontWeight: 600,
                lineHeight: 1.12,
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
                className="uppercase"
                style={{
                  color: accent,
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: fs(9.5),
                  letterSpacing: '0.16em',
                  marginTop: 3,
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
              style={{
                borderRadius: 7,
                padding: '8px 11px',
                background: 'rgba(0,0,0,0.5)',
                border: `1px solid ${accent}33`,
              }}
            >
              <p
                style={{
                  color: '#EBE5D8',
                  fontFamily: 'Cinzel, serif',
                  fontStyle: 'italic',
                  fontSize: fs(11.5),
                  lineHeight: 1.35,
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
                    fontSize: fs(8.5),
                    marginTop: 3,
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
                className="uppercase"
                style={{
                  color: cheia ? '#C9C2B4' : '#8A8378',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: fs(8.5),
                  letterSpacing: '0.14em',
                  textShadow: cheia ? '0 1px 4px rgba(0,0,0,0.9)' : 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {carta.categoria}
              </span>
              {carta.simbolo && (
                <span style={{ color: accent, fontSize: fs(14), flexShrink: 0 }}>
                  {carta.simbolo}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Holográfico (lendária / suprema) */}
        {meta.holo && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 20,
              opacity: holo.active ? 0.5 : 0.2,
              transition: 'opacity 0.2s',
              background: `radial-gradient(circle at ${holo.x}% ${holo.y}%, ${accent}66 0%, transparent 45%), linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.12) 50%, transparent 62%)`,
              mixBlendMode: 'overlay',
            }}
          />
        )}

        {/* Moldura — POR CIMA de tudo (z-30), mas o conteúdo já está recuado
            pra dentro dela, então emoldura sem cobrir nada. */}
        <Moldura tipo={carta.moldura} accent={accent} />
      </>
    )
  }

  const conteudo = (
    <div
      ref={cardRef}
      onPointerMove={handlePointer}
      onPointerLeave={() => setHolo((h) => ({ ...h, active: false }))}
      style={designStyle}
    >
      {inner}
    </div>
  )

  const wrapStyle: CSSProperties = {
    position: 'relative',
    width,
    height: (width * DESIGN_H) / DESIGN_W,
  }

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={cn('block transition-transform active:scale-[0.98]', className)}
      style={wrapStyle}
    >
      {conteudo}
    </button>
  ) : (
    <div className={className} style={wrapStyle}>
      {conteudo}
    </div>
  )
}

/**
 * Moldura — frame ornamental, renderizado POR CIMA do conteúdo (z-30). O
 * conteúdo da carta já é recuado o suficiente pra caber dentro dela.
 * Tudo em unidades de desenho (300×420), então escala junto com a carta.
 *
 *   minimalista → fio único fino
 *   classica    → fio duplo limpo
 *   vitral      → fio + "joias" nas bordas
 *   ornamentada → moldura dupla brilhante + cantos sólidos em quarto-de-
 *                 círculo (fecham a moldura) + 4 losangos formando a cruz
 */
function Moldura({ tipo, accent }: { tipo: CartaMoldura; accent: string }) {
  const wrap = 'absolute inset-0 pointer-events-none'
  const wrapStyle: CSSProperties = { zIndex: 30 }

  if (tipo === 'minimalista') {
    return (
      <div className={wrap} style={wrapStyle}>
        <div
          className="absolute"
          style={{ inset: 9, border: `1.5px solid ${accent}99`, borderRadius: 14 }}
        />
      </div>
    )
  }

  if (tipo === 'classica') {
    return (
      <div className={wrap} style={wrapStyle}>
        <div
          className="absolute"
          style={{ inset: 7, border: `2px solid ${accent}`, borderRadius: 16 }}
        />
        <div
          className="absolute"
          style={{ inset: 12, border: `1px solid ${accent}55`, borderRadius: 12 }}
        />
      </div>
    )
  }

  if (tipo === 'vitral') {
    const joias = [
      { top: 9, left: 9 },
      { top: 9, right: 9 },
      { bottom: 9, left: 9 },
      { bottom: 9, right: 9 },
      { top: 6, left: '50%', mx: true },
      { bottom: 6, left: '50%', mx: true },
      { left: 6, top: '50%', my: true },
      { right: 6, top: '50%', my: true },
    ] as const
    return (
      <div className={wrap} style={wrapStyle}>
        <div
          className="absolute"
          style={{ inset: 8, border: `2.5px solid ${accent}AA`, borderRadius: 15 }}
        />
        {joias.map((j, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              width: 9,
              height: 9,
              background: accent,
              boxShadow: `0 0 7px ${accent}`,
              top: 'top' in j ? j.top : undefined,
              bottom: 'bottom' in j ? j.bottom : undefined,
              left: 'left' in j ? j.left : undefined,
              right: 'right' in j ? j.right : undefined,
              transform:
                'mx' in j
                  ? 'translateX(-50%)'
                  : 'my' in j
                    ? 'translateY(-50%)'
                    : undefined,
            }}
          />
        ))}
      </div>
    )
  }

  // ── ornamentada ──────────────────────────────────────────────────────
  const FRAME = 13
  const R = 18
  const WEDGE = 14 // canto sólido em quarto-de-círculo
  const D = 15 // losango
  const OFF = FRAME - D / 2 // centraliza o losango na linha da moldura
  const losango = (extra: CSSProperties): CSSProperties => ({
    position: 'absolute',
    width: D,
    height: D,
    background: accent,
    boxShadow: `0 0 9px ${accent}, 0 0 3px ${accent}`,
    ...extra,
  })
  return (
    <div className={wrap} style={wrapStyle}>
      {/* moldura externa — linha forte e brilhante */}
      <div
        className="absolute"
        style={{
          inset: FRAME,
          border: `3px solid ${accent}`,
          borderRadius: R,
          boxShadow: `0 0 14px ${accent}55, inset 0 0 14px ${accent}22`,
        }}
      />
      {/* moldura interna — fio fino */}
      <div
        className="absolute"
        style={{
          inset: FRAME + 5,
          border: `1px solid ${accent}AA`,
          borderRadius: R - 5,
        }}
      />
      {/* cantos sólidos em quarto-de-círculo — fecham a moldura */}
      <span
        className="absolute"
        style={{
          top: FRAME,
          left: FRAME,
          width: WEDGE,
          height: WEDGE,
          background: accent,
          borderBottomRightRadius: WEDGE,
          boxShadow: `0 0 8px ${accent}`,
        }}
      />
      <span
        className="absolute"
        style={{
          top: FRAME,
          right: FRAME,
          width: WEDGE,
          height: WEDGE,
          background: accent,
          borderBottomLeftRadius: WEDGE,
          boxShadow: `0 0 8px ${accent}`,
        }}
      />
      <span
        className="absolute"
        style={{
          bottom: FRAME,
          left: FRAME,
          width: WEDGE,
          height: WEDGE,
          background: accent,
          borderTopRightRadius: WEDGE,
          boxShadow: `0 0 8px ${accent}`,
        }}
      />
      <span
        className="absolute"
        style={{
          bottom: FRAME,
          right: FRAME,
          width: WEDGE,
          height: WEDGE,
          background: accent,
          borderTopLeftRadius: WEDGE,
          boxShadow: `0 0 8px ${accent}`,
        }}
      />
      {/* 4 losangos formando a cruz — laterais elevados (na travessa) */}
      <span
        style={losango({
          top: OFF,
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
        })}
      />
      <span
        style={losango({
          bottom: OFF,
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
        })}
      />
      <span
        style={losango({
          left: OFF,
          top: '34%',
          transform: 'translateY(-50%) rotate(45deg)',
        })}
      />
      <span
        style={losango({
          right: OFF,
          top: '34%',
          transform: 'translateY(-50%) rotate(45deg)',
        })}
      />
    </div>
  )
}
