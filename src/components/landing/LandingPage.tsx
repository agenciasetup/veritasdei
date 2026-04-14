'use client'

import { useEffect, useMemo, useState, type ElementType } from 'react'
import Link from 'next/link'
import {
  Church,
  ClipboardCheck,
  Cross,
  HeartHandshake,
  Loader2,
  LogIn,
  MapPin,
  Navigation,
  Search,
  UserPlus,
  BookOpen,
  CalendarHeart,
  Lock,
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
    const SELECT = 'id, nome, diocese, cidade, estado, verificado, status'

    const { data } = await supabase
      .from('paroquias')
      .select(SELECT)
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
        .select(SELECT)
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
    if (geo.status === 'idle') {
      geo.request()
    }
  }

  if (isAuthenticated) return null

  return (
    <main className="min-h-screen px-4 pt-8 pb-28 md:pb-12 relative">
      <div className="bg-glow" />

      <section className="relative z-10 max-w-4xl mx-auto rounded-3xl p-6 md:p-8 mb-8" style={{
        background: 'rgba(16,16,16,0.78)',
        border: '1px solid rgba(201,168,76,0.15)',
      }}>
        <div
          className="inline-flex flex-col gap-1 rounded-xl px-3 py-2 mb-5"
          style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}
        >
          <span
            className="text-[10px] uppercase tracking-[0.16em] capitalize"
            style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}
          >
            {hoje}
          </span>
          <span className="text-[11px]" style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}>
            Leituras de hoje: {liturgical.name}
          </span>
        </div>

        <h1
          className="text-3xl md:text-5xl font-bold tracking-widest uppercase mb-2"
          style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
        >
          Veritas Dei
        </h1>
        <p className="text-sm md:text-base mb-6" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
          Encontre missa perto de você e reze todos os dias com orientação simples.
        </p>

        <div className="mb-3">
          <button
            onClick={jumpToChurchFinder}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold uppercase tracking-wider"
            style={{
              background: 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
              color: '#0A0A0A',
              fontFamily: 'Cinzel, serif',
            }}
          >
            <MapPin className="w-4 h-4" />
            Encontrar missa perto de mim
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-2">
          <LogIn className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
          <Link
            href="/login?tab=registro"
            className="text-xs underline"
            style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
          >
            Criar conta grátis
          </Link>
          <span style={{ color: '#7A7368' }}>·</span>
          <Link
            href="/login?tab=login"
            className="text-xs underline"
            style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
          >
            Já tenho conta
          </Link>
        </div>
        <p className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          Leva menos de 1 minuto. Sem spam.
        </p>

        {searching && (
          <p className="text-xs inline-flex items-center gap-2" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Procurando igrejas próximas...
          </p>
        )}

        {!searching && geoResults.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {geoResults.slice(0, 8).map(p => (
              <MiniChurchPill
                key={p.id}
                href={`/paroquias/${p.id}`}
                name={p.nome}
                suffix={formatDistance(p.distancia_km)}
              />
            ))}
          </div>
        )}

        {!searching && geoResults.length === 0 && geo.status === 'idle' && (
          <p className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
            Ative sua localização para ver igrejas próximas em formato rápido: Nome [x km].
          </p>
        )}
      </section>

      <section className="relative z-10 max-w-5xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <CounterCard icon={Church} value={stats.igrejas} label="Igrejas cadastradas" />
          <CounterCard icon={HeartHandshake} value={stats.convertidos} label="Convertidos" />
          <CounterCard icon={UserPlus} value={stats.catolicos} label="Católicos" />
        </div>
      </section>

      <section
        id="church-finder"
        className="relative z-10 max-w-4xl mx-auto rounded-2xl p-5 md:p-6 mb-8"
        style={{ background: 'rgba(16,16,16,0.72)', border: '1px solid rgba(201,168,76,0.12)' }}
      >
        <h2 className="text-xl md:text-2xl mb-1" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F2EDE4' }}>
          Encontrar igreja e missa perto de você
        </h2>
        <p className="text-sm mb-4" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          Em 30 segundos: toque em localização ou digite sua cidade.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => geo.request()}
            disabled={geo.status === 'prompting' || geo.status === 'loading'}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all"
            style={{
              background: geo.status === 'granted' ? 'rgba(76,175,80,0.1)' : 'rgba(201,168,76,0.08)',
              border: `1px solid ${geo.status === 'granted' ? 'rgba(76,175,80,0.25)' : 'rgba(201,168,76,0.15)'}`,
              color: geo.status === 'granted' ? '#4CAF50' : '#C9A84C',
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
              style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif', background: 'none', border: 'none' }}
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
            className="px-5 rounded-xl flex items-center gap-2 text-sm font-medium"
            style={{
              background: 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
              color: '#0A0A0A',
              fontFamily: 'Poppins, sans-serif',
              opacity: !searchCity.trim() ? 0.5 : 1,
            }}
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>

        {searched && !searching && geoResults.length > 0 && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-[0.16em] mb-2" style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}>
              Próximas a você
            </p>
            <div className="flex flex-wrap gap-2">
              {geoResults.map(p => (
                <MiniChurchPill
                  key={p.id}
                  href={`/paroquias/${p.id}`}
                  name={p.nome}
                  suffix={formatDistance(p.distancia_km)}
                />
              ))}
            </div>
          </div>
        )}

        {searched && !searching && geoResults.length === 0 && (
          <div className="mt-4 space-y-4">
            {searchResults.length === 0 && nearbyResults.length === 0 ? (
              <p className="text-sm" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                Nenhuma igreja encontrada em &quot;{searchCity}&quot;. Tente outra cidade próxima.
              </p>
            ) : (
              <>
                {searchResults.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] mb-2" style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}>
                      Na sua busca
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {searchResults.map(p => (
                        <MiniChurchPill
                          key={p.id}
                          href={`/paroquias/${p.id}`}
                          name={p.nome}
                          suffix={`${p.cidade}-${p.estado}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {nearbyResults.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] mb-2" style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}>
                      Cidades próximas
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {nearbyResults.map(p => (
                        <MiniChurchPill
                          key={p.id}
                          href={`/paroquias/${p.id}`}
                          name={p.nome}
                          suffix={`${p.cidade}-${p.estado}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>

      <section
        className="relative z-10 max-w-4xl mx-auto rounded-2xl p-5 md:p-6 mb-8"
        style={{ background: 'rgba(16,16,16,0.72)', border: '1px solid rgba(201,168,76,0.12)' }}
      >
        <h2 className="text-xl md:text-2xl mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F2EDE4' }}>
          Faça uma doação para apoiar o projeto
        </h2>
        <p className="text-sm mb-4" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          Este espaço já está preparado para receber o sistema de doação quando a integração de pagamento for ativada.
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

      <section className="relative z-10 max-w-4xl mx-auto mb-8">
        <h2 className="text-xl md:text-2xl mb-3" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F2EDE4' }}>
          Com sua conta você acessa
        </h2>
        <p className="text-sm mb-4" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          Sua rotina espiritual diária com passos simples.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FeatureAccessCard
            icon={CalendarHeart}
            title="Leituras de hoje"
            description="Leituras diárias com calendário litúrgico."
            href="/liturgia/hoje"
          />
          <FeatureAccessCard
            icon={BookOpen}
            title="Orações prontas"
            description="Pai-Nosso, Ave-Maria e mais em um toque."
            href="/oracoes"
          />
          <FeatureAccessCard
            icon={Cross}
            title="Rezar o Santo Terço"
            description="Mistérios do dia com guia para acompanhar."
            href="/rosario"
          />
          <FeatureAccessCard
            icon={ClipboardCheck}
            title="Preparar confissão"
            description="Exame de consciência direto e objetivo."
            href="/exame-consciencia"
          />
        </div>
      </section>

      <div
        className="fixed bottom-3 left-3 right-3 z-40 md:hidden rounded-2xl p-2"
        style={{ background: 'rgba(16,16,16,0.9)', border: '1px solid rgba(201,168,76,0.2)' }}
      >
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <button
            onClick={jumpToChurchFinder}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider"
            style={{
              background: 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
              color: '#0A0A0A',
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
              color: '#C9A84C',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Criar conta
          </Link>
        </div>
      </div>

      <footer className="relative z-10 pt-4 pb-2 text-center">
        <div className="flex items-center justify-center gap-4 mb-3">
          <Link
            href="/privacidade"
            className="text-xs underline"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
          >
            Política de Privacidade
          </Link>
          <span style={{ color: 'rgba(201,168,76,0.2)' }}>|</span>
          <Link
            href="/termos"
            className="text-xs underline"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
          >
            Termos de Serviço
          </Link>
        </div>
        <p className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          Fiel ao Magistério. Consulte sempre as fontes.
        </p>
      </footer>
    </main>
  )
}

function CounterCard({ icon: Icon, value, label }: { icon: ElementType; value: number; label: string }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'rgba(16,16,16,0.72)',
        border: '1px solid rgba(201,168,76,0.1)',
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.1)' }}>
          <Icon className="w-4 h-4" style={{ color: '#C9A84C' }} />
        </div>
        <strong style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}>{value}</strong>
      </div>
      <p className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
        {label}
      </p>
    </div>
  )
}

function MiniChurchPill({ href, name, suffix }: { href: string; name: string; suffix: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs max-w-full"
      style={{
        background: 'rgba(16,16,16,0.76)',
        border: '1px solid rgba(201,168,76,0.18)',
        color: '#F2EDE4',
        fontFamily: 'Poppins, sans-serif',
      }}
      title={name}
    >
      <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C9A84C' }} />
      <span className="truncate">{name}</span>
      <span style={{ color: '#C9A84C' }}>[{suffix}]</span>
    </Link>
  )
}

function FeatureAccessCard({
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
        background: 'rgba(16,16,16,0.72)',
        border: '1px solid rgba(201,168,76,0.1)',
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.1)' }}>
          <Icon className="w-4 h-4" style={{ color: '#C9A84C' }} />
        </div>
        <h3 className="text-sm" style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}>{title}</h3>
      </div>

      <p className="text-xs mb-3" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
        {description}
      </p>

      <div className="flex items-center gap-2">
        <Lock className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
        <Link
          href={`/login?tab=login&next=${nextParam}`}
          className="text-xs underline"
          style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
        >
          Entrar para abrir
        </Link>
        <span style={{ color: '#7A7368' }}>·</span>
        <Link
          href={`/login?tab=registro&next=${nextParam}`}
          className="text-xs underline"
          style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
        >
          Criar conta grátis
        </Link>
      </div>
    </article>
  )
}
