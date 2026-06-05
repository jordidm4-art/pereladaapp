const CACHE_NAME = 'perelada-v1';
const URLS_TO_CACHE = [
  '/pereladaapp/',
  '/pereladaapp/index.html',
  '/pereladaapp/login.html',
  '/pereladaapp/calendario.html',
  '/pereladaapp/documentos.html',
  '/pereladaapp/promociones.html',
  '/pereladaapp/perelada_logo_transparent.png',
  '/pereladaapp/manifest.json'
];

// Instalación — cachear archivos principales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activación — limpiar caches antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — servir desde cache si no hay red
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request)
    )
  );
});

// Notificaciones push
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Perelada Team', {
      body: data.body || 'Recuerda registrar los km de hoy',
      icon: '/pereladaapp/perelada_logo_transparent.png',
      badge: '/pereladaapp/perelada_logo_transparent.png',
      data: { url: data.url || '/pereladaapp/kilometros.html' }
    })
  );
});

// Al tocar la notificación — abre la página correspondiente
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      const url = event.notification.data.url;
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Notificación local programada (alarma diaria)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { hour, minute } = event.data;
    scheduleDaily(hour, minute);
  }
});

function scheduleDaily(hour, minute) {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const delay = next - now;
  setTimeout(() => {
    self.registration.showNotification('🚗 Perelada Team', {
      body: 'Recuerda registrar los km del vehículo',
      icon: '/pereladaapp/perelada_logo_transparent.png',
      data: { url: '/pereladaapp/kilometros.html' }
    });
    scheduleDaily(hour, minute); // Reprogramar para el día siguiente
  }, delay);
}
