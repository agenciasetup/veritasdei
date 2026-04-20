"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

export type Theme = "light" | "dark" | "system"
export type ResolvedTheme = "light" | "dark"

type ThemeContextValue = {
  theme: Theme
  setTheme: (t: Theme) => void
  resolvedTheme: ResolvedTheme
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = "veritas-theme"

function resolveSystem(): ResolvedTheme {
  if (typeof window === "undefined") return "dark"
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
}

function resolve(theme: Theme): ResolvedTheme {
  return theme === "system" ? resolveSystem() : theme
}

function syncMetaThemeColor(resolved: ResolvedTheme) {
  let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
  if (!meta) {
    meta = document.createElement("meta")
    meta.name = "theme-color"
    document.head.appendChild(meta)
  }
  meta.content = resolved === "light" ? "#F7F2E8" : "#0F0E0C"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark")

  // Hydrate from DOM (ThemeScript já aplicou `data-theme` antes do React montar)
  useEffect(() => {
    const current = (document.documentElement.getAttribute("data-theme") as Theme | null) ?? "system"
    setThemeState(current === "light" || current === "dark" || current === "system" ? current : "system")
    setResolvedTheme(resolve(current as Theme))
  }, [])

  // Ao mudar tema: aplicar no DOM, resolver, persistir, atualizar meta.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    const r = resolve(theme)
    setResolvedTheme(r)
    syncMetaThemeColor(r)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* storage pode estar bloqueado em modo privado */
    }
    document.cookie = `${STORAGE_KEY}=${theme}; path=/; max-age=31536000; samesite=lax`
  }, [theme])

  // Quando em 'system', reagir a mudanças da preferência do SO.
  useEffect(() => {
    if (theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: light)")
    const onChange = () => {
      const r: ResolvedTheme = mq.matches ? "light" : "dark"
      setResolvedTheme(r)
      syncMetaThemeColor(r)
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [theme])

  const setTheme = useCallback((t: Theme) => setThemeState(t), [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme deve ser usado dentro de <ThemeProvider>")
  return ctx
}
