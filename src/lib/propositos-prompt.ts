/**
 * Helpers puros pra decidir quando perguntar ao usuário se ele já cumpriu
 * cada propósito. Sem I/O — leitura/escrita de localStorage fica no hook.
 *
 * Regra geral:
 *   - Pergunta no MÁXIMO uma vez por dia para cada propósito.
 *   - Se já houve check-in no período atual → nunca pergunta.
 *   - Se a pessoa respondeu "Lembrar depois" → re-pergunta só no dia seguinte.
 *   - Se respondeu "Ainda não" → não insiste mais nesse período.
 */

import { startOfMonth, startOfWeek } from '@/lib/propositos'
import type { PropositoComProgresso } from '@/types/propositos'

/** Chave do período atual conforme a cadência (granularidade do "ciclo"). */
export function periodoKey(p: PropositoComProgresso, today: string): string {
  if (p.cadencia === 'diaria') return today
  if (p.cadencia === 'semanal' || p.cadencia === 'dias_semana') return startOfWeek(today)
  if (p.cadencia === 'mensal') return startOfMonth(today)
  return today
}

/**
 * Resposta possível do usuário ao prompt.
 * - 'fiz' → faz check-in e marca o período como respondido
 * - 'ainda_nao' → não pergunta mais nesse período
 * - 'lembrar' → re-pergunta amanhã (mas ainda dentro do período)
 */
export type RespostaPrompt = 'fiz' | 'ainda_nao' | 'lembrar'

export interface PromptStateEntry {
  /** chave do período em que respondeu por último */
  periodo: string
  /** dia em que respondeu por último (YYYY-MM-DD) */
  dia: string
  /** resposta dada */
  resposta: RespostaPrompt
}

/** Estado salvo em localStorage: {propositoId: PromptStateEntry} */
export type PromptState = Record<string, PromptStateEntry>

/**
 * Decide se devemos perguntar sobre este propósito agora.
 *
 * Critérios:
 *   1. Propósito precisa estar ativo.
 *   2. Não pode ter check-in no período atual.
 *   3. Para cadências semanal/mensal: já tendo cumprido a meta, não pergunta.
 *   4. Não pode ter respondido hoje (qualquer resposta dá "1 vez por dia").
 *   5. Se a última resposta foi "ainda_nao" no mesmo período → skip
 *      até virar o período.
 */
export function devePerguntar(
  p: PropositoComProgresso,
  state: PromptState,
  today: string,
): boolean {
  if (!p.ativo) return false
  if (p.feito_hoje) return false

  // Para cadências de período, se já bateu a meta → não pergunta
  if (p.cadencia !== 'diaria' && p.periodo_atual >= p.meta_por_periodo) {
    return false
  }

  const periodoAtual = periodoKey(p, today)
  const entry = state[p.id]
  if (!entry) return true

  // Já respondeu hoje? Skip (1× por dia).
  if (entry.dia === today) return false

  // Disse "ainda não" no mesmo período? Não insiste até virar o período.
  if (entry.resposta === 'ainda_nao' && entry.periodo === periodoAtual) {
    return false
  }

  return true
}

/** Filtra a lista para os que devem ser perguntados agora. */
export function selecionarParaPrompt(
  propositos: PropositoComProgresso[],
  state: PromptState,
  today: string,
): PropositoComProgresso[] {
  return propositos.filter(p => devePerguntar(p, state, today))
}
