'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Network,
  BookOpen,
  Layers,
  Sparkles,
  Plus,
  Globe,
  Lock,
  Trash2,
  Copy,
  MoreVertical,
  Search,
  Clock,
  Users,
  Heart,
  ArrowLeft,
  ArrowRight,
  Compass,
  Share2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getUserFlows,
  createFlow,
  deleteFlow,
  updateFlow,
  duplicateFlow,
  getSharedWithMe,
  acceptShare,
} from '@/verbum/services/flow.service'
import type { VerbumFlow, VerbumFlowShare } from '@/verbum/types/verbum.types'

const GOLD = '#C9A84C'
const BG_DEEP = '#0A0806'

export default function VerbumDashboard() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [flows, setFlows] = useState<VerbumFlow[]>([])
  const [sharedFlows, setSharedFlows] = useState<(VerbumFlowShare & { flow?: VerbumFlow })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  const [newFlowName, setNewFlowName] = useState('')
  const [newFlowDesc, setNewFlowDesc] = useState('')
  const [menuFlowId, setMenuFlowId] = useState<string | null>(null)
  const [tab, setTab] = useState<'my' | 'shared' | 'explore'>('my')

  // Load user data with abort guard to prevent race conditions
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const [userFlows, shared] = await Promise.all([
          getUserFlows(user!.id),
          getSharedWithMe(user!.id, profile?.email || ''),
        ])
        if (cancelled) return
        setFlows(userFlows)
        setSharedFlows(shared)
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user?.id, profile?.email])

  const handleCreateFlow = useCallback(async () => {
    if (!user?.id || !newFlowName.trim()) return
    const flow = await createFlow(user.id, newFlowName.trim(), newFlowDesc.trim() || undefined)
    if (flow) {
      router.push(`/verbum/canvas?flow=${flow.id}`)
    }
    setShowNewModal(false)
    setNewFlowName('')
    setNewFlowDesc('')
  }, [user?.id, newFlowName, newFlowDesc, router])

  const handleDeleteFlow = useCallback(async (flowId: string) => {
    if (!confirm('Tem certeza que deseja excluir este fluxo? Esta ação não pode ser desfeita.')) return
    await deleteFlow(flowId)
    setFlows((prev) => prev.filter((f) => f.id !== flowId))
    setMenuFlowId(null)
  }, [])

  const handleDuplicate = useCallback(async (flowId: string) => {
    if (!user?.id) return
    const source = flows.find((f) => f.id === flowId)
    const newFlow = await duplicateFlow(flowId, user.id, `${source?.name || 'Fluxo'} (cópia)`)
    if (newFlow) {
      setFlows((prev) => [newFlow, ...prev])
    }
    setMenuFlowId(null)
  }, [user?.id, flows])

  const handleTogglePublic = useCallback(async (flowId: string, isPublic: boolean) => {
    await updateFlow(flowId, { is_public: !isPublic })
    setFlows((prev) => prev.map((f) => f.id === flowId ? { ...f, is_public: !isPublic } : f))
    setMenuFlowId(null)
  }, [])

  const handleAcceptShare = useCallback(async (shareId: string) => {
    await acceptShare(shareId)
    setSharedFlows((prev) => prev.map((s) => s.id === shareId ? { ...s, accepted: true } : s))
  }, [])

  return (
    <div className="min-h-screen" style={{ background: BG_DEEP, fontFamily: 'Poppins, sans-serif' }}>
      {/* Background glow */}
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: '#5C4A2A' }}
              title="Voltar para Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: 'Cinzel, serif', color: GOLD, letterSpacing: '0.08em' }}
              >
                VERBUM
              </h1>
              <p className="text-xs mt-1" style={{ color: '#5C4A2A' }}>
                Mappa Fidei — Seus grafos teológicos
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: `linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.08) 100%)`,
              border: `1px solid ${GOLD}`,
              color: GOLD,
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <Plus className="w-4 h-4" />
            Novo Fluxo
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {[
            { key: 'my' as const, label: 'Meus Fluxos', icon: Network },
            { key: 'shared' as const, label: 'Compartilhados', icon: Users, badge: sharedFlows.filter(s => !s.accepted).length },
            { key: 'explore' as const, label: 'Explorar', icon: Compass },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => t.key === 'explore' ? router.push('/verbum/explorar') : setTab(t.key)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: tab === t.key ? 'rgba(201,168,76,0.1)' : 'transparent',
                color: tab === t.key ? GOLD : '#5C4A2A',
              }}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.badge ? (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(212,136,74,0.2)', color: '#D4884A' }}
                >
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-40 rounded-xl" />
            ))}
          </div>
        ) : tab === 'my' ? (
          <>
            {flows.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <Network className="w-12 h-12 mx-auto mb-4" style={{ color: '#3A2A10' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Cinzel, serif', color: '#F5EDD6' }}>
                  Nenhum fluxo ainda
                </h3>
                <p className="text-sm mb-6" style={{ color: '#5C4A2A' }}>
                  Crie seu primeiro grafo teológico
                </p>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="px-6 py-3 rounded-xl text-sm font-medium"
                  style={{
                    background: 'rgba(201,168,76,0.1)',
                    border: `1px solid ${GOLD}`,
                    color: GOLD,
                  }}
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Criar Fluxo
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {flows.map((flow, idx) => (
                  <FlowCard
                    key={flow.id}
                    flow={flow}
                    index={idx}
                    menuOpen={menuFlowId === flow.id}
                    onOpen={() => router.push(`/verbum/canvas?flow=${flow.id}`)}
                    onMenu={() => setMenuFlowId(menuFlowId === flow.id ? null : flow.id)}
                    onDelete={() => handleDeleteFlow(flow.id)}
                    onDuplicate={() => handleDuplicate(flow.id)}
                    onTogglePublic={() => handleTogglePublic(flow.id, flow.is_public)}
                  />
                ))}
              </div>
            )}
          </>
        ) : tab === 'shared' ? (
          <div className="space-y-3">
            {sharedFlows.length === 0 ? (
              <div className="text-center py-16">
                <Share2 className="w-12 h-12 mx-auto mb-4" style={{ color: '#3A2A10' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Cinzel, serif', color: '#F5EDD6' }}>
                  Nenhum fluxo compartilhado
                </h3>
                <p className="text-sm" style={{ color: '#5C4A2A' }}>
                  Quando alguém compartilhar um fluxo com você, ele aparecerá aqui
                </p>
              </div>
            ) : (
              sharedFlows.map((share) => (
                <motion.div
                  key={share.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{
                    background: 'rgba(20,18,14,0.72)',
                    border: '1px solid rgba(201,168,76,0.12)',
                  }}
                >
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#F5EDD6', fontFamily: 'Cinzel, serif' }}>
                      {share.flow?.name || 'Fluxo'}
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: '#5C4A2A' }}>
                      {share.permission === 'edit' ? 'Pode editar' : 'Somente ver'}
                      {!share.accepted && ' · Convite pendente'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!share.accepted && (
                      <button
                        onClick={() => handleAcceptShare(share.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{
                          background: 'rgba(201,168,76,0.1)',
                          color: GOLD,
                        }}
                      >
                        Aceitar
                      </button>
                    )}
                    {share.accepted && share.flow && (
                      <button
                        onClick={() => router.push(`/verbum/canvas?flow=${share.flow!.id}`)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{
                          background: 'rgba(201,168,76,0.1)',
                          color: GOLD,
                        }}
                      >
                        Abrir
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : null}
      </div>

      {/* New Flow Modal */}
      <AnimatePresence>
        {showNewModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300]"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setShowNewModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed z-[301] rounded-2xl overflow-hidden"
              style={{
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400,
                background: 'rgba(10, 8, 6, 0.95)',
                border: '1px solid #3A2A10',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.7)',
              }}
            >
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #3A2A10' }}>
                <h3 className="text-sm font-semibold" style={{ fontFamily: 'Cinzel, serif', color: '#F5EDD6' }}>
                  Novo Fluxo
                </h3>
              </div>
              <div className="px-5 py-4 space-y-3">
                <input
                  type="text"
                  value={newFlowName}
                  onChange={(e) => setNewFlowName(e.target.value)}
                  placeholder="Nome do fluxo"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid #3A2A10',
                    color: '#F5EDD6',
                  }}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFlow()}
                />
                <textarea
                  value={newFlowDesc}
                  onChange={(e) => setNewFlowDesc(e.target.value)}
                  placeholder="Descrição (opcional)"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid #3A2A10',
                    color: '#F5EDD6',
                  }}
                />
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowNewModal(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs"
                    style={{ color: '#5C4A2A' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateFlow}
                    disabled={!newFlowName.trim()}
                    className="flex-1 py-2.5 rounded-xl text-xs font-medium disabled:opacity-40"
                    style={{
                      background: 'rgba(201,168,76,0.15)',
                      border: `1px solid ${GOLD}`,
                      color: GOLD,
                    }}
                  >
                    Criar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function FlowCard({
  flow,
  index,
  menuOpen,
  onOpen,
  onMenu,
  onDelete,
  onDuplicate,
  onTogglePublic,
}: {
  flow: VerbumFlow
  index: number
  menuOpen: boolean
  onOpen: () => void
  onMenu: () => void
  onDelete: () => void
  onDuplicate: () => void
  onTogglePublic: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl cursor-pointer relative group"
      style={{
        background: 'rgba(20,18,14,0.72)',
        border: '1px solid rgba(201,168,76,0.12)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Card body — click to open */}
      <div onClick={onOpen} className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {flow.is_public ? (
              <Globe className="w-3.5 h-3.5" style={{ color: GOLD }} />
            ) : (
              <Lock className="w-3.5 h-3.5" style={{ color: '#5C4A2A' }} />
            )}
            <h3
              className="text-sm font-semibold truncate max-w-[180px]"
              style={{ fontFamily: 'Cinzel, serif', color: '#F5EDD6' }}
            >
              {flow.name}
            </h3>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onMenu() }}
            className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: '#5C4A2A' }}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {flow.description && (
          <p className="text-xs mb-3 line-clamp-2" style={{ color: '#5C4A2A' }}>
            {flow.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-[10px]" style={{ color: '#5C4A2A' }}>
          <span className="flex items-center gap-1">
            <Network className="w-3 h-3" />
            {flow.node_count} nós
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {flow.edge_count} conexões
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(flow.updated_at)}
          </span>
        </div>
      </div>

      {/* Dropdown menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-12 right-4 z-50 rounded-xl overflow-hidden"
            style={{
              background: 'rgba(10,8,6,0.95)',
              border: '1px solid #3A2A10',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              minWidth: 160,
            }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate() }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left transition-colors"
              style={{ color: '#A89060' }}
            >
              <Copy className="w-3.5 h-3.5" />
              Duplicar
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePublic() }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left transition-colors"
              style={{ color: '#A89060' }}
            >
              {flow.is_public ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
              {flow.is_public ? 'Tornar privado' : 'Tornar público'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left transition-colors"
              style={{ color: '#D4884A' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
