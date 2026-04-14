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
  Lock,
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

const SEARCH_SELECT = 'id, nome, diocese, cidade, estado, verificado, status'

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
    <main className="min-h-screen px-4 pt-8 pb-28 md:pb-12 relative">
      <div className="bg-glow" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        <section
          className="relative overflow-hidden rounded-[28px] p-6 md:p-8 fade-in"
          style={{
            background:
              'radial-gradient(120% 180% at 5% 5%, rgba(201,168,76,0.14) 0%, rgba(16,16,16,0.78) 48%, rgba(16,16,16,0.92) 100%)',
            border: '1px solid rgba(201,168,76,0.25)',
            boxShadow: '0 24px 70px rgba(0,0,0,0.45)',
          }}
        >
          <div
            className="pointer-events-none absolute -top-20 -right-12 w-56 h-56 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(107,29,42,0.26) 0%, rgba(107,29,42,0) 72%)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.18) 0%, rgba(201,168,76,0) 70%)' }}
          />

          <div className="relative z-10">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-4"
              style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
              <span className="text-[11px] capitalize" style={{ color: '#D9C077', fontFamily: 'Poppins, sans-serif' }}>
                {hoje}
              </span>
              <span style={{ color: 'rgba(217,192,119,0.45)' }}>·</span>
              <span className="text-[11px]" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
                Leituras de hoje: {liturgical.name}
              </span>
            </div>

            <h1
              className="text-3xl md:text-5xl leading-tight tracking-[0.04em] mb-3"
              style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
            >
              Fé católica,
              <br />
              sem complicação.
            </h1>

            <p className="text-sm md:text-base max-w-xl mb-5" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
              Um caminho guiado para quem quer rezar, encontrar missa e criar conta com facilidade, mesmo sem experiência com tecnologia.
            </p>

            <button
              onClick={jumpToChurchFinder}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold uppercase tracking-wider"
              style={{
                background: 'linear-gradient(135deg, #D9C077 0%, #B1913E 100%)',
                color: '#16120B',
                fontFamily: 'Cinzel, serif',
              }}
            >
              <Compass className="w-4 h-4" />
              Encontrar missa perto de mim
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="flex flex-wrap items-center gap-3 mt-4 text-xs" style={{ fontFamily: 'Poppins, sans-serif' }}>
              <Link href="/login?tab=registro" className="underline" style={{ color: '#D9C077' }}>
                Criar conta grátis
              </Link>
              <span style={{ color: '#7A7368' }}>·</span>
              <Link href="/login?tab=login" className="underline" style={{ color: '#D9C077' }}>
                Já tenho conta
              </Link>
              <span style={{ color: '#7A7368' }}>·</span>
              <span style={{ color: '#9D958A' }}>Leva menos de 1 minuto</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-5">
              <StatPill icon={Church} value={stats.igrejas} label="Igrejas cadastradas" />
              <StatPill icon={HeartHandshake} value={stats.convertidos} label="Convertidos" />
              <StatPill icon={UserPlus} value={stats.catolicos} label="Católicos" />
            </div>

            {searching && (
              <p className="text-xs inline-flex items-center gap-2 mt-4" style={{ color: '#D9C077', fontFamily: 'Poppins, sans-serif' }}>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Procurando igrejas próximas...
              </p>
            )}

            {!searching && geoResults.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
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
          </div>
        </section>

        <section
          className="rounded-3xl p-5 md:p-6"
          style={{ background: 'rgba(16,16,16,0.78)', border: '1px solid rgba(201,168,76,0.16)' }}
        >
          <p
            className="inline-flex items-center rounded-full px-3 py-1 mb-3 text-[11px] uppercase tracking-[0.16em]"
            style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontFamily: 'Cinzel, serif' }}
          >
            Passo 1 · Encontre uma igreja
          </p>

          <h2 className="text-xl md:text-2xl mb-1" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F2EDE4' }}>
            Localização automática com plano B por cidade
          </h2>
          <p className="text-sm mb-5" style={{ color: '#8E867A', fontFamily: 'Poppins, sans-serif' }}>
            Se a localização falhar, você digita a cidade e continua sem travar.
          </p>

          <div id="church-finder" className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-4">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => geo.request()}
                  disabled={geo.status === 'prompting' || geo.status === 'loading'}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs"
                  style={{
                    background: geo.status === 'granted' ? 'rgba(76,175,80,0.1)' : 'rgba(201,168,76,0.08)',
                    border: `1px solid ${geo.status === 'granted' ? 'rgba(76,175,80,0.25)' : 'rgba(201,168,76,0.2)'}`,
                    color: geo.status === 'granted' ? '#66BB6A' : '#D9C077',
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
                    style={{ color: '#8E867A', fontFamily: 'Poppins, sans-serif', background: 'none', border: 'none' }}
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
                    placeholder="Digite sua cidade (ex: Campinas)"
                    biasLatitude={geo.coords?.latitude ?? null}
                    biasLongitude={geo.coords?.longitude ?? null}
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searching || !searchCity.trim()}
                  className="px-4 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #D9C077 0%, #B1913E 100%)',
                    color: '#16120B',
                    opacity: !searchCity.trim() ? 0.5 : 1,
                  }}
                  aria-label="Buscar igreja"
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div
              className="rounded-2xl p-3 min-h-[168px]"
              style={{ background: 'rgba(10,10,10,0.45)', border: '1px solid rgba(201,168,76,0.12)' }}
            >
              <p className="text-[11px] uppercase tracking-[0.16em] mb-2" style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}>
                Resultado rápido
              </p>

              {searching && (
                <p className="text-xs" style={{ color: '#8E867A', fontFamily: 'Poppins, sans-serif' }}>
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
                    <p className="text-xs" style={{ color: '#8E867A', fontFamily: 'Poppins, sans-serif' }}>
                      Não encontramos nessa cidade. Tente uma cidade vizinha.
                    </p>
                  )}
                </div>
              )}

              {!searching && !searched && geoResults.length === 0 && (
                <p className="text-xs" style={{ color: '#8E867A', fontFamily: 'Poppins, sans-serif' }}>
                  Toque em “Usar minha localização” para ver igrejas em segundos.
                </p>
              )}
            </div>
          </div>
        </section>

        <section
          className="rounded-3xl p-5 md:p-6"
          style={{ background: 'rgba(16,16,16,0.78)', border: '1px solid rgba(201,168,76,0.16)' }}
        >
          <p
            className="inline-flex items-center rounded-full px-3 py-1 mb-3 text-[11px] uppercase tracking-[0.16em]"
            style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontFamily: 'Cinzel, serif' }}
          >
            Passo 2 · Crie conta e libere tudo
          </p>

          <h2 className="text-xl md:text-2xl mb-1" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F2EDE4' }}>
            Recursos para viver a fé no dia a dia
          </h2>
          <p className="text-sm mb-4" style={{ color: '#8E867A', fontFamily: 'Poppins, sans-serif' }}>
            Entrou na conta, abriu. Simples assim.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FeatureGateCard
              icon={CalendarHeart}
              title="Leituras de hoje"
              description="Acompanhe o calendário litúrgico sem se perder."
              href="/liturgia/hoje"
            />
            <FeatureGateCard
              icon={BookOpen}
              title="Orações prontas"
              description="Pai-Nosso, Ave-Maria e orações essenciais."
              href="/oracoes"
            />
            <FeatureGateCard
              icon={Cross}
              title="Santo Terço"
              description="Mistérios do dia com guia passo a passo."
              href="/rosario"
            />
            <FeatureGateCard
              icon={ClipboardCheck}
              title="Preparar confissão"
              description="Exame de consciência em formato prático."
              href="/exame-consciencia"
            />
          </div>
        </section>

        <section
          className="rounded-3xl p-5 md:p-6"
          style={{ background: 'rgba(16,16,16,0.78)', border: '1px solid rgba(201,168,76,0.16)' }}
        >
          <h2 className="text-xl md:text-2xl mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F2EDE4' }}>
            Apoie este apostolado
          </h2>
          <p className="text-sm mb-4" style={{ color: '#8E867A', fontFamily: 'Poppins, sans-serif' }}>
            O espaço de doação já está preparado. Em breve: Pix e cartão para manter o projeto no ar.
          </p>
          <button
            type="button"
            disabled
            className="px-4 py-2 rounded-xl text-sm"
            style={{
              background: 'rgba(201,168,76,0.08)',
              border: '1px dashed rgba(201,168,76,0.3)',
              color: '#C9A84C',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Doação (em breve)
          </button>
        </section>

        <footer className="pb-2 text-center">
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
      </div>

      <div
        className="fixed bottom-3 left-3 right-3 z-40 md:hidden rounded-2xl p-2"
        style={{ background: 'rgba(16,16,16,0.94)', border: '1px solid rgba(201,168,76,0.24)' }}
      >
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <button
            onClick={jumpToChurchFinder}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider"
            style={{
              background: 'linear-gradient(135deg, #D9C077 0%, #B1913E 100%)',
              color: '#16120B',
              fontFamily: 'Cinzel, serif',
            }}
          >
            <MapPin className="w-3.5 h-3.5" />
            Encontrar missa
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

function StatPill({ icon: Icon, value, label }: { icon: ElementType; value: number; label: string }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{
        background: 'rgba(10,10,10,0.45)',
        border: '1px solid rgba(201,168,76,0.15)',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
        <strong style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif', fontSize: '0.95rem' }}>
          {value}
        </strong>
      </div>
      <p className="text-[11px]" style={{ color: '#8E867A', fontFamily: 'Poppins, sans-serif' }}>
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
        border: '1px solid rgba(201,168,76,0.2)',
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

function FeatureGateCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: ElementType
  title: string
  description: string
  href: string
}) {
  const nextParam = encodeURIComponent(href)

  return (
    <article
      className="rounded-2xl p-4"
      style={{
        background: 'rgba(10,10,10,0.45)',
        border: '1px solid rgba(201,168,76,0.14)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.12)' }}>
          <Icon className="w-4 h-4" style={{ color: '#D9C077' }} />
        </div>
        <h3 className="text-sm" style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}>
          {title}
        </h3>
      </div>

      <p className="text-xs mb-3" style={{ color: '#8E867A', fontFamily: 'Poppins, sans-serif' }}>
        {description}
      </p>

      <div className="flex items-center gap-2 text-xs" style={{ fontFamily: 'Poppins, sans-serif' }}>
        <Lock className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
        <Link href={`/login?tab=login&next=${nextParam}`} className="underline" style={{ color: '#D9C077' }}>
          Entrar para abrir
        </Link>
        <span style={{ color: '#7A7368' }}>·</span>
        <Link href={`/login?tab=registro&next=${nextParam}`} className="underline" style={{ color: '#D9C077' }}>
          Criar conta
        </Link>
      </div>
    </article>
  )
}
