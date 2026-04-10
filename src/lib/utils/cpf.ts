/**
 * CPF validation and formatting utilities.
 * Uses the official mathematical algorithm (mod-11 check digits).
 */

/** Remove non-digit characters from a CPF string */
export function stripCpf(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/** Format a raw 11-digit string as CPF: 000.000.000-00 */
export function formatCpf(cpf: string): string {
  const digits = stripCpf(cpf)
  if (digits.length !== 11) return cpf
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

/**
 * Validate a CPF using the official mod-11 algorithm.
 * Returns true only if the CPF has exactly 11 digits and both check digits are correct.
 */
export function isValidCpf(cpf: string): boolean {
  const digits = stripCpf(cpf)

  // Must be exactly 11 digits
  if (digits.length !== 11) return false

  // Reject known invalid sequences (all same digit)
  if (/^(\d)\1{10}$/.test(digits)) return false

  // Calculate first check digit (10th position)
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i], 10) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(digits[9], 10)) return false

  // Calculate second check digit (11th position)
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i], 10) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(digits[10], 10)) return false

  return true
}

/** Apply CPF mask as the user types: 000.000.000-00 */
export function maskCpf(value: string): string {
  const digits = stripCpf(value).slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}
