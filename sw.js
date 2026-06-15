/* Gang Wars — service worker
   Cache-first for app shell; network-first for icons so home-screen art updates. */

const CACHE = 'gangwars-v11';
const ASSETS = [
  './gangwars.html',
  './engine.js',
  './manifest.json',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png'
];

const ICON_PATTERN = /(?:apple-touch-icon|icon-(?:180|192|512))\.png$/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const path = new URL(e.request.url).pathname;
  if (ICON_PATTERN.test(path)) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
