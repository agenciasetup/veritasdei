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
 * Escape characters that break PostgREST .or() filter syntax.
 * Commas, parentheses, and dots in values can break the filter string.
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
