"use client"

import CrossIcon from "@/components/icons/CrossIcon"

type Variant = "hair" | "ornament"

export interface DividerProps {
  variant?: Variant
  className?: string
  /** Ajusta margem vertical: tight (8px) | default (16px) | loose (32px) */
  spacing?: "tight" | "default" | "loose"
}

const SPACING = {
  tight: "my-2",
  default: "my-4",
  loose: "my-8",
} as const

export default function Divider({
  variant = "hair",
  className,
  spacing = "default",
}: DividerProps) {
  if (variant === "ornament") {
    return (
      <div
        className={["flex items-center gap-3", SPACING[spacing], className ?? ""].join(" ")}
        aria-hidden="true"
      >
        <span
          className="flex-1 h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, var(--border-1) 40%, var(--border-1) 60%, transparent)",
          }}
        />
        <CrossIcon size="xs" />
        <span
          className="flex-1 h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, var(--border-1) 40%, var(--border-1) 60%, transparent)",
          }}
        />
      </div>
    )
  }

  return (
    <hr
      className={[SPACING[spacing], "border-0", className ?? ""].join(" ")}
      style={{ height: 1, background: "var(--border-1)" }}
    />
  )
}
