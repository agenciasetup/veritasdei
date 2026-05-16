/**
 * Theme palettes for the rosary UI. Two languages, two visual moods:
 *
 * - `pt`  — Modo devocional padrão. Usa os tokens semânticos do app
 *           (var(--surface-1), var(--text-1), var(--accent)), então
 *           se adapta automaticamente ao tema claro/escuro/sistema.
 *
 * - `la`  — Rito latino: missal antigo. Paleta INDEPENDENTE do tema do
 *           app, com dourado oxidado e borgonha profundo sobre fundo
 *           quase-preto-vinho. Preserva o mood litúrgico tridentino sem
 *           cair em tons saturados ou kitsch.
 *
 * beadStops (cores dos SVG gradients das contas) são mantidos como
 * hex porque SVG `stopColor` como atributo não aceita CSS vars.
 * Visualmente funcionam em ambos os temas.
 */

export type RosaryLanguage = 'pt' | 'la'

export interface RosaryTheme {
  readonly language: RosaryLanguage
  readonly pageBg: string
  readonly pageBgAmbient: string
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
  pageBgAmbient:
    'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(107, 29, 42, 0.10) 0%, transparent 55%), ' +
    'radial-gradient(ellipse 60% 40% at 50% 110%, rgba(201, 168, 76, 0.05) 0%, transparent 50%)',
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
  beadCurrentStops: ['#F4E8B8', '#D9C077', '#C9A84C'],
  beadFutureStops: ['rgba(201,168,76,0.22)', 'rgba(201,168,76,0.08)'],
  beadCompletedStops: ['rgba(201,168,76,0.45)', 'rgba(201,168,76,0.18)'],
  cordStroke: 'var(--border-1)',
}

// Modo LA: missal antigo — dourado oxidado sobre borgonha profundo.
// Substitui a antiga paleta rosa salmão por algo mais sóbrio e litúrgico,
// inspirado em manuscritos iluminados e capelas tridentinas: ouro velho,
// vinho de cálice, pergaminho amarelado pela idade.
const MISSAL: RosaryTheme = {
  language: 'la',
  pageBg: '#0A0608',
  pageBgAmbient:
    'radial-gradient(ellipse 90% 55% at 50% -8%, rgba(92, 22, 32, 0.55) 0%, transparent 58%), ' +
    'radial-gradient(ellipse 70% 50% at 50% 110%, rgba(168, 136, 78, 0.06) 0%, transparent 55%), ' +
    'radial-gradient(ellipse 50% 40% at 15% 30%, rgba(168, 136, 78, 0.04) 0%, transparent 60%)',
  accent: '#A8884E',
  accentLight: '#D4B574',
  accentDeep: '#5C1620',
  textPrimary: '#EDE3D0',
  textSecondary: '#B5A687',
  textMuted: '#7C7163',
  border: 'rgba(168, 136, 78, 0.16)',
  borderStrong: 'rgba(212, 181, 116, 0.38)',
  cardBg: 'rgba(24, 12, 14, 0.72)',
  cardBorder: 'rgba(168, 136, 78, 0.22)',
  buttonGradient: ['#C9A45A', '#8B6F38'],
  buttonText: '#1A0D08',
  beadCurrentStops: ['#F0DCA0', '#D4B574', '#A8884E'],
  beadFutureStops: ['rgba(168,136,78,0.24)', 'rgba(168,136,78,0.08)'],
  beadCompletedStops: ['rgba(212,181,116,0.50)', 'rgba(168,136,78,0.18)'],
  cordStroke: 'rgba(212, 181, 116, 0.20)',
}

export const ROSARY_THEMES: Readonly<Record<RosaryLanguage, RosaryTheme>> =
  Object.freeze({ pt: GOLD, la: MISSAL })

export function getRosaryTheme(language: RosaryLanguage): RosaryTheme {
  return ROSARY_THEMES[language]
}
