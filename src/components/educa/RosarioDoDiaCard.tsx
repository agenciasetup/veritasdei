'use client'

/**
 * RosarioDoDiaCard — convite pra rezar o rosário com os mistérios do dia.
 *
 * Esquema tradicional:
 *  - Domingo, Quarta:    Mistérios Gloriosos
 *  - Segunda, Sábado:    Mistérios Gozosos
 *  - Terça, Sexta:       Mistérios Dolorosos
 *  - Quinta:             Mistérios Luminosos (instituídos por João Paulo II)
 *
 * Cor visual por tipo (tintas sutis, não ofusca a UI dourada).
 * Link → /rosario (rota já existente).
 */

import Link from 'next/link'
import { ArrowRight, Heart } from 'lucide-react'
import GlassCard from './GlassCard'

type MisterioTipo = 'gozosos' | 'dolorosos' | 'gloriosos' | 'luminosos'

const TIPO_POR_DIA: Record<number, MisterioTipo> = {
  0: 'gloriosos', // domingo
  1: 'gozosos',   // segunda
  2: 'dolorosos', // terça
  3: 'gloriosos', // quarta
  4: 'luminosos', // quinta
  5: 'dolorosos', // sexta
  6: 'gozosos',   // sábado
}

const META: Record<
  MisterioTipo,
  { label: string; tint: string; desc: string }
> = {
  gozosos: {
    label: 'Mistérios Gozosos',
    tint: '#F2EDE4', // branco
    desc: 'Anunciação · Visitação · Natividade · Apresentação · Encontro no Templo',
  },
  dolorosos: {
    label: 'Mistérios Dolorosos',
    tint: '#D94F5C', // vermelho
    desc: 'Agonia · Flagelação · Coroação de espinhos · Caminho da Cruz · Crucifixão',
  },
  gloriosos: {
    label: 'Mistérios Gloriosos',
    tint: '#C9A84C', // dourado
    desc: 'Ressurreição · Ascensão · Pentecostes · Assunção · Coroação',
  },
  luminosos: {
    label: 'Mistérios Luminosos',
    tint: '#BA68C8', // roxo
    desc: 'Batismo · Caná · Anúncio do Reino · Transfiguração · Eucaristia',
  },
}

export default function RosarioDoDiaCard() {
  const today = new Date()
  const tipo = TIPO_POR_DIA[today.getDay()]
  const meta = META[tipo]

  return (
    <Link href="/rosario" className="block h-full">
      <GlassCard variant="flat" interactive className="h-full">
        <div className="relative p-5 md:p-6 h-full flex flex-col">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.3]"
            style={{
              background: `radial-gradient(110% 70% at 100% 0%, ${meta.tint}28 0%, transparent 60%)`,
              mixBlendMode: 'screen',
            }}
          />

          <div className="relative flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart
                className="w-4 h-4"
                style={{ color: meta.tint }}
                strokeWidth={2}
              />
              <span
                className="text-[10px] tracking-[0.2em] uppercase"
                style={{
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-display)',
                  opacity: 0.85,
                }}
              >
                Rosário de hoje
              </span>
            </div>
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: meta.tint, boxShadow: `0 0 8px ${meta.tint}80` }}
            />
          </div>

          <p
            className="relative text-lg md:text-xl leading-tight mb-1.5"
            style={{
              color: 'var(--text-1)',
              fontFamily: 'var(--font-elegant)',
              fontWeight: 500,
            }}
          >
            {meta.label}
          </p>

          <p
            className="relative text-[11px] leading-relaxed"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {meta.desc}
          </p>

          <div className="relative flex items-center justify-between mt-auto pt-4 gap-2">
            <span
              className="text-[11px]"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              5 dezenas · ~20 min
            </span>
            <span
              className="inline-flex items-center gap-1 text-[11px]"
              style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
            >
              Rezar agora
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </GlassCard>
    </Link>
  )
}
