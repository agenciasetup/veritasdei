/**
 * Gera slug URL-safe em ASCII minúsculo.
 * - Remove diacríticos (NFD + strip combining marks)
 * - Troca não-alfanuméricos por `-`
 * - Trim de hífens extremos
 * - Limita a 80 chars (evita URLs absurdas)
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}
