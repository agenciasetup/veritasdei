/**
 * Design tokens — single source of truth shared between web e eventual
 * mobile (React Native). Quando migrarmos, trocamos apenas esta camada.
 *
 * Mantenha sincronizado com src/app/globals.css :root.
 */

/**
 * Tokens semânticos por tema. Use `theme.dark` / `theme.light` ao escrever
 * componentes novos ou quando precisar de acesso ao valor hex via JS
 * (ex: canvas, react-flow, meta theme-color).
 *
 * Para CSS, prefira as CSS vars correspondentes (`var(--surface-1)` etc) —
 * elas respondem automaticamente ao `data-theme` do <html>.
 */
export const theme = {
  dark: {
    surface1:       '#0F0E0C',
    surface2:       '#141210',
    surface3:       '#1C1913',
    surfaceInset:   'rgba(0, 0, 0, 0.35)',
    text1:          '#F2EDE4',
    text2:          '#B8AFA7',
    text3:          '#8A8378',
    textInverse:    '#1C140C',
    border1:        'rgba(242, 237, 228, 0.12)',
    border2:        'rgba(242, 237, 228, 0.06)',
    accent:         '#C9A84C',
    accentHover:    '#D9C077',
    accentContrast: '#1C140C',
    accentSoft:     'rgba(201, 168, 76, 0.15)',
    success:        '#66BB6A',
    danger:         '#D94F5C',
    warning:        '#E67E22',
  },
  light: {
    surface1:       '#F7F2E8',
    surface2:       '#FFFFFF',
    surface3:       '#FBF6EC',
    surfaceInset:   'rgba(28, 20, 12, 0.04)',
    text1:          '#1C140C',
    text2:          '#4A3E30',
    text3:          '#7A6E5E',
    textInverse:    '#F7F2E8',
    border1:        'rgba(28, 20, 12, 0.12)',
    border2:        'rgba(28, 20, 12, 0.06)',
    accent:         '#8B2435',
    accentHover:    '#6B1D2A',
    accentContrast: '#FFFFFF',
    accentSoft:     'rgba(139, 36, 53, 0.10)',
    success:        '#2E7D32',
    danger:         '#B71C3A',
    warning:        '#B3621F',
  },
} as const

export type ThemeName = keyof typeof theme
export type ThemeTokens = typeof theme.dark

/**
 * Legacy — valores hex fixos (tema dark). Mantido para compatibilidade
 * com chamadores que leem cores via JS (ex: três.js, react-flow).
 * Novos componentes devem usar `theme.dark` / `theme.light` ou CSS vars.
 */
export const colors = {
  // ── Core surface ──
  bgDeep:        theme.dark.surface1,
  bgSurface:     theme.dark.surface2,
  bgCard:        'rgba(20, 18, 14, 0.72)',
  bgCardSolid:   theme.dark.surface3,
  bgVerse:       'rgba(22, 18, 14, 0.6)',

  // ── Text ──
  textPrimary:   theme.dark.text1,
  textSecondary: theme.dark.text2,
  textMuted:     theme.dark.text3,

  // ── Accents ──
  gold:          theme.dark.accent,
  goldLight:     theme.dark.accentHover,
  goldDim:       theme.dark.accentSoft,
  wine:          '#6B1D2A',
  wineLight:     '#8B3145',

  // ── Borders ──
  borderGold:    'rgba(201, 168, 76, 0.12)',
  borderSubtle:  theme.dark.border2,

  // ── Semantic ──
  success:       theme.dark.success,
  danger:        theme.dark.danger,
  warning:       theme.dark.warning,
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
