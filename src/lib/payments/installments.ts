/**
 * Cálculo de parcelamento no cartão.
 *
 * Regras (decididas com o produto):
 *  - Mensal:    sempre 1x (cobrança recorrente; não faz sentido parcelar
 *               algo que já é cobrado mês a mês).
 *  - Semestral: 1x ou parcelar em até 6x.
 *  - Anual:     1x ou parcelar em até 12x.
 *  - Único:     até `installmentsMax` configurado em billing_checkout_settings.
 *
 * Juros: 2,49% ao mês, juros SIMPLES, repassados ao cliente. Sem juros
 * para 1x. Fórmula:
 *
 *   total_com_juros = base * (1 + tax * (n - 1))
 *   parcela          = total_com_juros / n
 *
 * Ex: anual R$179, 12x  → total = 179 * (1 + 0.0249 * 11) = R$227,03
 *                        parcela = R$18,92
 */

export const INSTALLMENT_MONTHLY_RATE = 0.0249

export type Intervalo = 'mensal' | 'semestral' | 'anual' | 'unico'

export function maxInstallments(
  intervalo: Intervalo,
  installmentsMaxSetting: number,
): number {
  if (intervalo === 'mensal') return 1
  if (intervalo === 'semestral') return Math.min(6, installmentsMaxSetting)
  if (intervalo === 'anual') return Math.min(12, installmentsMaxSetting)
  return Math.max(1, installmentsMaxSetting)
}

/**
 * Retorna o total com juros (em centavos) para `n` parcelas.
 * Para n=1, devolve o valor base sem juros.
 */
export function totalWithInterest(baseCents: number, n: number): number {
  if (n <= 1) return baseCents
  const factor = 1 + INSTALLMENT_MONTHLY_RATE * (n - 1)
  return Math.round(baseCents * factor)
}

/**
 * Valor de cada parcela (em centavos) — divide o total com juros pelo
 * número de parcelas. Arredondamento pode dar diferença de 1 centavo
 * na última parcela; o gateway resolve isso.
 */
export function installmentValue(baseCents: number, n: number): number {
  if (n <= 1) return baseCents
  return Math.round(totalWithInterest(baseCents, n) / n)
}

export type InstallmentOption = {
  n: number
  installmentCents: number
  totalCents: number
  hasInterest: boolean
}

/**
 * Lista todas as opções de parcelamento aplicáveis ao intervalo. UI usa
 * isso pra montar o <select> de "Em quantas vezes".
 */
export function listInstallmentOptions(
  baseCents: number,
  intervalo: Intervalo,
  installmentsMaxSetting: number,
): InstallmentOption[] {
  const max = maxInstallments(intervalo, installmentsMaxSetting)
  const out: InstallmentOption[] = []
  for (let n = 1; n <= max; n++) {
    out.push({
      n,
      installmentCents: installmentValue(baseCents, n),
      totalCents: totalWithInterest(baseCents, n),
      hasInterest: n > 1,
    })
  }
  return out
}
