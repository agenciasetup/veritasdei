/**
 * Platform abstraction layer — única camada que muda entre web / PWA /
 * Android nativo / iOS nativo. Migração futura para React Native só
 * precisa trocar estas funções (tokens e componentes já são
 * plataforma-agnósticos).
 *
 * Importante: tudo aqui é SSR-safe (verifica `typeof window`).
 */

export type Platform = 'web' | 'pwa' | 'android-native' | 'ios-native'

export function getPlatform(): Platform {
  if (typeof window === 'undefined') return 'web'
  // iOS PWA em home screen: Safari expõe `navigator.standalone === true`
  const iosStandalone =
    'standalone' in window.navigator &&
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  // Android/Desktop PWA: display-mode: standalone
  const displayStandalone =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches
  if (iosStandalone || displayStandalone) return 'pwa'
  return 'web'
  // 'android-native' e 'ios-native' serão adicionados na migração para RN.
}

/* ── Haptics ─────────────────────────────────────────────────────── */

export type HapticImpact = 'light' | 'medium' | 'heavy'
export type HapticNotification = 'success' | 'warning' | 'error'

interface VibrateNavigator {
  vibrate?: (pattern: number | number[]) => boolean
}

const IMPACT_PATTERNS: Record<HapticImpact, number> = {
  light: 10,
  medium: 18,
  heavy: 30,
}

const NOTIFICATION_PATTERNS: Record<HapticNotification, number | number[]> = {
  success: [24, 60, 40],
  warning: [30, 100, 30],
  error: [50, 80, 50, 80, 50],
}

/**
 * Dispara `navigator.vibrate(pattern)` de forma segura. Na migração
 * para RN, troca por `expo-haptics` ou `react-native-haptic-feedback`.
 * Exportada para uso em hooks de nível mais alto (ex: useHaptic).
 */
export function vibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined') return
  const nav = navigator as unknown as VibrateNavigator
  if (typeof nav.vibrate !== 'function') return
  try {
    nav.vibrate(pattern)
  } catch {
    /* Alguns browsers exigem gesto recente do usuário; silencioso. */
  }
}

export function isVibrationSupported(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as unknown as VibrateNavigator
  return typeof nav.vibrate === 'function'
}

export const haptics = {
  impact(style: HapticImpact): void {
    vibrate(IMPACT_PATTERNS[style])
  },
  notification(type: HapticNotification): void {
    vibrate(NOTIFICATION_PATTERNS[type])
  },
  selection(): void {
    vibrate(8)
  },
}

/* ── Storage ─────────────────────────────────────────────────────── */

export const storage = {
  get(key: string): string | null {
    if (typeof window === 'undefined') return null
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string): void {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(key, value)
    } catch {
      /* quota exceeded / private mode */
    }
  },
  remove(key: string): void {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(key)
    } catch {}
  },
}

/* ── Share ───────────────────────────────────────────────────────── */

export interface ShareContent {
  title: string
  text: string
  url?: string
}

export const share = {
  isAvailable(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  },
  async text(content: ShareContent): Promise<boolean> {
    if (typeof navigator === 'undefined') return false
    if (typeof navigator.share !== 'function') {
      // Fallback: copia para clipboard
      try {
        const combined = [content.title, content.text, content.url]
          .filter(Boolean)
          .join('\n')
        await navigator.clipboard.writeText(combined)
        return true
      } catch {
        return false
      }
    }
    try {
      await navigator.share(content)
      return true
    } catch {
      return false
    }
  },
}

/* ── Push notifications ──────────────────────────────────────────── */

export const push = {
  isSupported(): boolean {
    if (typeof window === 'undefined') return false
    return (
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    )
  },
  permission(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported'
    }
    return Notification.permission
  },
  // Wrappers finos — a implementação real fica em src/lib/pwa/push.ts
  // para evitar duplicação.
}

/* ── Media picker ────────────────────────────────────────────────── */

export interface PickImageOptions {
  /** Tamanho máximo em bytes. Default: 5MB. */
  maxSize?: number
  /** Tipos MIME aceitos. Default: image/* */
  accept?: string
}

export const media = {
  /**
   * Abre o seletor nativo de arquivo (web) ou picker (mobile nativo).
   * Retorna `null` se o usuário cancelar.
   */
  async pickImage(options: PickImageOptions = {}): Promise<File | null> {
    if (typeof document === 'undefined') return null
    const maxSize = options.maxSize ?? 5 * 1024 * 1024
    const accept = options.accept ?? 'image/*'
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = accept
      input.onchange = () => {
        const file = input.files?.[0] ?? null
        if (file && file.size > maxSize) {
          resolve(null)
          return
        }
        resolve(file)
      }
      // Cancelamento não dispara onchange; timeout de cleanup não é necessário
      // porque o input não é anexado ao DOM.
      input.click()
    })
  },
}

/* ── Biometrics (placeholder web; ativo em RN) ───────────────────── */

export const biometrics = {
  isAvailable(): boolean {
    return false
  },
  async authenticate(): Promise<boolean> {
    return false
  },
}

/* ── Viewport / system-level introspection ──────────────────────── */

export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/.test(navigator.userAgent)
}
