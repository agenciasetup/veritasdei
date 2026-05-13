'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Users, Link2, Cross, Crown, ArrowLeft } from 'lucide-react'
import { useProduct } from '@/contexts/ProductContext'

type PrayerMode = 'individual' | 'grupo' | 'entrar'
type PrayerType = 'terco' | 'rosario'

interface Props {
  onStartIndividual: (type: PrayerType) => void
}

export function RosaryDashboard({ onStartIndividual }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<PrayerMode>('individual')
  const [type, setType] = useState<PrayerType>('terco')
  const [roomCode, setRoomCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  // No subdomínio Educa, o link "Voltar" não pode ir pra /orar (hub do
  // Veritas full, fora da whitelist) — vai pra /educa.
  const { isEduca } = useProduct()
  const backHref = isEduca ? '/educa' : '/orar'

  async function handleJoinRoom() {
    const code = roomCode.trim().toUpperCase()
    if (code.length < 4) return
    setJoining(true)
    setJoinError(null)

    try {
      const res = await fetch(`/api/rosario/rooms/${code}/join`, {
        method: 'POST',
      })
      if (res.status === 401) {
        router.push(`/login?redirectTo=/rosario/juntos/${code}`)
        return
      }
      if (!res.ok) {
        const data = await res.json()
        setJoinError(data.error === 'room_not_found' ? 'Sala não encontrada' : data.error ?? 'Erro ao entrar')
        return
      }
      router.push(`/rosario/juntos/${code}`)
    } catch {
      setJoinError('Erro de conexão')
    } finally {
      setJoining(false)
    }
  }

  function handleStart() {
    if (mode === 'individual') {
      onStartIndividual(type)
    } else if (mode === 'grupo') {
      router.push(`/rosario/juntos?type=${type}`)
    } else if (mode === 'entrar') {
      handleJoinRoom()
    }
  }

  return (
    <div className="relative z-10 mx-auto max-w-xl px-4 py-10 md:py-14">
      <div className="bg-glow" aria-hidden />

      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm mb-4 relative z-10"
        style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <header className="mb-8 text-center relative z-10">
        <h1
          className="text-3xl md:text-4xl"
          style={{ color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}
        >
          Santo Rosário
        </h1>
        <p className="mt-2 text-xs md:text-sm" style={{ color: 'var(--text-3)' }}>
          Medite os mistérios da vida de Cristo com Nossa Senhora
        </p>
        <div className="ornament-divider max-w-xs mx-auto mt-4">
          <span>&#10022;</span>
        </div>
      </header>

      <div className="relative z-10 flex flex-col gap-5">
        {/* Step 1: Mode */}
        <section>
          <h2
            className="text-[10px] uppercase tracking-[0.2em] mb-3"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            1. Como deseja rezar?
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <ModeButton
              label="Sozinho"
              description="Oração individual"
              icon={<User size={22} strokeWidth={1.5} />}
              selected={mode === 'individual'}
              onClick={() => setMode('individual')}
            />
            <ModeButton
              label="Em grupo"
              description="Crie uma sala"
              icon={<Users size={22} strokeWidth={1.5} />}
              selected={mode === 'grupo'}
              onClick={() => setMode('grupo')}
            />
          </div>
          <button
            type="button"
            onClick={() => setMode('entrar')}
            className="w-full mt-2 rounded-xl px-4 py-3 text-left transition active:scale-[0.98]"
            style={{
              background: mode === 'entrar'
                ? 'var(--accent-soft)'
                : 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${mode === 'entrar' ? 'var(--accent-soft)' : 'var(--border-1)'}`,
            }}
          >
            <span className="flex items-center gap-3">
              <Link2 size={20} strokeWidth={1.5} style={{ color: mode === 'entrar' ? 'var(--accent)' : 'var(--text-3)' }} />
              <span>
                <span
                  className="block text-sm"
                  style={{ color: mode === 'entrar' ? 'var(--text-1)' : 'var(--text-2)' }}
                >
                  Entrar numa sala
                </span>
                <span className="block text-[11px]" style={{ color: 'var(--text-3)' }}>
                  Use um código ou link de convite
                </span>
              </span>
            </span>
          </button>
        </section>

        {/* Step 2: Type (only for individual/grupo) */}
        {mode !== 'entrar' && (
          <section>
            <h2
              className="text-[10px] uppercase tracking-[0.2em] mb-3"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              2. O que deseja rezar?
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <ModeButton
                label="Terço"
                description="5 dezenas · 1 mistério"
                icon={<Cross size={22} strokeWidth={1.5} />}
                selected={type === 'terco'}
                onClick={() => setType('terco')}
              />
              <ModeButton
                label="Rosário"
                description="20 dezenas · 4 mistérios"
                icon={<Crown size={22} strokeWidth={1.5} />}
                selected={type === 'rosario'}
                onClick={() => setType('rosario')}
              />
            </div>
          </section>
        )}

        {/* Join room input (when mode is "entrar") */}
        {mode === 'entrar' && (
          <section>
            <h2
              className="text-[10px] uppercase tracking-[0.2em] mb-3"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              Código da sala
            </h2>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ABC123"
              maxLength={6}
              className="w-full rounded-xl px-4 py-3 text-center text-xl font-mono tracking-[0.3em] uppercase outline-none transition"
              style={{
                background: 'rgba(20, 18, 14, 0.6)',
                border: '1px solid rgba(201, 168, 76, 0.2)',
                color: 'var(--text-1)',
              }}
              aria-label="Código da sala"
            />
            <p className="mt-2 text-[11px] text-center" style={{ color: 'var(--text-3)' }}>
              Ou cole o link completo da sala
            </p>
            {joinError && (
              <p className="mt-2 text-xs text-center" role="alert" style={{ color: 'var(--danger)' }}>
                {joinError}
              </p>
            )}
          </section>
        )}

        {/* CTA */}
        <button
          type="button"
          onClick={handleStart}
          disabled={mode === 'entrar' && (roomCode.trim().length < 4 || joining)}
          className="w-full rounded-xl py-4 text-base font-semibold transition active:scale-[0.97] disabled:opacity-40"
          style={{
            background: 'linear-gradient(180deg, #C9A84C, #A88437)',
            color: 'var(--accent-contrast)',
          }}
        >
          {mode === 'entrar'
            ? joining ? 'Entrando...' : 'Entrar na sala'
            : mode === 'grupo'
              ? 'Criar sala'
              : 'Começar a rezar'}
        </button>

        {/* Quick links */}
        <div className="flex justify-center gap-4 mt-2">
          <Link
            href="/rosario/historico"
            className="text-xs transition"
            style={{ color: 'var(--text-3)' }}
          >
            Histórico
          </Link>
          <span style={{ color: 'var(--border-1)' }}>·</span>
          <Link
            href="/rosario/juntos"
            className="text-xs transition"
            style={{ color: 'var(--text-3)' }}
          >
            Minhas salas
          </Link>
        </div>
      </div>
    </div>
  )
}

function ModeButton({
  label,
  description,
  icon,
  selected,
  onClick,
}: {
  label: string
  description: string
  icon: ReactNode
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl px-4 py-4 text-left transition active:scale-[0.97]"
      style={{
        background: selected
          ? 'var(--accent-soft)'
          : 'rgba(255, 255, 255, 0.02)',
        border: `1px solid ${selected ? 'var(--accent-soft)' : 'var(--border-1)'}`,
      }}
    >
      <span className="block mb-2" style={{ color: selected ? 'var(--accent)' : 'var(--text-3)' }}>
        {icon}
      </span>
      <span
        className="block text-sm font-medium"
        style={{ color: selected ? 'var(--text-1)' : 'var(--text-2)' }}
      >
        {label}
      </span>
      <span className="block text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>
        {description}
      </span>
    </button>
  )
}
