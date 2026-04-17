import type { Profile } from '@/types/auth'

export type VeritasKind = 'original' | 'reply' | 'repost' | 'quote'
export type VeritasPostVariant = 'default' | 'reflection'
export type VeritasReactionType = 'like' | 'share_cross'
export type VeritasMediaKind = 'image' | 'gif' | 'audio'

export interface VeritasMediaVariantSet {
  thumb: string
  feed: string
  detail: string
}

export interface VeritasMediaAsset {
  id: string
  kind: VeritasMediaKind
  mime_type: string
  object_key: string
  width: number | null
  height: number | null
  variants: VeritasMediaVariantSet
  position: number
}

export interface VeritasMetrics {
  like_count: number
  repost_count: number
  quote_count: number
  reply_count: number
  share_cross_count: number
  report_count: number
  score: number
}

export type CommunityRole =
  | 'leigo'
  | 'diacono'
  | 'padre'
  | 'bispo'
  | 'religioso'
  | 'artista'
  | 'moderator'
  | 'admin'

export interface VeritasAuthorSnapshot {
  id: string
  public_handle: string | null
  user_number: number | null
  name: string | null
  vocacao: Profile['vocacao'] | null
  community_role: CommunityRole
  verified: boolean
  profile_image_url: string | null
}

export interface VeritasParentSnapshot {
  id: string
  kind: VeritasKind
  body: string
  created_at: string
  author: VeritasAuthorSnapshot
  media: VeritasMediaAsset[]
}

export interface VeritasPost {
  id: string
  author_user_id: string
  kind: VeritasKind
  variant: VeritasPostVariant
  body: string
  parent_post_id: string | null
  /** Populado só quando kind='quote' ou 'repost' — post citado/reposted. */
  parent?: VeritasParentSnapshot | null
  created_at: string
  edited_at: string | null
  author: VeritasAuthorSnapshot
  metrics: VeritasMetrics
  media: VeritasMediaAsset[]
  viewer: {
    liked: boolean
    shared_cross: boolean
    reposted: boolean
    follows_author: boolean
    blocked_author: boolean
    muted_author: boolean
  }
}

export interface PublicProfileSnapshot {
  profile: {
    id: string
    public_handle: string | null
    user_number: number | null
    name: string | null
    vocacao: Profile['vocacao'] | null
    community_role: CommunityRole
    verified: boolean
    verified_at: string | null
    profile_image_url: string | null
    cover_image_url: string | null
    bio_short: string | null
    external_links: Array<{ label: string; url: string }>
    cidade: string | null
    estado: string | null
    paroquia: string | null
    diocese: string | null
    comunidade: string | null
    follower_count: number
    following_count: number
    veritas_count: number
    created_at: string
    show_likes_public?: boolean
  } | null
  veritas: Array<{
    id: string
    kind: VeritasKind
    body: string
    parent_post_id: string | null
    created_at: string
    metrics: Omit<VeritasMetrics, 'score'>
    media: VeritasMediaAsset[]
  }>
}

export interface FeedResponse {
  tab: 'for_you' | 'following'
  cursor: string | null
  items: VeritasPost[]
}
