"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

/**
 * Busca o contador de notificações não-lidas do usuário autenticado.
 * Refaz a request em cada mudança de pathname (é barato — a API
 * retorna só o count). Sem polling.
 */
export function useUnreadNotifications(): number {
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) {
      setUnread(0)
      return
    }
    const ctrl = new AbortController()
    fetch("/api/notificacoes?limit=1", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.unread_count === "number") {
          setUnread(data.unread_count)
        }
      })
      .catch(() => {
        /* ignora aborts e falhas silenciosas */
      })
    return () => ctrl.abort()
  }, [isAuthenticated, pathname])

  return unread
}
