import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null
  if (client) return client
  client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Bypass navigator.locks to prevent deadlock on hard refresh (Cmd+Shift+F5).
      // The default lock implementation uses navigator.locks.request() which
      // can hang indefinitely when the previous page's lock is orphaned.
      // The middleware already handles token refresh server-side, so
      // client-side cross-tab locking is not critical.
      lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
        return await fn()
      },
    },
  })
  return client
}
