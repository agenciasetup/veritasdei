"use client"

import type { ReactNode } from "react"
import CrossIcon from "@/components/icons/CrossIcon"

export interface EmptyStateProps {
  /** Ícone custom no topo. Se omitido, usa CrossIcon sutil como decoração. */
  icon?: ReactNode
  title: string
  description?: ReactNode
  /** Ação primária (botão, link). */
  action?: ReactNode
  /** Ação secundária (opcional, ex: "Saiba mais"). */
  secondaryAction?: ReactNode
  className?: string
}

/**
 * Estado vazio padronizado. Centralizado, espaçoso, com ícone sutil no topo,
 * título em Cinzel e descrição em texto secundário. Use em listagens sem
 * resultados, seções sem conteúdo ainda, buscas sem match.
 *
 * ```tsx
 * <EmptyState
 *   title="Nenhuma novena em curso"
 *   description="Escolha uma do catálogo e comece a rezar."
 *   action={<Button variant="gold" onClick={...}>Ver catálogo</Button>}
 * />
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center text-center px-6 py-16 gap-3",
        className ?? "",
      ].join(" ")}
    >
      <div
        className="flex items-center justify-center rounded-2xl mb-2"
        style={{
          width: 56,
          height: 56,
          background: "var(--surface-2)",
          border: "1px solid var(--border-1)",
          color: "var(--text-3)",
        }}
        aria-hidden="true"
      >
        {icon ?? <CrossIcon size="md" />}
      </div>

      <h3
        className="text-base md:text-lg tracking-[0.06em] uppercase"
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--text-1)",
          fontWeight: 700,
        }}
      >
        {title}
      </h3>

      {description && (
        <p
          className="text-sm max-w-sm"
          style={{ color: "var(--text-3)", fontFamily: "var(--font-body)" }}
        >
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-3 flex flex-col sm:flex-row items-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}

export default EmptyState
