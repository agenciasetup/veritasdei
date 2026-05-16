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

  const ctaLabel =
    mode === 'entrar'
      ? joining ? 'Entrando…' : 'Entrar na sala'
      : mode === 'grupo'
        ? 'Criar sala'
        : 'Começar a rezar'

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="bg-glow" aria-hidden />

      {/* Back link — top-left, always visible */}
      <Link
        href={backHref}
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 text-sm transition md:left-8 md:top-6"
        style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div
        className="
          relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-16
          md:px-8 md:py-20
          lg:flex-row lg:items-center lg:gap-16 lg:py-12
        "
      >
        {/* ───────── HERO COLUMN (left on desktop, top on mobile) ───────── */}
        <header className="mb-10 text-center lg:mb-0 lg:flex-1 lg:text-left">
          <p
            className="mb-4 text-[10px] uppercase tracking-[0.4em] md:text-[11px]"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
          >
            Oração contemplativa
          </p>
          <h1
            className="text-4xl leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl"
            style={{
              color: 'var(--text-1)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.01em',
            }}
          >
            Santo Rosário
          </h1>
          <p
            className="mx-auto mt-5 max-w-md text-sm leading-relaxed md:text-base lg:mx-0 lg:max-w-lg lg:text-lg"
            style={{
              color: 'var(--text-2)',
              fontFamily: 'var(--font-elegant)',
            }}
          >
            Medite os mistérios da vida de Cristo com Nossa Senhora.
            <span className="hidden md:inline"> Sozinho ou em comunhão com irmãos, em português ou no rito latino.</span>
          </p>

          <div
            className="mx-auto mt-6 hidden h-px max-w-xs lg:mx-0 lg:block lg:max-w-md"
            style={{
              background: 'linear-gradient(90deg, transparent, var(--accent-soft) 20%, var(--accent-soft) 80%, transparent)',
            }}
            aria-hidden
          />

          <div className="ornament-divider mx-auto mt-6 max-w-xs lg:hidden">
            <span>&#10022;</span>
          </div>

          {/* Quick links — desktop sidebar style, mobile inline below */}
          <div className="mt-6 hidden flex-wrap gap-x-5 gap-y-2 lg:flex" aria-label="Atalhos">
            <Link
              href="/rosario/tematicos"
              className="text-xs uppercase tracking-[0.2em] transition hover:opacity-100"
              style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
            >
              Terços Temáticos →
            </Link>
            <span style={{ color: 'var(--border-1)' }}>·</span>
            <Link
              href="/rosario/historico"
              className="text-xs uppercase tracking-[0.2em] transition hover:opacity-100"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)', opacity: 0.85 }}
            >
              Histórico
            </Link>
            <span style={{ color: 'var(--border-1)' }}>·</span>
            <Link
              href="/rosario/juntos"
              className="text-xs uppercase tracking-[0.2em] transition hover:opacity-100"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)', opacity: 0.85 }}
            >
              Minhas salas
            </Link>
          </div>
        </header>

        {/* ───────── CHOICE PANEL (right on desktop, bottom on mobile) ───────── */}
        <section
          className="
            relative w-full
            lg:flex-shrink-0 lg:max-w-xl
          "
          aria-label="Configurar sessão"
        >
          {/* Decorative rounded panel on desktop, transparent on mobile */}
          <div
            className="
              flex flex-col gap-6
              lg:rounded-3xl lg:border lg:p-8
            "
            style={{
              borderColor: 'var(--border-1)',
              background: 'transparent',
            }}
          >
            {/* Step 1: Mode */}
            <section>
              <h2
                className="mb-3 text-[10px] uppercase tracking-[0.25em] md:text-[11px]"
                style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
              >
                <span style={{ color: 'var(--accent)' }}>1.</span> Como deseja rezar?
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
                className="mt-2 w-full rounded-xl px-4 py-3 text-left transition active:scale-[0.98]"
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

            {/* Step 2: Type */}
            {mode !== 'entrar' && (
              <section>
                <h2
                  className="mb-3 text-[10px] uppercase tracking-[0.25em] md:text-[11px]"
                  style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
                >
                  <span style={{ color: 'var(--accent)' }}>2.</span> O que deseja rezar?
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

            {/* Join room input */}
            {mode === 'entrar' && (
              <section>
                <h2
                  className="mb-3 text-[10px] uppercase tracking-[0.25em] md:text-[11px]"
                  style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
                >
                  Código da sala
                </h2>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full rounded-xl px-4 py-4 text-center font-mono text-2xl uppercase tracking-[0.35em] outline-none transition"
                  style={{
                    background: 'rgba(20, 18, 14, 0.6)',
                    border: '1px solid rgba(201, 168, 76, 0.22)',
                    color: 'var(--text-1)',
                  }}
                  aria-label="Código da sala"
                />
                <p className="mt-2 text-center text-[11px]" style={{ color: 'var(--text-3)' }}>
                  Ou cole o link completo da sala
                </p>
                {joinError && (
                  <p className="mt-2 text-center text-xs" role="alert" style={{ color: 'var(--danger)' }}>
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
              className="
                w-full rounded-xl py-4 text-base font-semibold transition
                active:scale-[0.97] disabled:opacity-40 md:py-5 md:text-lg
              "
              style={{
                background: 'linear-gradient(180deg, #C9A84C, #A88437)',
                color: 'var(--accent-contrast)',
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                boxShadow: '0 8px 32px -12px rgba(201, 168, 76, 0.4)',
              }}
            >
              {ctaLabel}
            </button>
          </div>

          {/* Mobile quick links (visible below the panel on small screens) */}
          <div className="mt-6 flex flex-wrap justify-center gap-3 lg:hidden">
            <Link
              href="/rosario/tematicos"
              className="text-xs transition"
              style={{ color: 'var(--accent)' }}
            >
              Terços Temáticos →
            </Link>
            <span style={{ color: 'var(--border-1)' }}>·</span>
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
        </section>
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
      <span className="mb-2 block" style={{ color: selected ? 'var(--accent)' : 'var(--text-3)' }}>
        {icon}
      </span>
      <span
        className="block text-sm font-medium"
        style={{ color: selected ? 'var(--text-1)' : 'var(--text-2)' }}
      >
        {label}
      </span>
      <span className="mt-0.5 block text-[11px]" style={{ color: 'var(--text-3)' }}>
        {description}
      </span>
    </button>
  )
}
