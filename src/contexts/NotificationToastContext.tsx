'use client'

/**
 * Toast banner para notificações push recebidas em foreground.
 *
 * Por padrão, FCM no Android só mostra notificações na barra do
 * sistema quando o app está em background. Em foreground, o evento
 * `notificationReceived` dispara mas nada aparece pro usuário.
 *
 * Esse contexto resolve mostrando um banner curto in-app (~5s).
 * Tocar no banner navega pra `url` da notificação.
 *
 * Não persiste — só pra avisos em tempo real. O ícone do sino do
 * app continua sendo a fonte de verdade do histórico
 * (user_notificacoes_feed).
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'

export interface ToastNotification {
  id: number
  title: string
  body: string
  url?: string
}

interface ToastContextValue {
  current: ToastNotification | null
  show: (notif: Omit<ToastNotification, 'id'>) => void
  dismiss: () => void
}

const Ctx = createContext<ToastContextValue>({
  current: null,
  show: () => {},
  dismiss: () => {},
})

export function NotificationToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ToastNotification | null>(null)

  const show = useCallback((notif: Omit<ToastNotification, 'id'>) => {
    setCurrent({ ...notif, id: Date.now() })
  }, [])

  const dismiss = useCallback(() => setCurrent(null), [])

  return (
    <Ctx.Provider value={{ current, show, dismiss }}>{children}</Ctx.Provider>
  )
}

export function useNotificationToast() {
  return useContext(Ctx)
}
