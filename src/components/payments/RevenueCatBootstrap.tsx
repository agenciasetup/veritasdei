'use client'

/**
 * RevenueCatBootstrap — inicializa o SDK RevenueCat dentro do app
 * Capacitor (Android/iOS) e mantém o appUserID em sincronia com o
 * usuário logado no Supabase.
 *
 * Em web (PWA + browser): no-op total. Não importa o SDK, não chama
 * nada — Stripe continua sendo o caminho web.
 *
 * Por que não no AuthContext: o SDK do RevenueCat é nativo (NPM
 * package com bridges Capacitor). Importar direto no AuthContext
 * carregaria código nativo no bundle web. Aqui usamos dynamic import
 * dentro de um effect, garantindo que o módulo só seja resolvido em
 * contexto nativo.
 *
 * Login flow:
 *  - Bootstrap configura o SDK uma vez (anônimo por padrão).
 *  - Quando o user loga: Purchases.logIn(userId) — RevenueCat
 *    consolida histórico de compras pendentes naquele app user.
 *  - Quando o user deslogga: Purchases.logOut() — volta a anônimo.
 *
 * O webhook do RevenueCat usa esse mesmo appUserID para gravar
 * billing_subscriptions com user_id correto. Se o usuário comprar
 * antes de logar, RC mantém o histórico no anonymous ID e
 * automaticamente "alia" quando logar.
 */

import { useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { isNativePlatform, getPlatform } from '@/lib/platform/is-native'

const ANDROID_KEY = process.env.NEXT_PUBLIC_REVENUECAT_PUBLIC_KEY_ANDROID ?? ''
const IOS_KEY = process.env.NEXT_PUBLIC_REVENUECAT_PUBLIC_KEY_IOS ?? ''

/**
 * Evento global emitido quando o RC SDK notifica mudança de assinatura
 * (compra, renovação, cancelamento, restore). SubscriptionContext escuta
 * pra puxar entitlement novo do banco.
 */
export const RC_REFRESH_EVENT = 'veritasdei:subscription-refresh'

export default function RevenueCatBootstrap() {
  const { user, isAuthenticated } = useAuth()
  const configuredRef = useRef(false)
  const lastUserIdRef = useRef<string | null>(null)

  // Configure: roda uma vez por sessão, só no native.
  useEffect(() => {
    if (!isNativePlatform() || configuredRef.current) return

    const platform = getPlatform()
    const apiKey = platform === 'ios' ? IOS_KEY : ANDROID_KEY
    if (!apiKey) {
      console.warn(
        `[revenuecat] sem chave pública (NEXT_PUBLIC_REVENUECAT_PUBLIC_KEY_${platform.toUpperCase()}); SDK não inicializado`,
      )
      return
    }

    let canceled = false
    let listenerCallbackId: string | null = null
    ;(async () => {
      try {
        const { Purchases, LOG_LEVEL } = await import(
          '@revenuecat/purchases-capacitor'
        )
        if (canceled) return
        await Purchases.setLogLevel({
          level:
            process.env.NODE_ENV === 'production'
              ? LOG_LEVEL.WARN
              : LOG_LEVEL.DEBUG,
        })
        await Purchases.configure({ apiKey })
        configuredRef.current = true

        // P6 — fix do bug "premium não aparece após compra".
        // Após webhook RC bater no nosso backend e gravar em
        // billing_subscriptions, o SDK também recebe o customerInfo
        // atualizado. Ouvimos esse evento e disparamos refresh
        // global pro SubscriptionContext puxar o entitlement novo.
        // Sem isso, o usuário precisava fechar/abrir o app.
        try {
          listenerCallbackId = await Purchases.addCustomerInfoUpdateListener(
            () => {
              if (typeof window === 'undefined') return
              window.dispatchEvent(new CustomEvent(RC_REFRESH_EVENT))
            },
          )
        } catch (err) {
          console.warn('[revenuecat] addCustomerInfoUpdateListener:', err)
        }
      } catch (err) {
        console.warn('[revenuecat] configure falhou:', err)
      }
    })()

    return () => {
      canceled = true
      if (listenerCallbackId) {
        import('@revenuecat/purchases-capacitor').then(({ Purchases }) => {
          Purchases.removeCustomerInfoUpdateListener({
            listenerToRemove: listenerCallbackId!,
          }).catch(() => {})
        })
      }
    }
  }, [])

  // Login sync: quando muda user, propaga pro SDK.
  useEffect(() => {
    if (!isNativePlatform() || !configuredRef.current) return

    const targetId = isAuthenticated && user ? user.id : null
    if (targetId === lastUserIdRef.current) return

    let canceled = false
    ;(async () => {
      try {
        const { Purchases } = await import('@revenuecat/purchases-capacitor')
        if (canceled) return
        if (targetId) {
          await Purchases.logIn({ appUserID: targetId })
        } else {
          await Purchases.logOut()
        }
        lastUserIdRef.current = targetId
      } catch (err) {
        console.warn('[revenuecat] logIn/logOut falhou:', err)
      }
    })()

    return () => {
      canceled = true
    }
  }, [isAuthenticated, user])

  return null
}
