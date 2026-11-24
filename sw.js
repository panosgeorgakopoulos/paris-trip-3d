// Offline-First Service Worker for Paris 3D Trip Guide (works underground in Paris Métro!)
const CACHE_NAME = 'paris-3d-v6';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon.svg',
  './assets/apple-touch-icon.png',
  './vendor/three.min.js',
  './css/tailwind.min.css',
  './css/styles.css',
  './data/paris-buildings.zbin',
  './data/paris-roads.zbin',
  './js/main.js',
  './js/config.js',
  './js/state.js',
  './js/textures.js',
  './js/controls.js',
  './js/ui.js',
  './js/features.js',
  './js/scene/environment.js',
  './js/scene/roads.js',
  './js/scene/parks.js',
  './js/scene/buildings.js',
  './js/scene/landmarks.js',
  './js/scene/places.js',
  './js/scene/squad.js',
  './js/scene/transit.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never cache live weather API calls
  if (url.hostname.includes('open-meteo.com')) {
    event.respondWith(fetch(req).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // Stale-while-revalidate for same-origin + Three.js / Google Fonts CDN assets
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req).then((res) => {
        if (res && (res.status === 200 || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => { });
        }
        return res;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});
