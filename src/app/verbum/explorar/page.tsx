'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Compass,
  Search,
  Network,
  Sparkles,
  Clock,
  Copy,
  Heart,
  ArrowLeft,
  Eye,
  Globe,
  TrendingUp,
  Layers,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getPublicFlows,
  searchPublicFlows,
  duplicateFlow,
  toggleFavorite,
  getUserFavorites,
} from '@/verbum/services/flow.service'
import type { VerbumFlow } from '@/verbum/types/verbum.types'

const GOLD = '#C9A84C'

export default function ExplorarPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [flows, setFlows] = useState<VerbumFlow[]>([])
  const [total, setTotal] = useState(0)
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'nodes'>('recent')
  const [cloningId, setCloningId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      const result = await getPublicFlows(30, 0, sortBy)
      setFlows(result.flows)
      setTotal(result.total)

      if (user?.id) {
        const favs = await getUserFavorites(user.id)
        setFavorites(favs)
      }
      setIsLoading(false)
    }
    load()
  }, [sortBy, user?.id])

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      const result = await getPublicFlows(30, 0, sortBy)
      setFlows(result.flows)
      setTotal(result.total)
      return
    }
    setIsLoading(true)
    const results = await searchPublicFlows(searchQuery.trim())
    setFlows(results)
    setTotal(results.length)
    setIsLoading(false)
  }, [searchQuery, sortBy])

  const handleClone = useCallback(async (flowId: string) => {
    if (!user?.id) {
      router.push('/login')
      return
    }
    setCloningId(flowId)
    const source = flows.find(f => f.id === flowId)
    const cloned = await duplicateFlow(flowId, user.id, `${source?.name || 'Fluxo'} (clonado)`)
    if (cloned) {
      router.push(`/verbum/canvas?flow=${cloned.id}`)
    }
    setCloningId(null)
  }, [user?.id, flows, router])

  const handleFavorite = useCallback(async (flowId: string) => {
    if (!user?.id) return
    const isFav = await toggleFavorite(user.id, flowId)
    setFavorites(prev =>
      isFav ? [...prev, flowId] : prev.filter(id => id !== flowId)
    )
  }, [user?.id])

  return (
    <div className="min-h-screen" style={{ background: '#0A0806', fontFamily: 'Poppins, sans-serif' }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 50% 100%, rgba(107,29,42,0.04) 0%, transparent 60%)
          `,
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/verbum')}
            className="p-2 rounded-lg"
            style={{ color: '#5C4A2A' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1
              className="text-xl font-bold"
              style={{ fontFamily: 'Cinzel, serif', color: GOLD, letterSpacing: '0.06em' }}
            >
              Explorar Fluxos
            </h1>
            <p className="text-xs" style={{ color: '#5C4A2A' }}>
              {total} fluxos públicos da comunidade
            </p>
          </div>
        </div>

        {/* Search + Sort */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#5C4A2A' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar fluxos..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid #3A2A10',
                color: '#F5EDD6',
              }}
            />
          </div>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {[
              { key: 'recent' as const, label: 'Recentes', icon: Clock },
              { key: 'popular' as const, label: 'Populares', icon: TrendingUp },
              { key: 'nodes' as const, label: 'Maiores', icon: Layers },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                style={{
                  background: sortBy === s.key ? 'rgba(201,168,76,0.1)' : 'transparent',
                  color: sortBy === s.key ? GOLD : '#5C4A2A',
                }}
              >
                <s.icon className="w-3 h-3" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton h-44 rounded-xl" />
            ))}
          </div>
        ) : flows.length === 0 ? (
          <div className="text-center py-16">
            <Globe className="w-12 h-12 mx-auto mb-4" style={{ color: '#3A2A10' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Cinzel, serif', color: '#F5EDD6' }}>
              Nenhum fluxo público encontrado
            </h3>
            <p className="text-sm" style={{ color: '#5C4A2A' }}>
              Seja o primeiro a publicar um fluxo
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flows.map((flow, idx) => (
              <motion.div
                key={flow.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="rounded-xl overflow-hidden"
                style={{
                  background: 'rgba(20,18,14,0.72)',
                  border: '1px solid rgba(201,168,76,0.12)',
                }}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3
                      className="text-sm font-semibold truncate"
                      style={{ fontFamily: 'Cinzel, serif', color: '#F5EDD6' }}
                    >
                      {flow.name}
                    </h3>
                    <button
                      onClick={() => handleFavorite(flow.id)}
                      className="p-1 flex-shrink-0"
                    >
                      <Heart
                        className="w-4 h-4"
                        style={{
                          color: favorites.includes(flow.id) ? '#D4884A' : '#3A2A10',
                          fill: favorites.includes(flow.id) ? '#D4884A' : 'none',
                        }}
                      />
                    </button>
                  </div>

                  {flow.description && (
                    <p className="text-xs mb-3 line-clamp-2" style={{ color: '#5C4A2A' }}>
                      {flow.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[10px] mb-4" style={{ color: '#5C4A2A' }}>
                    <span className="flex items-center gap-1">
                      <Network className="w-3 h-3" />
                      {flow.node_count} nós
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {flow.edge_count} conexões
                    </span>
                    {flow.clone_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Copy className="w-3 h-3" />
                        {flow.clone_count} clones
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/verbum/canvas?flow=${flow.id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs transition-colors"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid #3A2A10',
                        color: '#A89060',
                      }}
                    >
                      <Eye className="w-3 h-3" />
                      Ver
                    </button>
                    <button
                      onClick={() => handleClone(flow.id)}
                      disabled={cloningId === flow.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                      style={{
                        background: 'rgba(201,168,76,0.1)',
                        border: `1px solid rgba(201,168,76,0.3)`,
                        color: GOLD,
                      }}
                    >
                      <Copy className="w-3 h-3" />
                      {cloningId === flow.id ? 'Clonando...' : 'Clonar'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
