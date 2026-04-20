"use client"

import { Sun, Moon, SunMoon } from "lucide-react"
import { useTheme, type Theme } from "@/contexts/ThemeContext"

type Option = { value: Theme; label: string; icon: typeof Sun }

const OPTIONS: Option[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: SunMoon },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Tema da aparência"
      className="inline-flex rounded-xl p-1"
      style={{
        background: "var(--surface-inset)",
        border: "1px solid var(--border-2)",
      }}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors touch-target active:scale-[0.97]"
            style={{
              background: active ? "var(--surface-2)" : "transparent",
              color: active ? "var(--text-1)" : "var(--text-3)",
              boxShadow: active
                ? "0 1px 2px rgba(0,0,0,0.08), 0 0 0 1px var(--border-1)"
                : undefined,
              fontFamily: "var(--font-body)",
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
