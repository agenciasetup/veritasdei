/* Veritas Dei — Service Worker.
 *
 * Responsabilidades:
 *   1. Push notifications (já existia).
 *   2. Cache offline do Santo Rosário (/rosario) — sprint 1.11.
 *
 * Estratégia de cache (apenas em produção; PwaRegister só chama em prod):
 *
 *   - `/rosario` (HTML)          → network-first com fallback pro cache.
 *       Sempre tenta ir à rede pra pegar a versão mais nova; se estiver
 *       offline, devolve a última cópia vista. Popula o cache
 *       oportunisticamente quando a rede responde com sucesso.
 *
 *   - `/_next/static/**`         → cache-first (stale-while-revalidate).
 *       Esses arquivos são content-hashed pelo Next, então um hash novo
 *       significa um arquivo novo — cachear indefinidamente é seguro.
 *
 *   - `/icon.svg`, `/favicon.ico`,
 *     `/manifest.webmanifest`    → cache-first (stale-while-revalidate).
 *       Assets pequenos que a shell do terço referencia.
 *
 *   - **qualquer outra URL**     → passa direto pra rede, sem interferir.
 *
 * Propositadamente **não** cacheamos JSON da API, rotas dinâmicas nem
 * outras páginas. O escopo offline desse sprint é apenas /rosario,
 * porque é uma experiência de oração que precisa estar disponível mesmo
 * em rede instável (igreja, ônibus, metrô), e o resto do app ainda
 * depende de servidor (paróquias, liturgia do dia, etc.).
 *
 * Versão do cache bumpada manualmente quando a estratégia muda —
 * entries do cache antigo são limpas no `activate`.
 */

const CACHE_VERSION = 'v2'
const CACHE_NAME = `veritasdei-app-${CACHE_VERSION}`

const ROSARY_PATHS = new Set(['/rosario', '/rosario/'])
const NOVENAS_PATHS_PREFIX = '/novenas'

self.addEventListener('install', (event) => {
  // Ativa imediatamente sem esperar clientes antigos.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Limpa caches antigos de versões anteriores.
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((k) => (k.startsWith('veritasdei-rosario-') || k.startsWith('veritasdei-app-')) && k !== CACHE_NAME)
          .map((k) => caches.delete(k)),
      )
      await self.clients.claim()
    })(),
  )
})

// ---------- cache helpers ----------

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    // Só cacheamos respostas "ok" pra não poluir com 404/500.
    if (response && response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (err) {
    const cached = await cache.match(request, { ignoreSearch: true })
    if (cached) return cached
    // Tenta match sem query string
    const cachedRosario = await cache.match('/rosario')
    if (cachedRosario) return cachedRosario
    throw err
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  const networkFetch = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => null)

  if (cached) {
    // Atualiza em background (networkFetch já está rodando), responde com
    // o cache imediatamente.
    return cached
  }
  const networkResponse = await networkFetch
  if (networkResponse) return networkResponse
  // Offline e sem cache: devolve 504 silencioso.
  return new Response('', {
    status: 504,
    statusText: 'Offline and asset not cached',
  })
}

// ---------- fetch handler ----------

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  let url
  try {
    url = new URL(request.url)
  } catch {
    return
  }
  if (url.origin !== self.location.origin) return

  const path = url.pathname

  // /rosario (HTML) — network-first
  if (ROSARY_PATHS.has(path)) {
    event.respondWith(networkFirst(request))
    return
  }

  // /novenas/* (HTML) — network-first com fallback pro cache.
  // Permite rezar a novena offline após primeira visita.
  if (path.startsWith(NOVENAS_PATHS_PREFIX)) {
    event.respondWith(networkFirst(request))
    return
  }

  // Assets estáticos do Next (chunks JS, CSS, fontes)
  if (path.startsWith('/_next/static/')) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  // Metadados PWA que a shell referencia
  if (
    path === '/icon.svg' ||
    path === '/favicon.ico' ||
    path === '/manifest.webmanifest'
  ) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  // Qualquer outra coisa: não interfere.
})

// ---------- push notifications (existente) ----------

self.addEventListener('push', (event) => {
  let payload = { title: 'Veritas Dei', body: 'Você tem um lembrete.', url: '/' }
  try {
    if (event.data) {
      const data = event.data.json()
      payload = { ...payload, ...data }
    }
  } catch (err) {
    // payload padrão
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      data: { url: payload.url },
      tag: payload.tag || 'veritasdei',
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.focus()
          if ('navigate' in client) {
            try {
              client.navigate(targetUrl)
            } catch (e) {}
          }
          return
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl)
    }),
  )
})
