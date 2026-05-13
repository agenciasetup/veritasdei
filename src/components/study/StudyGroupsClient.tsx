'use client'

import { useState } from 'react'
import { Users, Plus, LogIn, Copy, Check, Crown, LogOut, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import AuthGuard from '@/components/auth/AuthGuard'
import { useMyStudyGroups, type StudyGroup } from '@/lib/study/useStudyGroups'
import StudyGroupMembersDrawer from './StudyGroupMembersDrawer'
import GlassCard from '@/components/educa/GlassCard'

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
      <div
        className="min-h-screen relative"
        style={{
          background:
            'radial-gradient(ellipse 700px 500px at 50% -10%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 70%), radial-gradient(ellipse 500px 400px at 100% 100%, color-mix(in srgb, var(--wine) 14%, transparent), transparent 70%), var(--surface-1)',
        }}
      >
        <main className="max-w-5xl mx-auto px-4 md:px-6 pt-6 pb-32 md:py-10">
          <Link
            href="/educa/estudo"
            className="inline-flex items-center gap-1 text-xs mb-6"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao estudo
          </Link>

          {/* Hero */}
          <header className="text-center mb-8 md:mb-10">
            <div
              className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-3xl mb-4"
              style={{
                background:
                  'linear-gradient(135deg, color-mix(in srgb, var(--accent) 32%, rgba(0,0,0,0.4)) 0%, rgba(0,0,0,0.6) 100%)',
                border:
                  '1.5px solid color-mix(in srgb, var(--accent) 45%, transparent)',
                boxShadow:
                  '0 12px 32px -12px color-mix(in srgb, var(--accent) 35%, transparent), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <Users
                className="w-7 h-7 md:w-9 md:h-9"
                style={{ color: 'var(--accent)' }}
              />
            </div>
            <p
              className="text-[10px] md:text-xs tracking-[0.3em] uppercase mb-2"
              style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
            >
              Estudo em comunhão
            </p>
            <h1
              className="text-3xl md:text-5xl mb-2"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--text-1)',
                textShadow: '0 2px 12px rgba(0,0,0,0.4)',
              }}
            >
              Grupos de estudo
            </h1>
            <p
              className="text-sm md:text-base max-w-md mx-auto"
              style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
            >
              Estude com amigos, compartilhe reflexões e acompanhem juntos a
              mesma trilha.
            </p>
          </header>

          {/* Split: criar / entrar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6">
            <GlassCard variant="gold" padded>
              <form onSubmit={handleCreate}>
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'rgba(0,0,0,0.45)',
                      border:
                        '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
                    }}
                  >
                    <Plus className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  </div>
                  <h2
                    className="text-sm tracking-[0.15em] uppercase"
                    style={{
                      color: 'var(--accent)',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    Criar grupo
                  </h2>
                </div>

                <Field label="Nome do grupo *">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Família Souza"
                    maxLength={60}
                    required
                    className="input"
                  />
                </Field>
                <div className="mt-3">
                  <Field label="Descrição (opcional)">
                    <textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Pra que esse grupo serve?"
                      rows={2}
                      maxLength={500}
                      className="input resize-none"
                    />
                  </Field>
                </div>

                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm disabled:opacity-40"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, black) 100%)',
                    color: 'var(--accent-contrast)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    boxShadow:
                      '0 6px 18px -6px color-mix(in srgb, var(--accent) 45%, transparent)',
                  }}
                >
                  <Plus className="w-4 h-4" />
                  {creating ? 'Criando...' : 'Criar grupo'}
                </button>
              </form>
            </GlassCard>

            <GlassCard variant="default" padded>
              <form onSubmit={handleJoin}>
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'rgba(0,0,0,0.45)',
                      border:
                        '1px solid color-mix(in srgb, var(--accent) 22%, transparent)',
                    }}
                  >
                    <LogIn className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  </div>
                  <h2
                    className="text-sm tracking-[0.15em] uppercase"
                    style={{
                      color: 'var(--accent)',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    Entrar por convite
                  </h2>
                </div>

                <Field label="Código (6 caracteres)">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="A1B2C3"
                    maxLength={12}
                    required
                    className="input text-center tabular-nums tracking-[0.3em] uppercase"
                    style={{ fontSize: 18 }}
                  />
                </Field>
                <p
                  className="text-[11px] mt-2"
                  style={{
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Alguém do grupo compartilha o código com você.
                </p>

                <button
                  type="submit"
                  disabled={joining || joinCode.trim().length < 4}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm disabled:opacity-40"
                  style={{
                    background: 'rgba(0,0,0,0.45)',
                    border:
                      '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                  }}
                >
                  <LogIn className="w-4 h-4" />
                  {joining ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
            </GlassCard>
          </div>

          {feedback && (
            <div
              role="status"
              className="rounded-2xl px-4 py-3 text-sm mb-6"
              style={{
                background:
                  feedback.tone === 'ok'
                    ? 'color-mix(in srgb, var(--success) 14%, transparent)'
                    : 'color-mix(in srgb, var(--warning) 14%, transparent)',
                border: `1px solid ${
                  feedback.tone === 'ok'
                    ? 'color-mix(in srgb, var(--success) 35%, transparent)'
                    : 'color-mix(in srgb, var(--warning) 35%, transparent)'
                }`,
                color:
                  feedback.tone === 'ok' ? 'var(--success)' : 'var(--warning)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {feedback.msg}
            </div>
          )}

          {/* Lista de grupos */}
          <section>
            <h2
              className="text-xs tracking-[0.18em] uppercase mb-3 inline-flex items-center gap-2 px-1"
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-display)',
              }}
            >
              <Users className="w-3.5 h-3.5" />
              Meus grupos
            </h2>
            {loading ? (
              <p
                className="text-sm py-6 text-center"
                style={{ color: 'var(--text-3)' }}
              >
                Carregando...
              </p>
            ) : groups.length === 0 ? (
              <GlassCard variant="inset" padded className="text-center">
                <Users
                  className="w-6 h-6 mx-auto mb-2"
                  style={{ color: 'var(--text-3)' }}
                />
                <p
                  className="text-sm"
                  style={{
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Você ainda não faz parte de nenhum grupo. Crie um ou entre
                  com um código.
                </p>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {groups.map((g) => (
                  <div key={g.id} className="contents">
                    <GroupCard
                      group={g}
                      onViewMembers={() => setMembersOpen(g)}
                      onLeave={async () => {
                        if (!window.confirm(`Sair de "${g.name}"?`)) return
                        await leaveGroup(g.id)
                        setFeedback({ tone: 'ok', msg: 'Você saiu do grupo.' })
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        {membersOpen && (
          <StudyGroupMembersDrawer
            group={membersOpen}
            onClose={() => setMembersOpen(null)}
          />
        )}

        <style jsx>{`
          .input {
            width: 100%;
            padding: 0.625rem 0.875rem;
            border-radius: 0.75rem;
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid color-mix(in srgb, var(--accent) 18%, transparent);
            color: var(--text-1);
            font-family: var(--font-body);
            font-size: 0.875rem;
            outline: none;
            transition: border-color 0.15s ease;
          }
          .input:focus {
            border-color: color-mix(in srgb, var(--accent) 50%, transparent);
          }
        `}</style>
      </div>
    </AuthGuard>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span
        className="text-[10px] tracking-[0.18em] uppercase block mb-1.5"
        style={{
          color: 'var(--text-3)',
          fontFamily: 'var(--font-display)',
        }}
      >
        {label}
      </span>
      {children}
    </label>
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
  const isOwner = group.my_role === 'owner'
  return (
    <GlassCard variant={isOwner ? 'gold' : 'default'} padded>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3
              className="text-lg font-medium truncate"
              style={{
                color: 'var(--text-1)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {group.name}
            </h3>
            {isOwner && (
              <span
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                style={{
                  background:
                    'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, black) 100%)',
                  color: 'var(--accent-contrast)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                }}
                title="Você criou este grupo"
              >
                <Crown className="w-3 h-3" />
                Dono
              </span>
            )}
          </div>
          {group.description && (
            <p
              className="text-xs mt-1 line-clamp-2"
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {group.description}
            </p>
          )}
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
          {group.member_count}{' '}
          {group.member_count === 1 ? 'membro' : 'membros'}
        </button>
        <button
          type="button"
          onClick={copyCode}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs tabular-nums"
          style={{
            background: 'rgba(0,0,0,0.45)',
            border:
              '1px solid color-mix(in srgb, var(--accent) 18%, transparent)',
            color: copied ? 'var(--success)' : 'var(--accent)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            letterSpacing: '0.12em',
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
          style={{ color: 'var(--wine-light)', fontFamily: 'var(--font-body)' }}
        >
          <LogOut className="w-3 h-3" />
          Sair
        </button>
      </div>
    </GlassCard>
  )
}
