"use client"

import { forwardRef, type HTMLAttributes } from "react"

type Variant = "flat" | "elevated" | "inset"

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant
  /** Remove padding interno (útil para cards que contêm listas ou hero imagens). */
  unpadded?: boolean
  /** Padding: sm (12px) | md (16px) | lg (24px). Default md. */
  padding?: "sm" | "md" | "lg"
  interactive?: boolean
}

const PADDING = { sm: "p-3", md: "p-4", lg: "p-6" } as const

function variantStyle(variant: Variant): React.CSSProperties {
  switch (variant) {
    case "flat":
      return {
        background: "var(--surface-2)",
        border: "1px solid var(--border-1)",
      }
    case "elevated":
      return {
        background: "var(--surface-3)",
        border: "1px solid var(--border-1)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)",
      }
    case "inset":
      return {
        background: "var(--surface-inset)",
        border: "1px solid var(--border-2)",
      }
  }
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    variant = "flat",
    unpadded = false,
    padding = "md",
    interactive = false,
    className,
    style,
    children,
    ...rest
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className={[
        "rounded-2xl",
        unpadded ? "" : PADDING[padding],
        interactive
          ? "transition-transform duration-150 ease-out active:scale-[0.99] cursor-pointer"
          : "",
        className ?? "",
      ].join(" ")}
      style={{
        ...variantStyle(variant),
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
})
