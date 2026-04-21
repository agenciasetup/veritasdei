/* Veritas Dei — Service Worker (sprint 7.2).
 *
 * Estratégias por padrão de URL:
 *   - network-first:  páginas dinâmicas (home, hubs, /rosario, /novenas/*, etc.)
 *   - cache-first:    conteúdo estático/estável (orações, doutrina, exame)
 *   - cache + 24h:    /api/liturgia/hoje (stale-while-revalidate diário)
 *   - no-cache:       /buscar, /comunidade, /paroquias/buscar, /admin/*, /api/*
 *
 * Pre-cache no install: home, 4 hubs, exame e orações essenciais —
 * shell mínimo offline.
 *
 * Versão bumpada manualmente quando a estratégia muda; entries do
 * cache antigo são limpas no `activate`.
 */

const CACHE_VERSION = 'v4'
const CACHE_NAME = `veritasdei-app-${CACHE_VERSION}`
const LITURGIA_CACHE = `veritasdei-liturgia-${CACHE_VERSION}`

// Páginas pré-cacheadas no install — shell mínima offline
const PRECACHE_URLS = [
  '/',
  '/orar',
  '/liturgia',
  '/aprender',
  '/oracoes',
  '/exame-consciencia',
  '/icon.svg',
  '/favicon.ico',
  '/manifest.webmanifest',
]

// network-first: páginas que mudam (deve buscar fresco quando possível)
const NETWORK_FIRST_PATTERNS = [
  /^\/$/,
  /^\/orar(\/|$)/,
  /^\/liturgia$/,
  /^\/aprender(\/|$)/,
  /^\/rosario(\/|$)/,
  /^\/novenas(\/|$)/,
  /^\/perfil(\/|$)/,
  /^\/mapa(\/|$)/,
  /^\/calendario(\/|$)/,
]

// cache-first: conteúdo estável (raramente atualiza)
const CACHE_FIRST_PATTERNS = [
  /^\/oracoes(\/|$)/,
  /^\/exame-consciencia(\/|$)/,
  /^\/estudo\/(dogmas|sacramentos|mandamentos|preceitos|virtudes-pecados|obras-misericordia)(\/|$)/,
  /^\/catecismo-pio-x(\/|$)/,
  /^\/sao-tomas(\/|$)/,
]

// no-cache: nunca cachear estas (busca/realtime/admin/APIs)
const NO_CACHE_PATTERNS = [
  /^\/buscar(\/|$)/,
  /^\/comunidade(\/|$)/,
  /^\/paroquias\/buscar/,
  /^\/admin(\/|$)/,
  /^\/notificacoes(\/|$)/,
  /^\/auth(\/|$)/,
  /^\/login(\/|$)/,
  // /api/* exceto /api/liturgia/hoje
]

// API com cache especial: liturgia do dia (24h stale-while-revalidate)
const LITURGIA_HOJE_PATTERN = /^\/api\/liturgia\/hoje/

// ─── Lifecycle ────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME)
        await cache.addAll(PRECACHE_URLS).catch(() => {
          // Se algum precache falhar (offline durante install),
          // ainda ativamos o SW. Cada URL será cacheada na primeira visita.
        })
      } finally {
        self.skipWaiting()
      }
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter(
            (k) =>
              (k.startsWith('veritasdei-rosario-') ||
                k.startsWith('veritasdei-app-') ||
                k.startsWith('veritasdei-liturgia-')) &&
              k !== CACHE_NAME &&
              k !== LITURGIA_CACHE,
          )
          .map((k) => caches.delete(k)),
      )
      await self.clients.claim()
    })(),
  )
})

// ─── Cache strategies ─────────────────────────────────────────────

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    if (response && response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (err) {
    const cached = await cache.match(request, { ignoreSearch: true })
    if (cached) return cached
    throw err
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  if (cached) {
    // refresh em background
    fetch(request)
      .then((response) => {
        if (response && response.ok) cache.put(request, response.clone())
      })
      .catch(() => {})
    return cached
  }
  // Nunca rejeita — se a rede falhar, devolve um 503 discreto para o
  // navegador não estourar "uncaught in promise" e não quebrar o
  // event.respondWith() do SW.
  try {
    const response = await fetch(request)
    if (response && response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('', {
      status: 503,
      statusText: 'Offline and asset not cached',
    })
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

  if (cached) return cached
  const networkResponse = await networkFetch
  if (networkResponse) return networkResponse
  return new Response('', {
    status: 504,
    statusText: 'Offline and asset not cached',
  })
}

/**
 * Liturgia do dia — cache por dia (key inclui YYYY-MM-DD); fallback ao
 * último cache se a rede falhar. Permite rezar leituras offline.
 */
async function liturgiaCache(request) {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const cacheKey = new Request(`${request.url}#${today}`)
  const cache = await caches.open(LITURGIA_CACHE)

  const cached = await cache.match(cacheKey)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response && response.ok) {
      cache.put(cacheKey, response.clone())
      // limpa entradas de outros dias para não inflar
      const keys = await cache.keys()
      for (const k of keys) {
        if (!k.url.includes(`#${today}`)) {
          await cache.delete(k)
        }
      }
    }
    return response
  } catch (err) {
    // rede falhou e nada para hoje — tenta qualquer entrada do mesmo URL
    const all = await cache.keys()
    const fallback = all.find((k) => k.url.split('#')[0] === request.url)
    if (fallback) return cache.match(fallback)
    throw err
  }
}

// ─── fetch handler ────────────────────────────────────────────────

function matchesAny(path, patterns) {
  return patterns.some((p) => p.test(path))
}

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

  // Liturgia do dia (especial)
  if (LITURGIA_HOJE_PATTERN.test(path)) {
    event.respondWith(liturgiaCache(request))
    return
  }

  // Excluídos: nunca cachear
  if (matchesAny(path, NO_CACHE_PATTERNS) || path.startsWith('/api/')) {
    return // passa direto pra rede
  }

  // Cache-first: conteúdo estável
  if (matchesAny(path, CACHE_FIRST_PATTERNS)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Network-first: páginas dinâmicas
  if (matchesAny(path, NETWORK_FIRST_PATTERNS)) {
    event.respondWith(networkFirst(request))
    return
  }

  // Assets estáticos do Next (chunks JS, CSS, fontes) — content-hashed
  if (path.startsWith('/_next/static/')) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  // Metadados PWA
  if (
    path === '/icon.svg' ||
    path === '/favicon.ico' ||
    path === '/manifest.webmanifest'
  ) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  // default: passa pra rede
})

// ─── push notifications (inalterado) ──────────────────────────────

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
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
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
