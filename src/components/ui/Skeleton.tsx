"use client"

import type { CSSProperties } from "react"
import {
  Skeleton as BaseSkeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonAvatar,
} from "@/components/mobile/Skeleton"

type Variant = "text" | "card" | "avatar" | "list"

export interface SkeletonProps {
  variant?: Variant
  /** Width (px ou string CSS). Default depende da variante. */
  width?: number | string
  /** Height (px ou string CSS). Default depende da variante. */
  height?: number | string
  /** Border radius (px). Default depende da variante. */
  rounded?: number
  /** Para `variant="list"`: quantas linhas repetir. Default 3. */
  lines?: number
  className?: string
  style?: CSSProperties
}

/**
 * Primitivo canônico de skeleton loader. Unifica o padrão de shimmer
 * em todo o app via classe `.skeleton` (definida em globals.css).
 *
 * Variantes:
 *   - text    → linha curta (default 12px altura, border-radius 4)
 *   - card    → bloco maior (default 96px altura, border-radius 20)
 *   - avatar  → círculo (default 40×40)
 *   - list    → N linhas stackadas (default 3)
 *
 * Componentes base ficam em `@/components/mobile/Skeleton` (Skeleton,
 * SkeletonText, SkeletonCard, SkeletonAvatar) — este Skeleton é o
 * wrapper com API mais fluida para novos componentes.
 */
export function Skeleton({
  variant = "text",
  width,
  height,
  rounded,
  lines = 3,
  className,
  style,
}: SkeletonProps) {
  switch (variant) {
    case "avatar":
      return <SkeletonAvatar size={typeof width === "number" ? width : 40} />
    case "card":
      return (
        <SkeletonCard
          height={height ?? 96}
          rounded={rounded ?? 20}
          className={className}
          style={{ width: width ?? "100%", ...style }}
        />
      )
    case "text":
      return (
        <SkeletonText
          width={width ?? "100%"}
          height={typeof height === "number" ? height : 12}
          className={className}
        />
      )
    case "list":
      return (
        <div className={`flex flex-col gap-2 ${className ?? ""}`} style={style}>
          {Array.from({ length: lines }).map((_, i) => (
            <SkeletonText
              key={i}
              width={i === lines - 1 ? "70%" : "100%"}
              height={typeof height === "number" ? height : 14}
            />
          ))}
        </div>
      )
  }
}

export default Skeleton

// Re-export building blocks for backward compat
export { BaseSkeleton, SkeletonText, SkeletonCard, SkeletonAvatar }
