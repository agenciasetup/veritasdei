"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme, type Theme } from "@/contexts/ThemeContext"
import { createClient } from "@/lib/supabase/client"

function isValidTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system"
}

/**
 * Sincroniza a preferência de tema com `public.user_settings` no
 * Supabase para persistir entre dispositivos.
 *
 * Comportamento:
 *  - Ao autenticar: lê theme_preference e, se diferente do local,
 *    adota o valor do backend (assumindo que é o mais atualizado em
 *    outros dispositivos).
 *  - Ao mudar tema: upsert para user_settings.
 *
 * Falhas (tabela não existe, RLS, offline) são silenciadas — o tema
 * continua funcionando via localStorage + cookie.
 */
export default function ThemeSupabaseSync() {
  const { user, isAuthenticated } = useAuth()
  const { theme, setTheme } = useTheme()

  // Evita write-loop: só grava quando o usuário muda o tema localmente.
  const skipNextWrite = useRef(false)
  const lastSyncedUserId = useRef<string | null>(null)

  // Ao autenticar (ou mudar de usuário), puxa preferência do backend.
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      lastSyncedUserId.current = null
      return
    }
    if (lastSyncedUserId.current === user.id) return
    lastSyncedUserId.current = user.id

    const supabase = createClient()
    if (!supabase) return

    const ctrl = new AbortController()
    ;(async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("theme_preference")
        .eq("user_id", user.id)
        .maybeSingle()
        .abortSignal(ctrl.signal)

      if (error || !data) return
      const remote = data.theme_preference
      if (isValidTheme(remote) && remote !== theme) {
        skipNextWrite.current = true
        setTheme(remote)
      }
    })().catch(() => {
      /* silencia aborts e falhas de tabela inexistente */
    })

    return () => ctrl.abort()
    // Intencionalmente só reage a user.id — não queremos re-fetch a cada mudança de theme.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAuthenticated])

  // Ao mudar tema local (e estando autenticado), upsert no backend.
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    if (skipNextWrite.current) {
      skipNextWrite.current = false
      return
    }
    const supabase = createClient()
    if (!supabase) return
    ;(async () => {
      await supabase
        .from("user_settings")
        .upsert(
          { user_id: user.id, theme_preference: theme },
          { onConflict: "user_id" },
        )
    })().catch(() => {
      /* silencia falhas — localStorage é a fonte local de verdade */
    })
  }, [theme, user?.id, isAuthenticated])

  return null
}
