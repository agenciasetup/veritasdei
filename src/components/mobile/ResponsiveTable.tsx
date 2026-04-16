'use client'

import { type ReactNode } from 'react'

/**
 * `<ResponsiveTable />` — desktop renderiza uma tabela tradicional;
 * mobile renderiza cards empilhados.
 *
 * As páginas admin envolvem o conteúdo nesse componente para evitar
 * scroll horizontal em telas pequenas.
 *
 * Uso:
 * <ResponsiveTable
 *   header={<tr>...</tr>}
 *   rows={items.map((it) => ({
 *     key: it.id,
 *     desktop: <tr>...</tr>,
 *     mobile: <CardLayout item={it} />,
 *   }))}
 * />
 */

export interface ResponsiveRow {
  key: string
  desktop: ReactNode
  mobile: ReactNode
}

interface ResponsiveTableProps {
  header?: ReactNode
  rows: ResponsiveRow[]
  /** Mensagem quando rows está vazio */
  emptyMessage?: string
  /** ClassName extra no <table> desktop */
  tableClassName?: string
}

export default function ResponsiveTable({
  header,
  rows,
  emptyMessage = 'Nenhum item.',
  tableClassName = '',
}: ResponsiveTableProps) {
  if (rows.length === 0) {
    return (
      <div
        className="text-center py-10 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(201,168,76,0.15)',
          color: '#8A8378',
          fontFamily: 'Poppins, sans-serif',
          fontSize: '0.875rem',
        }}
      >
        {emptyMessage}
      </div>
    )
  }

  return (
    <>
      {/* Desktop: tabela tradicional */}
      <div className="hidden md:block overflow-x-auto">
        <table className={`w-full text-sm ${tableClassName}`}>
          {header}
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} style={{ borderBottom: '1px solid rgba(201,168,76,0.06)' }}>
                {r.desktop}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards empilhados */}
      <ul className="md:hidden flex flex-col gap-2">
        {rows.map((r) => (
          <li key={r.key}>{r.mobile}</li>
        ))}
      </ul>
    </>
  )
}

/**
 * Helper: card padrão para uso em ResponsiveTable.rows[].mobile.
 */
export function ResponsiveCard({
  children,
  highlighted,
}: {
  children: ReactNode
  highlighted?: boolean
}) {
  return (
    <div
      className="rounded-2xl p-3"
      style={{
        background: highlighted ? 'rgba(201,168,76,0.06)' : 'rgba(20,18,14,0.6)',
        border: `1px solid ${
          highlighted ? 'rgba(201,168,76,0.22)' : 'rgba(201,168,76,0.1)'
        }`,
      }}
    >
      {children}
    </div>
  )
}
