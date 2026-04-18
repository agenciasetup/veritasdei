'use client'

import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/**
 * Audio player minimalista para gravações de oração.
 *
 * Integração básica: play/pause, barra de progresso clicável,
 * tempo atual / duração. Usa HTMLAudioElement sem dependências.
 *
 * Visual: surface vítrea com acento dourado, coerente com os
 * outros átomos da página.
 */
export default function AudioPlayer({ src, title }: { src: string; title?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrent(audio.currentTime)
    const onDur = () => setDuration(audio.duration || 0)
    const onEnded = () => setPlaying(false)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onDur)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onDur)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      try {
        await audio.play()
        setPlaying(true)
      } catch {
        /* autoplay blocked or load error */
      }
    }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audio.currentTime = ratio * duration
    setCurrent(audio.currentTime)
  }

  const pct = duration > 0 ? (current / duration) * 100 : 0

  return (
    <div
      className="flex items-center gap-3 rounded-2xl p-3"
      style={{
        background: 'rgba(20,18,14,0.55)',
        border: '1px solid rgba(201,168,76,0.18)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pausar áudio' : 'Ouvir oração'}
        className="flex items-center justify-center rounded-full shrink-0 active:scale-95 transition-transform"
        style={{
          width: 44,
          height: 44,
          background: 'linear-gradient(135deg, #D9C077, #A88B3A)',
          boxShadow: '0 4px 14px rgba(201,168,76,0.35)',
        }}
      >
        {playing ? (
          <Pause className="w-5 h-5" style={{ color: '#0F0E0C' }} fill="#0F0E0C" />
        ) : (
          <Play className="w-5 h-5 ml-0.5" style={{ color: '#0F0E0C' }} fill="#0F0E0C" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        {title && (
          <p
            className="truncate"
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 12,
              color: 'var(--text-secondary)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            {title}
          </p>
        )}
        <div
          role="slider"
          tabIndex={0}
          aria-label="Progresso do áudio"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(current)}
          onClick={seek}
          onKeyDown={(e) => {
            const audio = audioRef.current
            if (!audio) return
            if (e.key === 'ArrowRight') audio.currentTime = Math.min(duration, audio.currentTime + 5)
            if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 5)
          }}
          className="relative h-1 rounded-full cursor-pointer"
          style={{ background: 'rgba(201,168,76,0.15)' }}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{ width: `${pct}%`, background: 'var(--gold)' }}
          />
        </div>
        <div
          className="flex justify-between"
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: 11,
            color: 'var(--text-muted)',
            marginTop: 4,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span>{fmtTime(current)}</span>
          <span>{duration ? fmtTime(duration) : '—:—'}</span>
        </div>
      </div>
    </div>
  )
}

function fmtTime(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const r = Math.floor(s % 60)
  return `${m}:${r.toString().padStart(2, '0')}`
}
