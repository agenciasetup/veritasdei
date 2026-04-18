'use client'

import { ArrowLeft, Wrench } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'

type PageProps = {
  params: Promise<{ id: string }>
}

/**
 * Placeholder do editor — implementado em sprints seguintes da Fase 2.
 * Por enquanto só lê e mostra a oração que vai ser editada, pra
 * validar que a rota e navegação funcionam.
 */
export default function EditorPage({ params }: PageProps) {
  const { id } = use(params)
  const [prayer, setPrayer] = useState<{
    title: string | null
    slug: string | null
    visible: boolean
  } | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return
    supabase
      .from('content_items')
      .select('title, slug, visible')
      .eq('id', id)
      .maybeSingle()
      .then((res: { data: { title: string | null; slug: string | null; visible: boolean } | null }) => {
        if (res.data) setPrayer(res.data)
        else setNotFound(true)
      })
  }, [id])

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Link
          href="/admin/oracoes"
          aria-label="Voltar"
          className="inline-flex items-center justify-center rounded-lg w-9 h-9 transition-colors active:scale-90"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(201,168,76,0.15)',
            color: '#8A8378',
          }}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: '1.25rem',
              color: '#F2EDE4',
              fontWeight: 600,
              letterSpacing: '0.03em',
            }}
          >
            {prayer?.title ?? (notFound ? 'Oração não encontrada' : 'Carregando…')}
          </h1>
          {prayer?.slug && (
            <p
              className="text-xs mt-0.5"
              style={{
                fontFamily: 'Poppins, sans-serif',
                color: '#8A8378',
                letterSpacing: '0.04em',
              }}
            >
              /oracoes/{prayer.slug} · {prayer.visible ? 'Publicada' : 'Rascunho'}
            </p>
          )}
        </div>
      </header>

      <div
        className="rounded-2xl p-8 flex flex-col items-center text-center gap-3"
        style={{
          background: 'rgba(20,18,14,0.4)',
          border: '1px dashed rgba(201,168,76,0.2)',
        }}
      >
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            width: 48,
            height: 48,
            background: 'rgba(201,168,76,0.08)',
            color: '#C9A84C',
          }}
        >
          <Wrench className="w-5 h-5" />
        </div>
        <h2
          style={{
            fontFamily: 'Cinzel, serif',
            fontSize: '1rem',
            color: '#F2EDE4',
            fontWeight: 600,
          }}
        >
          Editor visual em construção
        </h2>
        <p
          className="text-sm max-w-md"
          style={{
            fontFamily: 'Poppins, sans-serif',
            color: '#8A8378',
            lineHeight: 1.55,
          }}
        >
          O canvas de blocos arrastáveis chega no próximo sprint da Fase 2.
          Enquanto isso, o conteúdo pode ser editado via{' '}
          <Link
            href="/admin/conteudos"
            className="underline"
            style={{ color: '#C9A84C' }}
          >
            /admin/conteudos
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
