import { createClient } from './client'

/**
 * Thrown when a Supabase query fails with 403/401 (expired JWT)
 * and a session refresh also fails. Callers can catch this to
 * show a "session expired" message instead of "no results".
 */
export class SessionExpiredError extends Error {
  constructor() {
    super('session_expired')
    this.name = 'SessionExpiredError'
  }
}

/**
 * Check if a Supabase PostgREST error indicates an auth/session issue.
 */
export function isAuthError(error: { message?: string; code?: string; status?: number } | null): boolean {
  if (!error) return false
  const msg = error.message?.toLowerCase() ?? ''
  return (
    error.code === 'PGRST301' ||
    msg.includes('jwt') ||
    msg.includes('token') ||
    msg.includes('unauthorized') ||
    msg.includes('permission denied')
  )
}

// Deduplicate concurrent refresh attempts
let refreshPromise: Promise<boolean> | null = null

/**
 * Try to refresh the Supabase session. Deduplicates concurrent calls.
 * Returns true if refresh succeeded, false otherwise.
 */
export async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const client = createClient()
    if (!client) return false
    try {
      const { error } = await client.auth.refreshSession()
      return !error
    } catch {
      return false
    }
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

/**
 * Handle a Supabase query error: if it's an auth error, attempt refresh
 * and return true (caller should retry). If refresh fails, throw SessionExpiredError.
 * For non-auth errors, log and return false (caller should NOT retry).
 */
export async function handleQueryError(
  error: { message?: string; code?: string } | null,
  context: string
): Promise<boolean> {
  if (!error) return false

  if (isAuthError(error)) {
    console.warn(`[${context}] Auth error detected, attempting session refresh...`)
    const refreshed = await refreshSession()
    if (refreshed) {
      return true // Caller should retry
    }
    throw new SessionExpiredError()
  }

  console.warn(`[${context}] Query error:`, error.message)
  return false
}
