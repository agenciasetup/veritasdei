'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Paroquia, TipoIgreja } from '@/types/paroquia'
import { TIPOS_IGREJA } from '@/types/paroquia'
import SeloVerificado from '@/components/paroquias/SeloVerificado'
import {
  Church,
  MapPin,
  Search,
  Clock,
  Filter,
  ArrowLeft,
} from 'lucide-react'

const ESTADOS_BR = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA',
  'PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
]

type Ordenacao = 'recentes' | 'verificadas' | 'nome'

export default function BuscarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const initialCidade = searchParams.get('cidade') ?? ''
  const initialUf = searchParams.get('uf') ?? ''

  const [cidade, setCidade] = useState(initialCidade)
  const [uf, setUf] = useState(initialUf)
  const [tipo, setTipo] = useState<TipoIgreja | ''>('')
  const [apenasVerificadas, setApenasVerificadas] = useState(false)
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('verificadas')
  const [results, setResults] = useState<Paroquia[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    async function load() {
      setLoading(true)
      let query = supabase!
        .from('paroquias')
        .select(
          'id, nome, tipo_igreja, diocese, padre_responsavel, rua, numero, bairro, cidade, estado, foto_url, fotos, horarios_missa, horarios_confissao, verificado, status',
        )
        .eq('status', 'aprovada')
        .limit(60)

      if (cidade.trim()) query = query.ilike('cidade', `%${cidade.trim()}%`)
      if (uf) query = query.eq('estado', uf)
      if (tipo) query = query.eq('tipo_igreja', tipo)
      if (apenasVerificadas) query = query.eq('verificado', true)

      if (ordenacao === 'verificadas') {
        query = query.order('verificado', { ascending: false }).order('created_at', { ascending: false })
      } else if (ordenacao === 'nome') {
        query = query.order('nome', { ascending: true })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const { data } = await query
      if (!cancelled) {
        setResults((data as Paroquia[]) ?? [])
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [supabase, cidade, uf, tipo, apenasVerificadas, ordenacao])

  const cidadesProximas = useMemo(() => {
    if (!cidade.trim() || !uf) return []
    const normalized = cidade.trim().toLowerCase()
    return results.filter(p => p.estado === uf && p.cidade.toLowerCase() !== normalized)
  }, [results, cidade, uf])

  const resultadosDaCidade = useMemo(() => {
    if (!cidade.trim()) return results
    const normalized = cidade.trim().toLowerCase()
    return results.filter(p => p.cidade.toLowerCase() === normalized || !uf)
  }, [results, cidade, uf])

  return (
    <div className="min-h-screen px-4 md:px-8 py-8 relative">
      <div className="bg-glow" />
      <div className="max-w-6xl mx-auto relative z-10">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm mb-6"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif', background: 'none', border: 'none' }}
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <h1
          className="text-2xl md:text-3xl font-bold tracking-wider uppercase mb-2"
          style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
        >
          Buscar Igrejas
        </h1>
        <p className="text-sm mb-6" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          Encontre igrejas verificadas em sua cidade ou cidades próximas
        </p>

        {/* Filtros */}
        <div
          className="rounded-2xl p-5 mb-6 space-y-4"
          style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_180px] gap-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: '#7A7368' }}
              />
              <input
                type="text"
                value={cidade}
                onChange={e => setCidade(e.target.value)}
                placeholder="Cidade"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(10,10,10,0.6)',
                  border: '1px solid rgba(201,168,76,0.12)',
                  color: '#F2EDE4',
                  fontFamily: 'Poppins, sans-serif',
                  outline: 'none',
                }}
              />
            </div>
            <select
              value={uf}
              onChange={e => setUf(e.target.value)}
              className="px-4 py-3 rounded-xl text-sm appearance-none"
              style={{
                background: 'rgba(10,10,10,0.6)',
                border: '1px solid rgba(201,168,76,0.12)',
                color: uf ? '#F2EDE4' : '#7A7368',
                fontFamily: 'Poppins, sans-serif',
                outline: 'none',
              }}
            >
              <option value="">UF</option>
              {ESTADOS_BR.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value as TipoIgreja | '')}
              className="px-4 py-3 rounded-xl text-sm appearance-none"
              style={{
                background: 'rgba(10,10,10,0.6)',
                border: '1px solid rgba(201,168,76,0.12)',
                color: tipo ? '#F2EDE4' : '#7A7368',
                fontFamily: 'Poppins, sans-serif',
                outline: 'none',
              }}
            >
              <option value="">Todos os tipos</option>
              {TIPOS_IGREJA.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label
              className="inline-flex items-center gap-2 cursor-pointer text-xs"
              style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}
            >
              <input
                type="checkbox"
                checked={apenasVerificadas}
                onChange={e => setApenasVerificadas(e.target.checked)}
                className="accent-[#C9A84C]"
              />
              Apenas verificadas
            </label>
            <div className="inline-flex items-center gap-2 text-xs" style={{ color: '#7A7368' }}>
              <Filter className="w-3.5 h-3.5" />
              <select
                value={ordenacao}
                onChange={e => setOrdenacao(e.target.value as Ordenacao)}
                className="bg-transparent outline-none"
                style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
              >
                <option value="verificadas">Verificadas primeiro</option>
                <option value="recentes">Mais recentes</option>
                <option value="nome">Nome (A–Z)</option>
              </select>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-10">
            <div
              className="w-6 h-6 border-2 rounded-full animate-spin mx-auto"
              style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }}
            />
          </div>
        )}

        {!loading && resultadosDaCidade.length === 0 && cidadesProximas.length === 0 && (
          <div className="text-center py-16">
            <Church className="w-10 h-10 mx-auto mb-4" style={{ color: '#7A7368', opacity: 0.5 }} />
            <p className="text-sm" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
              Nenhuma igreja encontrada com esses filtros.
            </p>
          </div>
        )}

        {!loading && resultadosDaCidade.length > 0 && (
          <section className="mb-10">
            {cidade.trim() && (
              <h2
                className="text-xs tracking-wider uppercase mb-4"
                style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
              >
                Em {cidade}
              </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {resultadosDaCidade.map(p => (
                <ParoquiaCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        )}

        {!loading && cidade.trim() && uf && cidadesProximas.length > 0 && (
          <section>
            <h2
              className="text-xs tracking-wider uppercase mb-4"
              style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
            >
              Em cidades próximas ({uf})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {cidadesProximas.map(p => (
                <ParoquiaCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function ParoquiaCard({ p }: { p: Paroquia }) {
  const tipoLabel = TIPOS_IGREJA.find(t => t.value === p.tipo_igreja)?.label
  const photo = p.foto_url ?? p.fotos?.[0]?.url ?? null
  return (
    <Link
      href={`/paroquias/${p.id}`}
      className="block rounded-2xl p-5 transition-all hover:border-[rgba(201,168,76,0.25)]"
      style={{
        background: 'rgba(16,16,16,0.7)',
        border: '1px solid rgba(201,168,76,0.1)',
      }}
    >
      {photo && (
        <div className="w-full h-40 rounded-xl overflow-hidden mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt={p.nome} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3
          className="text-base font-bold tracking-wide uppercase"
          style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
        >
          {p.nome}
        </h3>
        {p.verificado && <SeloVerificado size="sm" showLabel={false} />}
      </div>
      <div className="space-y-1.5 text-xs" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
        {tipoLabel && (
          <span
            className="inline-block px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.15)',
              color: '#C9A84C',
            }}
          >
            {tipoLabel}
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3" style={{ color: '#C9A84C' }} />
          <span>{p.cidade}, {p.estado}</span>
        </div>
        {p.padre_responsavel && (
          <div className="flex items-center gap-1.5">
            <Church className="w-3 h-3" style={{ color: '#C9A84C' }} />
            <span>Pe. {p.padre_responsavel}</span>
          </div>
        )}
        {p.horarios_missa && p.horarios_missa.length > 0 && (
          <div className="flex items-start gap-1.5 pt-1">
            <Clock className="w-3 h-3 mt-0.5" style={{ color: '#C9A84C' }} />
            <div className="flex flex-wrap gap-1">
              {p.horarios_missa.slice(0, 3).map((h, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(201,168,76,0.06)',
                    border: '1px solid rgba(201,168,76,0.1)',
                    fontSize: 10,
                  }}
                >
                  {h.dia.slice(0, 3)} {h.horario}
                </span>
              ))}
            </div>
          </div>
        )}
        {p.horarios_confissao && p.horarios_confissao.length > 0 && (
          <div className="flex items-start gap-1.5">
            <Clock className="w-3 h-3 mt-0.5" style={{ color: '#D94F5C' }} />
            <span style={{ fontSize: 10 }}>
              Confissão: {p.horarios_confissao.slice(0, 2).map(h => `${h.dia.slice(0, 3)} ${h.horario}`).join(', ')}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
