/**
 * Dicionário de eventos da Comunidade Veritas.
 * Mantém nomes estáveis para analytics e logs.
 */
export const COMMUNITY_EVENTS = {
  veritasCreated: 'community.veritas.created',
  veritasLiked: 'community.veritas.liked',
  veritasUnliked: 'community.veritas.unliked',
  veritasReposted: 'community.veritas.reposted',
  veritasShareCross: 'community.veritas.share_cross',
  followCreated: 'community.follow.created',
  followRemoved: 'community.follow.removed',
  reportCreated: 'community.report.created',
  mediaPresigned: 'community.media.presigned',
} as const

export type CommunityEventName = (typeof COMMUNITY_EVENTS)[keyof typeof COMMUNITY_EVENTS]
