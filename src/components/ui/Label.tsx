"use client"

import { forwardRef, type LabelHTMLAttributes, type ReactNode } from "react"

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Marca como obrigatório (adiciona asterisco dourado). */
  required?: boolean
  /** Hint curto à direita do label (ex: "opcional"). */
  hint?: ReactNode
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { required, hint, children, className, style, ...rest },
  ref,
) {
  return (
    <label
      ref={ref}
      className={[
        "flex items-center justify-between gap-2 mb-1.5 text-xs tracking-wider uppercase",
        className ?? "",
      ].join(" ")}
      style={{
        color: "var(--text-2)",
        fontFamily: "var(--font-display)",
        letterSpacing: "0.06em",
        ...style,
      }}
      {...rest}
    >
      <span className="flex items-center gap-1.5 min-w-0 truncate">
        {children}
        {required && (
          <span aria-hidden="true" style={{ color: "var(--accent)" }}>
            *
          </span>
        )}
      </span>
      {hint && (
        <span
          className="text-[10px] normal-case tracking-normal"
          style={{ color: "var(--text-3)", fontFamily: "var(--font-body)" }}
        >
          {hint}
        </span>
      )}
    </label>
  )
})
