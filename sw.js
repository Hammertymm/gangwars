/* Gang Wars — service worker
   Cache-first for app shell; network-first for icons so home-screen art updates. */

const CACHE = 'gangwars-v64';
const ASSETS = [
  './gangwars.html',
  './engine.js',
  './ledger.js',
  './ledger-blueprint.js',
  './ledger-ui.js',
  './audio.js',
  './manifest.json',
  './title-screen.png',
  './assets/little-italy.png',
  './assets/dock-13.png',
  './assets/kitty-kat-club.png',
  './assets/uptown.png',
  './assets/warehouse-district.png',
  './assets/city-hall.png',
  './assets/travel-car.png',
  './assets/eos-tommy-left.png',
  './assets/goods/moonshine.png',
  './assets/goods/cigars.png',
  './assets/goods/bathgin.png',
  './assets/goods/art.png',
  './assets/goods/scotch.png',
  './assets/goods/counterfeits.png',
  './assets/goods/cognac.png',
  './assets/goods/furcoats.png',
  './assets/goods/champagne.png',
  './assets/goods/diamonds.png',
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
  './assets/ledger/crime-ledger-home-base.png',
  './assets/ledger/ledger-general-base.png',
  './assets/ledger/ledger-rare-base.png',
  './assets/ledger/ledger-super-rare-base.png',
  './assets/ledger/ledger-godlike-base.png',
  './assets/ledger/ledger-golden-godlike-base.png',
  './assets/ledger/ledger-header-general.png',
  './assets/ledger/ledger-header-rare.png',
  './assets/ledger/ledger-header-super-rare.png',
  './assets/ledger/ledger-header-godlike.png',
  './assets/ledger/ledger-header-golden-godlike.png',
  './assets/ledger/icons/locked.png',
  './assets/ledger/icons/made_man.png',
  './assets/ledger/icons/debt_survivor.png',
  './assets/ledger/icons/first_million.png',
  './assets/ledger/icons/connected.png',
  './assets/ledger/icons/bootlegger.png',
  './assets/ledger/icons/smoke_merchant.png',
  './assets/ledger/icons/the_collector.png',
  './assets/ledger/icons/high_roller.png',
  './assets/ledger/icons/diamond_hands.png',
  './assets/ledger/icons/empire_builder.png',
  './assets/ledger/icons/king_of_docks.png',
  './assets/ledger/icons/smooth_operator.png',
  './assets/ledger/icons/market_maven.png',
  './assets/ledger/icons/survivor.png',
  './assets/ledger/icons/luciano.png',
  './assets/ledger/icons/rumrow.png',
  './assets/ledger/icons/midnight.png',
  './assets/ledger/icons/ellington.png',
  './assets/ledger/icons/armstrong.png',
  './assets/ledger/icons/schultz.png',
  './assets/ledger/icons/lansky.png',
  './assets/ledger/icons/capone.png',
  './assets/ledger/icons/rothstein.png',
  './assets/ledger/icons/madden.png',
  './assets/ledger/icons/lindbergh.png',
  './assets/ledger/icons/mauretania.png',
  './assets/ledger/icons/dempsey.png',
  './assets/ledger/icons/kkrevue.png',
  './assets/ledger/icons/ziegfeld.png',
  './assets/ledger/icons/hollywood.png',
  './assets/ledger/icons/wales.png',
  './assets/ledger/icons/wallst.png',
  './assets/ledger/icons/ruth.png',
  './assets/ledger/icons/walker.png',
  './assets/ledger/icons/in_town.png',
  './assets/ledger/icons/interest.png',
  './assets/ledger/icons/move.png',
  './assets/ledger/icons/celebration.png',
  './assets/ledger/icons/history.png',
  './assets/ledger/icons/golden.png',
  './assets/audio/AUDIO-MANIFEST.json',
  './assets/audio/music/dock-ambient.ogg',
  './assets/audio/music/end-neutral.ogg',
  './assets/audio/music/end-triumph.ogg',
  './assets/audio/music/feds-tension.ogg',
  './assets/audio/music/golden-shower.ogg',
  './assets/audio/music/kitty-kat-club.ogg',
  './assets/audio/music/ledger-ambient.ogg',
  './assets/audio/music/run-ambient.ogg',
  './assets/audio/music/title-speakeasy-jazz.ogg',
  './assets/audio/sfx/achievement/card-reveal.ogg',
  './assets/audio/sfx/achievement/category-complete.ogg',
  './assets/audio/sfx/achievement/crime-lord.ogg',
  './assets/audio/sfx/achievement/found.ogg',
  './assets/audio/sfx/combat/death-sting.ogg',
  './assets/audio/sfx/combat/empty-click.ogg',
  './assets/audio/sfx/combat/footsteps-flee.ogg',
  './assets/audio/sfx/combat/gunshot.ogg',
  './assets/audio/sfx/combat/punch-oof-01.ogg',
  './assets/audio/sfx/combat/punch-oof-02.ogg',
  './assets/audio/sfx/combat/siren.ogg',
  './assets/audio/sfx/combat/tommy-burst.ogg',
  './assets/audio/sfx/economy/big-sale.ogg',
  './assets/audio/sfx/economy/bills-shuffle.ogg',
  './assets/audio/sfx/economy/cash-register.ogg',
  './assets/audio/sfx/economy/coins-buy.ogg',
  './assets/audio/sfx/economy/debt-paid.ogg',
  './assets/audio/sfx/economy/error-deny.ogg',
  './assets/audio/sfx/economy/loan-taken.ogg',
  './assets/audio/sfx/economy/vault-close.ogg',
  './assets/audio/sfx/end/rank-reveal.ogg',
  './assets/audio/sfx/end/run-complete.ogg',
  './assets/audio/sfx/events/bribe-paid.ogg',
  './assets/audio/sfx/events/dead-drop.ogg',
  './assets/audio/sfx/events/gun-offer.ogg',
  './assets/audio/sfx/events/modal-close.ogg',
  './assets/audio/sfx/events/modal-open.ogg',
  './assets/audio/sfx/events/mugging.ogg',
  './assets/audio/sfx/events/stash-upgrade.ogg',
  './assets/audio/sfx/events/stinger-flood.ogg',
  './assets/audio/sfx/events/stinger-godlike.ogg',
  './assets/audio/sfx/events/stinger-golden.ogg',
  './assets/audio/sfx/events/stinger-rare.ogg',
  './assets/audio/sfx/events/stinger-spike.ogg',
  './assets/audio/sfx/events/stinger-super-rare.ogg',
  './assets/audio/sfx/events/stinger-surge.ogg',
  './assets/audio/sfx/ledger/page-turn.ogg',
  './assets/audio/sfx/travel/arrival.ogg',
  './assets/audio/sfx/travel/day-tick.ogg',
  './assets/audio/sfx/travel/engine-start.ogg',
  './assets/audio/sfx/travel/tires-screech.ogg',
  './assets/audio/sfx/ui/button-tap.ogg',
];

const ICON_PATTERN = /(?:apple-touch-icon|icon-(?:180|192|512))\.png$/;
/** App shell — network-first so ledger/UI fixes reach installed PWAs without a stale trap. */
const SHELL_PATTERN = /\/(gangwars\.html|engine\.js|ledger\.js|ledger-blueprint\.js|ledger-ui\.js|audio\.js|sw\.js)$/;
/** Ledger art — network-first so regenerated -base PNGs are not trapped in cache-first. */
const LEDGER_PATTERN = /\/assets\/ledger\//;

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

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
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
  if (SHELL_PATTERN.test(path) || LEDGER_PATTERN.test(path)) {
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
