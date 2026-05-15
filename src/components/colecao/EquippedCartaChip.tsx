'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { RARIDADE_META, type CartaRaridade } from '@/types/colecao'

/**
 * Mini-chip da carta-vitrine equipada — aparece ao lado do nome no
 * header do perfil, em posts da comunidade e no JourneyHero. Substitui
 * visualmente o antigo `EquippedReliquiaChip`.
 *
 * Renderiza um pílula com o emblema/símbolo da carta + nome + número de
 * série. Linka para a página pública de verificação `/c/<token>` quando
 * o token estiver disponível (perfis públicos exibem isso, jornada/header
 * próprio também).
 */

export interface EquippedCartaChipData {
  id: string
  slug: string
  nome: string
  subtitulo: string | null
  numero: number | null
  raridade: CartaRaridade
  estrelas: number
  simbolo: string | null
  cor_accent: string | null
  ilustracao_url: string | null
  serial_number: number
  token: string
  minted_at: string
}

interface Props {
  carta: EquippedCartaChipData
  size?: 'xs' | 'sm' | 'md'
  showName?: boolean
  className?: string
  /** Se false, renderiza como `<span>` em vez de `<a>` (sem navegação). */
  linkParaCertificado?: boolean
}

const SIZE_META = {
  xs: { icon: 14, h: 18, px: 5, fs: 10, gap: 4 },
  sm: { icon: 18, h: 22, px: 6, fs: 11, gap: 5 },
  md: { icon: 22, h: 28, px: 8, fs: 12, gap: 6 },
}

export default function EquippedCartaChip({
  carta,
  size = 'sm',
  showName = false,
  className,
  linkParaCertificado = true,
}: Props) {
  const meta = RARIDADE_META[carta.raridade]
  const accent = carta.cor_accent || meta.cor
  const s = SIZE_META[size]

  const conteudo = (
    <>
      <span
        className="rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          width: s.icon,
          height: s.icon,
          background: carta.ilustracao_url
            ? `url(${carta.ilustracao_url}) center/cover`
            : `linear-gradient(135deg, ${accent}, rgba(0,0,0,0.4))`,
          border: `1px solid ${accent}`,
          boxShadow: `0 0 6px ${accent}66`,
          color: '#0F0E0C',
          fontSize: s.icon * 0.55,
          fontFamily: 'Cinzel, serif',
        }}
        aria-hidden
      >
        {!carta.ilustracao_url && (carta.simbolo ?? <Sparkles className="w-3 h-3" />)}
      </span>
      {showName && (
        <span
          className="whitespace-nowrap inline-flex items-center"
          style={{ gap: s.gap }}
        >
          <span
            style={{
              fontSize: s.fs,
              color: accent,
              fontFamily: 'Cinzel, serif',
              letterSpacing: '0.03em',
              fontWeight: 500,
            }}
          >
            {carta.nome}
          </span>
          <span
            className="tabular-nums"
            style={{
              fontSize: s.fs - 1,
              color: '#0F0E0C',
              background: accent,
              padding: '1px 5px',
              borderRadius: 3,
              fontFamily: 'Cinzel, serif',
              fontWeight: 600,
            }}
          >
            #{String(carta.serial_number).padStart(3, '0')}
          </span>
        </span>
      )}
    </>
  )

  const wrapStyle = {
    height: s.h,
    paddingInline: s.px,
    background: `${accent}15`,
    border: `1px solid ${accent}55`,
    boxShadow: `0 0 8px ${accent}33`,
    gap: s.gap,
  } as const
  const wrapClass = `inline-flex items-center rounded-full ${className ?? ''}`
  const titulo = `Carta: ${carta.nome} · Cópia #${carta.serial_number}`

  if (linkParaCertificado && carta.token) {
    return (
      <Link
        href={`/c/${carta.token}`}
        className={wrapClass}
        style={wrapStyle}
        title={titulo}
        aria-label={titulo}
      >
        {conteudo}
      </Link>
    )
  }

  return (
    <span className={wrapClass} style={wrapStyle} title={titulo}>
      {conteudo}
    </span>
  )
}
