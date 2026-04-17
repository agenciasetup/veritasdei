import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Limites diários por usuário para endpoints que consomem OpenAI.
 * Valores escolhidos pra cobrir uso normal com folga mas cortar abuso.
 * Free tier: 50 calls/dia por feature AI. Se virarmos planos pagos com
 * limite diferente, passar o cap dinâmico conforme o plano do user.
 */
export type AiFeature =
  | 'verbum_explain'
  | 'verbum_research'
  | 'search'
  | 'catechism'
  | 'liturgia_reflexao'

// Cap de tokens vem num sprint futuro — dependerá de função SQL separada
// pra não dobrar o contador de calls. Por ora só cap de calls, que já é
// suficiente pra impedir o pior caso (R$2.880/dia por conta).
const DEFAULT_CAPS: Record<AiFeature, { calls: number }> = {
  verbum_explain:    { calls: 50 },
  verbum_research:   { calls: 50 },
  search:            { calls: 100 },
  catechism:         { calls: 300 }, // read-only do DB, sem OpenAI
  liturgia_reflexao: { calls: 10 },  // 1x por dia basta; 10 dá margem
}

export interface BudgetResult {
  allowed: boolean
  callsToday: number
  tokensOutToday: number
  capCalls: number
  capTokensOut: number | null
}

/**
 * Reserva 1 chamada (incrementa contador atomicamente). Chamar ANTES da
 * request ao modelo — se allowed=false, retornar 429 sem gastar tokens.
 *
 * Após receber resposta do modelo, opcionalmente chamar `updateTokenUsage`
 * para registrar tokens reais (melhora accuracy do cap de tokens).
 */
export async function checkAndConsumeAiBudget(
  userId: string,
  feature: AiFeature,
): Promise<BudgetResult> {
  const admin = createAdminClient()
  const cap = DEFAULT_CAPS[feature]

  const { data, error } = await admin.rpc('ai_budget_check_and_consume', {
    p_user_id: userId,
    p_feature: feature,
    p_cap_calls: cap.calls,
    p_cap_tokens_out: null,
    p_tokens_in: 0,
    p_tokens_out: 0,
  })

  if (error || !data || !Array.isArray(data) || data.length === 0) {
    // Fail open em erro de infra — logar, mas não bloquear o user por
    // problema do nosso lado. O rate limit de minuto ainda limita abuso.
    console.warn(`[ai-budget] RPC error (feature=${feature}):`, error?.message)
    return {
      allowed: true,
      callsToday: 0,
      tokensOutToday: 0,
      capCalls: cap.calls,
      capTokensOut: null,
    }
  }

  const row = data[0] as {
    allowed: boolean
    calls_today: number
    tokens_out_today: number
    cap_calls: number
    cap_tokens_out: number | null
  }

  return {
    allowed: row.allowed,
    callsToday: row.calls_today,
    tokensOutToday: row.tokens_out_today,
    capCalls: row.cap_calls,
    capTokensOut: row.cap_tokens_out,
  }
}

