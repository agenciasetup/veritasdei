import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let client: ReturnType<typeof createBrowserClient> | null = null

// Lock de auth in-memory (mesma aba), substituindo o navigator.locks padrão.
//
// O navigator.locks podia travar indefinidamente quando a página anterior
// deixava um lock órfão (ex.: hard refresh) — daí o bypass total que existia
// aqui antes. Só que o bypass deixava operações de auth concorrentes rodarem
// em paralelo: ao voltar pra aba, AuthContext (visibilitychange),
// SubscriptionContext e o próprio "salvar" disparavam refresh ao mesmo
// tempo, cada um usando o refresh token. Como o refresh token é de uso
// único e rotaciona, só o primeiro vencia e os demais invalidavam a
// sessão — resultado: "salvei tudo mas só funciona depois de dar reload".
//
// Uma fila de promessas serializa as operações de auth na aba sem depender
// do navigator.locks, evitando tanto o deadlock quanto a corrida.
let authLockChain: Promise<unknown> = Promise.resolve()

function inMemoryAuthLock<R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>,
): Promise<R> {
  const run = authLockChain.then(fn, fn)
  // Não deixa um erro numa operação travar a fila inteira.
  authLockChain = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null
  if (client) return client
  client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      lock: inMemoryAuthLock,
    },
  })
  return client
}
