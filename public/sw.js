/* Veritas Dei — Service Worker (mínimo, Fase 1).
 *
 * Essa versão não faz cache offline (evita regressões de dev).
 * Função única: receber push events e mostrar notificação.
 * Cache/offline e sync chegam em Fase 2.
 */

self.addEventListener('install', (event) => {
  // Ativa imediatamente sem esperar clientes antigos.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

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
    })
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
            try { client.navigate(targetUrl) } catch (e) {}
          }
          return
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl)
    })
  )
})
