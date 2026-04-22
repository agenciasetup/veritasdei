import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { FestaHojeInfo } from '@/types/devocao'

const MESES_PT = [
  'janeiro', 'fevereiro', 'março', 'abril',
  'maio', 'junho', 'julho', 'agosto',
  'setembro', 'outubro', 'novembro', 'dezembro',
]

/**
 * Converte festa_mes + festa_dia em texto pt-BR legível.
 * "19 de março" (em vez de "03.19" formato GCatholic original).
 * Se festa for móvel, usa festa_movel direto.
 */
export function formatarFesta({
  festa_mes,
  festa_dia,
  festa_movel,
  festa_texto,
}: {
  festa_mes?: number | null
  festa_dia?: number | null
  festa_movel?: string | null
  festa_texto?: string | null
}): string | null {
  if (festa_mes && festa_dia) {
    const mes = MESES_PT[festa_mes - 1]
    if (!mes) return null
    return `${festa_dia} de ${mes}`
  }
  if (festa_movel) return festa_movel
  // Fallback: se festa_texto está em formato "DD de MES" já legível, usar
  if (festa_texto && /^\d{1,2}\s+de\s+/i.test(festa_texto)) return festa_texto
  if (festa_texto && !/^\d{2}\.\d{2}$/.test(festa_texto)) return festa_texto
  return null
}

export function diasEntre(hojeMes: number, hojeDia: number, festaMes: number, festaDia: number): number {
  // Usa ano corrente — suficiente para "está próximo" em janela de dias
  const ano = new Date().getUTCFullYear()
  const hoje = new Date(Date.UTC(ano, hojeMes - 1, hojeDia))
  let festa = new Date(Date.UTC(ano, festaMes - 1, festaDia))
  if (festa < hoje) {
    festa = new Date(Date.UTC(ano + 1, festaMes - 1, festaDia))
  }
  const MS_DIA = 24 * 60 * 60 * 1000
  return Math.round((festa.getTime() - hoje.getTime()) / MS_DIA)
}

export function hojeMesDia(tz = 'America/Sao_Paulo'): { mes: number; dia: number } {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now)
  const mes = Number(parts.find(p => p.type === 'month')?.value ?? NaN)
  const dia = Number(parts.find(p => p.type === 'day')?.value ?? NaN)
  return { mes, dia }
}

export async function getFestaInfoDoUsuario(
  userId: string,
): Promise<FestaHojeInfo | null> {
  const supabase = await createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('santo_devocao_id')
    .eq('id', userId)
    .maybeSingle()
  if (!profile?.santo_devocao_id) return null

  const { data: santo } = await supabase
    .from('santos')
    .select('id, slug, nome, invocacao, imagem_url, oracao_curta, festa_mes, festa_dia')
    .eq('id', profile.santo_devocao_id)
    .maybeSingle()
  if (!santo || !santo.festa_mes || !santo.festa_dia) return null

  const { mes, dia } = hojeMesDia()
  const dias = diasEntre(mes, dia, santo.festa_mes, santo.festa_dia)
  return {
    santo,
    diasAteFesta: dias,
    ehHoje: dias === 0,
    festaEm9Dias: dias > 0 && dias <= 9,
  }
}
