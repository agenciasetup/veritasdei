'use client'

import { useEffect, useMemo, useState, type ElementType } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  CalendarHeart,
  ChevronRight,
  Church,
  ClipboardCheck,
  Compass,
  Cross,
  HeartHandshake,
  Loader2,
  MapPin,
  Navigation,
  Search,
  Sparkles,
  UserPlus,
} from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { sanitizeIlike } from '@/lib/utils/sanitize'
import type { Paroquia, ParoquiaNearby } from '@/types/paroquia'
import { useGeolocation } from '@/hooks/useGeolocation'
import { formatDistance } from '@/lib/utils/geo'
import CityAutocomplete from '@/components/CityAutocomplete'
import { getLiturgicalDay } from '@/lib/liturgical-calendar'

interface Stats {
  catolicos: number
  convertidos: number
  igrejas: number
}

interface DevotionSection {
  key: string
  eyebrow: string
  title: string
  description: string
  href: string
  icon: ElementType
  bullets: string[]
}

const SEARCH_SELECT = 'id, nome, diocese, cidade, estado, verificado, status'

const DEVOTION_SECTIONS: DevotionSection[] = [
  {
    key: 'liturgia',
    eyebrow: 'Liturgia do Dia',
    title: 'Leia a liturgia diária com clareza e reverência',
    description:
      'Acompanhe as leituras e o calendário litúrgico sem se perder. Uma experiência pensada para quem quer fidelidade e simplicidade.',
    href: '/liturgia/hoje',
    icon: CalendarHeart,
    bullets: ['Leituras do dia organizadas', 'Calendário litúrgico visível', 'Acesso rápido após login'],
  },
  {
    key: 'oracoes',
    eyebrow: 'Orações',
    title: 'Tenha as orações essenciais sempre à mão',
    description:
      'Pai-Nosso, Ave-Maria, Credo e outras orações em uma navegação simples, sem distrações e com ótima leitura no celular.',
    href: '/oracoes',
    icon: BookOpen,
    bullets: ['Orações clássicas reunidas', 'Leitura confortável para leigos', 'Fluxo direto para rezar'],
  },
  {
    key: 'terco',
    eyebrow: 'Santo Terço',
    title: 'Reze o Santo Terço com guia passo a passo',
    description:
      'Mistérios do dia, estrutura clara e ritmo devocional para ajudar quem está retomando a vida de oração.',
    href: '/rosario',
    icon: Cross,
    bullets: ['Mistérios organizados por dia', 'Passo a passo para não se perder', 'Experiência imersiva e contemplativa'],
  },
  {
    key: 'exame',
    eyebrow: 'Exame de Consciência',
    title: 'Prepare uma boa confissão com profundidade',
    description:
      'Um exame de consciência claro e acessível para apoiar quem deseja voltar aos sacramentos com segurança espiritual.',
    href: '/exame-consciencia',
    icon: ClipboardCheck,
    bullets: ['Roteiro objetivo e pastoral', 'Linguagem acessível', 'Foco na prática sacramental'],
  },
]

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const geo = useGeolocation()

  const [stats, setStats] = useState<Stats>({ catolicos: 0, convertidos: 0, igrejas: 0 })
  const [searchCity, setSearchCity] = useState('')
  const [searchResults, setSearchResults] = useState<Paroquia[]>([])
  const [nearbyResults, setNearbyResults] = useState<Paroquia[]>([])
  const [geoResults, setGeoResults] = useState<ParoquiaNearby[]>([])
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)

  const liturgical = useMemo(() => getLiturgicalDay(new Date()), [])
  const hoje = useMemo(
    () =>
      new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      }),
    [],
  )

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return

    supabase
      .rpc('get_landing_stats')
      .then((res: { data: Stats[] | null; error: unknown }) => {
        if (res.error || !res.data || res.data.length === 0) return
        const row = res.data[0]
        setStats({
          catolicos: Number(row.catolicos) || 0,
          convertidos: Number(row.convertidos) || 0,
          igrejas: Number(row.igrejas) || 0,
        })
      })
      .catch(() => {
        // Stats são opcionais para a landing.
      })
  }, [])

  const handleSearch = async () => {
    const supabase = createClient()
    if (!supabase || !searchCity.trim()) return

    setSearching(true)
    setSearched(true)
    setGeoResults([])

    const termo = searchCity.trim()

    const { data } = await supabase
      .from('paroquias')
      .select(SEARCH_SELECT)
      .eq('status', 'aprovada')
      .ilike('cidade', `%${sanitizeIlike(termo)}%`)
      .order('verificado', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(8)

    const exact = (data as Paroquia[]) ?? []
    setSearchResults(exact)

    if (exact.length > 0) {
      const uf = exact[0].estado
      const cidadesDigitadas = new Set(exact.map(p => p.cidade.toLowerCase()))
      const { data: nearby } = await supabase
        .from('paroquias')
        .select(SEARCH_SELECT)
        .eq('status', 'aprovada')
        .eq('estado', uf)
        .order('verificado', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20)

      const filtered = ((nearby as Paroquia[]) ?? [])
        .filter(p => !cidadesDigitadas.has(p.cidade.toLowerCase()))
        .slice(0, 8)
      setNearbyResults(filtered)
    } else {
      setNearbyResults([])
    }

    setSearching(false)
  }

  useEffect(() => {
    if (geo.status !== 'granted' || !geo.coords) return

    const supabase = createClient()
    if (!supabase) return

    let cancelled = false
    setSearching(true)
    setSearched(true)
    setSearchResults([])
    setNearbyResults([])

    supabase
      .rpc('paroquias_nearby', {
        p_lat: geo.coords.latitude,
        p_lng: geo.coords.longitude,
        p_radius_km: 60,
        p_limit: 12,
      })
      .then((res: { data: ParoquiaNearby[] | null; error: unknown }) => {
        if (cancelled) return
        setGeoResults(res.data ?? [])
        if (geo.coords?.cidade && !searchCity) {
          setSearchCity(geo.coords.cidade)
        }
        setSearching(false)
      })
      .catch(() => {
        if (!cancelled) setSearching(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.status, geo.coords?.latitude, geo.coords?.longitude])

  const jumpToChurchFinder = () => {
    document.getElementById('church-finder')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (geo.status === 'idle') geo.request()
  }

  if (isAuthenticated) return null

  return (
    <main className="relative overflow-x-hidden pb-28 md:pb-0">
      <section
        className="relative min-h-[100svh] md:min-h-screen border-b"
        style={{
          borderColor: 'rgba(201,168,76,0.2)',
          background:
            'radial-gradient(120% 100% at 10% 8%, rgba(107,29,42,0.5) 0%, rgba(15,14,12,0.9) 48%, #0F0E0C 100%)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background:
            'radial-gradient(80% 60% at 80% 20%, rgba(201,168,76,0.12) 0%, transparent 80%), linear-gradient(to bottom, rgba(0,0,0,0.18), rgba(0,0,0,0.65))',
        }} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.13,
            backgroundImage:
              'repeating-linear-gradient(135deg, rgba(242,237,228,0.22) 0px, rgba(242,237,228,0.22) 1px, transparent 1px, transparent 8px)',
            maskImage: 'radial-gradient(circle at center, black 45%, transparent 95%)',
          }}
        />

        <div className="relative z-10 min-h-[100svh] md:min-h-screen px-5 md:px-10 lg:px-16 flex items-center">
          <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-end">
            <div className="pb-4 md:pb-8">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-6"
                style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)' }}
              >
                <Sparkles className="w-3.5 h-3.5" style={{ color: '#D9C077' }} />
                <span className="text-[11px] capitalize" style={{ color: '#E6D9B5', fontFamily: 'Poppins, sans-serif' }}>
                  {hoje}
                </span>
                <span style={{ color: 'rgba(230,217,181,0.55)' }}>·</span>
                <span className="text-[11px]" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
                  Liturgia de hoje: {liturgical.name}
                </span>
              </div>

              <h1
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.05] tracking-[0.03em] mb-5"
                style={{ fontFamily: 'Cinzel, serif', color: '#F5EFE6', textWrap: 'balance' }}
              >
                Um caminho de fé
                <br />
                belo, claro e vivo.
              </h1>

              <p className="text-base md:text-lg max-w-2xl mb-8" style={{ color: '#CEC3B3', fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.6 }}>
                Veritas Dei reúne liturgia, oração e vida sacramental em uma experiência elegante, acolhedora e fácil para qualquer católico leigo.
              </p>

              <div className="flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center">
                <button
                  onClick={jumpToChurchFinder}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    background: 'linear-gradient(135deg, #E0C98A 0%, #C9A84C 52%, #A88332 100%)',
                    color: '#1C140C',
                    fontFamily: 'Cinzel, serif',
                    boxShadow: '0 14px 34px rgba(201,168,76,0.3)',
                  }}
                >
                  <Compass className="w-4 h-4" />
                  Encontrar uma igreja
                  <ChevronRight className="w-4 h-4" />
                </button>

                <Link
                  href="/login?tab=registro"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm uppercase tracking-[0.12em] focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    background: 'rgba(242,237,228,0.08)',
                    color: '#F2EDE4',
                    border: '1px solid rgba(242,237,228,0.25)',
                    fontFamily: 'Cinzel, serif',
                  }}
                >
                  Criar conta
                </Link>
              </div>

              <div className="mt-4 flex items-center gap-3 text-xs" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <Link href="/login?tab=login" className="underline" style={{ color: '#D9C077' }}>
                  Já tenho conta
                </Link>
                <span style={{ color: '#8C8274' }}>·</span>
                <span style={{ color: '#B8AFA2' }}>Sem spam. Em menos de 1 minuto.</span>
              </div>
            </div>

            <div
              className="rounded-[28px] p-5 md:p-6"
              style={{
                background: 'linear-gradient(160deg, rgba(20,17,13,0.88), rgba(11,10,8,0.92))',
                border: '1px solid rgba(201,168,76,0.22)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
              }}
            >
              <h2 className="text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}>
                Sinais de comunhão
              </h2>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <HeroStat icon={Church} value={stats.igrejas} label="Igrejas" />
                <HeroStat icon={HeartHandshake} value={stats.convertidos} label="Convertidos" />
                <HeroStat icon={UserPlus} value={stats.catolicos} label="Fiéis" />
              </div>

              <h3 className="text-xs uppercase tracking-[0.18em] mb-2" style={{ color: '#D9C077', fontFamily: 'Cinzel, serif' }}>
                Igrejas próximas agora
              </h3>

              {searching && (
                <p className="text-xs inline-flex items-center gap-2" style={{ color: '#D9C077', fontFamily: 'Poppins, sans-serif' }}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Procurando por você...
                </p>
              )}

              {!searching && geoResults.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {geoResults.slice(0, 6).map(p => (
                    <ChurchChip
                      key={p.id}
                      href={`/paroquias/${p.id}`}
                      label={p.nome}
                      meta={formatDistance(p.distancia_km)}
                    />
                  ))}
                </div>
              )}

              {!searching && geoResults.length === 0 && (
                <p className="text-xs" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
                  Ative sua localização para ver “Nome da Igreja [x km]”.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        id="church-finder"
        className="relative py-16 md:py-20 border-b"
        style={{
          borderColor: 'rgba(84,42,31,0.22)',
          background:
            'linear-gradient(180deg, #F3EEE5 0%, #EEE5D8 58%, #E8DECF 100%)',
        }}
      >
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <p
            className="inline-flex items-center rounded-full px-3 py-1 mb-4 text-[11px] uppercase tracking-[0.16em]"
            style={{ background: 'rgba(90,22,37,0.08)', color: '#5A1625', border: '1px solid rgba(90,22,37,0.2)', fontFamily: 'Cinzel, serif' }}
          >
            Encontre uma Igreja
          </p>

          <h2 className="text-3xl md:text-4xl mb-3" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#2E211A' }}>
            Localização automática com fallback inteligente por cidade
          </h2>
          <p className="text-base mb-8" style={{ color: '#6D5D4F', fontFamily: 'Poppins, sans-serif' }}>
            Quando a geolocalização não estiver disponível, você continua normalmente digitando sua cidade.
          </p>

          <div
            className="rounded-3xl p-5 md:p-6"
            style={{
              background: 'linear-gradient(180deg, rgba(28,22,17,0.96) 0%, rgba(15,14,12,0.98) 100%)',
              border: '1px solid rgba(201,168,76,0.2)',
              boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
            }}
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => geo.request()}
                disabled={geo.status === 'prompting' || geo.status === 'loading'}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: geo.status === 'granted' ? 'rgba(76,175,80,0.12)' : 'rgba(201,168,76,0.1)',
                  border: `1px solid ${geo.status === 'granted' ? 'rgba(76,175,80,0.28)' : 'rgba(201,168,76,0.26)'}`,
                  color: geo.status === 'granted' ? '#76D37B' : '#D9C077',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {geo.status === 'prompting' || geo.status === 'loading' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
                {geo.status === 'granted' && geo.coords?.label
                  ? `Você está em ${geo.coords.label}`
                  : 'Usar minha localização'}
              </button>

              {geo.status === 'granted' && (
                <button
                  onClick={() => {
                    geo.clear()
                    setGeoResults([])
                    setSearched(false)
                  }}
                  className="text-xs underline"
                  style={{ color: '#A99F90', fontFamily: 'Poppins, sans-serif', background: 'none', border: 'none' }}
                >
                  limpar
                </button>
              )}
            </div>

            {geo.error && (
              <p className="text-xs mb-3" style={{ color: '#D94F5C', fontFamily: 'Poppins, sans-serif' }}>
                {geo.error}
              </p>
            )}

            <div className="flex gap-2">
              <div className="flex-1">
                <CityAutocomplete
                  value={searchCity}
                  onChange={setSearchCity}
                  onSelect={city => {
                    setSearchCity(city.cidade)
                    setTimeout(() => handleSearch(), 0)
                  }}
                  placeholder="Digite sua cidade..."
                  biasLatitude={geo.coords?.latitude ?? null}
                  biasLongitude={geo.coords?.longitude ?? null}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching || !searchCity.trim()}
                className="px-4 rounded-xl flex items-center justify-center focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: 'linear-gradient(135deg, #E0C98A 0%, #C9A84C 52%, #A88332 100%)',
                  color: '#1C140C',
                  opacity: !searchCity.trim() ? 0.5 : 1,
                }}
                aria-label="Buscar igreja"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </div>

            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-[0.16em] mb-2" style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}>
                Resultado rápido
              </p>

              {searching && (
                <p className="text-xs" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
                  Buscando igrejas...
                </p>
              )}

              {!searching && geoResults.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {geoResults.map(p => (
                    <ChurchChip
                      key={p.id}
                      href={`/paroquias/${p.id}`}
                      label={p.nome}
                      meta={formatDistance(p.distancia_km)}
                    />
                  ))}
                </div>
              )}

              {!searching && searched && geoResults.length === 0 && (
                <div className="space-y-3">
                  {searchResults.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {searchResults.map(p => (
                        <ChurchChip
                          key={p.id}
                          href={`/paroquias/${p.id}`}
                          label={p.nome}
                          meta={`${p.cidade}-${p.estado}`}
                        />
                      ))}
                    </div>
                  )}

                  {nearbyResults.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {nearbyResults.map(p => (
                        <ChurchChip
                          key={p.id}
                          href={`/paroquias/${p.id}`}
                          label={p.nome}
                          meta={`${p.cidade}-${p.estado}`}
                        />
                      ))}
                    </div>
                  )}

                  {searchResults.length === 0 && nearbyResults.length === 0 && (
                    <p className="text-xs" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
                      Não encontramos nessa cidade. Tente uma cidade vizinha.
                    </p>
                  )}
                </div>
              )}

              {!searching && !searched && geoResults.length === 0 && (
                <p className="text-xs" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
                  Toque em “Usar minha localização” para ver igrejas próximas em segundos.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {DEVOTION_SECTIONS.map((feature, index) => {
        const Icon = feature.icon
        const isLight = index % 2 === 1
        const sectionBg = isLight
          ? 'linear-gradient(180deg, #F4EEE4 0%, #EEE4D4 100%)'
          : 'linear-gradient(180deg, #17120E 0%, #100E0C 100%)'

        const headingColor = isLight ? '#2E211A' : '#F2EDE4'
        const bodyColor = isLight ? '#6D5D4F' : '#B8AFA2'
        const eyebrowBg = isLight ? 'rgba(90,22,37,0.08)' : 'rgba(201,168,76,0.08)'
        const eyebrowBorder = isLight ? 'rgba(90,22,37,0.2)' : 'rgba(201,168,76,0.2)'
        const eyebrowColor = isLight ? '#5A1625' : '#C9A84C'

        return (
          <section
            key={feature.key}
            className="relative py-16 md:py-20 border-b"
            style={{ borderColor: 'rgba(201,168,76,0.12)', background: sectionBg }}
          >
            <div className="max-w-6xl mx-auto px-5 md:px-8 grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
              <div>
                <p
                  className="inline-flex items-center rounded-full px-3 py-1 mb-4 text-[11px] uppercase tracking-[0.16em]"
                  style={{ background: eyebrowBg, border: `1px solid ${eyebrowBorder}`, color: eyebrowColor, fontFamily: 'Cinzel, serif' }}
                >
                  {feature.eyebrow}
                </p>

                <h2 className="text-3xl md:text-4xl mb-3" style={{ fontFamily: 'Cormorant Garamond, serif', color: headingColor }}>
                  {feature.title}
                </h2>
                <p className="text-base mb-5" style={{ color: bodyColor, fontFamily: 'Poppins, sans-serif' }}>
                  {feature.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  <Link
                    href={`/login?tab=login&next=${encodeURIComponent(feature.href)}`}
                    className="underline"
                    style={{ color: isLight ? '#5A1625' : '#D9C077' }}
                  >
                    Entrar para acessar
                  </Link>
                  <span style={{ color: isLight ? '#8C7564' : '#7A7368' }}>·</span>
                  <Link
                    href={`/login?tab=registro&next=${encodeURIComponent(feature.href)}`}
                    className="underline"
                    style={{ color: isLight ? '#5A1625' : '#D9C077' }}
                  >
                    Criar conta
                  </Link>
                </div>
              </div>

              <aside
                className="rounded-3xl p-5 md:p-6"
                style={{
                  background: isLight
                    ? 'linear-gradient(160deg, rgba(90,22,37,0.04), rgba(255,255,255,0.75))'
                    : 'linear-gradient(160deg, rgba(201,168,76,0.08), rgba(17,14,11,0.85))',
                  border: `1px solid ${isLight ? 'rgba(90,22,37,0.15)' : 'rgba(201,168,76,0.18)'}`,
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: isLight ? 'rgba(90,22,37,0.1)' : 'rgba(201,168,76,0.12)' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: isLight ? '#5A1625' : '#D9C077' }} />
                  </div>
                  <strong style={{ color: headingColor, fontFamily: 'Cinzel, serif' }}>{feature.eyebrow}</strong>
                </div>

                <ul className="space-y-2">
                  {feature.bullets.map(item => (
                    <li key={item} className="text-sm flex items-start gap-2" style={{ color: bodyColor, fontFamily: 'Poppins, sans-serif' }}>
                      <span style={{ color: isLight ? '#5A1625' : '#D9C077' }}>✦</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          </section>
        )
      })}

      <section
        className="relative py-16 md:py-20 border-b"
        style={{
          borderColor: 'rgba(201,168,76,0.16)',
          background:
            'radial-gradient(80% 140% at 0% 0%, rgba(107,29,42,0.3) 0%, rgba(16,14,12,0.94) 50%, #0F0E0C 100%)',
        }}
      >
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <div
            className="rounded-3xl p-6 md:p-8"
            style={{
              background: 'rgba(16,14,12,0.75)',
              border: '1px solid rgba(201,168,76,0.22)',
            }}
          >
            <p
              className="inline-flex items-center rounded-full px-3 py-1 mb-3 text-[11px] uppercase tracking-[0.16em]"
              style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.24)', fontFamily: 'Cinzel, serif' }}
            >
              Apoio ao projeto
            </p>

            <h2 className="text-3xl md:text-4xl mb-3" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F2EDE4' }}>
              Faça uma doação para apoiar o Veritas Dei
            </h2>
            <p className="text-base mb-5 max-w-3xl" style={{ color: '#C2B7A8', fontFamily: 'Poppins, sans-serif' }}>
              Este espaço está pronto para receber a integração de doação. Em breve, disponibilizaremos meios seguros para apoiar esta obra de evangelização.
            </p>

            <button
              type="button"
              disabled
              className="px-5 py-2.5 rounded-xl text-sm"
              style={{
                background: 'rgba(201,168,76,0.08)',
                border: '1px dashed rgba(201,168,76,0.35)',
                color: '#D9C077',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Doação (em breve)
            </button>
          </div>
        </div>
      </section>

      <footer className="py-9 text-center" style={{ background: '#0F0E0C' }}>
        <div className="flex items-center justify-center gap-4 mb-3">
          <Link href="/privacidade" className="text-xs underline" style={{ color: '#8E867A', fontFamily: 'Poppins, sans-serif' }}>
            Política de Privacidade
          </Link>
          <span style={{ color: 'rgba(201,168,76,0.2)' }}>|</span>
          <Link href="/termos" className="text-xs underline" style={{ color: '#8E867A', fontFamily: 'Poppins, sans-serif' }}>
            Termos de Serviço
          </Link>
        </div>
        <p className="text-xs" style={{ color: '#8E867A', fontFamily: 'Poppins, sans-serif' }}>
          Fiel ao Magistério. Consulte sempre as fontes.
        </p>
      </footer>

      <div
        className="fixed bottom-3 left-3 right-3 z-40 md:hidden rounded-2xl p-2"
        style={{ background: 'rgba(15,14,12,0.95)', border: '1px solid rgba(201,168,76,0.24)', backdropFilter: 'blur(8px)' }}
      >
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <button
            onClick={jumpToChurchFinder}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-[0.12em]"
            style={{
              background: 'linear-gradient(135deg, #E0C98A 0%, #C9A84C 52%, #A88332 100%)',
              color: '#1C140C',
              fontFamily: 'Cinzel, serif',
            }}
          >
            <MapPin className="w-3.5 h-3.5" />
            Encontrar igreja
          </button>
          <Link
            href="/login?tab=registro"
            className="inline-flex items-center justify-center px-3 py-2.5 rounded-xl text-xs"
            style={{
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.25)',
              color: '#D9C077',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Criar conta
          </Link>
        </div>
      </div>
    </main>
  )
}

function HeroStat({ icon: Icon, value, label }: { icon: ElementType; value: number; label: string }) {
  return (
    <div
      className="rounded-xl px-3 py-2"
      style={{
        background: 'rgba(9,9,8,0.45)',
        border: '1px solid rgba(201,168,76,0.16)',
      }}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className="w-3.5 h-3.5" style={{ color: '#D9C077' }} />
        <strong style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}>{value}</strong>
      </div>
      <p className="text-[11px]" style={{ color: '#A79D8E', fontFamily: 'Poppins, sans-serif' }}>
        {label}
      </p>
    </div>
  )
}

function ChurchChip({ href, label, meta }: { href: string; label: string; meta: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs max-w-full"
      style={{
        background: 'rgba(22,19,14,0.95)',
        border: '1px solid rgba(201,168,76,0.24)',
        color: '#F2EDE4',
        fontFamily: 'Poppins, sans-serif',
      }}
      title={label}
    >
      <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C9A84C' }} />
      <span className="truncate">{label}</span>
      <span style={{ color: '#D9C077' }}>[{meta}]</span>
    </Link>
  )
}
