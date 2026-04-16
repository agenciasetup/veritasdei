/**
 * Design tokens — single source of truth shared between web e eventual
 * mobile (React Native). Quando migrarmos, trocamos apenas esta camada.
 *
 * Mantenha sincronizado com src/app/globals.css :root.
 */

export const colors = {
  // ── Core surface ──
  bgDeep:        '#0F0E0C',
  bgSurface:     '#141210',
  bgCard:        'rgba(20, 18, 14, 0.72)',
  bgCardSolid:   '#18160F',
  bgVerse:       'rgba(22, 18, 14, 0.6)',

  // ── Text ──
  textPrimary:   '#F2EDE4',
  textSecondary: '#B8AFA7',
  textMuted:     '#8A8378', // bumped de #7A7368 para WCAG AA em texto pequeno

  // ── Accents ──
  gold:          '#C9A84C',
  goldLight:     '#D9C077',
  goldDim:       'rgba(201, 168, 76, 0.15)',
  wine:          '#6B1D2A',
  wineLight:     '#8B3145',

  // ── Borders ──
  borderGold:    'rgba(201, 168, 76, 0.12)',
  borderSubtle:  'rgba(242, 237, 228, 0.06)',

  // ── Semantic ──
  success:       '#66BB6A',
  danger:        '#D94F5C',
  warning:       '#E67E22',
} as const

export const fonts = {
  display:  "'Cinzel', serif",
  elegant:  "'Cormorant Garamond', serif",
  body:     "'Poppins', sans-serif",
} as const

export const spacing = {
  touchTarget:   44, // min WCAG/iOS tap area
  touchTargetLg: 48, // confortável para uso prolongado
  safeX:         16,
  safeY:         16,
} as const

export const radii = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
} as const

export const durations = {
  fast:   150, // crossfade de tabs
  base:   250, // page transition
  slow:   400,
} as const

export const gestures = {
  /** Distância mínima em pixels para considerar um swipe horizontal. */
  swipeThreshold: 40,
  /** Distância para ativar pull-to-refresh. */
  pullThreshold: 72,
  /** Largura da zona morta (px) nas bordas laterais em páginas imersivas,
   *  para não conflitar com edge-swipe do browser/OS. */
  edgeDeadZone: 20,
} as const

export type Colors = typeof colors
export type Fonts = typeof fonts
