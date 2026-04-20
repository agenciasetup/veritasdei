"use client"

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react"

type Variant = "primary" | "ghost" | "destructive" | "gold"
type Size = "sm" | "md" | "lg"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

const SIZE: Record<Size, { h: string; px: string; text: string; icon: string; radius: string }> = {
  sm: { h: "h-9",  px: "px-3",   text: "text-xs",  icon: "w-3.5 h-3.5", radius: "rounded-lg" },
  md: { h: "h-11", px: "px-4",   text: "text-sm",  icon: "w-4 h-4",    radius: "rounded-xl" },
  lg: { h: "h-12", px: "px-5",   text: "text-sm",  icon: "w-4 h-4",    radius: "rounded-xl" },
}

function variantStyle(variant: Variant): React.CSSProperties {
  switch (variant) {
    case "primary":
      return {
        background: "var(--accent)",
        color: "var(--accent-contrast)",
        border: "1px solid transparent",
        fontFamily: "var(--font-body)",
        fontWeight: 600,
      }
    case "ghost":
      return {
        background: "transparent",
        color: "var(--text-1)",
        border: "1px solid var(--border-1)",
        fontFamily: "var(--font-body)",
        fontWeight: 500,
      }
    case "destructive":
      return {
        background: "var(--danger)",
        color: "#FFFFFF",
        border: "1px solid transparent",
        fontFamily: "var(--font-body)",
        fontWeight: 600,
      }
    case "gold":
      return {
        background: "linear-gradient(135deg, var(--accent-hover) 0%, var(--accent) 55%, color-mix(in srgb, var(--accent) 85%, #000) 100%)",
        color: "var(--accent-contrast)",
        border: "1px solid transparent",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }
  }
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    leftIcon,
    rightIcon,
    fullWidth,
    className,
    children,
    type = "button",
    style,
    ...rest
  },
  ref,
) {
  const s = SIZE[size]
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={[
        "inline-flex items-center justify-center gap-2 select-none",
        "transition-[transform,opacity,background-color,border-color] duration-150 ease-out",
        "active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
        s.h,
        s.px,
        s.text,
        s.radius,
        fullWidth ? "w-full" : "",
        className ?? "",
      ].join(" ")}
      style={{
        ...variantStyle(variant),
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <span
          className={`${s.icon} border-2 rounded-full animate-spin`}
          style={{
            borderColor: "currentColor",
            borderTopColor: "transparent",
            opacity: 0.6,
          }}
          aria-hidden
        />
      ) : (
        leftIcon && <span className={s.icon} aria-hidden>{leftIcon}</span>
      )}
      {children}
      {!loading && rightIcon && <span className={s.icon} aria-hidden>{rightIcon}</span>}
    </button>
  )
})
