'use client'

import { useState } from 'react'
import { Users, Plus, LogIn, Copy, Check, Crown, LogOut } from 'lucide-react'
import AuthGuard from '@/components/auth/AuthGuard'
import HubHeader from '@/components/hubs/HubHeader'
import { useMyStudyGroups, type StudyGroup } from '@/lib/study/useStudyGroups'
import StudyGroupMembersDrawer from './StudyGroupMembersDrawer'

export default function StudyGroupsClient() {
  const { groups, loading, createGroup, joinByCode, leaveGroup } = useMyStudyGroups()
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'err'; msg: string } | null>(null)
  const [membersOpen, setMembersOpen] = useState<StudyGroup | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const g = await createGroup(newName, newDesc || undefined)
    setCreating(false)
    if (g) {
      setNewName('')
      setNewDesc('')
      setFeedback({ tone: 'ok', msg: `Grupo "${g.name}" criado. Código: ${g.invite_code}` })
    } else {
      setFeedback({ tone: 'err', msg: 'Não foi possível criar o grupo.' })
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setJoining(true)
    const g = await joinByCode(joinCode)
    setJoining(false)
    if (g) {
      setJoinCode('')
      setFeedback({ tone: 'ok', msg: `Você entrou em "${g.name}".` })
    } else {
      setFeedback({ tone: 'err', msg: 'Código inválido ou grupo não encontrado.' })
    }
  }

  return (
    <AuthGuard>
      <main className="min-h-screen pb-24">
        <HubHeader
          title="Grupos de estudo"
          subtitle="Estude com amigos, compartilhe reflexões e acompanhe juntos."
        />

        <div className="max-w-[900px] mx-auto px-4 md:px-6 mt-6 space-y-6">
          {/* Ações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <form
              onSubmit={handleCreate}
              className="rounded-2xl p-5"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)' }}
            >
              <h2
                className="text-xs tracking-[0.15em] uppercase mb-3 inline-flex items-center gap-2"
                style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Criar grupo
              </h2>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome do grupo"
                maxLength={60}
                required
                className="w-full px-3 py-2 rounded-lg text-sm outline-none mb-2"
                style={{
                  background: 'var(--surface-3)',
                  border: '1px solid var(--border-1)',
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-body)',
                }}
              />
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Descrição (opcional)"
                rows={2}
                maxLength={500}
                className="w-full resize-none px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: 'var(--surface-3)',
                  border: '1px solid var(--border-1)',
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-body)',
                }}
              />
              <button
                type="submit"
                disabled={creating || !newName.trim()}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs tracking-wider uppercase disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
                  color: '#0F0E0C',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                }}
              >
                <Plus className="w-4 h-4" />
                {creating ? 'Criando...' : 'Criar grupo'}
              </button>
            </form>

            <form
              onSubmit={handleJoin}
              className="rounded-2xl p-5"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)' }}
            >
              <h2
                className="text-xs tracking-[0.15em] uppercase mb-3 inline-flex items-center gap-2"
                style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
              >
                <LogIn className="w-3.5 h-3.5" />
                Entrar por convite
              </h2>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Código (6 caracteres)"
                maxLength={12}
                required
                className="w-full px-3 py-2 rounded-lg text-sm outline-none tabular-nums uppercase tracking-[0.3em] text-center"
                style={{
                  background: 'var(--surface-3)',
                  border: '1px solid var(--border-1)',
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-body)',
                }}
              />
              <p
                className="text-[11px] mt-2"
                style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
              >
                Alguém do grupo compartilha o código com você. Só quem tem o código entra.
              </p>
              <button
                type="submit"
                disabled={joining || joinCode.trim().length < 4}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs tracking-wider uppercase disabled:opacity-40"
                style={{
                  background: 'rgba(201,168,76,0.12)',
                  border: '1px solid rgba(201,168,76,0.25)',
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                }}
              >
                <LogIn className="w-4 h-4" />
                {joining ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>

          {feedback ? (
            <div
              role="status"
              className="rounded-xl px-4 py-3 text-sm"
              style={{
                background: feedback.tone === 'ok' ? 'rgba(139,181,139,0.1)' : 'rgba(200,139,124,0.1)',
                border: `1px solid ${feedback.tone === 'ok' ? 'rgba(139,181,139,0.3)' : 'rgba(200,139,124,0.3)'}`,
                color: feedback.tone === 'ok' ? '#8BB58B' : '#C88B7C',
                fontFamily: 'var(--font-body)',
              }}
            >
              {feedback.msg}
            </div>
          ) : null}

          {/* Lista de grupos */}
          <section>
            <h2
              className="text-xs tracking-[0.15em] uppercase mb-3 inline-flex items-center gap-2"
              style={{ color: 'var(--text-2)', fontFamily: 'var(--font-display)' }}
            >
              <Users className="w-3.5 h-3.5" />
              Meus grupos
            </h2>
            {loading ? (
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>Carregando...</p>
            ) : groups.length === 0 ? (
              <p
                className="text-sm py-6 text-center rounded-xl"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px dashed var(--border-1)',
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Você ainda não faz parte de nenhum grupo. Crie um ou entre com um código.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groups.map((g) => (
                  <GroupCard
                    key={g.id}
                    group={g}
                    onViewMembers={() => setMembersOpen(g)}
                    onLeave={async () => {
                      if (!window.confirm(`Sair de "${g.name}"?`)) return
                      await leaveGroup(g.id)
                      setFeedback({ tone: 'ok', msg: 'Você saiu do grupo.' })
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {membersOpen ? (
          <StudyGroupMembersDrawer
            group={membersOpen}
            onClose={() => setMembersOpen(null)}
          />
        ) : null}
      </main>
    </AuthGuard>
  )
}

function GroupCard({
  group,
  onViewMembers,
  onLeave,
}: {
  group: StudyGroup
  onViewMembers: () => void
  onLeave: () => void
}) {
  const [copied, setCopied] = useState(false)
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(group.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ok */
    }
  }
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className="text-base font-semibold truncate"
              style={{ color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}
            >
              {group.name}
            </h3>
            {group.my_role === 'owner' ? (
              <span
                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
                style={{
                  background: 'rgba(201,168,76,0.12)',
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-body)',
                }}
                title="Você criou este grupo"
              >
                <Crown className="w-3 h-3" />
                Dono
              </span>
            ) : null}
          </div>
          {group.description ? (
            <p
              className="text-xs mt-1 line-clamp-2"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              {group.description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-4">
        <button
          type="button"
          onClick={onViewMembers}
          className="inline-flex items-center gap-1.5 text-xs"
          style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
        >
          <Users className="w-3.5 h-3.5" />
          {group.member_count} {group.member_count === 1 ? 'membro' : 'membros'}
        </button>
        <button
          type="button"
          onClick={copyCode}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs tabular-nums"
          style={{
            background: 'var(--surface-3)',
            border: '1px solid var(--border-1)',
            color: copied ? 'var(--accent)' : 'var(--text-2)',
            fontFamily: 'var(--font-body)',
          }}
          aria-label="Copiar código de convite"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {group.invite_code}
        </button>
      </div>

      <div className="flex justify-end mt-3">
        <button
          type="button"
          onClick={onLeave}
          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition-colors hover:bg-white/5"
          style={{ color: '#C88B7C', fontFamily: 'var(--font-body)' }}
        >
          <LogOut className="w-3 h-3" />
          Sair
        </button>
      </div>
    </div>
  )
}
