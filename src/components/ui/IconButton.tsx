"use client"

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react"

type Variant = "ghost" | "solid" | "accent"
type Size = "sm" | "md" | "lg"

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /** Descrição obrigatória para acessibilidade (vira aria-label se não houver um). */
  label: string
  children: ReactNode
}

const SIZE: Record<Size, string> = {
  sm: "w-9 h-9",
  md: "w-11 h-11",
  lg: "w-12 h-12",
}

function variantStyle(variant: Variant): React.CSSProperties {
  switch (variant) {
    case "ghost":
      return {
        background: "transparent",
        color: "var(--text-2)",
        border: "1px solid transparent",
      }
    case "solid":
      return {
        background: "var(--surface-2)",
        color: "var(--text-1)",
        border: "1px solid var(--border-1)",
      }
    case "accent":
      return {
        background: "var(--accent-soft)",
        color: "var(--accent)",
        border: "1px solid var(--accent-soft)",
      }
  }
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    variant = "ghost",
    size = "md",
    label,
    disabled,
    className,
    children,
    type = "button",
    style,
    "aria-label": ariaLabel,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel ?? label}
      title={label}
      className={[
        "inline-flex items-center justify-center rounded-full",
        "transition-[transform,opacity,background-color,border-color] duration-150 ease-out",
        "active:scale-[0.94] disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2",
        SIZE[size],
        className ?? "",
      ].join(" ")}
      style={{
        ...variantStyle(variant),
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
})
