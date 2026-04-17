/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import type { PublicProfileSnapshot } from '@/lib/community/types'
import CrossIcon from '@/components/icons/CrossIcon'
import { renderVeritasBody } from '@/lib/community/body-renderer'

interface Props {
  snapshot: PublicProfileSnapshot
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function PublicProfileView({ snapshot }: Props) {
  const profile = snapshot.profile
  if (!profile) return null

  const location = [profile.cidade, profile.estado].filter(Boolean).join(', ')

  return (
    <main className="min-h-screen px-4 md:px-8 py-8 relative">
      <div className="bg-glow" />

      <div className="max-w-3xl mx-auto relative z-10">
        <div
          className="rounded-3xl p-6 md:p-8 mb-6"
          style={{
            background: 'rgba(16,16,16,0.78)',
            border: '1px solid rgba(201,168,76,0.18)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center"
              style={{
                background: profile.profile_image_url
                  ? 'transparent'
                  : 'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.06))',
                border: '1px solid rgba(201,168,76,0.25)',
              }}
            >
              {profile.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt={profile.name ?? 'Perfil da comunidade'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <CrossIcon size="md" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1
                className="text-2xl md:text-3xl leading-tight"
                style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F2EDE4' }}
              >
                {profile.name ?? 'Membro Veritas'}
              </h1>
              <p
                className="text-sm mt-1"
                style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
              >
                {profile.public_handle ? `@${profile.public_handle}` : `#${profile.user_number ?? '-'}`}
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                {profile.vocacao && (
                  <span
                    className="px-2.5 py-1 rounded-full"
                    style={{
                      background: 'rgba(201,168,76,0.1)',
                      border: '1px solid rgba(201,168,76,0.2)',
                      color: '#C9A84C',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    {profile.vocacao}
                  </span>
                )}
                {profile.verified && (
                  <span
                    className="px-2.5 py-1 rounded-full"
                    style={{
                      background: 'rgba(102,187,106,0.12)',
                      border: '1px solid rgba(102,187,106,0.35)',
                      color: '#66BB6A',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    Verificado
                  </span>
                )}
                {location && (
                  <span
                    className="px-2.5 py-1 rounded-full"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#B8AFA2',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    {location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-xs uppercase tracking-[0.2em]"
            style={{ color: '#7A7368', fontFamily: 'Cinzel, serif' }}
          >
            Últimos 10 Veritas
          </h2>
          <Link
            href="/comunidade"
            className="text-xs underline"
            style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
          >
            Abrir Comunidade
          </Link>
        </div>

        <div className="space-y-4">
          {snapshot.veritas.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl p-5"
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
                        alt="Mídia do Veritas"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-56 object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center gap-4 text-xs" style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}>
                <span>{post.metrics.like_count} curtidas</span>
                <span>{post.metrics.reply_count} respostas</span>
                <span>{post.metrics.repost_count} republicações</span>
                <span>{post.metrics.share_cross_count} CRUZ</span>
              </div>
            </article>
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
    </main>
  )
}
