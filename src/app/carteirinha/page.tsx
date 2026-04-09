'use client'

import AuthGuard from '@/components/auth/AuthGuard'
import { useAuth } from '@/contexts/AuthContext'
import { VOCACOES, SACRAMENTOS } from '@/types/auth'
import { VocacaoIcon } from '@/components/icons/VocacaoIcons'
import {
  Shield, MapPin, Church, CheckCircle, Calendar, Droplets, User,
} from 'lucide-react'

export default function CarteirinhaPage() {
  return (
    <AuthGuard>
      <CarteirinhaContent />
    </AuthGuard>
  )
}

function CarteirinhaContent() {
  const { profile } = useAuth()

  if (!profile) return null

  const vocacaoLabel = VOCACOES.find(v => v.value === profile.vocacao)?.label ?? 'Leigo'
  const sacramentosRecebidos = profile.sacramentos ?? []

  return (
    <div className="min-h-screen px-4 md:px-8 py-8 relative flex flex-col items-center justify-center">
      <div className="bg-glow" />

      <div className="relative z-10 w-full max-w-md">
        {/* Title */}
        <h1
          className="text-xl font-bold tracking-wider uppercase text-center mb-2"
          style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
        >
          Carteirinha Católica
        </h1>
        <p className="text-sm text-center mb-8" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          Seu perfil católico digital
        </p>

        {/* Card */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(20,20,20,0.95) 0%, rgba(16,16,16,0.98) 100%)',
            border: '2px solid rgba(201,168,76,0.25)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Card header */}
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{
              background: 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(107,29,42,0.08) 100%)',
              borderBottom: '1px solid rgba(201,168,76,0.15)',
            }}
          >
            <div className="flex items-center gap-2">
              <span style={{ color: '#C9A84C', fontSize: '1.2rem' }}>&#10013;</span>
              <span
                className="text-sm font-bold tracking-widest uppercase"
                style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
              >
                Veritas Dei
              </span>
            </div>
            {profile.verified && (
              <div className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" style={{ color: '#66BB6A' }} />
                <span className="text-[10px] uppercase tracking-wider" style={{ color: '#66BB6A', fontFamily: 'Poppins, sans-serif' }}>
                  Verificado
                </span>
              </div>
            )}
          </div>

          {/* Card body */}
          <div className="px-6 py-6">
            {/* User info */}
            <div className="flex items-start gap-4 mb-6">
              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{
                  background: profile.profile_image_url ? 'transparent' : 'rgba(201,168,76,0.08)',
                  border: '2px solid rgba(201,168,76,0.2)',
                }}
              >
                {profile.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt={profile.name ?? 'Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8" style={{ color: '#C9A84C', opacity: 0.5 }} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2
                  className="text-lg font-bold leading-tight truncate"
                  style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                >
                  {profile.name ?? 'Católico'}
                </h2>

                {/* Vocação badge */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <VocacaoIcon vocacao={profile.vocacao ?? 'leigo'} size={14} />
                  <span className="text-xs" style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}>
                    {vocacaoLabel}
                  </span>
                </div>

                {/* Location */}
                {(profile.cidade || profile.paroquia) && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: '#7A7368' }} />
                    <span className="text-xs truncate" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                      {[profile.cidade, profile.estado].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}

                {profile.paroquia && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Church className="w-3 h-3 flex-shrink-0" style={{ color: '#7A7368' }} />
                    <span className="text-xs truncate" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                      {profile.paroquia}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Sacramentos */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Droplets className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
                <span className="text-[10px] tracking-[0.15em] uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>
                  Sacramentos Recebidos
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {SACRAMENTOS.map(s => {
                  const received = sacramentosRecebidos.includes(s.value)
                  return (
                    <div
                      key={s.value}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                      style={{
                        background: received ? 'rgba(201,168,76,0.06)' : 'transparent',
                        color: received ? '#C9A84C' : '#7A736840',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      {received ? (
                        <CheckCircle className="w-3 h-3 flex-shrink-0" />
                      ) : (
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ border: '1px solid rgba(201,168,76,0.15)' }} />
                      )}
                      {s.label}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Member since */}
            <div
              className="flex items-center justify-between pt-4"
              style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}
            >
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" style={{ color: '#7A7368' }} />
                <span className="text-[10px]" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                  Membro desde {new Date(profile.created_at ?? Date.now()).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{
                  background: 'rgba(201,168,76,0.08)',
                  border: '1px solid rgba(201,168,76,0.12)',
                  color: '#7A7368',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {profile.plan ?? 'free'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              fontFamily: 'Poppins, sans-serif',
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.15)',
              color: '#C9A84C',
            }}
            onClick={() => {
              // Future: share or download card
              if (navigator.share) {
                navigator.share({
                  title: 'Minha Carteirinha Católica - Veritas Dei',
                  text: `${profile.name} - ${vocacaoLabel} | Veritas Dei`,
                })
              }
            }}
          >
            Compartilhar
          </button>
        </div>

        <p className="text-xs text-center mt-6" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          Sua identidade católica digital. Em breve: QR Code e versão para impressão.
        </p>
      </div>
    </div>
  )
}
