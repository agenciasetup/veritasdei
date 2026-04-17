import { NextRequest, NextResponse } from 'next/server'
import { getLiturgicalDay } from '@/lib/liturgical-calendar'
import { openai } from '@/lib/openai/client'
import { rateLimit } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { sanitizeLiturgicalText } from '@/lib/liturgia/text'
import type { LiturgiaDia } from '@/types/liturgia'

export const dynamic = 'force-dynamic'

interface ReflectionPayload {
  liturgia?: LiturgiaDia
  titulo?: string
  season?: string
  hoje?: string
}

interface ReflectionData {
  titulo: string
  conexao: string
  mensagem: string
  aplicacao: string
  oracao: string
  pontos: string[]
}

interface ReflectionRow {
  data: string
  status: 'generating' | 'ready' | 'error'
  titulo_liturgia: string | null
  tempo_liturgico: string | null
  modelo: string | null
  prompt_version: number
  reflexao: ReflectionData | null
  generated_at: string | null
  lock_expires_at: string | null
  error_message: string | null
}

interface KnowledgeEntry {
  topic: string
  category: string
  summary: string
  core_teaching: string
  catechism_references: string | null
  tradition_notes: string | null
}

const LOCK_TTL_MS = 90_000
const WAIT_READY_MS = 20_000
const POLL_INTERVAL_MS = 1_250
const PROMPT_VERSION = 1
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 40

const PT_STOPWORDS = new Set([
  'a', 'ao', 'aos', 'as', 'com', 'da', 'das', 'de', 'do', 'dos', 'e', 'em', 'na', 'nas', 'no', 'nos', 'o',
  'os', 'para', 'por', 'que', 'se', 'sem', 'um', 'uma', 'uns', 'umas', 'é', 'foi', 'ser', 'sao', 'não',
  'mais', 'como', 'quando', 'onde', 'porque', 'sobre', 'entre', 'ainda', 'todo', 'toda', 'todos', 'todas',
])

function clip(text: string, max = 5000): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}…`
}

function todayInBrazil(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function formatBrazilianDate(dateIso: string): string {
  const [year, month, day] = dateIso.split('-').map(Number)
  const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12, 0, 0))
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}

function normalizeForKeywords(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function extractLiturgicalKeywords(input: string): string[] {
  const words = normalizeForKeywords(input)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 5 && !PT_STOPWORDS.has(word))

  return [...new Set(words)].slice(0, 14)
}

function toSection(label: string, referencia?: string | null, texto?: string | null): string {
  const sanitized = sanitizeLiturgicalText(texto ?? '')
  if (!sanitized) return `${label}: (indisponível)`
  const ref = referencia?.trim() ? ` [${referencia.trim()}]` : ''
  return `${label}${ref}\n${clip(sanitized)}`
}

function getRequesterIp(req: NextRequest): string {
  const xForwardedFor = req.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    const first = xForwardedFor.split(',')[0]?.trim()
    if (first) return first
  }

  const realIp = req.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  return 'unknown'
}

function normalizeReflection(value: Partial<ReflectionData> | null, tituloBase: string): ReflectionData {
  return {
    titulo: value?.titulo?.trim() || `Reflexão — ${tituloBase}`,
    conexao:
      value?.conexao?.trim() ||
      'As leituras convergem para um chamado concreto de conversão, confiança e fidelidade ao Senhor.',
    mensagem:
      value?.mensagem?.trim() ||
      'Hoje, Cristo nos chama a viver a fé com caridade, verdade e perseverança na vida diária.',
    aplicacao:
      value?.aplicacao?.trim() ||
      'Escolha um gesto prático de obediência ao Evangelho e mantenha-o com constância ao longo do dia.',
    oracao:
      value?.oracao?.trim() ||
      'Senhor Jesus, dá-me um coração dócil à tua Palavra e firme na tua vontade. Amém.',
    pontos: Array.isArray(value?.pontos)
      ? value!.pontos.filter((item) => typeof item === 'string' && item.trim()).slice(0, 5)
      : [],
  }
}

function parseCachedReflection(row: ReflectionRow): ReflectionData | null {
  const raw = row.reflexao
  if (!raw || typeof raw !== 'object') return null

  const tituloBase = row.titulo_liturgia?.trim() || 'Liturgia do dia'
  return normalizeReflection(raw as Partial<ReflectionData>, tituloBase)
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function waitForReady(admin: ReturnType<typeof createAdminClient>, date: string): Promise<ReflectionRow | null> {
  const deadline = Date.now() + WAIT_READY_MS

  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS)

    const { data } = await admin
      .from('liturgia_reflexao_dia')
      .select('*')
      .eq('data', date)
      .maybeSingle()

    const row = data as ReflectionRow | null
    if (!row) continue

    if (row.status === 'ready' || row.status === 'error') {
      return row
    }

    if (row.lock_expires_at && new Date(row.lock_expires_at).getTime() <= Date.now()) {
      return row
    }
  }

  return null
}

async function loadKnowledgeContext(
  admin: ReturnType<typeof createAdminClient>,
  liturgia: LiturgiaDia,
  titulo: string,
  season: string,
): Promise<string | null> {
  const keywordInput = [
    titulo,
    season,
    liturgia.primeira_leitura?.referencia,
    liturgia.segunda_leitura?.referencia,
    liturgia.salmo?.referencia,
    liturgia.evangelho?.referencia,
    clip(sanitizeLiturgicalText(liturgia.primeira_leitura?.texto ?? ''), 450),
    clip(sanitizeLiturgicalText(liturgia.evangelho?.texto ?? ''), 450),
  ]
    .filter(Boolean)
    .join(' ')

  const keywords = extractLiturgicalKeywords(keywordInput)
  if (!keywords.length) return null

  const { data } = await admin
    .from('ai_knowledge_base')
    .select('topic, category, summary, core_teaching, catechism_references, tradition_notes')
    .eq('status', 'active')
    .overlaps('keywords', keywords)
    .limit(3)

  const entries = (data ?? []) as KnowledgeEntry[]
  if (!entries.length) return null

  return entries
    .map((entry, index) => {
      const catechism = entry.catechism_references?.trim()
      const tradition = entry.tradition_notes?.trim()

      return [
        `${index + 1}. ${entry.topic} (${entry.category})`,
        `Ensino: ${clip(entry.core_teaching ?? '', 320)}`,
        `Resumo: ${clip(entry.summary ?? '', 220)}`,
        catechism ? `Catecismo: ${clip(catechism, 160)}` : null,
        tradition ? `Tradição: ${clip(tradition, 140)}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n\n')
}

async function generateReflection(params: {
  liturgia: LiturgiaDia
  titulo: string
  season: string
  hoje: string
  knowledgeContext: string | null
}): Promise<{ reflection: ReflectionData; model: string }> {
  const { liturgia, titulo, season, hoje, knowledgeContext } = params

  const userPrompt = [
    `Data: ${hoje}`,
    `Tempo litúrgico: ${season}`,
    `Título litúrgico: ${titulo}`,
    '',
    toSection('Primeira Leitura', liturgia.primeira_leitura?.referencia, liturgia.primeira_leitura?.texto),
    '',
    toSection('Salmo Responsorial', liturgia.salmo?.referencia, liturgia.salmo?.texto),
    '',
    toSection('Segunda Leitura', liturgia.segunda_leitura?.referencia, liturgia.segunda_leitura?.texto),
    '',
    toSection('Aclamação ao Evangelho', liturgia.aclamacao?.referencia, liturgia.aclamacao?.texto),
    '',
    toSection('Evangelho', liturgia.evangelho?.referencia, liturgia.evangelho?.texto),
    knowledgeContext
      ? `\nContexto doutrinal opcional (usar apenas quando realmente pertinente):\n${knowledgeContext}`
      : '',
  ]
    .filter(Boolean)
    .join('\n')

  const primaryModel = process.env.OPENAI_LITURGIA_REFLECTION_MODEL || 'gpt-4o'
  const fallbackModel = process.env.OPENAI_LITURGIA_REFLECTION_FALLBACK_MODEL || 'gpt-4o-mini'

  const runModel = async (model: string) => {
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.25,
      max_tokens: 1100,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'Você é um assistente católico para Reflexão da Liturgia Diária.',
            'Seja integralmente fiel ao Magistério, Catecismo, Tradição e Sagrada Escritura.',
            'Não invente leituras, referências, datas ou citações.',
            'Faça um paralelo orgânico entre Primeira Leitura, Salmo, Segunda Leitura (se houver) e Evangelho.',
            'Entregue linguagem pastoral, clara e reverente, em português do Brasil.',
            'Retorne JSON estrito no formato:',
            '{',
            '  "titulo": string,',
            '  "conexao": string,',
            '  "mensagem": string,',
            '  "aplicacao": string,',
            '  "oracao": string,',
            '  "pontos": string[]',
            '}',
            'Campos obrigatórios: conexao, aplicacao, oracao.',
          ].join(' '),
        },
        { role: 'user', content: userPrompt },
      ],
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Resposta vazia da IA.')

    return JSON.parse(content) as Partial<ReflectionData>
  }

  try {
    const parsed = await runModel(primaryModel)
    return {
      reflection: normalizeReflection(parsed, titulo),
      model: primaryModel,
    }
  } catch (error) {
    if (fallbackModel === primaryModel) throw error

    const parsed = await runModel(fallbackModel)
    return {
      reflection: normalizeReflection(parsed, titulo),
      model: fallbackModel,
    }
  }
}

async function handleReflection(req: NextRequest, payload?: ReflectionPayload) {
  let admin: ReturnType<typeof createAdminClient> | null = null
  let dateForError: string | null = null

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Serviço de reflexão indisponível no momento.' }, { status: 503 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Configuração do servidor incompleta para reflexão diária.' }, { status: 503 })
    }

    const requesterIp = getRequesterIp(req)
    if (!(await rateLimit(`liturgia-reflexao:${requesterIp}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS))) {
      return NextResponse.json({ error: 'Muitas requisições. Tente novamente em instantes.' }, { status: 429 })
    }

    admin = createAdminClient()
    const date = todayInBrazil()
    dateForError = date
    const now = new Date()
    const nowIso = now.toISOString()
    const lockExpiresAt = new Date(now.getTime() + LOCK_TTL_MS).toISOString()

    const { data: existingRaw } = await admin
      .from('liturgia_reflexao_dia')
      .select('*')
      .eq('data', date)
      .maybeSingle()

    let row = existingRaw as ReflectionRow | null

    if (row?.status === 'ready') {
      const cached = parseCachedReflection(row)
      if (cached) {
        return NextResponse.json(cached, {
          headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
        })
      }

      await admin
        .from('liturgia_reflexao_dia')
        .update({ status: 'error', error_message: 'Cache inválido para reflexão do dia.' })
        .eq('data', date)
    }

    if (row?.status === 'ready') {
      const cached = parseCachedReflection(row)
      if (cached) {
        return NextResponse.json(cached, {
          headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
        })
      }
    }

    if (row?.status === 'generating' && row.lock_expires_at && new Date(row.lock_expires_at).getTime() > Date.now()) {
      const waited = await waitForReady(admin, date)
      if (waited?.status === 'ready') {
        const cached = parseCachedReflection(waited)
        if (!cached) {
          await admin
            .from('liturgia_reflexao_dia')
            .update({ status: 'error', error_message: 'Cache inválido para reflexão do dia.' })
            .eq('data', date)
        } else {
          return NextResponse.json(cached, {
            headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
          })
        }
      }
      row = waited ?? row
    }

    if (row?.status === 'ready') {
      const cached = parseCachedReflection(row)
      if (cached) {
        return NextResponse.json(cached, {
          headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
        })
      }
    }

    let shouldGenerate = false

    if (!row) {
      const { data: inserted, error: insertError } = await admin
        .from('liturgia_reflexao_dia')
        .insert({
          data: date,
          status: 'generating',
          lock_expires_at: lockExpiresAt,
          prompt_version: PROMPT_VERSION,
        })
        .select('*')
        .maybeSingle()

      if (!insertError && inserted) {
        row = inserted as ReflectionRow
        shouldGenerate = true
      } else if (insertError?.code === '23505') {
        const { data: conflictRow } = await admin
          .from('liturgia_reflexao_dia')
          .select('*')
          .eq('data', date)
          .maybeSingle()

        row = (conflictRow as ReflectionRow | null) ?? null
      } else if (insertError) {
        throw insertError
      }
    }

    if (!shouldGenerate && row?.status === 'error') {
      const { data: claimed } = await admin
        .from('liturgia_reflexao_dia')
        .update({
          status: 'generating',
          lock_expires_at: lockExpiresAt,
          error_message: null,
          prompt_version: PROMPT_VERSION,
        })
        .eq('data', date)
        .eq('status', 'error')
        .select('*')
        .maybeSingle()

      if (claimed) {
        shouldGenerate = true
        row = claimed as ReflectionRow
      }
    }

    if (!shouldGenerate && row?.status === 'generating') {
      const { data: claimed } = await admin
        .from('liturgia_reflexao_dia')
        .update({
          lock_expires_at: lockExpiresAt,
          error_message: null,
          prompt_version: PROMPT_VERSION,
        })
        .eq('data', date)
        .eq('status', 'generating')
        .lt('lock_expires_at', nowIso)
        .select('*')
        .maybeSingle()

      if (claimed) {
        shouldGenerate = true
        row = claimed as ReflectionRow
      }
    }

    if (!shouldGenerate) {
      const waitedAgain = await waitForReady(admin, date)
      if (waitedAgain?.status === 'ready') {
        const cached = parseCachedReflection(waitedAgain)
        if (cached) {
          return NextResponse.json(cached, {
            headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
          })
        }
      }

      if (waitedAgain?.status === 'error') {
        return NextResponse.json(
          { error: waitedAgain.error_message || 'Falha ao gerar a reflexão diária.' },
          { status: 503 },
        )
      }

      return NextResponse.json(
        { error: 'A reflexão do dia está sendo preparada. Tente novamente em alguns segundos.' },
        { status: 503 },
      )
    }

    const liturgia = payload?.liturgia
      ? {
          ...payload.liturgia,
          primeira_leitura: payload.liturgia.primeira_leitura
            ? {
                ...payload.liturgia.primeira_leitura,
                texto: sanitizeLiturgicalText(payload.liturgia.primeira_leitura.texto ?? ''),
              }
            : null,
          salmo: payload.liturgia.salmo
            ? { ...payload.liturgia.salmo, texto: sanitizeLiturgicalText(payload.liturgia.salmo.texto ?? '') }
            : null,
          segunda_leitura: payload.liturgia.segunda_leitura
            ? {
                ...payload.liturgia.segunda_leitura,
                texto: sanitizeLiturgicalText(payload.liturgia.segunda_leitura.texto ?? ''),
              }
            : null,
          aclamacao: payload.liturgia.aclamacao
            ? {
                ...payload.liturgia.aclamacao,
                texto: sanitizeLiturgicalText(payload.liturgia.aclamacao.texto ?? ''),
              }
            : null,
          evangelho: payload.liturgia.evangelho
            ? { ...payload.liturgia.evangelho, texto: sanitizeLiturgicalText(payload.liturgia.evangelho.texto ?? '') }
            : null,
        }
      : null

    let liturgiaDoDia = liturgia
    if (!liturgiaDoDia) {
      const { data: liturgiaRow } = await admin
        .from('liturgia_dia')
        .select('*')
        .eq('data', date)
        .maybeSingle()

      liturgiaDoDia = (liturgiaRow as LiturgiaDia | null) ?? null
    }

    if (!liturgiaDoDia) {
      await admin
        .from('liturgia_reflexao_dia')
        .update({
          status: 'error',
          lock_expires_at: null,
          error_message: 'Liturgia indisponível para gerar reflexão diária.',
        })
        .eq('data', date)

      return NextResponse.json({ error: 'Liturgia indisponível para gerar reflexão diária.' }, { status: 503 })
    }

    const [year, month, day] = date.split('-').map(Number)
    const liturgicalDate = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12, 0, 0))
    const liturgicalDay = getLiturgicalDay(liturgicalDate)

    const titulo = (payload?.titulo || liturgiaDoDia.titulo || liturgicalDay.title || liturgicalDay.name || '').trim()
    const season = (payload?.season || liturgicalDay.season || 'tempo comum').trim()
    const hoje = (payload?.hoje || formatBrazilianDate(date)).trim()

    const knowledgeContext = await loadKnowledgeContext(admin, liturgiaDoDia, titulo, season)
    const { reflection, model } = await generateReflection({
      liturgia: liturgiaDoDia,
      titulo,
      season,
      hoje,
      knowledgeContext,
    })

    await admin
      .from('liturgia_reflexao_dia')
      .update({
        status: 'ready',
        titulo_liturgia: titulo,
        tempo_liturgico: season,
        modelo: model,
        prompt_version: PROMPT_VERSION,
        reflexao: reflection,
        generated_at: new Date().toISOString(),
        lock_expires_at: null,
        error_message: null,
      })
      .eq('data', date)

    return NextResponse.json(reflection, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    if (admin && dateForError) {
      await admin
        .from('liturgia_reflexao_dia')
        .update({
          status: 'error',
          lock_expires_at: null,
          error_message: clip(error instanceof Error ? error.message : 'Falha na geração da reflexão.', 350),
        })
        .eq('data', dateForError)
    }

    console.error('[api/liturgia/reflexao] Error:', error)
    return NextResponse.json({ error: 'Erro ao gerar reflexão.' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return handleReflection(req)
}

export async function POST(req: NextRequest) {
  let payload: ReflectionPayload | undefined

  try {
    payload = (await req.json()) as ReflectionPayload
  } catch {
    payload = undefined
  }

  return handleReflection(req, payload)
}
