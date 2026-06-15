/* Gang Wars — service worker
   Cache-first for app shell; network-first for icons so home-screen art updates. */

const CACHE = 'gangwars-v20';
const ASSETS = [
  './gangwars.html',
  './engine.js',
  './manifest.json',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './cards/nobody.png',
  './cards/pickpocket.png',
  './cards/hustler.png',
  './cards/rum-runner.png',
  './cards/bootlegger.png',
  './cards/racketeer.png',
  './cards/wise-guy.png',
  './cards/crew-boss.png',
  './cards/underboss.png',
  './cards/godfather.png',
  './cards/big-daddy-j.png',
  './events/the_feds.png',
  './events/ambushed_rolled.png',
  './events/dead_drop.png',
  './events/packing_iron.png',
  './events/upgrade_available.png',
  './events/shortage.png',
  './events/buying_frenzy.png',
  './events/flooded_market.png',
  './events/super_rare_event.png',
  './events/rare_event_intel.png',
  './events/rare_capone.png',
  './events/rare_luciano.png',
  './events/rare_schultz.png',
  './events/rare_madden.png',
  './events/rare_rothstein.png',
  './events/rare_lansky.png',
  './events/rare_ellington.png',
  './events/rare_armstrong.png',
  './events/rare_rumrow.png',
  './events/rare_midnight.png',
  './events/super_ruth.png',
  './events/super_lindbergh.png',
  './events/super_dempsey.png',
  './events/super_wales.png',
  './events/super_kkrevue.png',
  './events/super_mauretania.png',
  './events/super_ziegfeld.png',
  './events/super_wallst.png',
  './events/super_walker.png',
  './events/super_hollywood.png',
  './events/godlike_in_town.png',
  './events/godlike_interest.png',
  './events/godlike_move.png',
  './events/godlike_celebration.png',
  './events/godlike_history.png',
  './events/godlike_golden.png',
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
