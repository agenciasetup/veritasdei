'use client'

/**
 * DashboardLiturgiaCard — versão flat editorial do dia litúrgico.
 *
 * Camada 1 (sempre disponível): cor / grade / título locais via
 *   getLiturgicalDay() — não depende de rede.
 * Camada 2 (best-effort): puxa /api/liturgia/hoje em background; quando
 *   chega, exibe a referência do Evangelho num chip discreto.
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, BookMarked } from 'lucide-react'
import { getLiturgicalDay } from '@/lib/liturgical-calendar'
import type { LiturgiaDia } from '@/types/liturgia'

const COLOR_DOT: Record<string, string> = {
  branco: '#F2EDE4',
  vermelho: '#D94F5C',
  verde: '#66BB6A',
  roxo: '#BA68C8',
  rosa: '#F48FB1',
}

const GRADE_LABELS: Record<string, string> = {
  solenidade: 'Solenidade',
  festa: 'Festa',
  memorial: 'Memória',
  memorial_facultativo: 'Memória facultativa',
  feria: 'Féria',
}

function useLiturgiaHoje(): LiturgiaDia | null {
  const [data, setData] = useState<LiturgiaDia | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    void fetch('/api/liturgia/hoje', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: LiturgiaDia | null) => {
        if (json) setData(json)
      })
      .catch(() => {
        /* silencioso — temos fallback local */
      })
    return () => controller.abort()
  }, [])
  return data
}

export default function DashboardLiturgiaCard() {
  const day = getLiturgicalDay(new Date())
  const liturgia = useLiturgiaHoje()
  const dot = COLOR_DOT[day.color] ?? COLOR_DOT.verde
  const grade = GRADE_LABELS[day.grade] ?? null
  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const heading = liturgia?.titulo ?? day.title ?? day.name
  const evangelhoRef = liturgia?.evangelho?.referencia ?? null

  return (
    <Link
      href="/liturgia/hoje"
      className="block h-full rounded-[24px] p-6 lg:p-7 transition-colors hover:bg-white/[0.01]"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <BookMarked
              className="w-4 h-4"
              style={{ color: 'var(--accent)' }}
              strokeWidth={1.6}
            />
          </div>
          <p
            className="text-xs"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Liturgia de hoje
          </p>
          <span
            className="ml-auto inline-block w-2 h-2 rounded-full"
            style={{ background: dot, boxShadow: `0 0 6px ${dot}80` }}
            aria-hidden
          />
        </div>

        <p
          className="text-xl lg:text-2xl leading-tight mt-3 line-clamp-2"
          style={{
            color: 'var(--text-1)',
            fontFamily: 'var(--font-elegant)',
            fontWeight: 500,
          }}
        >
          {heading}
        </p>

        <p
          className="text-xs capitalize mt-1.5"
          style={{
            color: 'var(--text-3)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {hoje}
          {grade ? ` · ${grade}` : ''}
        </p>

        {evangelhoRef && (
          <div
            className="mt-4 flex items-baseline gap-2"
            style={{
              color: 'var(--text-2)',
              fontFamily: 'var(--font-body)',
            }}
          >
            <span
              className="text-[11px]"
              style={{ color: 'var(--text-3)' }}
            >
              Evangelho
            </span>
            <span className="text-[13px]" style={{ color: 'var(--text-1)' }}>
              {evangelhoRef}
            </span>
          </div>
        )}

        <div className="mt-auto pt-5 flex items-center justify-between">
          <span
            className="text-[11px] truncate"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {day.season}
          </span>
          <span
            className="inline-flex items-center gap-1.5 text-sm"
            style={{
              color: 'var(--accent)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Ler liturgia
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
