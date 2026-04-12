/**
 * Funções puras de propósitos: cálculo de streak, progresso do período,
 * formatação de data local. Sem I/O. 100% testáveis.
 */

import type {
  Proposito,
  PropositoLog,
  PropositoCadencia,
  PropositoComProgresso,
} from '@/types/propositos'

/* ─── Datas em timezone local ─────────────────────────────────────── */

/**
 * Retorna 'YYYY-MM-DD' da data no timezone informado.
 * Usado para gravar `feito_em` alinhado ao dia do usuário.
 */
export function localDateString(date: Date = new Date(), timezone?: string): string {
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const y = parts.find(p => p.type === 'year')?.value ?? '1970'
  const m = parts.find(p => p.type === 'month')?.value ?? '01'
  const d = parts.find(p => p.type === 'day')?.value ?? '01'
  return `${y}-${m}-${d}`
}

export function parseLocalDate(yyyyMmDd: string): Date {
  const [y, m, d] = yyyyMmDd.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

/** Soma `days` dias a 'YYYY-MM-DD' e devolve nova string. */
export function addDaysString(yyyyMmDd: string, days: number): string {
  const base = parseLocalDate(yyyyMmDd)
  base.setDate(base.getDate() + days)
  const y = base.getFullYear()
  const m = String(base.getMonth() + 1).padStart(2, '0')
  const d = String(base.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Diferença de dias entre duas strings 'YYYY-MM-DD' (a - b). */
export function diffDays(a: string, b: string): number {
  const da = parseLocalDate(a).getTime()
  const db = parseLocalDate(b).getTime()
  return Math.round((da - db) / (1000 * 60 * 60 * 24))
}

/* ─── Janelas de período ──────────────────────────────────────────── */

/**
 * Início da semana (segunda-feira) para uma data — formato 'YYYY-MM-DD'.
 * Convenção católica/brasileira: semana começa na segunda.
 */
export function startOfWeek(dateStr: string): string {
  const d = parseLocalDate(dateStr)
  const day = d.getDay() // 0=dom..6=sáb
  const offset = day === 0 ? -6 : 1 - day // seg como início
  return addDaysString(dateStr, offset)
}

export function startOfMonth(dateStr: string): string {
  const [y, m] = dateStr.split('-')
  return `${y}-${m}-01`
}

/* ─── Progresso do período atual ──────────────────────────────────── */

/**
 * Quantos check-ins foram feitos no período atual conforme a cadência.
 * - 'diaria' → conta hoje (0 ou 1)
 * - 'semanal' → conta esta semana (seg→dom)
 * - 'mensal' → conta este mês
 * - 'dias_semana' → conta esta semana (idem semanal; a UI valida o dia)
 */
export function currentPeriodProgress(
  logs: PropositoLog[],
  cadencia: PropositoCadencia,
  today: string,
): number {
  if (logs.length === 0) return 0

  if (cadencia === 'diaria') {
    return logs.some(l => l.feito_em === today) ? 1 : 0
  }

  if (cadencia === 'semanal' || cadencia === 'dias_semana') {
    const inicio = startOfWeek(today)
    return logs.filter(l => l.feito_em >= inicio && l.feito_em <= today).length
  }

  if (cadencia === 'mensal') {
    const inicio = startOfMonth(today)
    return logs.filter(l => l.feito_em >= inicio && l.feito_em <= today).length
  }

  return 0
}

/* ─── Streak ──────────────────────────────────────────────────────── */

/**
 * Calcula a sequência de períodos consecutivos cumpridos.
 * - 'diaria' → dias consecutivos com log (inclui hoje ou ontem como âncora).
 * - 'semanal' → semanas consecutivas com pelo menos `meta` check-ins.
 * - 'mensal' → meses consecutivos com pelo menos `meta` check-ins.
 *
 * Se a pessoa perdeu o dia de hoje, o streak permanece válido até amanhã
 * (âncora = hoje ou ontem). A partir de 2 dias sem fazer, zera.
 */
export function computeStreak(
  logs: PropositoLog[],
  cadencia: PropositoCadencia,
  meta: number,
  today: string,
): number {
  if (logs.length === 0) return 0

  const datas = new Set(logs.map(l => l.feito_em))

  if (cadencia === 'diaria') {
    // âncora: hoje se feito, senão ontem (período de graça), senão 0
    let anchor: string | null = null
    if (datas.has(today)) anchor = today
    else if (datas.has(addDaysString(today, -1))) anchor = addDaysString(today, -1)
    else return 0

    let streak = 0
    let cursor = anchor
    while (datas.has(cursor)) {
      streak++
      cursor = addDaysString(cursor, -1)
    }
    return streak
  }

  if (cadencia === 'semanal' || cadencia === 'dias_semana') {
    let cursor = startOfWeek(today)
    let streak = 0
    // período atual só conta se já cumpriu a meta; senão começa pela semana passada
    const fimSemanaAtual = addDaysString(cursor, 6)
    const countAtual = logs.filter(l => l.feito_em >= cursor && l.feito_em <= fimSemanaAtual).length
    if (countAtual < meta) cursor = addDaysString(cursor, -7)

    for (let i = 0; i < 520; i++) {
      const fim = addDaysString(cursor, 6)
      const count = logs.filter(l => l.feito_em >= cursor && l.feito_em <= fim).length
      if (count >= meta) {
        streak++
        cursor = addDaysString(cursor, -7)
      } else {
        break
      }
    }
    return streak
  }

  if (cadencia === 'mensal') {
    let [y, m] = today.split('-').map(Number) as [number, number]
    let streak = 0
    for (let i = 0; i < 120; i++) {
      const inicio = `${y}-${String(m).padStart(2, '0')}-01`
      const ultimoDia = new Date(y, m, 0).getDate()
      const fim = `${y}-${String(m).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
      const count = logs.filter(l => l.feito_em >= inicio && l.feito_em <= fim).length

      if (count >= meta) {
        streak++
      } else if (streak > 0 || i > 0) {
        break
      }
      m--
      if (m === 0) {
        m = 12
        y--
      }
    }
    return streak
  }

  return 0
}

/* ─── Enriquecimento de propósito ─────────────────────────────────── */

export function enrichProposito(
  proposito: Proposito,
  logs: PropositoLog[],
  today: string,
): PropositoComProgresso {
  const logsOrdenados = [...logs].sort((a, b) => (a.feito_em < b.feito_em ? 1 : -1))
  return {
    ...proposito,
    periodo_atual: currentPeriodProgress(logs, proposito.cadencia, today),
    streak: computeStreak(logs, proposito.cadencia, proposito.meta_por_periodo, today),
    logs_recentes: logsOrdenados.slice(0, 30),
    feito_hoje: logs.some(l => l.feito_em === today),
  }
}

/* ─── Rótulos pra UI ──────────────────────────────────────────────── */

export function cadenciaLabel(cadencia: PropositoCadencia, meta: number): string {
  switch (cadencia) {
    case 'diaria':
      return 'todos os dias'
    case 'semanal':
      return meta > 1 ? `${meta}× por semana` : 'uma vez por semana'
    case 'mensal':
      return meta > 1 ? `${meta}× por mês` : 'uma vez por mês'
    case 'dias_semana':
      return 'em dias específicos'
  }
}

export function periodoAtualLabel(cadencia: PropositoCadencia): string {
  switch (cadencia) {
    case 'diaria':
      return 'hoje'
    case 'semanal':
    case 'dias_semana':
      return 'esta semana'
    case 'mensal':
      return 'este mês'
  }
}

/* ─── Propósitos sugeridos (seed lazy) ────────────────────────────── */

export interface PropositoSugerido {
  tipo: string
  titulo: string
  descricao: string
  cadencia: PropositoCadencia
  meta_por_periodo: number
  horario_sugerido: string | null
}

export const PROPOSITOS_SUGERIDOS: PropositoSugerido[] = [
  {
    tipo: 'rosario',
    titulo: 'Rezar o Santo Rosário',
    descricao: 'Um mistério por dia, em família ou sozinho.',
    cadencia: 'diaria',
    meta_por_periodo: 1,
    horario_sugerido: '18:00',
  },
  {
    tipo: 'confissao',
    titulo: 'Confessar-me',
    descricao: 'Sacramento da Penitência — meta mensal.',
    cadencia: 'mensal',
    meta_por_periodo: 1,
    horario_sugerido: null,
  },
  {
    tipo: 'missa',
    titulo: 'Participar da Santa Missa',
    descricao: 'Missa dominical ou diária — aprofundar a vida sacramental.',
    cadencia: 'semanal',
    meta_por_periodo: 1,
    horario_sugerido: null,
  },
]
