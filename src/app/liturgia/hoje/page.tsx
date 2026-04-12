import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Music, Sparkles } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLiturgicalDay } from '@/lib/liturgical-calendar'
import type { LiturgiaDia, LeituraRef } from '@/types/liturgia'

/**
 * /liturgia/hoje — página completa das leituras do dia.
 *
 * Server Component que busca da tabela `liturgia_dia` (cache 24h). Se não
 * houver cache ou estiver velho, dispara a Edge Function `liturgia-scrape`
 * que cacheia e retorna. Em caso de falha total, cai no fallback local
 * (getLiturgicalDay) e mostra só o título/cor/tempo.
 *
 * Cabeçalho renderiza com a cor litúrgica do dia. Leituras formatadas
 * paragrafadas para leitura confortável em mobile.
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

function Paragrafo({ texto }: { texto: string }) {
  const pars = texto
    .split(/\n\n+|\n(?=[A-Z\-])/)
    .map(p => p.trim())
    .filter(Boolean)
  return (
    <div className="space-y-3">
      {pars.map((p, i) => (
        <p
          key={i}
          className="text-[15px] leading-relaxed"
          style={{ color: '#D4CCBE', fontFamily: 'Cormorant Garamond, serif' }}
        >
          {p}
        </p>
      ))}
    </div>
  )
}

function LeituraBlock({
  leitura,
  label,
  icon,
  accent,
}: {
  leitura: LeituraRef | null
  label: string
  icon: React.ReactNode
  accent: string
}) {
  if (!leitura) return null
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: `${accent}15`, color: accent }}
        >
          {icon}
        </span>
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
          >
            {label}
          </p>
          {leitura.referencia && (
            <p
              className="text-sm"
              style={{ color: accent, fontFamily: 'Poppins, sans-serif' }}
            >
              {leitura.referencia}
            </p>
          )}
        </div>
      </div>
      <Paragrafo texto={leitura.texto} />
    </section>
  )
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
    <>
      {/* Header sticky com cor litúrgica */}
      <header
        className="sticky top-0 z-20 backdrop-blur-md px-4 pt-4 pb-5 border-b"
        style={{
          background: bg,
          borderColor: `${accent}22`,
        }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-3 text-xs"
          style={{ color: '#A8A096', fontFamily: 'Poppins, sans-serif' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
          />
          <span
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
          >
            Liturgia de hoje · {localDay.season}
          </span>
        </div>
        <h1
          className="text-2xl leading-tight"
          style={{ color: '#F2EDE4', fontFamily: 'Cormorant Garamond, serif' }}
        >
          {titulo}
        </h1>
        <p
          className="text-sm capitalize mt-1"
          style={{ color: '#A8A096', fontFamily: 'Poppins, sans-serif' }}
        >
          {hoje}
        </p>

        {liturgia?.stale && (
          <p
            className="mt-2 text-[10px]"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
          >
            Conteúdo em cache — atualização indisponível no momento
          </p>
        )}
      </header>

      <article className="px-5 pt-6 pb-24 max-w-2xl mx-auto">
        {!liturgia ? (
          <div
            className="rounded-2xl p-5 text-center"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p
              className="text-sm"
              style={{ color: '#A8A096', fontFamily: 'Poppins, sans-serif' }}
            >
              Não foi possível carregar as leituras agora. Tente novamente
              em instantes.
            </p>
            <p
              className="mt-2 text-xs"
              style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
            >
              Fonte: Liturgia Diária — Canção Nova
            </p>
          </div>
        ) : (
          <>
            <LeituraBlock
              leitura={liturgia.primeira_leitura}
              label="Primeira Leitura"
              icon={<BookOpen className="w-4 h-4" />}
              accent={accent}
            />
            <LeituraBlock
              leitura={liturgia.salmo}
              label="Salmo Responsorial"
              icon={<Music className="w-4 h-4" />}
              accent={accent}
            />
            <LeituraBlock
              leitura={liturgia.segunda_leitura}
              label="Segunda Leitura"
              icon={<BookOpen className="w-4 h-4" />}
              accent={accent}
            />
            <LeituraBlock
              leitura={liturgia.aclamacao}
              label="Aclamação ao Evangelho"
              icon={<Sparkles className="w-4 h-4" />}
              accent={accent}
            />
            <LeituraBlock
              leitura={liturgia.evangelho}
              label="Evangelho"
              icon={<BookOpen className="w-4 h-4" />}
              accent={accent}
            />

            <footer
              className="mt-10 pt-6 border-t text-center"
              style={{ borderColor: 'rgba(201,168,76,0.12)' }}
            >
              <p
                className="text-[11px] tracking-wider"
                style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
              >
                Leituras extraídas da Liturgia Diária — Canção Nova
              </p>
            </footer>
          </>
        )}
      </article>
    </>
  )
}

export default function LiturgiaHojePage() {
  return (
    <main id="main-content" className="min-h-screen relative">
      <div className="bg-glow" />
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div
              className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }}
            />
          </div>
        }
      >
        <LiturgiaContent />
      </Suspense>
    </main>
  )
}
