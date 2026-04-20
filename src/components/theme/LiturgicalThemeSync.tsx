"use client"

import { useEffect } from "react"
import { useSyncExternalStore } from "react"
import { getLiturgicalDay } from "@/lib/liturgical-calendar"

/**
 * Theming adaptativo litúrgico (opt-in).
 *
 * Quando ativado, em **Quaresma** e **Advento** o app sobrescreve
 * `--accent` para roxo litúrgico — cor dos paramentos nesses tempos.
 * Nos demais tempos (Comum, Pascal, Natal), o accent padrão do tema
 * (dourado no dark, vinho no light) prevalece.
 *
 * A preferência persiste em localStorage (`veritas-liturgical-theme`,
 * default = on). Componente renderiza `null` — só aplica/remove o
 * atributo `data-liturgical-season` no `<html>`.
 */

const PREF_KEY = "veritas-liturgical-theme"

function loadPref(): boolean {
  if (typeof window === "undefined") return true
  try {
    const raw = window.localStorage.getItem(PREF_KEY)
    if (raw === "off") return false
    return true
  } catch {
    return true
  }
}

const listeners = new Set<() => void>()
function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): boolean {
  return loadPref()
}
function getServerSnapshot(): boolean {
  return true
}

function seasonToAttr(season: string): "quaresma" | "advento" | null {
  const normalized = season.toLowerCase()
  if (normalized.includes("quaresma")) return "quaresma"
  if (normalized.includes("advento")) return "advento"
  return null
}

export default function LiturgicalThemeSync() {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    const html = document.documentElement
    if (!enabled) {
      html.removeAttribute("data-liturgical-season")
      return
    }
    const today = getLiturgicalDay(new Date())
    const attr = seasonToAttr(today.season)
    if (attr) {
      html.setAttribute("data-liturgical-season", attr)
    } else {
      html.removeAttribute("data-liturgical-season")
    }

    // Reavaliar à meia-noite (muda o dia, pode mudar de tempo).
    const now = new Date()
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const ms = tomorrow.getTime() - now.getTime()
    const timer = setTimeout(() => {
      const next = getLiturgicalDay(new Date())
      const nextAttr = seasonToAttr(next.season)
      if (nextAttr) html.setAttribute("data-liturgical-season", nextAttr)
      else html.removeAttribute("data-liturgical-season")
    }, ms)

    return () => {
      clearTimeout(timer)
    }
  }, [enabled])

  return null
}

/** Utilitário consumível por settings UI. */
export function setLiturgicalThemeEnabled(next: boolean) {
  try {
    localStorage.setItem(PREF_KEY, next ? "on" : "off")
  } catch {
    /* ignore */
  }
  for (const listener of listeners) listener()
}
