/**
 * Theme palettes for the rosary UI. Two languages, two visual moods:
 *
 * - `pt`  — Modo devocional padrão. Usa os tokens semânticos do app
 *           (var(--surface-1), var(--text-1), var(--accent)), então
 *           se adapta automaticamente ao tema claro/escuro/sistema.
 * - `la`  — Rito latino: paleta vinho/sangue forçada sobre um fundo
 *           bordô bem escuro, INDEPENDENTE do tema do app. Preserva
 *           o mood litúrgico tradicional da Missa Tridentina.
 *
 * beadStops (cores dos SVG gradients das contas) são mantidos como
 * hex porque SVG `stopColor` como atributo não aceita CSS vars.
 * Visualmente funcionam em ambos os temas.
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

// Modo PT: usa CSS vars semânticas — responde ao tema do app.
const GOLD: RosaryTheme = {
  language: 'pt',
  pageBg: 'var(--surface-1)',
  accent: 'var(--accent)',
  accentLight: 'var(--accent-hover)',
  accentDeep: 'var(--accent-hover)',
  textPrimary: 'var(--text-1)',
  textSecondary: 'var(--text-2)',
  textMuted: 'var(--text-3)',
  border: 'var(--border-1)',
  borderStrong: 'var(--accent-soft)',
  cardBg: 'var(--surface-2)',
  cardBorder: 'var(--border-1)',
  buttonGradient: ['var(--accent)', 'var(--accent-hover)'],
  buttonText: 'var(--accent-contrast)',
  // SVG gradient stops mantêm hex — funcionam bem em ambos os temas
  // (ouro sobre claro ou escuro transmite o mesmo significado).
  beadCurrentStops: ['#F4E8B8', '#D9C077', '#C9A84C'],
  beadFutureStops: ['rgba(201,168,76,0.22)', 'rgba(201,168,76,0.08)'],
  beadCompletedStops: ['rgba(201,168,76,0.45)', 'rgba(201,168,76,0.18)'],
  cordStroke: 'var(--border-1)',
}

// Modo LA: paleta forçada — Missa Tridentina com mood específico.
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
