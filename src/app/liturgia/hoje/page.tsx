import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLiturgicalDay } from '@/lib/liturgical-calendar'
import type { LiturgiaDia } from '@/types/liturgia'
import LiturgiaReaderClient from '@/components/liturgia/LiturgiaReaderClient'

/**
 * /liturgia/hoje — página completa das leituras do dia.
 *
 * Server Component que busca da tabela `liturgia_dia` (cache 24h). Se não
 * houver cache ou estiver velho, dispara a Edge Function `liturgia-scrape`
 * que cacheia e retorna. Em caso de falha total, cai no fallback local
 * (getLiturgicalDay) e mostra só o título/cor/tempo.
 *
 * Renderização de leitura fica em um componente client dedicado:
 * tabs fixas, acessibilidade de navegação, controle de fonte e
 * formatação amigável de versículos.
 */

export const dynamic = 'force-dynamic'
export const revalidate = 3600

const COLOR_ACCENTS: Record<string, { accent: string; bg: string }> = {
  branco:   { accent: '#F2EDE4', bg: 'rgba(242,237,228,0.04)' },
  vermelho: { accent: '#D94F5C', bg: 'rgba(217,79,92,0.05)'  },
  verde:    { accent: '#66BB6A', bg: 'rgba(102,187,106,0.04)' },
  roxo:     { accent: '#BA68C8', bg: 'rgba(186,104,200,0.05)' },
  rosa:     { accent: '#F48FB1', bg: 'rgba(244,143,177,0.05)' },
}

function todayInBrazil(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

async function fetchLiturgia(data: string): Promise<LiturgiaDia | null> {
  const supabase = await createServerSupabaseClient()
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000

  // 1. Try cache
  const { data: cached } = await supabase
    .from('liturgia_dia')
    .select('*')
    .eq('data', data)
    .maybeSingle()

  if (cached) {
    const ageMs = Date.now() - new Date(cached.coletado_em as string).getTime()
    if (ageMs < CACHE_TTL_MS) return cached as LiturgiaDia
  }

  // 2. Trigger scrape (fire-and-use)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  if (!supabaseUrl) return (cached as LiturgiaDia) ?? null

  try {
    const res = await fetch(
      `${supabaseUrl}/functions/v1/liturgia-scrape?data=${data}`,
      {
        headers: { apikey: apiKey },
        next: { revalidate: 3600 },
      },
    )
    if (!res.ok) return (cached as LiturgiaDia) ?? null
    return (await res.json()) as LiturgiaDia
  } catch {
    return (cached as LiturgiaDia) ?? null
  }
}

async function LiturgiaContent() {
  const data = todayInBrazil()
  const liturgia = await fetchLiturgia(data)
  const localDay = getLiturgicalDay(new Date())
  const colorKey = localDay.color
  const accent = COLOR_ACCENTS[colorKey]?.accent ?? '#C9A84C'
  const bg = COLOR_ACCENTS[colorKey]?.bg ?? 'rgba(201,168,76,0.05)'

  const titulo = liturgia?.titulo || localDay.title || localDay.name

  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <LiturgiaReaderClient
      liturgia={liturgia}
      titulo={titulo}
      accent={accent}
      bg={bg}
      hoje={hoje}
      season={localDay.season}
    />
  )
}

export default function LiturgiaHojePage() {
  return (
    <main
      id="main-content"
      className="min-h-screen relative"
      style={{ background: 'var(--surface-1)' }}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div
              className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: 'var(--border-1)', borderTopColor: 'var(--accent)' }}
            />
          </div>
        }
      >
        <LiturgiaContent />
      </Suspense>
    </main>
  )
}
