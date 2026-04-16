'use client'

import { useSyncExternalStore } from 'react'
import { getPlatform, isAndroid, isIos, type Platform } from '@/lib/platform'

/**
 * Hook SSR-safe para acessar a plataforma atual.
 *
 * Re-render quando o usuário instala o PWA (mudança display-mode)?
 * Na prática não — o PWA standalone vem como uma nova sessão após
 * instalação. Usamos `useSyncExternalStore` com snapshot estático para
 * consistência React 18+.
 */

const noopSubscribe = () => () => {}

function getClientSnapshot(): Platform {
  return getPlatform()
}

function getServerSnapshot(): Platform {
  return 'web'
}

export interface UsePlatformReturn {
  platform: Platform
  isNative: boolean
  isPwa: boolean
  isWeb: boolean
  isIos: boolean
  isAndroid: boolean
}

export function usePlatform(): UsePlatformReturn {
  const platform = useSyncExternalStore(
    noopSubscribe,
    getClientSnapshot,
    getServerSnapshot,
  )
  return {
    platform,
    isNative: platform === 'android-native' || platform === 'ios-native',
    isPwa: platform === 'pwa',
    isWeb: platform === 'web',
    isIos: isIos(),
    isAndroid: isAndroid(),
  }
}
