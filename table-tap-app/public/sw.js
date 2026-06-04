const CACHE_VERSION = '1.1.0';
const CACHE_NAME = `table-tap-v${CACHE_VERSION}`;
const STATIC_CACHE = `static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-v${CACHE_VERSION}`;

// Only precache stable, always-present app-shell entry points. Hashed bundles
// (/static/js/main.<hash>.js) are cached at runtime; precaching fixed bundle
// paths breaks because the filenames differ between dev and each prod build.
const STATIC_ASSETS = ['/', '/manifest.json', '/favicon.ico'];

// Install event - precache the app shell (resiliently: a single failed entry
// must not abort the whole install).
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      Promise.all(STATIC_ASSETS.map((url) => cache.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Drop caches from older versions (including the old API cache).
          if (![STATIC_CACHE, DYNAMIC_CACHE].includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only ever touch same-origin GETs over http(s). Cross-origin requests
  // (Supabase REST/Realtime, CDNs, analytics, etc.) MUST go straight to the
  // network — caching them cache-first served stale/empty API data (e.g. the
  // restaurant list and activity logs) indefinitely.
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (!url.protocol.startsWith('http')) return;

  // App shell (navigation + JS/CSS): network-first, so a new deploy is picked
  // up immediately. Fall back to cache only when the network is unavailable.
  const isAppShell =
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    request.destination === 'script' ||
    request.destination === 'style';

  if (isAppShell) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/')),
        ),
    );
    return;
  }

  // Other same-origin static assets (images, fonts, manifest): cache-first is
  // safe because CRA emits content-hashed filenames in production.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        }),
    ),
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Perform background sync operations
    console.log('Performing background sync');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Table Tap', options)
  );
}); 