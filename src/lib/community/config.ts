export type CommunityFlags = {
  communityEnabled: boolean
  communityPublicProfiles: boolean
  communityReplies: boolean
}

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on'])
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off'])

function parseFlag(raw: string | undefined, fallback: boolean): boolean {
  if (!raw) return fallback
  const value = raw.trim().toLowerCase()
  if (TRUE_VALUES.has(value)) return true
  if (FALSE_VALUES.has(value)) return false
  return fallback
}

export function getCommunityFlags(): CommunityFlags {
  return {
    communityEnabled: parseFlag(
      process.env.FEATURE_COMMUNITY_ENABLED ?? process.env.NEXT_PUBLIC_FEATURE_COMMUNITY_ENABLED,
      true,
    ),
    communityPublicProfiles: parseFlag(
      process.env.FEATURE_COMMUNITY_PUBLIC_PROFILES ?? process.env.NEXT_PUBLIC_FEATURE_COMMUNITY_PUBLIC_PROFILES,
      true,
    ),
    communityReplies: parseFlag(
      process.env.FEATURE_COMMUNITY_REPLIES ?? process.env.NEXT_PUBLIC_FEATURE_COMMUNITY_REPLIES,
      true,
    ),
  }
}
