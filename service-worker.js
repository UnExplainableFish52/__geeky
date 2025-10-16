const CACHE_VERSION = 'v1';
const CACHE_NAME = `saksham-site-${CACHE_VERSION}`;
const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/main.js',
  '/site.webmanifest',
  '/favicon-16x16.png',
  '/favicon-32x32.png'
];

self.addEventListener('install', event => {
  // Precache core assets so the shell works offline.
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Clear old caches when a new version is activated.
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('saksham-site-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then(networkResponse => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }

          return cachedResponse;
        });
    })
  );
});
