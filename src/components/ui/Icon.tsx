"use client"

import { cloneElement, isValidElement, type ComponentType, type ReactElement, type SVGProps } from "react"

type Size = "xs" | "sm" | "md" | "lg" | "xl"

const SIZE_PX: Record<Size, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
}

type LucideLike = ComponentType<SVGProps<SVGSVGElement> & { size?: string | number }>

export interface IconProps {
  /** Pode ser um componente (ex: lucide `Cross`) ou um ReactElement já renderizado. */
  as?: LucideLike
  children?: ReactElement
  size?: Size
  className?: string
  /** Sobrepõe `color` — por padrão usa `currentColor` para herdar do parent. */
  color?: string
  /** aria-label → se omitido, fica decorativo (aria-hidden). */
  label?: string
}

/**
 * Wrapper para ícones. Normaliza tamanho (xs..xl → px) e cor
 * (`currentColor` por padrão, herdando do texto ao redor).
 *
 * Uso com componente lucide:
 *   <Icon as={Cross} size="sm" label="Rezar" />
 *
 * Uso com elemento já montado (ex: CrossIcon com size custom):
 *   <Icon size="md"><CrossIcon size="md" /></Icon>
 */
export default function Icon({ as: Component, children, size = "md", className, color, label }: IconProps) {
  const px = SIZE_PX[size]
  const a11y = label ? { "aria-label": label, role: "img" as const } : { "aria-hidden": true }

  if (Component) {
    return (
      <Component
        width={px}
        height={px}
        size={px}
        className={className}
        style={{ color: color ?? "currentColor", flexShrink: 0 }}
        {...a11y}
      />
    )
  }

  if (children && isValidElement<{ className?: string; style?: React.CSSProperties }>(children)) {
    return cloneElement(children, {
      className: [children.props.className, className].filter(Boolean).join(" "),
      style: {
        width: px,
        height: px,
        color: color ?? "currentColor",
        flexShrink: 0,
        ...children.props.style,
      },
      ...a11y,
    })
  }

  return null
}
