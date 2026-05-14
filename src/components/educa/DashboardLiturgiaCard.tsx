'use client'

/**
 * DashboardLiturgiaCard — versão compacta do dia litúrgico em GlassCard.
 *
 * Camada 1 (sempre disponível): cor / grade / título calculados localmente
 *   por `getLiturgicalDay()` — não depende de rede.
 * Camada 2 (best-effort): puxa a referência do Evangelho do dia da
 *   `/api/liturgia/hoje` (cacheada 24h no DB + 1h no Next). Quando volta,
 *   exibe inline. Se falha ou demora, o card já estava útil sem isso.
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, BookMarked } from 'lucide-react'
import { getLiturgicalDay } from '@/lib/liturgical-calendar'
import type { LiturgiaDia } from '@/types/liturgia'
import GlassCard from './GlassCard'

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
  const grade = GRADE_LABELS[day.grade] ?? 'Liturgia diária'
  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  // Preferimos o título oficial da liturgia (do scrape) se disponível,
  // mas como pode chegar com ALL CAPS ou frase longa, mantemos fallback
  // pro nome calculado localmente quando o scrape ainda não voltou.
  const heading = liturgia?.titulo ?? day.title ?? day.name
  const evangelhoRef = liturgia?.evangelho?.referencia ?? null

  return (
    <Link href="/liturgia/hoje" className="block h-full">
      <GlassCard variant="flat" interactive className="h-full">
        <div className="relative p-5 md:p-6 h-full flex flex-col">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              background: `radial-gradient(110% 60% at 0% 0%, ${dot}26 0%, transparent 55%)`,
              mixBlendMode: 'screen',
            }}
          />

          <div className="relative flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: dot, boxShadow: `0 0 8px ${dot}80` }}
              />
              <span
                className="text-[10px] tracking-[0.2em] uppercase"
                style={{
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-display)',
                  opacity: 0.85,
                }}
              >
                Liturgia de hoje
              </span>
            </div>
            <span
              className="text-[9px] uppercase px-2 py-0.5 rounded-full tracking-[0.12em]"
              style={{
                color: 'var(--text-2)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.06)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {grade}
            </span>
          </div>

          <p
            className="relative text-lg md:text-xl leading-tight mb-1.5 line-clamp-2"
            style={{
              color: 'var(--text-1)',
              fontFamily: 'var(--font-elegant)',
              fontWeight: 500,
            }}
          >
            {heading}
          </p>

          <p
            className="relative text-xs capitalize"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {hoje}
          </p>

          {evangelhoRef && (
            <div
              className="relative mt-3 flex items-start gap-2 px-3 py-2 rounded-xl"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border:
                  '1px solid color-mix(in srgb, var(--accent) 12%, transparent)',
              }}
            >
              <BookMarked
                className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                style={{ color: 'var(--accent)' }}
              />
              <div className="min-w-0">
                <p
                  className="text-[9px] tracking-[0.18em] uppercase"
                  style={{
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-display)',
                    opacity: 0.85,
                  }}
                >
                  Evangelho
                </p>
                <p
                  className="text-[12px] truncate"
                  style={{
                    color: 'var(--text-2)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {evangelhoRef}
                </p>
              </div>
            </div>
          )}

          <div className="relative flex items-center justify-between mt-auto pt-4 gap-2">
            <span
              className="text-[11px] truncate"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              {day.season}
            </span>
            <span
              className="inline-flex items-center gap-1 text-[11px]"
              style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
            >
              Ler
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </GlassCard>
    </Link>
  )
}
