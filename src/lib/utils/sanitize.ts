/**
 * Sanitization utilities for Supabase PostgREST queries.
 * Prevents filter injection via .ilike() and .or() methods.
 */

/**
 * Escape special characters for PostgREST ILIKE filters.
 * Prevents `%` and `_` in user input from acting as wildcards.
 */
export function sanitizeIlike(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
}

/**
 * Escape characters para PostgREST `.or()` contendo `.ilike.` ou outros
 * filtros de pattern. Escapa:
 *   • `\`      — escape char
 *   • `%` `_`  — ILIKE wildcards (evita que input vire wildcard)
 *   • `,` `(` `)` — delimitadores de filtro dentro do `.or()`
 *
 * NÃO use em `.eq.` — `%` e `_` passam a ser comparados literalmente e
 * vão quebrar matches em valores reais (ex.: email `user_name@...`).
 * Para `.eq.` dentro de `.or()`, use {@link sanitizePostgrestEqValue}.
 */
export function sanitizePostgrestFilter(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/,/g, '\\,')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

/**
 * Escape mínimo para valores usados em `.eq.` (ou outros filtros
 * literais como `.neq`, `.in`, `.is`) dentro de `.or(...)`.
 *
 * `eq` compara bytes literalmente, então `_` e `%` **não** podem ser
 * escapados: se forem, o valor real deixa de casar. Só precisamos
 * escapar os caracteres que rompem o parser do `.or()` do PostgREST:
 *   • `\` — escape char
 *   • `,` `(` `)` — delimitadores de filtro
 */
export function sanitizePostgrestEqValue(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}
