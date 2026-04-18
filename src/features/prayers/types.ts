/**
 * Prayer page block types.
 *
 * O body de uma oração é escrito em markdown leve com fences especiais.
 * O parser (`./parser`) transforma o texto num array de blocos tipados,
 * que o `PrayerRenderer` consome. É o contrato que o futuro editor
 * Elementor-like vai produzir.
 */

export type Block =
  | HeadingBlock
  | ParagraphBlock
  | VerseBlock
  | ListBlock
  | QuoteBlock
  | CalloutBlock
  | DividerBlock

export interface HeadingBlock {
  type: 'heading'
  /** 1–3 (H2 / H3 / H4 em HTML — H1 é o título da página). */
  level: 2 | 3 | 4
  text: string
}

export interface ParagraphBlock {
  type: 'paragraph'
  /** Texto plano com inline simples: **bold**, *italic*, quebra de linha. */
  text: string
}

export interface VerseBlock {
  type: 'verse'
  /** Conteúdo do verso, linhas preservadas. */
  text: string
  /** Referência opcional ex: "Sl 51:3" ou "Lc 11:2-4". */
  reference?: string
}

export interface ListBlock {
  type: 'list'
  ordered: boolean
  items: string[]
}

export interface QuoteBlock {
  type: 'quote'
  text: string
  author?: string
}

export interface CalloutBlock {
  type: 'callout'
  /** Visual variant. */
  tone: 'info' | 'warning' | 'indulgence'
  text: string
}

export interface DividerBlock {
  type: 'divider'
}

/**
 * DTO completo da página de oração (o que queries.ts devolve).
 */
export interface PrayerItem {
  id: string
  slug: string
  title: string
  latinTitle: string | null
  body: string
  latinBody: string | null
  reference: string | null
  keywords: string[]
  metaDescription: string | null
  scriptureRefs: string[]
  indulgenceNote: string | null
  audioUrl: string | null
  videoUrl: string | null
  iconName: string | null
  imageUrl: string | null
  subtopic: {
    slug: string
    title: string
  }
  topic: {
    slug: string
    title: string
  }
}
