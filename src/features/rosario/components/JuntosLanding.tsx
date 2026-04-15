'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { MYSTERY_GROUPS, getMysteryForToday } from '@/features/rosario/data/mysteries'
import type { MysterySet } from '@/features/rosario/data/types'
import type { RosaryRoomSnapshot } from '@/features/rosario/data/historyTypes'

/**
 * `<JuntosLanding />` — ponto de entrada do terço compartilhado.
 *
 * Dois caminhos lado a lado:
 *   - Criar uma sala: usuário vira host, escolhe mistérios, recebe
 *     um código de convite e é redirecionado pra sala.
 *   - Entrar em sala: cola o código de 6 chars e é redirecionado.
 *
 * Ambos os fluxos usam os route handlers do sprint 3.2. Erros da API
 * são exibidos inline; nada de redirect em cima de falha.
 */
export function JuntosLanding() {
  const router = useRouter()
  const [mysterySet, setMysterySet] = useState<MysterySet>(
    () => getMysteryForToday().id,
  )
  const [titulo, setTitulo] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

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
      router.push(`/rosario/juntos/${data.room.codigo}`)
    } catch {
      setCreateError('Erro de rede. Verifique sua conexão.')
    } finally {
      setCreating(false)
    }
  }, [mysterySet, titulo, router])

  const handleJoin = useCallback(async () => {
    const codigo = joinCode.trim().toUpperCase()
    if (codigo.length !== 6) {
      setJoinError('Digite o código de 6 caracteres.')
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
          style={{ color: '#D9C077', fontFamily: 'Cinzel, serif' }}
        >
          Criar uma sala
        </h2>
        <p className="mt-1 text-xs" style={{ color: '#7A7368' }}>
          Você vira o host e pode convidar outros pelo código gerado.
        </p>

        <label className="mt-4 block text-[10px] uppercase tracking-[0.2em]" style={{ color: '#7A7368' }}>
          Mistérios
        </label>
        <div
          className="mt-2 flex gap-1.5 rounded-xl p-1.5"
          role="radiogroup"
          aria-label="Mistérios da sala"
          style={{
            background: 'rgba(20,18,14,0.6)',
            border: '1px solid rgba(201,168,76,0.08)',
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
                    fontFamily: 'Cinzel, serif',
                    color: active ? '#C9A84C' : '#7A7368',
                  }}
                >
                  {g.name.replace('Mistérios ', '')}
                </span>
              </button>
            )
          })}
        </div>

        <label className="mt-4 block text-[10px] uppercase tracking-[0.2em]" style={{ color: '#7A7368' }}>
          Título (opcional)
        </label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex: Terço pelas famílias"
          maxLength={120}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: 'rgba(201, 168, 76, 0.22)',
            backgroundColor: 'rgba(20, 18, 14, 0.8)',
            color: '#F2EDE4',
          }}
        />

        {createError && (
          <div
            className="mt-3 rounded-md border px-3 py-2 text-xs"
            role="alert"
            style={{
              borderColor: 'rgba(201, 100, 100, 0.45)',
              color: '#F2EDE4',
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
          className="mt-4 w-full rounded-lg px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60"
          style={{
            background: 'linear-gradient(180deg, #C9A84C, #A88437)',
            color: '#0F0E0C',
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
          style={{ color: '#D9C077', fontFamily: 'Cinzel, serif' }}
        >
          Entrar em uma sala
        </h2>
        <p className="mt-1 text-xs" style={{ color: '#7A7368' }}>
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
          className="mt-4 w-full rounded-lg border px-3 py-3 text-center font-mono text-xl tracking-[0.4em]"
          style={{
            borderColor: 'rgba(201, 168, 76, 0.22)',
            backgroundColor: 'rgba(20, 18, 14, 0.8)',
            color: '#F2EDE4',
          }}
          aria-label="Código da sala"
        />

        {joinError && (
          <div
            className="mt-3 rounded-md border px-3 py-2 text-xs"
            role="alert"
            style={{
              borderColor: 'rgba(201, 100, 100, 0.45)',
              color: '#F2EDE4',
              backgroundColor: 'rgba(70, 20, 20, 0.4)',
            }}
          >
            {joinError}
          </div>
        )}

        <button
          type="button"
          onClick={handleJoin}
          disabled={joining || joinCode.length !== 6}
          className="mt-4 w-full rounded-lg border px-5 py-2.5 text-sm font-semibold transition disabled:opacity-40"
          style={{
            borderColor: 'rgba(201, 168, 76, 0.35)',
            color: '#D9C077',
          }}
        >
          {joining ? 'Entrando…' : 'Entrar'}
        </button>
      </section>
    </div>
  )
}
