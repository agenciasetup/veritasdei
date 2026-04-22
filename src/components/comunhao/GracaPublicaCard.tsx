'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import BotaoReportar from './BotaoReportar'
import type { GracaPublica } from '@/types/comunhao'

export default function GracaPublicaCard({ graca }: { graca: GracaPublica }) {
  return (
    <article
      className="rounded-xl p-4"
      style={{
        background: 'rgba(201,168,76,0.06)',
        border: '1px solid rgba(201,168,76,0.22)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        {graca.autor_avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={graca.autor_avatar}
            alt=""
            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="w-6 h-6 rounded-full flex-shrink-0"
            style={{ background: 'rgba(242,237,228,0.1)' }}
          />
        )}
        <span
          className="text-xs truncate"
          style={{ color: 'rgba(242,237,228,0.85)', fontFamily: 'Poppins, sans-serif' }}
        >
          {graca.autor_nome || 'Um irmão'}
        </span>
        <span
          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ml-auto"
          style={{
            background: 'rgba(201,168,76,0.18)',
            color: '#C9A84C',
            fontFamily: 'Poppins, sans-serif',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          <Sparkles className="w-2.5 h-2.5" />
          Graça recebida
        </span>
      </div>

      <p
        className="whitespace-pre-wrap text-sm mb-2"
        style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', lineHeight: 1.55 }}
      >
        {graca.texto}
      </p>

      {graca.reflexao_graca && (
        <blockquote
          className="whitespace-pre-wrap italic mt-2 pl-3 text-sm"
          style={{
            borderLeft: '2px solid rgba(201,168,76,0.4)',
            color: 'rgba(242,237,228,0.8)',
            fontFamily: 'Cormorant Garamond, serif',
            lineHeight: 1.55,
          }}
        >
          {graca.reflexao_graca}
        </blockquote>
      )}

      {graca.santo_slug && graca.santo_nome && (
        <div className="mt-3">
          <Link
            href={`/santos/${graca.santo_slug}`}
            className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full"
            style={{
              background: 'rgba(201,168,76,0.1)',
              color: 'rgba(201,168,76,0.85)',
              fontFamily: 'Poppins, sans-serif',
              textDecoration: 'none',
            }}
          >
            Pela intercessão de {graca.santo_nome}
          </Link>
        </div>
      )}

      <div
        className="flex items-center justify-between mt-3 pt-3"
        style={{ borderTop: '1px solid rgba(201,168,76,0.18)' }}
      >
        <p
          className="text-[10px] italic"
          style={{ color: 'rgba(242,237,228,0.45)', fontFamily: 'Poppins, sans-serif', lineHeight: 1.5 }}
        >
          Testemunho pessoal. A Igreja reconhece milagres por processo canônico formal.
        </p>
        <BotaoReportar conteudoTipo="intencao_publica" conteudoId={graca.id} />
      </div>
    </article>
  )
}
