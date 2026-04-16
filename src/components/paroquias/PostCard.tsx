'use client'

import { Calendar } from 'lucide-react'
import type { ParoquiaPost } from '@/types/paroquia'

interface Props {
  post: ParoquiaPost
  paroquiaNome?: string
}

/**
 * Visual card for a single church feed post ("aviso").
 */
export default function PostCard({ post, paroquiaNome }: Props) {
  const date = new Date(post.published_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <article
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(16,16,16,0.7)',
        border: '1px solid rgba(201,168,76,0.1)',
      }}
    >
      {post.imagem_url && (
        <div className="rounded-xl overflow-hidden mb-4" style={{ maxHeight: 360 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.imagem_url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex items-center gap-2 text-xs mb-2" style={{ color: '#7A7368' }}>
        <Calendar className="w-3 h-3" style={{ color: '#C9A84C' }} />
        <span style={{ fontFamily: 'Poppins, sans-serif' }}>{date}</span>
        {paroquiaNome && (
          <>
            <span>•</span>
            <span style={{ fontFamily: 'Poppins, sans-serif' }}>{paroquiaNome}</span>
          </>
        )}
      </div>
      <h3
        className="text-lg font-bold mb-2"
        style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
      >
        {post.titulo}
      </h3>
      <p
        className="text-sm whitespace-pre-wrap"
        style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif', lineHeight: 1.6 }}
      >
        {post.conteudo}
      </p>
    </article>
  )
}
