'use client'

import { Play } from 'lucide-react'
import { useState } from 'react'

/**
 * Embed de YouTube que NÃO carrega o iframe até o primeiro clique.
 * Poster = thumbnail CDN do YT (grátis, sem rastreamento até o play).
 *
 * Aceita URLs nos formatos:
 *   https://www.youtube.com/watch?v=ID
 *   https://youtu.be/ID
 *   https://www.youtube.com/embed/ID
 */
export default function YoutubeLazyEmbed({ url, title }: { url: string; title?: string }) {
  const [loaded, setLoaded] = useState(false)
  const videoId = parseYoutubeId(url)
  if (!videoId) return null

  const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`

  if (loaded) {
    return (
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          aspectRatio: '16 / 9',
          background: '#000',
          border: '1px solid rgba(201,168,76,0.2)',
        }}
      >
        <iframe
          src={embedUrl}
          title={title ?? 'Vídeo'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      aria-label={title ? `Reproduzir: ${title}` : 'Reproduzir vídeo'}
      className="relative block w-full rounded-2xl overflow-hidden group active:scale-[0.99] transition-transform"
      style={{
        aspectRatio: '16 / 9',
        border: '1px solid rgba(201,168,76,0.2)',
        background: '#000',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnail}
        alt={title ?? 'Thumbnail do vídeo'}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="flex items-center justify-center rounded-full group-hover:scale-105 transition-transform"
          style={{
            width: 64,
            height: 64,
            background: 'linear-gradient(135deg, #D9C077, #A88B3A)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
          }}
        >
          <Play className="w-7 h-7 ml-1" style={{ color: '#0F0E0C' }} fill="#0F0E0C" />
        </div>
      </div>
      {title && (
        <div
          className="absolute bottom-0 left-0 right-0 p-3 pt-8"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
          }}
        >
          <p
            className="truncate"
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 13,
              color: '#F2EDE4',
              fontWeight: 500,
            }}
          >
            {title}
          </p>
        </div>
      )}
    </button>
  )
}

function parseYoutubeId(raw: string): string | null {
  if (!raw) return null
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
    /youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
  ]
  for (const p of patterns) {
    const m = raw.match(p)
    if (m) return m[1]
  }
  // Já pode ser só o ID (11 chars típicos)
  if (/^[a-zA-Z0-9_-]{6,15}$/.test(raw.trim())) return raw.trim()
  return null
}
