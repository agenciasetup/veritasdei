'use client'

import { useState } from 'react'
import { Users, Plus, LogIn, Copy, Check, Crown, LogOut, ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import AuthGuard from '@/components/auth/AuthGuard'
import { useMyStudyGroups, type StudyGroup } from '@/lib/study/useStudyGroups'

const SHELL_STYLE = {
  background: 'var(--surface-2)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: 24,
}

export default function StudyGroupsClient() {
  const { groups, loading, createGroup, joinByCode, leaveGroup } = useMyStudyGroups()
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'err'; msg: string } | null>(null)

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
      <div className="min-h-screen" style={{ background: 'var(--surface-1)' }}>
        <main
          className="
            max-w-2xl mx-auto px-4 pt-5 pb-28
            md:py-10
            lg:max-w-[1100px] lg:px-8 lg:pt-10 lg:pb-16
          "
        >
          <Link
            href="/educa/estudo"
            className="inline-flex items-center gap-1.5 text-xs mb-8 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao estudo
          </Link>

          {/* Hero editorial — sem brilho, sem eyebrow caixa alta */}
          <header className="mb-10 md:mb-12">
            <h1
              className="text-3xl md:text-5xl leading-tight mb-3"
              style={{
                fontFamily: 'var(--font-elegant)',
                color: 'var(--text-1)',
                fontWeight: 500,
              }}
            >
              Grupos de estudo
            </h1>
            <p
              className="text-sm md:text-base max-w-xl"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              Estude em comunhão. Crie um grupo pra família, paróquia ou
              amigos — e caminhem juntos na mesma trilha.
            </p>
          </header>

          {/* Criar + Entrar lado a lado, flat */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-10">
            <section className="p-6 md:p-7 flex flex-col" style={SHELL_STYLE}>
              <header className="flex items-center gap-3 mb-5">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <Plus className="w-5 h-5" strokeWidth={1.6} style={{ color: 'var(--accent)' }} />
                </div>
                <div className="min-w-0">
                  <h2
                    className="text-lg leading-tight"
                    style={{
                      color: 'var(--text-1)',
                      fontFamily: 'var(--font-elegant)',
                      fontWeight: 500,
                    }}
                  >
                    Criar um grupo
                  </h2>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
                  >
                    Você vira o guia da trilha.
                  </p>
                </div>
              </header>

              <form onSubmit={handleCreate} className="flex-1 flex flex-col">
                <Field label="Nome">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Família Souza, Catequese SS. Coração…"
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
                  className="mt-5 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm disabled:opacity-40 transition-opacity"
                  style={{
                    background: 'rgba(201,168,76,0.10)',
                    border: '1px solid rgba(201,168,76,0.25)',
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                  }}
                >
                  {creating ? 'Criando…' : 'Criar grupo'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </section>

            <section className="p-6 md:p-7 flex flex-col" style={SHELL_STYLE}>
              <header className="flex items-center gap-3 mb-5">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <LogIn className="w-5 h-5" strokeWidth={1.6} style={{ color: 'var(--accent)' }} />
                </div>
                <div className="min-w-0">
                  <h2
                    className="text-lg leading-tight"
                    style={{
                      color: 'var(--text-1)',
                      fontFamily: 'var(--font-elegant)',
                      fontWeight: 500,
                    }}
                  >
                    Entrar por convite
                  </h2>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
                  >
                    Use o código que te enviaram.
                  </p>
                </div>
              </header>

              <form onSubmit={handleJoin} className="flex-1 flex flex-col">
                <Field label="Código de 6 caracteres">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="A1B2C3"
                    maxLength={12}
                    required
                    className="input text-center tabular-nums tracking-[0.32em] uppercase"
                    style={{ fontSize: 18 }}
                  />
                </Field>

                <button
                  type="submit"
                  disabled={joining || joinCode.trim().length < 4}
                  className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm disabled:opacity-40 transition-opacity"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'var(--text-2)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                  }}
                >
                  {joining ? 'Entrando…' : 'Entrar no grupo'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </section>
          </div>

          {feedback && (
            <div
              role="status"
              className="rounded-2xl px-4 py-3 text-sm mb-8"
              style={{
                background: 'var(--surface-2)',
                border: `1px solid ${
                  feedback.tone === 'ok'
                    ? 'rgba(106,170,98,0.25)'
                    : 'rgba(217,79,92,0.25)'
                }`,
                color:
                  feedback.tone === 'ok' ? 'var(--success)' : 'var(--wine-light)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {feedback.msg}
            </div>
          )}

          {/* Meus grupos */}
          <section>
            <header className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" strokeWidth={1.6} style={{ color: 'var(--accent)' }} />
                <h2
                  className="text-base"
                  style={{
                    color: 'var(--text-1)',
                    fontFamily: 'var(--font-elegant)',
                    fontWeight: 500,
                  }}
                >
                  Meus grupos
                </h2>
              </div>
              <span
                className="text-[11px] tabular-nums"
                style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
              >
                {loading ? '' : `${groups.length} ${groups.length === 1 ? 'grupo' : 'grupos'}`}
              </span>
            </header>

            {loading ? (
              <p
                className="text-sm py-6 text-center"
                style={{ color: 'var(--text-3)' }}
              >
                Carregando…
              </p>
            ) : groups.length === 0 ? (
              <div className="p-8 text-center" style={SHELL_STYLE}>
                <Users
                  className="w-6 h-6 mx-auto mb-3 opacity-50"
                  style={{ color: 'var(--text-3)' }}
                />
                <p
                  className="text-sm"
                  style={{
                    color: 'var(--text-2)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Você ainda não faz parte de nenhum grupo.
                </p>
                <p
                  className="text-xs mt-1"
                  style={{
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Crie um acima, ou use um código de convite.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {groups.map((g) => (
                  <GroupCard
                    key={g.id}
                    group={g}
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
        </main>

        <style jsx>{`
          .input {
            width: 100%;
            padding: 0.7rem 0.9rem;
            border-radius: 0.875rem;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.06);
            color: var(--text-1);
            font-family: var(--font-body);
            font-size: 0.875rem;
            outline: none;
            transition: border-color 0.15s ease, background 0.15s ease;
          }
          .input::placeholder {
            color: var(--text-3);
          }
          .input:focus {
            border-color: rgba(201, 168, 76, 0.4);
            background: rgba(0, 0, 0, 0.4);
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
        className="text-[11px] block mb-1.5"
        style={{
          color: 'var(--text-3)',
          fontFamily: 'var(--font-body)',
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
  onLeave,
}: {
  group: StudyGroup
  onLeave: () => void
}) {
  const [copied, setCopied] = useState(false)
  async function copyCode(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
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
    <Link
      href={`/estudo/grupos/${group.id}`}
      className="block p-5 md:p-6 transition-colors hover:bg-white/[0.01]"
      style={SHELL_STYLE}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <h3
            className="text-lg leading-tight truncate"
            style={{
              color: 'var(--text-1)',
              fontFamily: 'var(--font-elegant)',
              fontWeight: 500,
            }}
          >
            {group.name}
          </h3>
          {group.description && (
            <p
              className="text-xs mt-1.5 line-clamp-2"
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {group.description}
            </p>
          )}
        </div>
        {isOwner && (
          <span
            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
            style={{
              color: 'var(--accent)',
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.2)',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
            }}
            title="Você criou este grupo"
          >
            <Crown className="w-3 h-3" />
            Dono
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1.5 text-xs"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          <Users className="w-3.5 h-3.5" />
          {group.member_count}{' '}
          {group.member_count === 1 ? 'membro' : 'membros'}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={copyCode}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] tabular-nums transition-colors"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.05)',
              color: copied ? 'var(--success)' : 'var(--text-3)',
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.1em',
            }}
            aria-label="Copiar código de convite"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {group.invite_code}
          </button>
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-full"
            style={{ color: 'var(--accent)' }}
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t flex justify-end" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onLeave()
          }}
          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition-colors hover:bg-white/5"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          <LogOut className="w-3 h-3" />
          Sair do grupo
        </button>
      </div>
    </Link>
  )
}
