'use client'

/**
 * TodayStack — coluna vertical "do dia" pra plugar à direita do hero
 * na dashboard /educa (desktop col-span-8).
 *
 * Estilo flat editorial: superfícies sólidas em `--surface-2`, borda 5%
 * branco, dourado só em sublinhe / referência / "Retomar →". Tipografia
 * serifa nos títulos.
 *
 * Itens (ordem importa pra cadência espiritual):
 *   1. Rosário do dia (mistério pelo dia da semana)
 *   2. Liturgia do dia (cor litúrgica + evangelho ref)
 *   3. Continue de onde parou (se houver progresso)
 *
 * Mobile (< lg): some — o conteúdo já aparece em cards próprios na grid
 * mobile, então renderizar aqui geraria duplicata.
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, BookMarked, Heart, Play } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLastStudied } from '@/lib/content/useLastStudied'
import { getLiturgicalDay } from '@/lib/liturgical-calendar'
import type { LiturgiaDia } from '@/types/liturgia'

type MisterioTipo = 'gozosos' | 'dolorosos' | 'gloriosos' | 'luminosos'

const TIPO_POR_DIA: Record<number, MisterioTipo> = {
  0: 'gloriosos',
  1: 'gozosos',
  2: 'dolorosos',
  3: 'gloriosos',
  4: 'luminosos',
  5: 'dolorosos',
  6: 'gozosos',
}

const MISTERIO_NOME: Record<MisterioTipo, string> = {
  gozosos: 'Mistérios Gozosos',
  dolorosos: 'Mistérios Dolorosos',
  gloriosos: 'Mistérios Gloriosos',
  luminosos: 'Mistérios Luminosos',
}

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
        /* silencioso */
      })
    return () => controller.abort()
  }, [])
  return data
}

export default function TodayStack() {
  const { user } = useAuth()
  const { last: lastStudied } = useLastStudied(user?.id)
  const liturgia = useLiturgiaHoje()

  const today = new Date()
  const misterio = TIPO_POR_DIA[today.getDay()]
  const dia = getLiturgicalDay(today)
  const dot = COLOR_DOT[dia.color] ?? COLOR_DOT.verde
  const grade = GRADE_LABELS[dia.grade] ?? null
  const liturgiaTitle = liturgia?.titulo ?? dia.title ?? dia.name
  const evangelhoRef = liturgia?.evangelho?.referencia ?? null

  return (
    <div className="flex flex-col gap-3">
      {/* Rosário */}
      <Link
        href="/rosario"
        className="block rounded-[28px] p-6 transition-colors hover:bg-white/[0.01]"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <Heart className="w-5 h-5" style={{ color: 'var(--accent)' }} strokeWidth={1.6} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-xs"
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Rosário de hoje
            </p>
            <p
              className="text-lg leading-tight mt-0.5"
              style={{
                color: 'var(--text-1)',
                fontFamily: 'var(--font-elegant)',
                fontWeight: 500,
              }}
            >
              {MISTERIO_NOME[misterio]}
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1 text-[12px] flex-shrink-0"
            style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
          >
            Rezar
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>

      {/* Liturgia */}
      <Link
        href="/liturgia/hoje"
        className="block rounded-[28px] p-6 transition-colors hover:bg-white/[0.01]"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 relative"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <BookMarked
              className="w-5 h-5"
              style={{ color: 'var(--accent)' }}
              strokeWidth={1.6}
            />
            <span
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
              style={{ background: dot, boxShadow: `0 0 6px ${dot}80` }}
              aria-hidden
            />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-xs"
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Liturgia de hoje {grade ? `· ${grade}` : ''}
            </p>
            <p
              className="text-lg leading-tight mt-0.5 line-clamp-1"
              style={{
                color: 'var(--text-1)',
                fontFamily: 'var(--font-elegant)',
                fontWeight: 500,
              }}
            >
              {liturgiaTitle}
            </p>
            {evangelhoRef && (
              <p
                className="text-[11px] mt-0.5"
                style={{
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Evangelho · {evangelhoRef}
              </p>
            )}
          </div>
          <span
            className="inline-flex items-center gap-1 text-[12px] flex-shrink-0"
            style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
          >
            Ler
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>

      {/* Continue de onde parou */}
      {lastStudied && (
        <Link
          href={`/estudo/${lastStudied.groupSlug}`}
          className="block rounded-[28px] overflow-hidden transition-colors hover:bg-white/[0.01]"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {lastStudied.groupCoverUrl ? (
            <div className="flex items-stretch">
              <div
                className="w-32 flex-shrink-0 relative"
                style={{
                  backgroundImage: `url(${lastStudied.groupCoverUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div
                  aria-hidden
                  className="absolute inset-y-0 right-0 w-10"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, var(--surface-2) 100%)',
                  }}
                />
              </div>
              <div className="flex-1 p-5 flex items-center gap-3 min-w-0">
                <div className="min-w-0 flex-1">
                  <p
                    className="text-xs"
                    style={{
                      color: 'var(--text-3)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    Continue de onde parou
                  </p>
                  <p
                    className="text-lg leading-tight mt-0.5 line-clamp-1"
                    style={{
                      color: 'var(--text-1)',
                      fontFamily: 'var(--font-elegant)',
                      fontWeight: 500,
                    }}
                  >
                    {lastStudied.subtopicTitle}
                  </p>
                  <p
                    className="text-[11px] mt-0.5"
                    style={{
                      color: 'var(--text-3)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {lastStudied.groupTitle}
                  </p>
                </div>
                <span
                  className="inline-flex items-center gap-1 text-[12px] flex-shrink-0"
                  style={{
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Retomar
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <Play
                  className="w-4 h-4"
                  style={{ color: 'var(--accent)' }}
                  strokeWidth={1.6}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="text-xs"
                  style={{
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Continue de onde parou
                </p>
                <p
                  className="text-lg leading-tight mt-0.5 line-clamp-1"
                  style={{
                    color: 'var(--text-1)',
                    fontFamily: 'var(--font-elegant)',
                    fontWeight: 500,
                  }}
                >
                  {lastStudied.subtopicTitle}
                </p>
                <p
                  className="text-[11px] mt-0.5"
                  style={{
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {lastStudied.groupTitle}
                </p>
              </div>
              <span
                className="inline-flex items-center gap-1 text-[12px] flex-shrink-0"
                style={{
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Retomar
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          )}
        </Link>
      )}
    </div>
  )
}
