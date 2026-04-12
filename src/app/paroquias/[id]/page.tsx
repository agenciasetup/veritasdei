'use client'

import { use, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { Paroquia, ParoquiaPost } from '@/types/paroquia'
import { TIPOS_IGREJA } from '@/types/paroquia'
import SeloVerificado from '@/components/paroquias/SeloVerificado'
import PostCard from '@/components/paroquias/PostCard'
import HistoriaBlocksView from '@/components/paroquias/HistoriaBlocksView'
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
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  Crown,
  Lightbulb,
  Newspaper,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

type TabKey = 'sobre' | 'historia' | 'santo' | 'curiosidades' | 'uteis' | 'feed'

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'sobre', label: 'Sobre', icon: Info },
  { key: 'historia', label: 'História', icon: BookOpen },
  { key: 'santo', label: 'Santo', icon: Crown },
  { key: 'curiosidades', label: 'Curiosidades', icon: Sparkles },
  { key: 'uteis', label: 'Informações', icon: Lightbulb },
  { key: 'feed', label: 'Feed', icon: Newspaper },
]

export default function ParoquiaPublicPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const [paroquia, setParoquia] = useState<Paroquia | null>(null)
  const [posts, setPosts] = useState<ParoquiaPost[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('sobre')
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
        .limit(20)
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

  const photos = useMemo(() => {
    if (!paroquia) return []
    if (paroquia.fotos && paroquia.fotos.length > 0) return paroquia.fotos
    if (paroquia.foto_url) return [{ url: paroquia.foto_url, label: '' }]
    return []
  }, [paroquia])

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

  const coverUrl = paroquia.foto_capa_url || paroquia.foto_url || photos[0]?.url || null
  const profileUrl = paroquia.foto_perfil_url || paroquia.foto_url || null

  const hasHistoria = paroquia.historia_blocks && paroquia.historia_blocks.length > 0
  const hasSanto = !!(paroquia.santo_nome || paroquia.santo_descricao || paroquia.santo_imagem_url)
  const hasCuriosidades = paroquia.curiosidades && paroquia.curiosidades.length > 0
  const hasUteis = paroquia.informacoes_uteis && paroquia.informacoes_uteis.length > 0

  return (
    <div className="min-h-screen relative pb-10">
      <div className="bg-glow" />

      {/* Cover */}
      <div className="relative z-10">
        <div
          className="w-full relative"
          style={{
            height: 'clamp(200px, 38vw, 380px)',
            background: coverUrl
              ? `linear-gradient(180deg, rgba(10,10,10,0.2) 0%, rgba(10,10,10,0.85) 100%), url(${coverUrl}) center/cover`
              : 'linear-gradient(180deg, rgba(107,29,42,0.25) 0%, rgba(10,10,10,0.9) 100%)',
          }}
        >
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
            style={{
              background: 'rgba(10,10,10,0.6)',
              color: '#F2EDE4',
              fontFamily: 'Poppins, sans-serif',
              border: '1px solid rgba(201,168,76,0.2)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </button>
        </div>

        {/* Header overlay */}
        <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-20 md:-mt-24 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Profile photo */}
            <div
              className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden flex-shrink-0"
              style={{
                background: 'rgba(10,10,10,0.8)',
                border: '3px solid #C9A84C',
                boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
              }}
            >
              {profileUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileUrl} alt={paroquia.nome} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Church className="w-10 h-10" style={{ color: '#C9A84C' }} />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1
                  className="text-2xl md:text-3xl font-bold tracking-wider uppercase"
                  style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                >
                  {paroquia.nome}
                </h1>
                {paroquia.verificado && <SeloVerificado size="md" />}
              </div>
              <div
                className="flex flex-wrap items-center gap-2 text-sm"
                style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}
              >
                {tipoLabel && (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs"
                    style={{
                      background: 'rgba(201,168,76,0.1)',
                      border: '1px solid rgba(201,168,76,0.2)',
                      color: '#C9A84C',
                    }}
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
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div className="flex flex-wrap items-center gap-2 mt-5">
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
                <Pencil className="w-3.5 h-3.5" /> Editar perfil
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
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 mt-8 relative z-10">
        {/* Quick info strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <QuickCard
            icon={MapPin}
            label="Endereço"
            value={`${paroquia.cidade}, ${paroquia.estado}`}
            href={mapsHref ?? undefined}
          />
          {paroquia.telefone && (
            <QuickCard icon={Phone} label="Telefone" value={paroquia.telefone} href={`tel:${paroquia.telefone}`} />
          )}
          {paroquia.horarios_missa && paroquia.horarios_missa.length > 0 && (
            <QuickCard
              icon={Clock}
              label="Próxima missa"
              value={paroquia.horarios_missa.slice(0, 1).map(h => `${h.dia} ${h.horario}`).join(', ')}
            />
          )}
        </div>

        {/* Carousel */}
        {photos.length > 0 && (
          <div className="mb-8">
            <div
              className="relative w-full rounded-2xl overflow-hidden"
              style={{
                aspectRatio: '16 / 9',
                background: 'rgba(10,10,10,0.6)',
                border: '1px solid rgba(201,168,76,0.12)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos[activePhoto]?.url}
                alt={photos[activePhoto]?.label || paroquia.nome}
                className="w-full h-full object-cover"
              />
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActivePhoto((activePhoto - 1 + photos.length) % photos.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(10,10,10,0.75)',
                      border: '1px solid rgba(201,168,76,0.3)',
                      color: '#C9A84C',
                    }}
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePhoto((activePhoto + 1) % photos.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(10,10,10,0.75)',
                      border: '1px solid rgba(201,168,76,0.3)',
                      color: '#C9A84C',
                    }}
                    aria-label="Próxima foto"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActivePhoto(i)}
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: i === activePhoto ? '#C9A84C' : 'rgba(242,237,228,0.4)',
                          border: 'none',
                        }}
                        aria-label={`Foto ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
              {photos[activePhoto]?.label && (
                <div
                  className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs"
                  style={{
                    background: 'rgba(10,10,10,0.75)',
                    color: '#F2EDE4',
                    fontFamily: 'Poppins, sans-serif',
                    border: '1px solid rgba(201,168,76,0.2)',
                  }}
                >
                  {photos[activePhoto].label}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-2xl mb-6 overflow-x-auto"
          style={{
            background: 'rgba(10,10,10,0.6)',
            border: '1px solid rgba(201,168,76,0.1)',
          }}
        >
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className="inline-flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-xs tracking-wider uppercase whitespace-nowrap transition-all"
                style={{
                  fontFamily: 'Cinzel, serif',
                  background: active ? 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)' : 'transparent',
                  color: active ? '#0A0A0A' : '#7A7368',
                  border: 'none',
                  fontWeight: active ? 600 : 400,
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'sobre' && (
          <div className="space-y-4">
            <Card>
              <SectionHead icon={MapPin} label="Endereço completo" />
              <div className="space-y-1 text-sm" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
                {enderecoLinha && <p>{enderecoLinha}</p>}
                <p>
                  {paroquia.cidade}, {paroquia.estado}
                  {paroquia.cep ? ` • ${paroquia.cep}` : ''}
                </p>
                {paroquia.complemento && (
                  <p className="text-xs" style={{ color: '#7A7368' }}>
                    {paroquia.complemento}
                  </p>
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
          </div>
        )}

        {activeTab === 'historia' && (
          <div
            className="rounded-2xl p-6 md:p-8"
            style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
          >
            {hasHistoria ? (
              <HistoriaBlocksView blocks={paroquia.historia_blocks} />
            ) : (
              <EmptyTab message="Esta igreja ainda não contou sua história." />
            )}
          </div>
        )}

        {activeTab === 'santo' && (
          <div
            className="rounded-2xl p-6 md:p-8"
            style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
          >
            {hasSanto ? (
              <div className="flex flex-col md:flex-row gap-6">
                {paroquia.santo_imagem_url && (
                  <div
                    className="w-full md:w-56 flex-shrink-0 rounded-2xl overflow-hidden"
                    style={{
                      aspectRatio: '3 / 4',
                      background: 'rgba(10,10,10,0.6)',
                      border: '1px solid rgba(201,168,76,0.15)',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={paroquia.santo_imagem_url}
                      alt={paroquia.santo_nome ?? 'Santo padroeiro'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  {paroquia.santo_nome && (
                    <h3
                      className="text-2xl md:text-3xl mb-2"
                      style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
                    >
                      {paroquia.santo_nome}
                    </h3>
                  )}
                  {paroquia.santo_data_festa && (
                    <p
                      className="text-xs tracking-wider uppercase mb-4"
                      style={{ color: '#7A7368', fontFamily: 'Cinzel, serif' }}
                    >
                      Festa • {paroquia.santo_data_festa}
                    </p>
                  )}
                  {paroquia.santo_descricao && (
                    <p
                      className="whitespace-pre-wrap"
                      style={{
                        color: '#C9BFA8',
                        fontFamily: 'Cormorant Garamond, serif',
                        fontSize: '1.05rem',
                        lineHeight: 1.75,
                      }}
                    >
                      {paroquia.santo_descricao}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <EmptyTab message="Sem informações sobre o santo padroeiro." />
            )}
          </div>
        )}

        {activeTab === 'curiosidades' && (
          <div>
            {hasCuriosidades ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paroquia.curiosidades.map(item => (
                  <div
                    key={item.id}
                    className="rounded-2xl p-5"
                    style={{
                      background: 'rgba(16,16,16,0.7)',
                      border: '1px solid rgba(201,168,76,0.1)',
                    }}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: 'rgba(201,168,76,0.1)',
                          border: '1px solid rgba(201,168,76,0.2)',
                        }}
                      >
                        <Sparkles className="w-4 h-4" style={{ color: '#C9A84C' }} />
                      </div>
                      <h4
                        className="text-base font-bold"
                        style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                      >
                        {item.titulo}
                      </h4>
                    </div>
                    <p
                      className="text-sm whitespace-pre-wrap"
                      style={{
                        color: '#B8AFA2',
                        fontFamily: 'Cormorant Garamond, serif',
                        lineHeight: 1.6,
                        fontSize: '1rem',
                      }}
                    >
                      {item.descricao}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="rounded-2xl p-8"
                style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
              >
                <EmptyTab message="Nenhuma curiosidade publicada ainda." />
              </div>
            )}
          </div>
        )}

        {activeTab === 'uteis' && (
          <div>
            {hasUteis ? (
              <div className="space-y-3">
                {paroquia.informacoes_uteis.map(item => (
                  <div
                    key={item.id}
                    className="rounded-2xl p-5"
                    style={{
                      background: 'rgba(16,16,16,0.7)',
                      border: '1px solid rgba(201,168,76,0.1)',
                    }}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <Lightbulb className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: '#C9A84C' }} />
                      <h4
                        className="text-base font-bold"
                        style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                      >
                        {item.titulo}
                      </h4>
                    </div>
                    <p
                      className="text-sm whitespace-pre-wrap mb-2"
                      style={{
                        color: '#B8AFA2',
                        fontFamily: 'Poppins, sans-serif',
                        lineHeight: 1.6,
                      }}
                    >
                      {item.conteudo}
                    </p>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs"
                        style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
                      >
                        <Globe className="w-3 h-3" /> {item.link}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="rounded-2xl p-8"
                style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
              >
                <EmptyTab message="Sem informações úteis cadastradas." />
              </div>
            )}
          </div>
        )}

        {activeTab === 'feed' && (
          <div>
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
                className="rounded-2xl p-8 text-center"
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
                className="rounded-2xl p-8 text-center"
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
        )}
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
    >
      {children}
    </div>
  )
}

function QuickCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType
  label: string
  value: string
  href?: string
}) {
  const content = (
    <div
      className="rounded-2xl p-4 h-full transition-all"
      style={{
        background: 'rgba(16,16,16,0.7)',
        border: '1px solid rgba(201,168,76,0.1)',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
        <span
          className="text-[10px] tracking-wider uppercase"
          style={{ color: '#7A7368', fontFamily: 'Cinzel, serif' }}
        >
          {label}
        </span>
      </div>
      <p className="text-sm" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
        {value}
      </p>
    </div>
  )
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block hover:opacity-90">
        {content}
      </a>
    )
  }
  return content
}

function SectionHead({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4" style={{ color: '#C9A84C' }} />
      <h3 className="text-xs tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>
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

function EmptyTab({ message }: { message: string }) {
  return (
    <p
      className="text-sm italic text-center py-8"
      style={{ color: '#7A7368', fontFamily: 'Cormorant Garamond, serif' }}
    >
      {message}
    </p>
  )
}
