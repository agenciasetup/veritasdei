import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { FestaHojeInfo } from '@/types/devocao'

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
