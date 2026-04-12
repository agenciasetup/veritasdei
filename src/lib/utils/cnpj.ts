/**
 * CNPJ validation and formatting utilities.
 * Uses the official mathematical algorithm (mod-11 check digits).
 */

/** Remove non-digit characters from a CNPJ string */
export function stripCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '')
}

/** Format a raw 14-digit string as CNPJ: 00.000.000/0000-00 */
export function formatCnpj(cnpj: string): string {
  const d = stripCnpj(cnpj)
  if (d.length !== 14) return cnpj
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

/** Apply CNPJ mask as the user types: 00.000.000/0000-00 */
export function maskCnpj(value: string): string {
  const d = stripCnpj(value).slice(0, 14)
  if (d.length <= 2)  return d
  if (d.length <= 5)  return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8)  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

/**
 * Validate a CNPJ using the official mod-11 algorithm.
 * Returns true only if the CNPJ has exactly 14 digits and both check digits match.
 */
export function isValidCnpj(cnpj: string): boolean {
  const d = stripCnpj(cnpj)
  if (d.length !== 14) return false
  if (/^(\d)\1{13}$/.test(d)) return false

  const calc = (len: number): number => {
    const weights = len === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let sum = 0
    for (let i = 0; i < len; i++) {
      sum += parseInt(d[i], 10) * weights[i]
    }
    const mod = sum % 11
    return mod < 2 ? 0 : 11 - mod
  }

  if (calc(12) !== parseInt(d[12], 10)) return false
  if (calc(13) !== parseInt(d[13], 10)) return false
  return true
}
