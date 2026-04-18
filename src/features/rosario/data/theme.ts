/**
 * Theme palettes for the rosary UI. Two languages, two visual moods:
 *
 * - `pt`  — Gold on deep black. The usual devotional palette.
 * - `la`  — Wine / blood / rose on very dark burgundy. Lighter, rosier
 *           inside the prayer card and on text so it contrasts with the
 *           dark wine background. Reserved for the Latin rite mode.
 *
 * Components read from this object rather than hard-coding hex values so
 * that a single `language` flag in the session can re-skin the entire
 * rosary coherently.
 */

export type RosaryLanguage = 'pt' | 'la'

export interface RosaryTheme {
  readonly language: RosaryLanguage
  readonly pageBg: string
  readonly accent: string
  readonly accentLight: string
  readonly accentDeep: string
  readonly textPrimary: string
  readonly textSecondary: string
  readonly textMuted: string
  readonly border: string
  readonly borderStrong: string
  readonly cardBg: string
  readonly cardBorder: string
  readonly buttonGradient: readonly [string, string]
  readonly buttonText: string
  readonly beadCurrentStops: readonly [string, string, string]
  readonly beadFutureStops: readonly [string, string]
  readonly beadCompletedStops: readonly [string, string]
  readonly cordStroke: string
}

const GOLD: RosaryTheme = {
  language: 'pt',
  pageBg: '#0F0E0C',
  accent: '#C9A84C',
  accentLight: '#D9C077',
  accentDeep: '#A88437',
  textPrimary: '#F2EDE4',
  textSecondary: '#D9D2C4',
  textMuted: '#7A7368',
  border: 'rgba(201, 168, 76, 0.12)',
  borderStrong: 'rgba(201, 168, 76, 0.3)',
  cardBg: 'rgba(20, 18, 14, 0.6)',
  cardBorder: 'rgba(201, 168, 76, 0.18)',
  buttonGradient: ['#C9A84C', '#A88437'],
  buttonText: '#0F0E0C',
  beadCurrentStops: ['#F4E8B8', '#D9C077', '#C9A84C'],
  beadFutureStops: ['rgba(201,168,76,0.22)', 'rgba(201,168,76,0.08)'],
  beadCompletedStops: ['rgba(201,168,76,0.45)', 'rgba(201,168,76,0.18)'],
  cordStroke: 'rgba(201, 168, 76, 0.22)',
}

const WINE: RosaryTheme = {
  language: 'la',
  pageBg: '#13080A',
  accent: '#C97584',
  accentLight: '#EAB8C0',
  accentDeep: '#6B1D2A',
  textPrimary: '#F4DCE0',
  textSecondary: '#E8C4CA',
  textMuted: '#9A7680',
  border: 'rgba(201, 117, 132, 0.16)',
  borderStrong: 'rgba(234, 184, 192, 0.35)',
  cardBg: 'rgba(36, 14, 18, 0.7)',
  cardBorder: 'rgba(201, 117, 132, 0.25)',
  buttonGradient: ['#C97584', '#7A2331'],
  buttonText: '#FFF2F4',
  beadCurrentStops: ['#F4DCE0', '#EAB8C0', '#C97584'],
  beadFutureStops: ['rgba(201,117,132,0.26)', 'rgba(201,117,132,0.10)'],
  beadCompletedStops: ['rgba(234,184,192,0.55)', 'rgba(201,117,132,0.22)'],
  cordStroke: 'rgba(234, 184, 192, 0.26)',
}

export const ROSARY_THEMES: Readonly<Record<RosaryLanguage, RosaryTheme>> =
  Object.freeze({ pt: GOLD, la: WINE })

export function getRosaryTheme(language: RosaryLanguage): RosaryTheme {
  return ROSARY_THEMES[language]
}
