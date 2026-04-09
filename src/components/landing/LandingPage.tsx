'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Users, Church, HeartHandshake, UserPlus, LogIn, MapPin, Clock, Search } from 'lucide-react'
import type { Paroquia } from '@/types/paroquia'

interface Stats {
  catolicos: number
  convertidos: number
  igrejas: number
}

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const [stats, setStats] = useState<Stats>({ catolicos: 0, convertidos: 0, igrejas: 0 })
  const [animated, setAnimated] = useState(false)
  const [searchCity, setSearchCity] = useState('')
  const [searchResults, setSearchResults] = useState<Paroquia[]>([])
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return

    async function fetchStats() {
      const { count: total } = await supabase!
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      const { count: convertidos } = await supabase!
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('veio_de_outra_religiao', true)

      const { count: igrejas } = await supabase!
        .from('paroquias')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'aprovada')

      setStats({
        catolicos: total ?? 0,
        convertidos: convertidos ?? 0,
        igrejas: igrejas ?? 0,
      })
    }

    fetchStats()
    setTimeout(() => setAnimated(true), 100)
  }, [])

  const handleSearch = async () => {
    const supabase = createClient()
    if (!supabase || !searchCity.trim()) return
    setSearching(true)
    setSearched(true)

    const { data } = await supabase
      .from('paroquias')
      .select('*')
      .eq('status', 'aprovada')
      .ilike('cidade', `%${searchCity.trim()}%`)
      .limit(6)

    setSearchResults((data as Paroquia[]) ?? [])
    setSearching(false)
  }

  if (isAuthenticated) return null

  return (
    <div className="flex flex-col items-center min-h-screen px-4 pt-16 pb-10 relative">
      <div className="bg-glow" />

      {/* ── Cross ── */}
      <div className="relative z-10 mb-8">
        <svg width="44" height="64" viewBox="0 0 36 52" fill="none" className="gothic-cross">
          <rect x="14" y="0" width="8" height="52" rx="1.5" fill="url(#crossGoldLanding)" />
          <rect x="0" y="14" width="36" height="8" rx="1.5" fill="url(#crossGoldLanding)" />
          <circle cx="18" cy="18" r="3" fill="#6B1D2A" stroke="#C9A84C" strokeWidth="1" />
          <circle cx="18" cy="2" r="1.5" fill="#C9A84C" opacity="0.6" />
          <circle cx="18" cy="50" r="1.5" fill="#C9A84C" opacity="0.6" />
          <circle cx="2" cy="18" r="1.5" fill="#C9A84C" opacity="0.6" />
          <circle cx="34" cy="18" r="1.5" fill="#C9A84C" opacity="0.6" />
          <defs>
            <linearGradient id="crossGoldLanding" x1="18" y1="0" x2="18" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#D9C077" />
              <stop offset="50%" stopColor="#C9A84C" />
              <stop offset="100%" stopColor="#A88B3A" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ── Headline ── */}
      <h1
        className="relative z-10 text-4xl md:text-6xl lg:text-7xl font-bold tracking-widest uppercase text-center"
        style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
      >
        Veritas Dei
      </h1>

      {/* ── Ornament ── */}
      <div className="relative z-10 flex items-center justify-center gap-4 mt-4 mb-3 max-w-xs mx-auto w-full">
        <span className="flex-1 h-px bg-gradient-to-r from-transparent to-[rgba(201,168,76,0.3)]" />
        <span style={{ color: '#C9A84C', opacity: 0.5, fontSize: '0.75rem' }}>&#10022;</span>
        <span style={{ color: '#6B1D2A', opacity: 0.7, fontSize: '0.6rem' }}>&#9670;</span>
        <span style={{ color: '#C9A84C', opacity: 0.5, fontSize: '0.75rem' }}>&#10022;</span>
        <span className="flex-1 h-px bg-gradient-to-l from-transparent to-[rgba(201,168,76,0.3)]" />
      </div>

      {/* ── Subtitle ── */}
      <p
        className="relative z-10 text-base md:text-lg text-center max-w-lg mb-12"
        style={{ fontFamily: 'Cormorant Garamond, serif', color: '#B8AFA2', fontStyle: 'italic', lineHeight: 1.6 }}
      >
        A maior comunidade católica digital do Brasil.
        <br />
        Encontre igrejas, missas e católicos perto de você.
      </p>

      {/* ── Counters ── */}
      <div
        className={`relative z-10 flex flex-wrap justify-center gap-4 md:gap-6 mb-12 transition-all duration-1000 ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <CounterCard icon={Users} value={stats.catolicos} label="Católicos" />
        <CounterCard icon={HeartHandshake} value={stats.convertidos} label="Convertidos" />
        <CounterCard icon={Church} value={stats.igrejas} label="Igrejas cadastradas" />
      </div>

      {/* ── Church Search ── */}
      <div className="relative z-10 w-full max-w-2xl mb-12">
        <h2
          className="text-lg font-bold tracking-wider uppercase text-center mb-4"
          style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
        >
          Encontre sua Paroquia
        </h2>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#7A7368' }} />
            <input
              type="text"
              value={searchCity}
              onChange={e => setSearchCity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Digite sua cidade..."
              className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm"
              style={{
                background: 'rgba(16,16,16,0.8)',
                border: '1px solid rgba(201,168,76,0.15)',
                color: '#F2EDE4',
                fontFamily: 'Poppins, sans-serif',
                outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(201,168,76,0.4)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(201,168,76,0.15)' }}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !searchCity.trim()}
            className="px-5 rounded-xl flex items-center gap-2 text-sm font-medium transition-all"
            style={{
              background: 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
              color: '#0A0A0A',
              fontFamily: 'Poppins, sans-serif',
              opacity: !searchCity.trim() ? 0.5 : 1,
            }}
          >
            {searching ? (
              <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(10,10,10,0.3)', borderTopColor: '#0A0A0A' }} />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Search Results */}
        {searched && !searching && (
          <div className="mt-4">
            {searchResults.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                Nenhuma paroquia encontrada em &quot;{searchCity}&quot;. Cadastre-se e ajude a registrar!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {searchResults.map(p => (
                  <div
                    key={p.id}
                    className="rounded-xl p-4 transition-all"
                    style={{
                      background: 'rgba(16,16,16,0.7)',
                      border: '1px solid rgba(201,168,76,0.1)',
                    }}
                  >
                    <h4 className="text-sm font-bold mb-1" style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
                      {p.nome}
                    </h4>
                    {p.diocese && (
                      <p className="text-xs mb-1.5" style={{ color: '#7A7368' }}>{p.diocese}</p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: '#B8AFA2' }}>
                      <MapPin className="w-3 h-3" style={{ color: '#C9A84C' }} />
                      {p.cidade}, {p.estado}
                    </div>
                    {p.horarios_missa && p.horarios_missa.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: '#B8AFA2' }}>
                        <Clock className="w-3 h-3" style={{ color: '#C9A84C' }} />
                        {p.horarios_missa.slice(0, 2).map((h, i) => (
                          <span key={i}>{h.dia} {h.horario}{i < Math.min(p.horarios_missa.length, 2) - 1 ? ', ' : ''}</span>
                        ))}
                      </div>
                    )}
                    {p.padre_responsavel && (
                      <div className="flex items-center gap-1.5 text-xs mt-1" style={{ color: '#B8AFA2' }}>
                        <Church className="w-3 h-3" style={{ color: '#C9A84C' }} />
                        Pe. {p.padre_responsavel}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CTA ── */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full max-w-md">
        <Link
          href="/login?tab=registro"
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all hover:scale-[1.02]"
          style={{
            fontFamily: 'Cinzel, serif',
            background: 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
            color: '#0A0A0A',
            boxShadow: '0 8px 32px rgba(201,168,76,0.25)',
          }}
        >
          <UserPlus className="w-4 h-4" />
          Criar Conta
        </Link>
        <Link
          href="/login"
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all hover:scale-[1.02]"
          style={{
            fontFamily: 'Cinzel, serif',
            background: 'rgba(201,168,76,0.08)',
            color: '#C9A84C',
            border: '1px solid rgba(201,168,76,0.25)',
          }}
        >
          <LogIn className="w-4 h-4" />
          Entrar
        </Link>
      </div>

      {/* ── Bottom text ── */}
      <p
        className="relative z-10 text-xs text-center mt-8 max-w-sm"
        style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif', lineHeight: 1.7 }}
      >
        Cadastre-se e garanta seu perfil católico.
        <br />
        Ajude a construir o maior censo católico do Brasil.
      </p>

      {/* ── Footer ── */}
      <footer className="relative z-10 mt-auto pt-16 pb-6">
        <div className="flex items-center justify-center gap-3 mb-3 max-w-[200px] mx-auto">
          <span className="flex-1 h-px bg-gradient-to-r from-transparent to-[rgba(201,168,76,0.15)]" />
          <span style={{ color: '#C9A84C', opacity: 0.4, fontSize: '0.6rem' }}>&#10022;</span>
          <span className="flex-1 h-px bg-gradient-to-l from-transparent to-[rgba(201,168,76,0.15)]" />
        </div>
        <div className="flex items-center justify-center gap-4 mb-3">
          <Link
            href="/privacidade"
            className="text-xs underline transition-colors hover:opacity-80"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
          >
            Política de Privacidade
          </Link>
          <span style={{ color: 'rgba(201,168,76,0.2)' }}>|</span>
          <Link
            href="/termos"
            className="text-xs underline transition-colors hover:opacity-80"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
          >
            Termos de Serviço
          </Link>
        </div>
        <p className="text-xs tracking-wider text-center" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          Fiel ao Magistério. Consulte sempre as fontes.
        </p>
      </footer>
    </div>
  )
}

function CounterCard({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-3.5 rounded-2xl min-w-[160px]"
      style={{
        background: 'rgba(16,16,16,0.7)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(201,168,76,0.12)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}
      >
        <Icon className="w-5 h-5" style={{ color: '#C9A84C' }} />
      </div>
      <div>
        <span
          className="text-xl font-bold block"
          style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
        >
          {value}
        </span>
        <span className="text-[11px] uppercase tracking-wider" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          {label}
        </span>
      </div>
    </div>
  )
}
