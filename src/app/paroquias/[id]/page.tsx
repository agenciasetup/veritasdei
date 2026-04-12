'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { Paroquia, ParoquiaPost } from '@/types/paroquia'
import { TIPOS_IGREJA } from '@/types/paroquia'
import SeloVerificado from '@/components/paroquias/SeloVerificado'
import PostCard from '@/components/paroquias/PostCard'
import {
  ArrowLeft,
  MapPin,
  Church,
  Clock,
  Phone,
  Mail,
  Globe,
  AtSign,
  Navigation,
  Pencil,
  MessageSquarePlus,
  Shield,
  Info,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ParoquiaPublicPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const [paroquia, setParoquia] = useState<Paroquia | null>(null)
  const [posts, setPosts] = useState<ParoquiaPost[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activePhoto, setActivePhoto] = useState(0)

  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    async function load() {
      const { data, error } = await supabase!
        .from('paroquias')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (cancelled) return
      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setParoquia(data as Paroquia)

      const { data: postsData } = await supabase!
        .from('paroquia_posts')
        .select('*')
        .eq('paroquia_id', id)
        .order('published_at', { ascending: false })
        .limit(10)
      if (!cancelled) {
        setPosts((postsData as ParoquiaPost[]) ?? [])
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }}
        />
      </div>
    )
  }

  if (notFound || !paroquia) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <Church className="w-12 h-12 mb-4" style={{ color: '#7A7368', opacity: 0.5 }} />
        <h1 className="text-lg mb-2" style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
          Igreja não encontrada
        </h1>
        <Link
          href="/paroquias"
          className="text-sm mt-2 underline"
          style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
        >
          Voltar para a lista
        </Link>
      </div>
    )
  }

  const tipoLabel = TIPOS_IGREJA.find(t => t.value === paroquia.tipo_igreja)?.label
  const isOwner =
    !!user?.id &&
    (user.id === paroquia.owner_user_id || user.id === paroquia.criado_por)

  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.debug('[paroquia]', {
      userId: user?.id ?? null,
      ownerUserId: paroquia.owner_user_id,
      criadoPor: paroquia.criado_por,
      isOwner,
    })
  }
  const photos = paroquia.fotos && paroquia.fotos.length > 0
    ? paroquia.fotos
    : paroquia.foto_url
      ? [{ url: paroquia.foto_url, label: '' }]
      : []
  const heroPhoto = photos[activePhoto] ?? photos[0]

  const enderecoLinha = [paroquia.rua, paroquia.numero, paroquia.bairro]
    .filter(Boolean)
    .join(', ')
  const mapsHref =
    paroquia.latitude && paroquia.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${paroquia.latitude},${paroquia.longitude}`
      : paroquia.endereco || enderecoLinha
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${paroquia.nome} ${enderecoLinha} ${paroquia.cidade} ${paroquia.estado}`,
          )}`
        : null

  const instagramUrl = paroquia.instagram
    ? paroquia.instagram.startsWith('http')
      ? paroquia.instagram
      : `https://instagram.com/${paroquia.instagram.replace(/^@/, '')}`
    : null
  const facebookUrl = paroquia.facebook
    ? paroquia.facebook.startsWith('http')
      ? paroquia.facebook
      : `https://facebook.com/${paroquia.facebook.replace(/^@/, '')}`
    : null
  const siteUrl = paroquia.site
    ? paroquia.site.startsWith('http')
      ? paroquia.site
      : `https://${paroquia.site}`
    : null

  return (
    <div className="min-h-screen px-4 md:px-8 py-6 relative">
      <div className="bg-glow" />

      <div className="max-w-4xl mx-auto relative z-10">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm mb-6 transition-colors hover:opacity-80"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif', background: 'none', border: 'none' }}
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        {/* Hero photo + thumbnails */}
        {heroPhoto && (
          <div className="mb-6">
            <div
              className="w-full rounded-2xl overflow-hidden"
              style={{ aspectRatio: '16 / 9', background: 'rgba(10,10,10,0.6)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroPhoto.url}
                alt={heroPhoto.label || paroquia.nome}
                className="w-full h-full object-cover"
              />
            </div>
            {photos.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {photos.map((p, i) => (
                  <button
                    key={`${p.url}-${i}`}
                    type="button"
                    onClick={() => setActivePhoto(i)}
                    className="flex-shrink-0 rounded-lg overflow-hidden"
                    style={{
                      width: 84,
                      height: 56,
                      border: i === activePhoto ? '2px solid #C9A84C' : '2px solid rgba(201,168,76,0.12)',
                      background: 'none',
                      padding: 0,
                      cursor: 'pointer',
                    }}
                    aria-label={p.label || `Foto ${i + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={p.label || ''} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {heroPhoto.label && (
              <p className="text-xs mt-2" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                {heroPhoto.label}
              </p>
            )}
          </div>
        )}

        {/* Header: name + selo + tipo */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1
              className="text-2xl md:text-3xl font-bold tracking-wider uppercase"
              style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
            >
              {paroquia.nome}
            </h1>
            {paroquia.verificado && <SeloVerificado size="md" />}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
            {tipoLabel && (
              <span
                className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)', color: '#C9A84C' }}
              >
                {tipoLabel}
              </span>
            )}
            {paroquia.diocese && <span>{paroquia.diocese}</span>}
            {paroquia.padre_responsavel && (
              <>
                <span>•</span>
                <span>Pe. {paroquia.padre_responsavel}</span>
              </>
            )}
          </div>
        </div>

        {/* Owner actions */}
        {isOwner && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Link
              href={`/paroquias/${paroquia.id}/editar`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs tracking-wider uppercase"
              style={{
                fontFamily: 'Cinzel, serif',
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid rgba(201,168,76,0.15)',
                color: '#C9A84C',
              }}
            >
              <Pencil className="w-3.5 h-3.5" /> Editar
            </Link>
            {paroquia.verificado ? (
              <Link
                href={`/paroquias/${paroquia.id}/publicar`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs tracking-wider uppercase"
                style={{
                  fontFamily: 'Cinzel, serif',
                  background: 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
                  color: '#0A0A0A',
                }}
              >
                <MessageSquarePlus className="w-3.5 h-3.5" /> Publicar aviso
              </Link>
            ) : (
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  background: 'rgba(201,168,76,0.04)',
                  border: '1px dashed rgba(201,168,76,0.2)',
                  color: '#7A7368',
                }}
              >
                <Shield className="w-3.5 h-3.5" />
                {paroquia.verificacao_solicitada_em
                  ? 'Verificação em análise'
                  : 'Publicação liberada após verificação'}
              </span>
            )}
          </div>
        )}

        {/* Endereço */}
        <Card>
          <SectionHead icon={MapPin} label="Endereço" />
          <div className="space-y-1 text-sm" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
            {enderecoLinha && <p>{enderecoLinha}</p>}
            <p>{paroquia.cidade}, {paroquia.estado}{paroquia.cep ? ` • ${paroquia.cep}` : ''}</p>
            {paroquia.complemento && (
              <p className="text-xs" style={{ color: '#7A7368' }}>{paroquia.complemento}</p>
            )}
          </div>
          {mapsHref && (
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs tracking-wider uppercase"
              style={{
                fontFamily: 'Cinzel, serif',
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid rgba(201,168,76,0.15)',
                color: '#C9A84C',
              }}
            >
              <Navigation className="w-3.5 h-3.5" /> Como chegar
            </a>
          )}
        </Card>

        {/* Horários de Missa */}
        {paroquia.horarios_missa && paroquia.horarios_missa.length > 0 && (
          <Card>
            <SectionHead icon={Clock} label="Horários de Missa" />
            <div className="flex flex-wrap gap-2">
              {paroquia.horarios_missa.map((h, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1.5 rounded-full"
                  style={{
                    background: 'rgba(201,168,76,0.08)',
                    border: '1px solid rgba(201,168,76,0.15)',
                    color: '#C9A84C',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  {h.dia} • {h.horario}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Horários de Confissão */}
        {paroquia.horarios_confissao && paroquia.horarios_confissao.length > 0 && (
          <Card>
            <SectionHead icon={Clock} label="Horários de Confissão" />
            <div className="flex flex-wrap gap-2">
              {paroquia.horarios_confissao.map((h, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1.5 rounded-full"
                  style={{
                    background: 'rgba(107,29,42,0.12)',
                    border: '1px solid rgba(107,29,42,0.3)',
                    color: '#D94F5C',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  {h.dia} • {h.horario}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Contatos */}
        {(paroquia.telefone || paroquia.email || instagramUrl || facebookUrl || siteUrl) && (
          <Card>
            <SectionHead icon={Phone} label="Contatos e Redes" />
            <div className="flex flex-col gap-2 text-sm" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
              {paroquia.telefone && (
                <ContactLine icon={Phone} label={paroquia.telefone} href={`tel:${paroquia.telefone}`} />
              )}
              {paroquia.email && (
                <ContactLine icon={Mail} label={paroquia.email} href={`mailto:${paroquia.email}`} />
              )}
              {instagramUrl && (
                <ContactLine icon={AtSign} label={paroquia.instagram ?? ''} href={instagramUrl} external />
              )}
              {facebookUrl && (
                <ContactLine icon={AtSign} label={paroquia.facebook ?? ''} href={facebookUrl} external />
              )}
              {siteUrl && (
                <ContactLine icon={Globe} label={paroquia.site ?? ''} href={siteUrl} external />
              )}
            </div>
          </Card>
        )}

        {/* Info extra */}
        {paroquia.informacoes_extras && (
          <Card>
            <SectionHead icon={Info} label="Informações" />
            <p
              className="text-sm whitespace-pre-wrap"
              style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif', lineHeight: 1.6 }}
            >
              {paroquia.informacoes_extras}
            </p>
          </Card>
        )}

        {/* Feed */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-sm tracking-wider uppercase"
              style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
            >
              Últimos avisos
            </h2>
            {paroquia.verificado && (
              <span className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                {posts.length} {posts.length === 1 ? 'publicação' : 'publicações'}
              </span>
            )}
          </div>

          {!paroquia.verificado ? (
            <div
              className="rounded-2xl p-6 text-center"
              style={{
                background: 'rgba(16,16,16,0.6)',
                border: '1px dashed rgba(201,168,76,0.15)',
              }}
            >
              <Shield className="w-8 h-8 mx-auto mb-3" style={{ color: '#C9A84C', opacity: 0.6 }} />
              <p className="text-sm" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                Esta igreja ainda não foi verificada. O feed de avisos é liberado após a
                validação do documento pelo time Veritas Dei.
              </p>
            </div>
          ) : posts.length === 0 ? (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: 'rgba(16,16,16,0.6)', border: '1px solid rgba(201,168,76,0.1)' }}
            >
              <p className="text-sm" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                Nenhum aviso publicado ainda.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
    >
      {children}
    </div>
  )
}

function SectionHead({
  icon: Icon,
  label,
}: {
  icon: React.ElementType
  label: string
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4" style={{ color: '#C9A84C' }} />
      <h3
        className="text-xs tracking-wider uppercase"
        style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
      >
        {label}
      </h3>
    </div>
  )
}

function ContactLine({
  icon: Icon,
  label,
  href,
  external,
}: {
  icon: React.ElementType
  label: string
  href: string
  external?: boolean
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      style={{ color: '#B8AFA2' }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: '#C9A84C' }} />
      <span className="truncate">{label}</span>
    </a>
  )
}
