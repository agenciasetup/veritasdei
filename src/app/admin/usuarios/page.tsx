'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VOCACOES } from '@/types/auth'
import { VocacaoIcon } from '@/components/icons/VocacaoIcons'
import {
  Search, ChevronLeft, ChevronRight, Users, Shield, Filter,
  CheckCircle, XCircle, Clock,
} from 'lucide-react'

interface UserRow {
  id: string
  name: string | null
  email: string | null
  role: string
  status: string
  vocacao: string
  verified: boolean
  cidade: string | null
  estado: string | null
  paroquia: string | null
  plan: string
  created_at: string
}

const PAGE_SIZE = 30

const ROLE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'Usuário' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'active', label: 'Ativo' },
  { value: 'pending_verification', label: 'Pendente' },
  { value: 'suspended', label: 'Suspenso' },
]

export default function AdminUsuariosPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [filterVocacao, setFilterVocacao] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const fetchUsers = useCallback(async () => {
    if (!supabase) return
    setLoading(true)

    let query = supabase
      .from('profiles')
      .select('id, name, email, role, status, vocacao, verified, cidade, estado, paroquia, plan, created_at', { count: 'exact' })

    if (search.trim()) {
      // Escape special PostgREST filter characters to prevent filter injection
      const sanitized = search.trim().replace(/[%_\\]/g, c => `\\${c}`)
      query = query.or(`name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`)
    }
    if (filterVocacao) query = query.eq('vocacao', filterVocacao)
    if (filterRole) query = query.eq('role', filterRole)
    if (filterStatus) query = query.eq('status', filterStatus)

    query = query
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    const { data, count } = await query
    setUsers((data as UserRow[]) ?? [])
    setTotal(count ?? 0)
    setLoading(false)
  }, [supabase, search, filterVocacao, filterRole, filterStatus, page])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const statusBadge = (status: string) => {
    const map: Record<string, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
      active: { icon: CheckCircle, color: '#4CAF50', bg: 'rgba(76,175,80,0.1)', label: 'Ativo' },
      pending_verification: { icon: Clock, color: '#C9A84C', bg: 'rgba(201,168,76,0.1)', label: 'Pendente' },
      suspended: { icon: XCircle, color: '#D94F5C', bg: 'rgba(217,79,92,0.1)', label: 'Suspenso' },
    }
    const s = map[status] ?? map.active
    const Icon = s.icon
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
        style={{ background: s.bg, color: s.color, fontFamily: 'Poppins, sans-serif' }}>
        <Icon className="w-3 h-3" /> {s.label}
      </span>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5" style={{ color: '#C9A84C' }} />
          <h1 className="text-xl font-bold tracking-wider uppercase"
            style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
            Usuários
          </h1>
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}>
            {total}
          </span>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#7A7368' }} />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
            style={{
              background: 'rgba(16,16,16,0.8)',
              border: '1px solid rgba(201,168,76,0.12)',
              color: '#F2EDE4',
              fontFamily: 'Poppins, sans-serif',
              outline: 'none',
            }}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs transition-all"
          style={{
            background: showFilters ? 'rgba(201,168,76,0.1)' : 'rgba(16,16,16,0.8)',
            border: '1px solid rgba(201,168,76,0.12)',
            color: showFilters ? '#C9A84C' : '#7A7368',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          <Filter className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 p-4 rounded-xl"
          style={{ background: 'rgba(16,16,16,0.6)', border: '1px solid rgba(201,168,76,0.08)' }}>
          <FilterSelect label="Vocação" value={filterVocacao}
            onChange={v => { setFilterVocacao(v); setPage(0) }}
            options={[{ value: '', label: 'Todas' }, ...VOCACOES.map(v => ({ value: v.value, label: v.label }))]} />
          <FilterSelect label="Role" value={filterRole}
            onChange={v => { setFilterRole(v); setPage(0) }} options={ROLE_OPTIONS} />
          <FilterSelect label="Status" value={filterStatus}
            onChange={v => { setFilterStatus(v); setPage(0) }} options={STATUS_OPTIONS} />
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 text-[10px] tracking-wider uppercase"
          style={{ borderBottom: '1px solid rgba(201,168,76,0.08)', color: '#7A7368', fontFamily: 'Cinzel, serif' }}>
          <div className="col-span-3">Usuário</div>
          <div className="col-span-2">Vocação</div>
          <div className="col-span-2">Local</div>
          <div className="col-span-1">Role</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Plano</div>
          <div className="col-span-2">Cadastro</div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 rounded-full animate-spin mx-auto"
              style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
          </div>
        )}

        {/* Empty */}
        {!loading && users.length === 0 && (
          <div className="p-8 text-center">
            <Users className="w-8 h-8 mx-auto mb-2" style={{ color: '#7A7368', opacity: 0.4 }} />
            <p className="text-sm" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
              Nenhum usuário encontrado
            </p>
          </div>
        )}

        {/* Rows */}
        {!loading && users.map(u => (
          <div key={u.id}
            className="grid grid-cols-1 md:grid-cols-12 gap-2 px-5 py-3.5 items-center transition-colors hover:bg-[rgba(201,168,76,0.03)]"
            style={{ borderBottom: '1px solid rgba(201,168,76,0.05)' }}>

            {/* User */}
            <div className="col-span-3 flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.12)' }}>
                <VocacaoIcon vocacao={u.vocacao ?? 'leigo'} size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
                  {u.name ?? '—'}
                </p>
                <p className="text-[11px] truncate" style={{ color: '#7A7368' }}>{u.email}</p>
              </div>
            </div>

            {/* Vocação */}
            <div className="col-span-2">
              <span className="text-xs" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
                {VOCACOES.find(v => v.value === u.vocacao)?.label ?? 'Leigo'}
              </span>
              {u.verified && <Shield className="w-3 h-3 inline ml-1" style={{ color: '#4CAF50' }} />}
            </div>

            {/* Local */}
            <div className="col-span-2">
              <p className="text-xs truncate" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
                {[u.cidade, u.estado].filter(Boolean).join(', ') || '—'}
              </p>
            </div>

            {/* Role */}
            <div className="col-span-1">
              {u.role === 'admin' ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}>
                  Admin
                </span>
              ) : (
                <span className="text-xs" style={{ color: '#7A7368' }}>user</span>
              )}
            </div>

            {/* Status */}
            <div className="col-span-1">{statusBadge(u.status)}</div>

            {/* Plan */}
            <div className="col-span-1">
              <span className="text-xs uppercase" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                {u.plan ?? 'free'}
              </span>
            </div>

            {/* Date */}
            <div className="col-span-2">
              <span className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                {new Date(u.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
            Página {page + 1} de {totalPages} ({total} usuários)
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="p-2 rounded-lg transition-all disabled:opacity-30"
              style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C' }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="p-2 rounded-lg transition-all disabled:opacity-30"
              style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C' }}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-[10px] mb-1.5 tracking-wider uppercase"
        style={{ fontFamily: 'Cinzel, serif', color: '#7A7368' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-xs"
        style={{
          background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.1)',
          color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', outline: 'none',
        }}>
        {options.map(o => <option key={o.value} value={o.value} style={{ background: '#0A0A0A' }}>{o.label}</option>)}
      </select>
    </div>
  )
}
