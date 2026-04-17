/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar, Link as LinkIcon } from 'lucide-react'
import type { PublicProfileSnapshot } from '@/lib/community/types'
import CrossIcon from '@/components/icons/CrossIcon'
import { renderVeritasBody } from '@/lib/community/body-renderer'
import RoleBadge from '@/components/comunidade/RoleBadge'
import VerifiedBadge from '@/components/comunidade/VerifiedBadge'

interface Props {
  snapshot: PublicProfileSnapshot
  viewerUserId?: string | null
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
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

export default function PublicProfileView({ snapshot, viewerUserId }: Props) {
  const profile = snapshot.profile
  if (!profile) return null

  const location = [profile.cidade, profile.estado].filter(Boolean).join(', ')
  const hasCover = Boolean(profile.cover_image_url)
  const isOwnProfile = viewerUserId === profile.id

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

        <div className="mt-4">
          <div
            className="relative overflow-hidden rounded-none md:rounded-3xl md:mx-4"
            style={{
              aspectRatio: '3 / 1',
              background: hasCover
                ? `url(${profile.cover_image_url}) center/cover no-repeat`
                : 'linear-gradient(135deg, rgba(201,168,76,0.22) 0%, rgba(60,30,10,0.6) 50%, rgba(201,168,76,0.08) 100%)',
              borderBottom: '1px solid rgba(201,168,76,0.2)',
            }}
          >
            {!hasCover && (
              <div
                className="absolute inset-0 flex items-center justify-center opacity-20"
                style={{ color: '#C9A84C' }}
              >
                <CrossIcon size="lg" />
              </div>
            )}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(10,10,10,0.85) 100%)',
              }}
            />
          </div>

          <div className="px-4 md:px-8 -mt-14 md:-mt-16 relative">
            <div className="flex items-end justify-between gap-4 mb-4">
              <div
                className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{
                  background: profile.profile_image_url
                    ? 'transparent'
                    : 'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.06))',
                  border: '4px solid rgba(10,10,10,0.98)',
                  boxShadow: profile.verified
                    ? '0 0 0 2px rgba(233,196,106,0.55), 0 8px 24px rgba(0,0,0,0.5)'
                    : '0 8px 24px rgba(0,0,0,0.5)',
                }}
              >
                {profile.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt={profile.name ?? 'Perfil'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <CrossIcon size="lg" />
                )}
              </div>

              {isOwnProfile && (
                <div className="flex items-center gap-2">
                  <Link
                    href="/comunidade/perfil/editar"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs uppercase tracking-[0.12em]"
                    style={{
                      background: 'rgba(16,16,16,0.78)',
                      border: '1px solid rgba(201,168,76,0.25)',
                      color: '#C9A84C',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    Editar perfil
                  </Link>
                </div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className="text-2xl md:text-3xl leading-tight"
                  style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F2EDE4' }}
                >
                  {profile.name ?? 'Membro Veritas'}
                </h1>
                {profile.verified && <VerifiedBadge size={22} />}
                <RoleBadge role={profile.community_role} />
              </div>

              <p
                className="text-sm mt-1"
                style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
              >
                {profile.public_handle ? `@${profile.public_handle}` : `#${profile.user_number ?? '-'}`}
              </p>
            </div>

            {profile.bio_short && (
              <p
                className="mb-4 text-sm leading-relaxed whitespace-pre-line"
                style={{ color: '#E7DED1', fontFamily: 'Poppins, sans-serif' }}
              >
                {profile.bio_short}
              </p>
            )}

            <div
              className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-xs"
              style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
            >
              {location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {location}
                </span>
              )}
              {profile.diocese && !location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {profile.diocese}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
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
                  <LinkIcon className="w-3.5 h-3.5" />
                  {link.label || safeLinkHost(link.url)}
                </a>
              ))}
            </div>

            <div
              className="flex items-center gap-5 mb-6 text-sm"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <span>
                <strong style={{ color: '#F2EDE4' }}>{profile.following_count}</strong>
                <span style={{ color: '#8A8378' }}> seguindo</span>
              </span>
              <span>
                <strong style={{ color: '#F2EDE4' }}>{profile.follower_count}</strong>
                <span style={{ color: '#8A8378' }}>
                  {' '}{profile.follower_count === 1 ? 'seguidor' : 'seguidores'}
                </span>
              </span>
              <span>
                <strong style={{ color: '#F2EDE4' }}>{profile.veritas_count}</strong>
                <span style={{ color: '#8A8378' }}>
                  {' '}{profile.veritas_count === 1 ? 'Veritas' : 'Veritas'}
                </span>
              </span>
            </div>

            <div
              className="flex items-center gap-1 mb-4 border-b"
              style={{ borderColor: 'rgba(201,168,76,0.15)' }}
            >
              <button
                type="button"
                className="px-4 py-3 text-xs uppercase tracking-[0.12em]"
                style={{
                  color: '#C9A84C',
                  fontFamily: 'Poppins, sans-serif',
                  borderBottom: '2px solid #C9A84C',
                  marginBottom: '-1px',
                }}
              >
                Veritas
              </button>
              <button
                type="button"
                disabled
                className="px-4 py-3 text-xs uppercase tracking-[0.12em] opacity-40 cursor-not-allowed"
                style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
                title="Em breve"
              >
                Respostas
              </button>
              <button
                type="button"
                disabled
                className="px-4 py-3 text-xs uppercase tracking-[0.12em] opacity-40 cursor-not-allowed"
                style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
                title="Em breve"
              >
                Mídia
              </button>
              <button
                type="button"
                disabled
                className="px-4 py-3 text-xs uppercase tracking-[0.12em] opacity-40 cursor-not-allowed"
                style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
                title="Em breve"
              >
                Curtidos
              </button>
            </div>

            <div className="space-y-4 pb-12">
              {snapshot.veritas.map((post) => (
                <Link
                  key={post.id}
                  href={`/comunidade/veritas/${post.id}`}
                  className="block rounded-2xl p-5 transition-colors"
                  style={{
                    background: 'rgba(16,16,16,0.72)',
                    border: '1px solid rgba(201,168,76,0.14)',
                  }}
                >
                  <p
                    className="text-xs mb-2"
                    style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {formatDate(post.created_at)}
                  </p>

                  <p
                    className="text-sm whitespace-pre-line leading-relaxed"
                    style={{ color: '#E7DED1', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {renderVeritasBody(post.body)}
                  </p>

                  {post.media.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {post.media.slice(0, 6).map((media) => (
                        <div
                          key={media.id}
                          className="rounded-xl overflow-hidden"
                          style={{
                            border: '1px solid rgba(201,168,76,0.15)',
                            background: 'rgba(0,0,0,0.3)',
                          }}
                        >
                          <img
                            src={media.variants.feed}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="w-full h-56 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    className="mt-4 flex items-center gap-4 text-xs"
                    style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
                  >
                    <span>{post.metrics.like_count} curtidas</span>
                    <span>{post.metrics.reply_count} respostas</span>
                    <span>{post.metrics.repost_count} reveritas</span>
                    <span>{post.metrics.share_cross_count} CRUZ</span>
                  </div>
                </Link>
              ))}

              {snapshot.veritas.length === 0 && (
                <div
                  className="rounded-2xl p-8 text-center"
                  style={{
                    background: 'rgba(16,16,16,0.6)',
                    border: '1px solid rgba(201,168,76,0.1)',
                  }}
                >
                  <p style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}>
                    Ainda não há Veritas públicos neste perfil.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
