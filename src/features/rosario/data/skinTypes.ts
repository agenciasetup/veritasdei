/**
 * Tipos TypeScript pra skins de terço.
 *
 * Espelham o schema das tabelas:
 *   public.rosary_skins
 *   public.user_rosary_skins
 *   public.rosary_redemption_codes
 *
 * As skins centralizam DOIS conceitos antes separados:
 *   - Identidade visual (tema/paleta/glyphs) — antes em `data/theme.ts`.
 *   - Mistérios temáticos — antes em `data/thematicRosaries.ts`.
 *
 * Uma skin pode definir ambos. As "canônicas" (devocional-classico,
 * missal-tridentino) definem só tema e usam mistérios do dia. As
 * "temáticas" (são-bento, dogmas-marianos) definem ambos.
 */

import type { Mystery, MysterySet } from './types'

// ---- Theme tokens (paleta + variantes de glyph) ----

export type CrucifixVariant =
  | 'classic'      // crucifixo retangular simples (default atual)
  | 'benedictine'  // cruz de São Bento (com discos/medalhão)
  | 'budded'       // crus florida — pontas em trifólio
  | 'celtic'       // cruz céltica com anel
  | 'pio'          // cruz franciscana de Padre Pio

export type IntroBeadVariant =
  | 'classic'              // contas simples (default)
  | 'medal-bento'          // medalha de São Bento na conta inicial
  | 'medal-divine-mercy'   // medalha da Divina Misericórdia
  | 'rose'                 // rosa estilizada

export type BeadShape = 'sphere' | 'rose' | 'cube' | 'oval'

export interface RosarySkinTheme {
  pageBg: string
  pageBgAmbient: string
  accent: string
  accentLight: string
  accentDeep: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  border: string
  borderStrong: string
  cardBg: string
  cardBorder: string
  buttonGradient: readonly [string, string]
  buttonText: string
  beadCurrentStops: readonly [string, string, string]
  beadFutureStops: readonly [string, string]
  beadCompletedStops: readonly [string, string]
  cordStroke: string
  crucifixVariant: CrucifixVariant
  introBeadVariant: IntroBeadVariant
  beadShape: BeadShape
}

// ---- Unlock rules (mesma DSL que cartas) ----

export type UnlockCondicaoTipo =
  | 'subtopico_concluido'
  | 'grupo_concluido'
  | 'topico_concluido'
  | 'nivel'
  | 'streak'
  | 'quiz_gabaritado'
  | 'contador'

export interface UnlockCondicao {
  tipo: UnlockCondicaoTipo
  ref?: string
  valor?: number
}

export interface UnlockRegras {
  operador: 'todas' | 'qualquer'
  condicoes: UnlockCondicao[]
}

export type UnlockTipo =
  | 'free'
  | 'rules'
  | 'commerce'
  | 'admin_only'
  | 'coming_soon'

// ---- Skin ----

export type RosarySkinCategoria =
  | 'canonico'
  | 'devocional'
  | 'santo'
  | 'doutrina'
  | 'comemorativo'
  | 'exclusivo'

export type RosarySkinRaridade =
  | 'comum'
  | 'rara'
  | 'epica'
  | 'lendaria'
  | 'suprema'

export type RosarySkinStatus = 'draft' | 'published' | 'archived'

export interface RosarySkin {
  id: string
  slug: string
  nome: string
  subtitulo: string | null
  descricao: string | null
  epigraph: string | null
  categoria: RosarySkinCategoria
  raridade: RosarySkinRaridade
  glyph: string
  preview_url: string | null

  theme: RosarySkinTheme
  /** Quando null, a sessão usa o set canônico do dia. */
  mysteries: Mystery[] | null
  base_mystery_set: MysterySet | null

  unlock_tipo: UnlockTipo
  unlock_regras: UnlockRegras
  unlock_label: string | null

  sku: string | null
  preco_cents: number

  ordem: number
  visivel: boolean
  status: RosarySkinStatus
  created_at: string
  updated_at: string
}

// ---- User collection ----

export type UserRosarySkinFonte =
  | 'initial'
  | 'auto'
  | 'commerce'
  | 'redemption'
  | 'admin_grant'

export interface UserRosarySkin {
  user_id: string
  skin_id: string
  unlocked_at: string
  fonte: UserRosarySkinFonte
}

// ---- Catalog item (skin + state for the viewing user) ----

export interface RosarySkinCatalogItem extends RosarySkin {
  /** Se o user atual já desbloqueou esta skin. */
  owned: boolean
  /** Se é a skin atualmente equipada. */
  equipped: boolean
  /** Quando foi desbloqueada (se owned). */
  unlocked_at?: string | null
  fonte?: UserRosarySkinFonte | null
}

// ---- Redemption code ----

export interface RosaryRedemptionCode {
  codigo: string
  skin_id: string
  lote: string | null
  used_by_user_id: string | null
  used_at: string | null
  notes: string | null
  created_at: string
  created_by_admin_id: string | null
}

// ---- Defaults / fallbacks ----

/**
 * Theme padrão usado se a skin do banco vier malformada / corrupta.
 * Igual ao Devocional Clássico mas hardcoded — defesa em profundidade.
 */
export const FALLBACK_THEME: RosarySkinTheme = Object.freeze({
  pageBg: '#0F0E0C',
  pageBgAmbient:
    'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(107, 29, 42, 0.10) 0%, transparent 55%), ' +
    'radial-gradient(ellipse 60% 40% at 50% 110%, rgba(201, 168, 76, 0.05) 0%, transparent 50%)',
  accent: '#C9A84C',
  accentLight: '#D9C077',
  accentDeep: '#A88437',
  textPrimary: '#F2EDE4',
  textSecondary: '#C0B8B0',
  textMuted: '#938B80',
  border: 'rgba(242, 237, 228, 0.12)',
  borderStrong: 'rgba(201, 168, 76, 0.30)',
  cardBg: '#141210',
  cardBorder: 'rgba(242, 237, 228, 0.12)',
  buttonGradient: ['#C9A84C', '#A88437'] as const,
  buttonText: '#1C140C',
  beadCurrentStops: ['#F4E8B8', '#D9C077', '#C9A84C'] as const,
  beadFutureStops: ['rgba(201,168,76,0.22)', 'rgba(201,168,76,0.08)'] as const,
  beadCompletedStops: ['rgba(201,168,76,0.45)', 'rgba(201,168,76,0.18)'] as const,
  cordStroke: 'rgba(242, 237, 228, 0.12)',
  crucifixVariant: 'classic',
  introBeadVariant: 'classic',
  beadShape: 'sphere',
})

/**
 * Resolve um theme do banco com fallbacks campo-a-campo. Aceita JSONB
 * parcial — preenche os campos faltantes com FALLBACK_THEME.
 */
export function resolveTheme(raw: unknown): RosarySkinTheme {
  if (!raw || typeof raw !== 'object') return FALLBACK_THEME
  const r = raw as Record<string, unknown>
  const pick = <K extends keyof RosarySkinTheme>(k: K): RosarySkinTheme[K] =>
    (r[k] ?? FALLBACK_THEME[k]) as RosarySkinTheme[K]
  const pickStr = (k: keyof RosarySkinTheme): string =>
    (typeof r[k] === 'string' ? (r[k] as string) : (FALLBACK_THEME[k] as string))
  return {
    pageBg:           pickStr('pageBg'),
    pageBgAmbient:    pickStr('pageBgAmbient'),
    accent:           pickStr('accent'),
    accentLight:      pickStr('accentLight'),
    accentDeep:       pickStr('accentDeep'),
    textPrimary:      pickStr('textPrimary'),
    textSecondary:    pickStr('textSecondary'),
    textMuted:        pickStr('textMuted'),
    border:           pickStr('border'),
    borderStrong:     pickStr('borderStrong'),
    cardBg:           pickStr('cardBg'),
    cardBorder:       pickStr('cardBorder'),
    buttonGradient:   pick('buttonGradient'),
    buttonText:       pickStr('buttonText'),
    beadCurrentStops:   pick('beadCurrentStops'),
    beadFutureStops:    pick('beadFutureStops'),
    beadCompletedStops: pick('beadCompletedStops'),
    cordStroke:       pickStr('cordStroke'),
    crucifixVariant:   pick('crucifixVariant') as CrucifixVariant,
    introBeadVariant:  pick('introBeadVariant') as IntroBeadVariant,
    beadShape:         pick('beadShape') as BeadShape,
  }
}
