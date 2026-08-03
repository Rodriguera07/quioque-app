// Service worker mínimo só para Web Push — o app em si não usa cache
// offline/precache (é servido normal pelo Vercel a cada load).

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = { title: 'Trailer Mar Azul', body: '' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    payload.body = event.data ? event.data.text() : '';
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      // `icon` é o ícone grande (colorido) dentro da notificação. `badge` é
      // o ícone pequeno da barra de status do Android — o SO ignora a cor e
      // usa só o canal alfa da imagem, então precisa ser uma silhueta
      // branca sobre fundo transparente; usar a logo colorida ali vira um
      // quadrado branco sólido (é o que estava acontecendo).
      icon: '/icon-192.png',
      badge: '/badge-monochrome.png',
      data: { url: payload.url || '/' },
    })
  );
});

// Clica na notificação -> foca uma aba já aberta do app, ou abre uma nova.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
