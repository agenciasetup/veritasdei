'use client'

import { Church, MapPin, Share2, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { VOCACOES, SACRAMENTOS } from '@/types/auth'
import CrossIcon from '@/components/icons/CrossIcon'
import { share } from '@/lib/platform'

/**
 * Carteirinha Católica — cartão de identificação digital com selo dourado
 * sobre fundo de pergaminho (estética distinta do resto do app).
 *
 * Compartilhamento via Web Share API (com fallback para clipboard).
 */
export default function CarteirinhaSection() {
  const { profile } = useAuth()
  const vocacaoLabel = VOCACOES.find((v) => v.value === profile?.vocacao)?.label ?? 'Leigo(a)'
  const sacramentosRecebidos = (profile?.sacramentos ?? []) as string[]
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      })
    : ''

  const handleShare = async () => {
    await share.text({
      title: 'Carteirinha Católica',
      text: `Carteirinha Catolica - ${profile?.name ?? 'Membro'} | Veritas Dei`,
    })
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #F2EDE4 0%, #E8E0D0 100%)',
          border: '2px solid #C9A84C',
          boxShadow: '0 4px 24px rgba(201,168,76,0.18), 0 1px 0 rgba(201,168,76,0.3) inset',
        }}
      >
        <div
          style={{
            border: '3px solid transparent',
            borderImage:
              'linear-gradient(135deg, #C9A84C 0%, #A88B3A 40%, #C9A84C 60%, #A88B3A 100%) 1',
            margin: '4px',
            borderRadius: '12px',
          }}
        >
          <div
            className="flex items-center justify-center gap-3 py-4 px-6"
            style={{
              background:
                'linear-gradient(135deg, #6B1D2A 0%, #8B2D3A 50%, #6B1D2A 100%)',
              borderBottom: '2px solid #C9A84C',
            }}
          >
            <CrossIcon size="md" />
            <div className="text-center">
              <h3
                className="text-lg font-bold tracking-[0.2em] uppercase"
                style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
              >
                Veritas Dei
              </h3>
              <p
                className="text-[10px] tracking-[0.15em] uppercase"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  color: 'rgba(201,168,76,0.7)',
                }}
              >
                Carteirinha Catolica
              </p>
            </div>
            <CrossIcon size="md" />
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{
                  background: profile?.profile_image_url
                    ? 'transparent'
                    : 'rgba(107,29,42,0.08)',
                  border: '2px solid #C9A84C',
                }}
              >
                {profile?.profile_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.profile_image_url}
                    alt="Avatar"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-7 h-7" style={{ color: '#6B1D2A' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4
                  className="text-lg font-bold truncate"
                  style={{ fontFamily: 'Cinzel, serif', color: '#2A1F14' }}
                >
                  {profile?.name ?? 'Membro'}
                </h4>
                <p
                  className="text-sm"
                  style={{ fontFamily: 'Poppins, sans-serif', color: '#6B1D2A' }}
                >
                  {vocacaoLabel}
                </p>
              </div>
            </div>

            <div
              style={{
                height: '1px',
                background: 'linear-gradient(to right, transparent, #C9A84C, transparent)',
              }}
            />

            <div className="space-y-3">
              {profile?.paroquia && (
                <CardRow icon={Church} label="Paroquia" value={profile.paroquia} />
              )}
              {profile?.diocese && (
                <CardRow icon={MapPin} label="Diocese" value={profile.diocese} />
              )}
            </div>

            {sacramentosRecebidos.length > 0 && (
              <div>
                <p
                  className="text-[10px] tracking-wider uppercase mb-2"
                  style={{ fontFamily: 'Cinzel, serif', color: '#8B7355' }}
                >
                  Sacramentos Recebidos
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sacramentosRecebidos.map((s) => {
                    const label = SACRAMENTOS.find((sac) => sac.value === s)?.label ?? s
                    return (
                      <span
                        key={s}
                        className="text-[11px] px-2.5 py-1 rounded-full"
                        style={{
                          fontFamily: 'Poppins, sans-serif',
                          background: 'rgba(107,29,42,0.08)',
                          border: '1px solid rgba(201,168,76,0.3)',
                          color: '#6B1D2A',
                        }}
                      >
                        {label}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            <div
              style={{
                height: '1px',
                background: 'linear-gradient(to right, transparent, #C9A84C, transparent)',
              }}
            />

            <div className="flex items-center justify-between">
              <div>
                {profile?.user_number && (
                  <p
                    className="text-[10px] tracking-wider uppercase font-bold"
                    style={{ fontFamily: 'Cinzel, serif', color: '#6B1D2A' }}
                  >
                    ID #{String(profile.user_number).padStart(6, '0')}
                  </p>
                )}
                <p
                  className="text-[10px] tracking-wider uppercase"
                  style={{ fontFamily: 'Cinzel, serif', color: '#8B7355' }}
                >
                  {memberSince ? `Membro desde ${memberSince}` : 'Membro'}
                </p>
              </div>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(107,29,42,0.06)',
                  border: '1px solid rgba(201,168,76,0.25)',
                }}
              >
                <CrossIcon size="xs" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all touch-target-lg active:scale-[0.98]"
        style={{
          fontFamily: 'Cinzel, serif',
          background: 'linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.08) 100%)',
          border: '1px solid rgba(201,168,76,0.3)',
          color: '#C9A84C',
        }}
      >
        <Share2 className="w-4 h-4" />
        Compartilhar Carteirinha
      </button>
    </div>
  )
}

function CardRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#6B1D2A' }} />
      <div>
        <p
          className="text-[10px] tracking-wider uppercase"
          style={{ fontFamily: 'Cinzel, serif', color: '#8B7355' }}
        >
          {label}
        </p>
        <p
          className="text-sm"
          style={{ fontFamily: 'Poppins, sans-serif', color: '#2A1F14' }}
        >
          {value}
        </p>
      </div>
    </div>
  )
}
