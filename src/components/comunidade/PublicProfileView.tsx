import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, MapPin, Calendar, Link as LinkIcon } from 'lucide-react'
import type { PublicProfileSnapshot } from '@/lib/community/types'
import CrossIcon from '@/components/icons/CrossIcon'
import RoleBadge from '@/components/comunidade/RoleBadge'
import VerifiedBadge from '@/components/comunidade/VerifiedBadge'
import ProfileFollowButton from '@/components/comunidade/ProfileFollowButton'
import ProfileTabs from '@/components/comunidade/ProfileTabs'
import { OrnamentDivider } from '@/components/landing/components/OrnamentDivider'

interface Props {
  snapshot: PublicProfileSnapshot
  viewerUserId?: string | null
  viewerFollows?: boolean
  showLikesPublic?: boolean
}

function formatJoined(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
}

function safeLinkHost(raw: string): string {
  try {
    return new URL(raw).hostname.replace(/^www\./, '')
  } catch {
    return raw
  }
}

export default function PublicProfileView({
  snapshot,
  viewerUserId,
  viewerFollows = false,
  showLikesPublic = false,
}: Props) {
  const profile = snapshot.profile
  if (!profile) return null

  const location = [profile.cidade, profile.estado].filter(Boolean).join(', ')
  const hasCover = Boolean(profile.cover_image_url)
  const isOwnProfile = viewerUserId === profile.id
  const isAuthenticated = Boolean(viewerUserId)
  const likesVisible = showLikesPublic || isOwnProfile
  const tabIdentifier = profile.public_handle
    ? `@${profile.public_handle}`
    : String(profile.user_number ?? '')

  return (
    <main className="min-h-screen relative">
      <div className="bg-glow" />

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="px-4 md:px-8 pt-6">
          <Link
            href="/comunidade"
            className="inline-flex items-center gap-2 text-sm"
            style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
          >
            <ArrowLeft className="w-4 h-4" /> Comunidade
          </Link>
        </div>

        {/* Cover: minimalista, sem overlay preto no fim. */}
        <div className="mt-4">
          <div
            className="relative overflow-hidden rounded-none md:rounded-2xl md:mx-4"
            style={{
              aspectRatio: '3 / 1',
              background: hasCover
                ? undefined
                : 'linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(60,30,10,0.5) 55%, rgba(201,168,76,0.06) 100%)',
            }}
          >
            {hasCover && profile.cover_image_url && (
              <Image
                src={profile.cover_image_url}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
                priority
              />
            )}
            {!hasCover && (
              <div
                aria-hidden
                className="absolute inset-0 flex items-center justify-center opacity-15"
                style={{ color: '#C9A84C' }}
              >
                <CrossIcon size="lg" />
              </div>
            )}
          </div>

          {/* Header: avatar + nome + ação — linha compacta estilo Threads. */}
          <div className="px-4 md:px-8 -mt-10 relative">
            <div className="flex items-end justify-between gap-4 mb-4">
              <div
                className="relative rounded-full overflow-hidden flex-shrink-0"
                style={{
                  width: 80,
                  height: 80,
                  background: profile.profile_image_url
                    ? 'transparent'
                    : 'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.06))',
                  border: '2px solid #0F0E0C',
                  boxShadow: profile.verified
                    ? '0 0 0 1.5px rgba(233,196,106,0.6), 0 4px 16px rgba(0,0,0,0.45)'
                    : '0 4px 16px rgba(0,0,0,0.45)',
                }}
              >
                {profile.profile_image_url ? (
                  <Image
                    src={profile.profile_image_url}
                    alt={profile.name ?? 'Perfil'}
                    width={80}
                    height={80}
                    sizes="80px"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="flex items-center justify-center w-full h-full">
                    <CrossIcon size="lg" />
                  </span>
                )}
              </div>

              {isOwnProfile ? (
                <Link
                  href="/comunidade/perfil/editar"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-[0.12em]"
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(201,168,76,0.4)',
                    color: '#C9A84C',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  Editar perfil
                </Link>
              ) : isAuthenticated ? (
                <ProfileFollowButton
                  profileId={profile.id}
                  initialFollowing={viewerFollows}
                />
              ) : null}
            </div>

            {/* Nome e handle */}
            <div className="mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className="text-[22px] md:text-[26px] leading-tight"
                  style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F2EDE4', fontWeight: 500 }}
                >
                  {profile.name ?? 'Membro Veritas'}
                </h1>
                {profile.verified && <VerifiedBadge size={18} />}
                <RoleBadge role={profile.community_role} />
              </div>

              <p
                className="text-[13px] mt-0.5"
                style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
              >
                {profile.public_handle ? `@${profile.public_handle}` : `#${profile.user_number ?? '-'}`}
              </p>
            </div>

            {profile.bio_short && (
              <p
                className="mb-3 text-[14px] leading-relaxed whitespace-pre-line"
                style={{ color: '#E7DED1', fontFamily: 'Poppins, sans-serif' }}
              >
                {profile.bio_short}
              </p>
            )}

            {/* Meta (localização, data, links). */}
            <div
              className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3 text-[12px]"
              style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
            >
              {location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {location}
                </span>
              )}
              {profile.diocese && !location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {profile.diocese}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
                Entrou em {formatJoined(profile.created_at)}
              </span>
              {profile.external_links.slice(0, 3).map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1.5 hover:underline"
                  style={{ color: '#C9A84C' }}
                >
                  <LinkIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {link.label || safeLinkHost(link.url)}
                </a>
              ))}
            </div>

            {/* Estatísticas. */}
            <div
              className="flex items-center gap-5 mb-4 text-[14px]"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <Link
                href={profile.public_handle
                  ? `/comunidade/@${profile.public_handle}/seguindo`
                  : `/comunidade/p/${profile.user_number ?? ''}/seguindo`}
                className="hover:underline"
              >
                <strong style={{ color: '#F2EDE4' }}>{profile.following_count}</strong>
                <span style={{ color: '#8A8378' }}> seguindo</span>
              </Link>
              <Link
                href={profile.public_handle
                  ? `/comunidade/@${profile.public_handle}/seguidores`
                  : `/comunidade/p/${profile.user_number ?? ''}/seguidores`}
                className="hover:underline"
              >
                <strong style={{ color: '#F2EDE4' }}>{profile.follower_count}</strong>
                <span style={{ color: '#8A8378' }}>
                  {' '}{profile.follower_count === 1 ? 'seguidor' : 'seguidores'}
                </span>
              </Link>
              <span>
                <strong style={{ color: '#F2EDE4' }}>{profile.veritas_count}</strong>
                <span style={{ color: '#8A8378' }}>{' '}Veritas</span>
              </span>
            </div>
          </div>

          {/* Divisor ornamental entre header e tabs — identidade Veritas. */}
          <div className="px-4 md:px-8">
            <OrnamentDivider className="!py-4" />
          </div>

          <div className="px-4 md:px-8 pb-12">
            <ProfileTabs
              identifier={tabIdentifier}
              viewerUserId={viewerUserId ?? null}
              likesVisible={likesVisible}
              isOwnProfile={isOwnProfile}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
