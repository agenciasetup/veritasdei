'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Users } from 'lucide-react'
import { MYSTERY_GROUPS, getMysteryForToday } from '@/features/rosario/data/mysteries'
import type { MysterySet } from '@/features/rosario/data/types'
import type { RosaryRoomSnapshot } from '@/features/rosario/data/historyTypes'

export function JuntosLanding() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [mysterySet, setMysterySet] = useState<MysterySet>(
    () => getMysteryForToday().id,
  )
  const [titulo, setTitulo] = useState('')
  const [intencao, setIntencao] = useState('')
  const [periodo, setPeriodo] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createdRoom, setCreatedRoom] = useState<{ codigo: string } | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const handleCreate = useCallback(async () => {
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/rosario/rooms', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mystery_set: mysterySet,
          titulo: titulo.trim() || null,
        }),
      })
      if (!res.ok) {
        setCreateError('Não foi possível criar a sala. Tente novamente.')
        return
      }
      const data = (await res.json()) as RosaryRoomSnapshot
      setCreatedRoom({ codigo: data.room.codigo })
    } catch {
      setCreateError('Erro de rede. Verifique sua conexão.')
    } finally {
      setCreating(false)
    }
  }, [mysterySet, titulo])

  const handleCopyLink = useCallback(async () => {
    if (!createdRoom) return
    const link = `${window.location.origin}/rosario/juntos/${createdRoom.codigo}`
    try {
      await navigator.clipboard.writeText(link)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      // fallback
    }
  }, [createdRoom])

  const handleEnterRoom = useCallback(() => {
    if (createdRoom) router.push(`/rosario/juntos/${createdRoom.codigo}`)
  }, [createdRoom, router])

  const handleJoin = useCallback(async () => {
    const codigo = joinCode.trim().toUpperCase()
    if (codigo.length < 4) {
      setJoinError('Digite o código de 4-6 caracteres.')
      return
    }
    setJoining(true)
    setJoinError(null)
    try {
      const res = await fetch(`/api/rosario/rooms/${codigo}/join`, {
        method: 'POST',
      })
      if (res.status === 404) {
        setJoinError('Sala não encontrada ou já encerrada.')
        return
      }
      if (!res.ok) {
        setJoinError('Não foi possível entrar na sala.')
        return
      }
      router.push(`/rosario/juntos/${codigo}`)
    } catch {
      setJoinError('Erro de rede. Verifique sua conexão.')
    } finally {
      setJoining(false)
    }
  }, [joinCode, router])

  // If room was just created, show the share screen
  if (createdRoom) {
    const shareLink = typeof window !== 'undefined'
      ? `${window.location.origin}/rosario/juntos/${createdRoom.codigo}`
      : `/rosario/juntos/${createdRoom.codigo}`

    return (
      <div className="flex flex-col gap-5">
        <section
          className="rounded-2xl border p-6 text-center"
          style={{
            borderColor: 'rgba(201, 168, 76, 0.22)',
            backgroundColor: 'rgba(20, 18, 14, 0.6)',
          }}
        >
          <div className="flex justify-center mb-3" aria-hidden>
            <Users size={32} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
          </div>
          <h2
            className="text-lg mb-2"
            style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
          >
            Sala criada!
          </h2>

          {/* Code */}
          <div
            className="inline-block rounded-xl px-6 py-3 font-mono text-2xl tracking-[0.4em] mb-4"
            style={{
              background: 'rgba(201, 168, 76, 0.08)',
              border: '1px solid rgba(201, 168, 76, 0.2)',
              color: 'var(--text-1)',
            }}
          >
            {createdRoom.codigo}
          </div>

          {/* Shareable link */}
          <div className="mb-4">
            <p className="text-[11px] mb-2" style={{ color: 'var(--text-3)' }}>
              Compartilhe o link — quem clicar entra direto:
            </p>
            <div
              className="flex items-center gap-2 rounded-lg border px-3 py-2"
              style={{
                borderColor: 'rgba(201, 168, 76, 0.15)',
                background: 'rgba(20, 18, 14, 0.8)',
              }}
            >
              <span
                className="flex-1 text-xs truncate font-mono"
                style={{ color: 'var(--text-2)' }}
              >
                {shareLink}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="shrink-0 rounded-md px-3 py-1 text-[11px] font-semibold transition active:scale-95"
                style={{
                  background: linkCopied ? 'rgba(76, 175, 80, 0.2)' : 'rgba(201, 168, 76, 0.12)',
                  color: linkCopied ? '#81C784' : '#D9C077',
                  border: `1px solid ${linkCopied ? 'rgba(76, 175, 80, 0.3)' : 'rgba(201, 168, 76, 0.25)'}`,
                }}
              >
                {linkCopied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleEnterRoom}
            className="w-full rounded-xl py-3 text-sm font-semibold transition active:scale-[0.97]"
            style={{
              background: 'linear-gradient(180deg, #C9A84C, #A88437)',
              color: 'var(--accent-contrast)',
            }}
          >
            Entrar na sala
          </button>
        </section>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Criar sala */}
      <section
        className="rounded-2xl border p-5"
        style={{
          borderColor: 'rgba(201, 168, 76, 0.22)',
          backgroundColor: 'rgba(20, 18, 14, 0.6)',
        }}
        aria-labelledby="juntos-criar-titulo"
      >
        <h2
          id="juntos-criar-titulo"
          className="text-sm font-semibold uppercase tracking-[0.2em]"
          style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
        >
          Criar uma sala
        </h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-3)' }}>
          Você vira o host e pode convidar outros pelo código ou link.
        </p>

        <label className="mt-4 block text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-3)' }}>
          Mistérios
        </label>
        <div
          className="mt-2 flex gap-1.5 rounded-xl p-1.5"
          role="radiogroup"
          aria-label="Mistérios da sala"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-1)',
          }}
        >
          {MYSTERY_GROUPS.map((g) => {
            const active = g.id === mysterySet
            return (
              <button
                key={g.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMysterySet(g.id)}
                className="min-w-0 flex-1 rounded-lg px-2 py-2 text-center transition"
                style={{
                  background: active ? 'rgba(201,168,76,0.12)' : 'transparent',
                  border: active ? '1px solid rgba(201,168,76,0.2)' : '1px solid transparent',
                }}
              >
                <span
                  className="block text-[11px] font-semibold tracking-wide"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: active ? '#C9A84C' : '#7A7368',
                  }}
                >
                  {g.name.replace('Mistérios ', '')}
                </span>
              </button>
            )
          })}
        </div>

        <label className="mt-4 block text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-3)' }}>
          Título (opcional)
        </label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex: Terço pelas famílias"
          maxLength={120}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none"
          style={{
            borderColor: 'rgba(201, 168, 76, 0.22)',
            backgroundColor: 'rgba(20, 18, 14, 0.8)',
            color: 'var(--text-1)',
          }}
        />

        <label className="mt-3 block text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-3)' }}>
          Intenção (opcional)
        </label>
        <input
          type="text"
          value={intencao}
          onChange={(e) => setIntencao(e.target.value)}
          placeholder="Ex: Pela saúde da família"
          maxLength={200}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none"
          style={{
            borderColor: 'rgba(201, 168, 76, 0.22)',
            backgroundColor: 'rgba(20, 18, 14, 0.8)',
            color: 'var(--text-1)',
          }}
        />

        <label className="mt-3 block text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-3)' }}>
          Período (opcional)
        </label>
        <input
          type="text"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          placeholder="Ex: 16/04 a 24/04"
          maxLength={60}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none"
          style={{
            borderColor: 'rgba(201, 168, 76, 0.22)',
            backgroundColor: 'rgba(20, 18, 14, 0.8)',
            color: 'var(--text-1)',
          }}
        />

        {createError && (
          <div
            className="mt-3 rounded-md border px-3 py-2 text-xs"
            role="alert"
            style={{
              borderColor: 'rgba(201, 100, 100, 0.45)',
              color: 'var(--text-1)',
              backgroundColor: 'rgba(70, 20, 20, 0.4)',
            }}
          >
            {createError}
          </div>
        )}

        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="mt-4 w-full rounded-lg px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 active:scale-[0.97]"
          style={{
            background: 'linear-gradient(180deg, #C9A84C, #A88437)',
            color: 'var(--accent-contrast)',
          }}
        >
          {creating ? 'Criando…' : 'Criar sala'}
        </button>
      </section>

      {/* Entrar em sala */}
      <section
        className="rounded-2xl border p-5"
        style={{
          borderColor: 'rgba(201, 168, 76, 0.22)',
          backgroundColor: 'rgba(20, 18, 14, 0.6)',
        }}
        aria-labelledby="juntos-entrar-titulo"
      >
        <h2
          id="juntos-entrar-titulo"
          className="text-sm font-semibold uppercase tracking-[0.2em]"
          style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
        >
          Entrar em uma sala
        </h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-3)' }}>
          Digite o código de 6 caracteres que o host compartilhou.
        </p>

        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="ABC123"
          maxLength={6}
          autoComplete="off"
          spellCheck={false}
          className="mt-4 w-full rounded-lg border px-3 py-3 text-center font-mono text-xl tracking-[0.4em] outline-none"
          style={{
            borderColor: 'rgba(201, 168, 76, 0.22)',
            backgroundColor: 'rgba(20, 18, 14, 0.8)',
            color: 'var(--text-1)',
          }}
          aria-label="Código da sala"
        />

        {joinError && (
          <div
            className="mt-3 rounded-md border px-3 py-2 text-xs"
            role="alert"
            style={{
              borderColor: 'rgba(201, 100, 100, 0.45)',
              color: 'var(--text-1)',
              backgroundColor: 'rgba(70, 20, 20, 0.4)',
            }}
          >
            {joinError}
          </div>
        )}

        <button
          type="button"
          onClick={handleJoin}
          disabled={joining || joinCode.length < 4}
          className="mt-4 w-full rounded-lg border px-5 py-2.5 text-sm font-semibold transition disabled:opacity-40 active:scale-[0.97]"
          style={{
            borderColor: 'rgba(201, 168, 76, 0.35)',
            color: 'var(--accent)',
          }}
        >
          {joining ? 'Entrando…' : 'Entrar'}
        </button>
      </section>
    </div>
  )
}
