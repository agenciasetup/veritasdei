/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Camera,
  Loader2,
  MapPin,
  Church,
  Pencil,
  Share2,
  ShieldCheck,
  Heart,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/image/compress'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { uploadProfileImage } from '@/lib/media/upload'
import { VOCACOES } from '@/types/auth'
import { VocacaoIcon } from '@/components/icons/VocacaoIcons'
import LevelBadge from '@/components/gamification/LevelBadge'
import XpBar from '@/components/gamification/XpBar'
import EquippedReliquiaChip from '@/components/gamification/EquippedReliquiaChip'
import { useGamification } from '@/lib/gamification/useGamification'
import SantoCoverFallback from '@/components/devocao/SantoCoverFallback'
import type { SantoResumo } from '@/types/santo'

/**
 * Header estilo Instagram: capa + avatar + nome/handle/bio + stats + botão
 * "Editar perfil". Fica fixo no topo de /perfil e já expõe os atalhos
 * mais comuns (trocar capa/avatar) — o resto vai via sheet de edição.
 *
 * Mantém o desenho coerente com `PublicProfileView` da Comunidade para
 * dar a sensação de "é o mesmo perfil" nos dois contextos.
 */
export default function ProfileHeaderCard({
  onEditClick,
}: {
  onEditClick: () => void
}) {
  const { profile, user, refreshProfile } = useAuth()
  const { isPremium } = useSubscription()
  const supabase = createClient()
  const gami = useGamification(user?.id)

  const [stats, setStats] = useState<{
    followers: number
    following: number
    veritas: number
  } | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [santoDevocao, setSantoDevocao] = useState<SantoResumo | null>(null)
  const [error, setError] = useState<string | null>(null)

  const publicUrl =
    profile?.public_handle
      ? `/comunidade/@${profile.public_handle}`
      : profile?.user_number
        ? `/comunidade/p/${profile.user_number}`
        : null

  useEffect(() => {
    if (!profile || !supabase) return
    let cancelled = false
    const identifier = profile.public_handle
      ? `@${profile.public_handle}`
      : profile.user_number
        ? String(profile.user_number)
        : null
    if (!identifier) {
      setStats({ followers: 0, following: 0, veritas: 0 })
      return
    }
    void (async () => {
      const { data, error: rpcError } = await supabase.rpc(
        'get_public_profile_snapshot',
        { identifier },
      )
      if (cancelled) return
      if (rpcError || !data) {
        setStats({ followers: 0, following: 0, veritas: 0 })
        return
      }
      const snap = (Array.isArray(data) ? data[0] : data) as {
        profile?: {
          follower_count?: number
          following_count?: number
          veritas_count?: number
        }
      } | null
      const p = snap?.profile
      setStats({
        followers: p?.follower_count ?? 0,
        following: p?.following_count ?? 0,
        veritas: p?.veritas_count ?? 0,
      })
    })()
    return () => {
      cancelled = true
    }
  }, [profile, supabase])

  async function handleAvatar(file: File) {
    if (!user || !supabase) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 4 * 1024 * 1024) {
      setError('Imagem muito grande (máximo 4MB).')
      return
    }
    setUploadingAvatar(true)
    setError(null)
    try {
      let publicUrl: string
      if (isPremium) {
        // Premium usa o fluxo R2 (mesmo das outras mídias da Comunidade).
        publicUrl = await uploadProfileImage(file)
      } else {
        // Free cai no bucket público do Supabase Storage (sem custo).
        const { file: compressed } = await compressImage(file)
        const ext = compressed.name.split('.').pop() ?? 'jpg'
        const path = `${user.id}/avatar.${ext}`
        const { error: upErr } = await supabase.storage
          .from('avatars')
          .upload(path, compressed, { upsert: true })
        if (upErr) throw upErr
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        // Upsert reusa a mesma key → URL pública idêntica entre uploads.
        // Sem cache-buster o browser serve a foto antiga do cache e o
        // usuário acha que não trocou.
        publicUrl = `${data.publicUrl}?v=${Date.now()}`
      }
      const { error: saveErr } = await supabase
        .from('profiles')
        .update({ profile_image_url: publicUrl })
        .eq('id', user.id)
      if (saveErr) throw saveErr
      await refreshProfile()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao enviar foto.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  // Capa do perfil = imagem do santo de devoção (mesmo asset para todos os devotos).
  useEffect(() => {
    if (!profile?.santo_devocao_id || !supabase) {
      setSantoDevocao(null)
      return
    }
    let cancelled = false
    void (async () => {
      const { data } = await supabase
        .from('santos')
        .select('id, slug, nome, invocacao, patronatos, imagem_url, popularidade_rank, festa_texto, tipo_culto')
        .eq('id', profile.santo_devocao_id!)
        .maybeSingle()
      if (!cancelled && data) setSantoDevocao(data as SantoResumo)
    })()
    return () => { cancelled = true }
  }, [profile?.santo_devocao_id, supabase])

  if (!profile) {
    return (
      <div className="h-48 rounded-2xl animate-pulse" style={{ background: 'rgba(16,16,16,0.6)' }} />
    )
  }

  const coverUrl = santoDevocao?.imagem_url ?? null
  const vocacaoMeta = VOCACOES.find(v => v.value === profile.vocacao)
  const location = [profile.cidade, profile.estado].filter(Boolean).join(', ')

  return (
    <div>
      {/* Capa — sempre derivada do santo de devoção */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          aspectRatio: '3 / 1',
          background: coverUrl
            ? undefined
            : 'linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(60,30,10,0.5) 55%, rgba(201,168,76,0.06) 100%)',
        }}
      >
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={santoDevocao?.nome ?? ''}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        ) : santoDevocao ? (
          <SantoCoverFallback nome={santoDevocao.nome} invocacao={santoDevocao.invocacao} />
        ) : profile.santo_devocao_id ? null : (
          <Link
            href="/perfil?section=editar"
            className="absolute right-3 bottom-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs touch-target-lg active:scale-95"
            style={{
              background: 'rgba(10,10,10,0.7)',
              backdropFilter: 'blur(8px)',
              color: '#F2EDE4',
              fontFamily: 'Poppins, sans-serif',
              border: '1px solid rgba(242,237,228,0.14)',
            }}
          >
            <Heart className="w-3.5 h-3.5" />
            Escolher santo de devoção
          </Link>
        )}
        {santoDevocao && (
          <Link
            href={`/santos/${santoDevocao.slug}`}
            className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] touch-target active:scale-95"
            style={{
              background: 'rgba(10,10,10,0.65)',
              backdropFilter: 'blur(8px)',
              color: '#F2EDE4',
              fontFamily: 'Poppins, sans-serif',
              border: '1px solid rgba(242,237,228,0.14)',
            }}
          >
            <Heart className="w-3 h-3" style={{ color: 'rgb(201,168,76)' }} />
            Devoto de <strong style={{ fontWeight: 600 }}>{santoDevocao.nome}</strong>
          </Link>
        )}
      </div>

      {/* Linha avatar + ações */}
      <div className="flex items-end justify-between gap-3 px-1 -mt-10 relative z-10">
        <label className="relative cursor-pointer group">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            disabled={uploadingAvatar}
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) void handleAvatar(f)
            }}
          />
          <div
            className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden flex items-center justify-center"
            style={{
              background: profile.profile_image_url ? 'transparent' : 'rgba(201,168,76,0.15)',
              border: '3px solid #0F0E0C',
              boxShadow: profile.verified
                ? '0 0 0 1.5px rgba(233,196,106,0.6), 0 4px 16px rgba(0,0,0,0.45)'
                : '0 4px 16px rgba(0,0,0,0.45)',
            }}
          >
            {uploadingAvatar ? (
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#C9A84C' }} />
            ) : profile.profile_image_url ? (
              <img
                src={profile.profile_image_url}
                alt={profile.name ?? 'Avatar'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif', fontSize: 28 }}>
                {(profile.name?.[0] || '✝').toUpperCase()}
              </span>
            )}
          </div>
          <span
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              background: '#C9A84C',
              color: '#0A0A0A',
              boxShadow: '0 2px 6px rgba(0,0,0,0.45)',
            }}
          >
            <Camera className="w-3.5 h-3.5" />
          </span>
        </label>

        <div className="flex items-center gap-2">
          {publicUrl && (
            <Link
              href={publicUrl}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs uppercase tracking-[0.12em] touch-target-lg"
              style={{
                background: 'transparent',
                border: '1px solid rgba(201,168,76,0.3)',
                color: '#8A8378',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <Share2 className="w-3.5 h-3.5" />
              Ver público
            </Link>
          )}
          <button
            type="button"
            onClick={onEditClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-[0.12em] touch-target-lg active:scale-95"
            style={{
              background: 'linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(201,168,76,0.08) 100%)',
              border: '1px solid rgba(201,168,76,0.4)',
              color: '#C9A84C',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar perfil
          </button>
        </div>
      </div>

      {error && (
        <div
          className="mt-3 rounded-xl p-3 text-sm"
          style={{
            background: 'rgba(107,29,42,0.12)',
            border: '1px solid rgba(217,79,92,0.35)',
            color: '#D94F5C',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {error}
        </div>
      )}

      {/* Nome, handle, badges */}
      <div className="mt-4 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1
            className="text-[22px] md:text-[26px] leading-tight"
            style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F2EDE4', fontWeight: 500 }}
          >
            {profile.name ?? 'Sem nome'}
          </h1>
          {profile.verified && (
            <span
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(102,187,106,0.12)',
                border: '1px solid rgba(102,187,106,0.25)',
                color: '#66BB6A',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <ShieldCheck className="w-2.5 h-2.5" />
              Verificado
            </span>
          )}
          <LevelBadge level={gami.level} size="sm" />
          {vocacaoMeta && (
            <span
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(201,168,76,0.1)',
                border: '1px solid rgba(201,168,76,0.15)',
                color: '#C9A84C',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <VocacaoIcon vocacao={profile.vocacao} size={10} />
              {vocacaoMeta.label}
            </span>
          )}
        </div>

        {(profile.public_handle || profile.user_number) && (
          <p
            className="text-[13px] mt-0.5"
            style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
          >
            {profile.public_handle
              ? `@${profile.public_handle}`
              : `#${profile.user_number}`}
          </p>
        )}

        {/* Gamificação: XP bar + relíquia equipada */}
        {!gami.loading && gami.totalXp > 0 && (
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <XpBar
                level={gami.level}
                xpInLevel={gami.xpInLevel}
                xpToNextLevel={gami.xpToNextLevel}
                percentInLevel={gami.percentInLevel}
                size="sm"
              />
            </div>
            {gami.equippedReliquia && (
              <EquippedReliquiaChip reliquia={gami.equippedReliquia} size="sm" showName />
            )}
          </div>
        )}

        {/* Bio */}
        {profile.bio_short && (
          <p
            className="mt-2 text-[14px] leading-relaxed whitespace-pre-line"
            style={{ color: '#E7DED1', fontFamily: 'Poppins, sans-serif' }}
          >
            {profile.bio_short}
          </p>
        )}

        {/* Meta: localização + paróquia */}
        {(location || profile.paroquia || profile.diocese) && (
          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[12px]"
            style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
          >
            {location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                {location}
              </span>
            )}
            {(profile.paroquia || profile.diocese) && (
              <span className="inline-flex items-center gap-1.5">
                <Church className="w-3.5 h-3.5" strokeWidth={1.5} />
                {profile.paroquia ?? profile.diocese}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div
            className="flex items-center gap-5 mt-4 text-[14px]"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <span>
              <strong style={{ color: '#F2EDE4' }}>{stats.veritas}</strong>
              <span style={{ color: '#8A8378' }}>{' '}Veritas</span>
            </span>
            <span>
              <strong style={{ color: '#F2EDE4' }}>{stats.following}</strong>
              <span style={{ color: '#8A8378' }}> seguindo</span>
            </span>
            <span>
              <strong style={{ color: '#F2EDE4' }}>{stats.followers}</strong>
              <span style={{ color: '#8A8378' }}>
                {' '}{stats.followers === 1 ? 'seguidor' : 'seguidores'}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
