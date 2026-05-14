'use client'

/**
 * RosarioDoDiaCard — convite editorial pra rezar o rosário do dia.
 *
 * Versão grande: lista numerada dos 5 mistérios + tipo + tempo estimado +
 * CTA. Estilo flat: sem gradiente radial, dourado só no número, lista e
 * "Rezar agora →".
 *
 * Esquema tradicional dos mistérios:
 *  - Domingo, Quarta:    Gloriosos
 *  - Segunda, Sábado:    Gozosos
 *  - Terça, Sexta:       Dolorosos
 *  - Quinta:             Luminosos
 */

import Link from 'next/link'
import { ArrowRight, Heart } from 'lucide-react'

type MisterioTipo = 'gozosos' | 'dolorosos' | 'gloriosos' | 'luminosos'

const TIPO_POR_DIA: Record<number, MisterioTipo> = {
  0: 'gloriosos',
  1: 'gozosos',
  2: 'dolorosos',
  3: 'gloriosos',
  4: 'luminosos',
  5: 'dolorosos',
  6: 'gozosos',
}

const META: Record<
  MisterioTipo,
  { label: string; tint: string; itens: string[] }
> = {
  gozosos: {
    label: 'Mistérios Gozosos',
    tint: '#F2EDE4',
    itens: [
      'Anunciação do Anjo Gabriel',
      'Visitação a Isabel',
      'Natividade de Jesus',
      'Apresentação no Templo',
      'Encontro de Jesus no Templo',
    ],
  },
  dolorosos: {
    label: 'Mistérios Dolorosos',
    tint: '#D94F5C',
    itens: [
      'Agonia no Horto',
      'Flagelação',
      'Coroação de espinhos',
      'Caminho do Calvário',
      'Crucifixão e morte',
    ],
  },
  gloriosos: {
    label: 'Mistérios Gloriosos',
    tint: '#C9A84C',
    itens: [
      'Ressurreição de Jesus',
      'Ascensão ao Céu',
      'Vinda do Espírito Santo',
      'Assunção de Maria',
      'Coroação de Maria',
    ],
  },
  luminosos: {
    label: 'Mistérios Luminosos',
    tint: '#BA68C8',
    itens: [
      'Batismo no Jordão',
      'Bodas de Caná',
      'Anúncio do Reino',
      'Transfiguração',
      'Instituição da Eucaristia',
    ],
  },
}

export default function RosarioDoDiaCard() {
  const today = new Date()
  const tipo = TIPO_POR_DIA[today.getDay()]
  const meta = META[tipo]

  return (
    <Link
      href="/rosario"
      className="block h-full rounded-[24px] p-6 lg:p-7 transition-colors hover:bg-white/[0.01]"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <Heart
              className="w-4 h-4"
              style={{ color: 'var(--accent)' }}
              strokeWidth={1.6}
            />
          </div>
          <p
            className="text-xs"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Rosário de hoje
          </p>
          <span
            className="ml-auto inline-block w-2 h-2 rounded-full"
            style={{
              background: meta.tint,
              boxShadow: `0 0 6px ${meta.tint}80`,
            }}
            aria-hidden
          />
        </div>

        <p
          className="text-xl lg:text-2xl leading-tight mt-3"
          style={{
            color: 'var(--text-1)',
            fontFamily: 'var(--font-elegant)',
            fontWeight: 500,
          }}
        >
          {meta.label}
        </p>

        <ol className="mt-4 space-y-1.5">
          {meta.itens.map((item, idx) => (
            <li key={idx} className="flex items-baseline gap-2.5">
              <span
                className="inline-flex items-baseline justify-end w-4 text-[11px] flex-shrink-0"
                style={{
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-elegant)',
                  fontWeight: 500,
                }}
              >
                {idx + 1}
              </span>
              <span
                className="text-[13px] leading-snug"
                style={{
                  color: 'var(--text-2)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {item}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-auto pt-5 flex items-center justify-between">
          <span
            className="text-[11px]"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            5 dezenas · ~20 min
          </span>
          <span
            className="inline-flex items-center gap-1.5 text-sm"
            style={{
              color: 'var(--accent)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Rezar agora
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
