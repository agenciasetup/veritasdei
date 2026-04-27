'use client'

/**
 * Configura a aparência nativa do app empacotado (Capacitor) no boot.
 *
 * - Splash screen: esconde assim que o WebView terminou de hidratar
 *   (caso contrário fica até 3s a mais por padrão).
 * - Status bar: tema escuro = ícones brancos sobre fundo do app.
 *
 * Em web (PWA + browser): no-op total. Plugins não são importados.
 *
 * Roda 1x por sessão. Se o tema do usuário mudar (light/dark), o
 * background da status bar acompanha via efeito separado.
 */

import { useEffect } from 'react'
import { isNativePlatform } from '@/lib/platform/is-native'

export default function NativeAppearanceBootstrap() {
  useEffect(() => {
    if (!isNativePlatform()) return

    let canceled = false
    ;(async () => {
      try {
        const [{ SplashScreen }, { StatusBar, Style }] = await Promise.all([
          import('@capacitor/splash-screen'),
          import('@capacitor/status-bar'),
        ])
        if (canceled) return

        // Status bar primeiro (visual aplica antes do splash sumir).
        // Style.Dark = conteúdo claro (texto branco, ícones brancos)
        // sobre fundo dark do app. Se o usuário tiver tema claro
        // futuramente, alternamos via observer do ThemeContext.
        await StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
        await StatusBar.setBackgroundColor({ color: '#0A0A0A' }).catch(() => {})

        // Splash: damos uma janela curta pro CSS hidratar e fontes
        // carregarem. Sem isso o usuário vê splash → branco → conteúdo
        // (flash). Com 600ms o conteúdo costuma estar pronto.
        await new Promise((r) => setTimeout(r, 600))
        if (canceled) return
        await SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {})
      } catch (err) {
        console.warn('[native-appearance] bootstrap falhou:', err)
      }
    })()

    return () => {
      canceled = true
    }
  }, [])

  return null
}
