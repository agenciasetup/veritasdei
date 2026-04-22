'use client'

import { getFamiliaMeta } from '@/lib/santos/familia-religiosa'

/**
 * Chip mostrando a família espiritual do santo (ex.: "Franciscano").
 * Usado em /santos/[slug] como contexto sem forçar paleta global.
 */
export default function FamiliaReligiosaChip({ familia }: { familia: string | null | undefined }) {
  const meta = getFamiliaMeta(familia)
  if (!meta) return null

  return (
    <div
      className="inline-flex flex-col gap-0.5 px-3 py-2 rounded-xl"
      style={{
        background: meta.acentoSoft,
        border: `1px solid ${meta.acento}45`,
      }}
    >
      <span
        className="text-[10px] tracking-[0.12em] uppercase"
        style={{
          color: meta.acento,
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 600,
        }}
      >
        Tradição
      </span>
      <span
        style={{
          fontFamily: 'Cinzel, Georgia, serif',
          color: '#F2EDE4',
          fontSize: '0.85rem',
          fontWeight: 500,
        }}
      >
        {meta.label}
      </span>
      <span
        className="italic mt-0.5"
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          color: 'rgba(242,237,228,0.65)',
          fontSize: '0.75rem',
          letterSpacing: '0.01em',
        }}
      >
        {meta.lema}
      </span>
    </div>
  )
}
