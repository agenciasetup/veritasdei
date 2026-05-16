'use client'

import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react'
import type { UseRoomVoiceChatReturn } from '@/features/rosario/session/useRoomVoiceChat'

/**
 * Barra de controle de áudio em grupo (Frente 3).
 *
 * Estados:
 *   - Não-suportado (browser sem WebRTC) → bar oculta.
 *   - Não-conectado → CTA "Entrar com voz".
 *   - Conectado     → contagem de usuários ativos + botão de mute + sair.
 *   - Erro          → mensagem inline com retry.
 */
export function VoiceControlBar({ voice }: { voice: UseRoomVoiceChatReturn }) {
  if (!voice.supported) return null

  const onCount = voice.voiceJoinedUserIds.size
  const speakingCount = voice.speakingUserIds.size

  return (
    <section
      className="
        mx-auto mb-6 w-full max-w-md rounded-2xl border p-4
        md:max-w-lg md:p-5
        lg:max-w-3xl
      "
      style={{
        borderColor: 'var(--accent-soft)',
        backgroundColor: 'rgba(20, 18, 14, 0.55)',
      }}
      aria-label="Áudio em grupo"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
            style={{
              background: voice.joined
                ? voice.muted
                  ? 'rgba(122, 115, 104, 0.25)'
                  : 'var(--accent-soft)'
                : 'var(--surface-2)',
              border: `1px solid ${voice.joined ? 'var(--accent-soft)' : 'var(--border-1)'}`,
              color: voice.joined && !voice.muted ? 'var(--accent)' : 'var(--text-3)',
            }}
          >
            {voice.joining ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
            ) : voice.muted ? (
              <MicOff className="h-4 w-4" strokeWidth={1.8} />
            ) : (
              <Mic className="h-4 w-4" strokeWidth={1.8} />
            )}
          </span>

          <div className="flex min-w-0 flex-col leading-tight">
            <span
              className="text-[10px] uppercase tracking-[0.22em]"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
            >
              Áudio em grupo
            </span>
            <span className="text-sm" style={{ color: 'var(--text-1)' }}>
              {voice.joined
                ? `${onCount} ${onCount === 1 ? 'pessoa' : 'pessoas'} no áudio${
                    speakingCount > 0 ? ` · ${speakingCount} falando` : ''
                  }`
                : voice.joining
                  ? 'Solicitando microfone…'
                  : 'Reze junto, em voz alta'}
            </span>
          </div>
        </div>

        <div className="flex flex-shrink-0 gap-2">
          {voice.joined ? (
            <>
              <button
                type="button"
                onClick={voice.toggleMute}
                className="rounded-lg border px-3 py-2 text-xs transition active:scale-[0.97]"
                style={{
                  borderColor: voice.muted ? 'var(--accent)' : 'var(--accent-soft)',
                  color: voice.muted ? 'var(--accent)' : 'var(--text-2)',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
                aria-pressed={voice.muted}
              >
                {voice.muted ? 'Tirar mudo' : 'Mudo'}
              </button>
              <button
                type="button"
                onClick={voice.leaveVoice}
                className="rounded-lg border px-3 py-2 text-xs transition active:scale-[0.97]"
                style={{
                  borderColor: 'rgba(122, 115, 104, 0.4)',
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Sair
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void voice.joinVoice()}
              disabled={voice.joining}
              className="rounded-lg px-4 py-2 text-xs font-semibold transition active:scale-[0.97] disabled:opacity-60"
              style={{
                background: 'linear-gradient(180deg, #C9A84C, #A88437)',
                color: 'var(--accent-contrast)',
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Entrar com voz
            </button>
          )}
        </div>
      </div>

      {voice.error && (
        <div
          className="mt-3 flex items-start gap-2 rounded-md border px-3 py-2 text-xs"
          role="alert"
          style={{
            borderColor: 'color-mix(in srgb, var(--danger) 45%, transparent)',
            color: 'var(--text-1)',
            backgroundColor: 'rgba(70, 20, 20, 0.35)',
          }}
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span>{voice.error}</span>
        </div>
      )}
    </section>
  )
}
