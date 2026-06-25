/* Gang Wars — service worker
   Cache-first for app shell; network-first for icons so home-screen art updates. */

const CACHE = 'gangwars-v183';
const ASSETS = [
  './gangwars.html',
  './gangwars.css',
  './engine.js',
  './ledger.js',
  './tips.js',
  './ledger-ui.js',
  './scores-ui.js',
  './event-ui.js',
  './travel-ui.js',
  './market-ui.js',
  './bank-ui.js',
  './standard-events.js',
  './feds-event.js',
  './audio.js',
  './manifest.json',
  './banner.jpg',
  './title-screen.jpg?v=13',
  './assets/little-italy.jpg',
  './assets/dock-13.jpg',
  './assets/kitty-kat-club.jpg',
  './assets/uptown.jpg',
  './assets/warehouse-district.jpg',
  './assets/city-hall.jpg',
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
  './cards/big-daddy-j-portrait.jpg',
  './cards/godfather-portrait.jpg',
  './cards/boss-portrait.jpg',
  './cards/consigliere-portrait.jpg',
  './cards/underboss-portrait.jpg',
  './cards/capo-portrait.jpg',
  './cards/racketeer-portrait.jpg',
  './cards/wise-guy-portrait.jpg',
  './cards/associate-portrait.jpg',
  './cards/street-runner-portrait.jpg',
  './cards/nobody-portrait.jpg',
  './cards/big-daddy-j.jpg',
  './events/the_feds.jpg',
  './events/ambushed_rolled.jpg',
  './events/dead_drop.jpg',
  './events/packing_iron.jpg',
  './events/upgrade_available.jpg',
  './events/shortage.jpg',
  './events/buying_frenzy.jpg',
  './events/flooded_market.jpg',
  './events/super_rare_event.jpg',
  './events/rare_event_intel.jpg',
  './events/rare_capone.jpg',
  './events/rare_luciano.jpg',
  './events/rare_schultz.jpg',
  './events/rare_madden.jpg',
  './events/rare_rothstein.jpg',
  './events/rare_lansky.jpg',
  './events/rare_ellington.jpg',
  './events/rare_armstrong.jpg',
  './events/rare_rumrow.jpg',
  './events/rare_midnight.jpg',
  './events/rare_pasta_la_vista.jpg',
  './events/rare_gnocchi_horror_show.jpg',
  './events/rare_ship_happens.jpg',
  './events/rare_titanic_markup.jpg',
  './events/rare_jazz_stinger.jpg',
  './events/rare_great_gats_got.jpg',
  './events/rare_dow_jonesing.jpg',
  './events/rare_margin_of_terror.jpg',
  './events/rare_bribe_and_prejudice.jpg',
  './events/rare_license_to_ill.jpg',
  './events/rare_pallet_wounds.jpg',
  './events/rare_crate_expectations.jpg',
  './events/super_lindbergh.jpg',
  './events/super_mauretania.jpg',
  './events/super_ziegfeld.jpg',
  './events/super_hollywood.jpg',
  './events/super_wales.jpg',
  './events/super_wallst.jpg',
  './events/super_ruth.jpg',
  './events/super_walker.jpg',
  './events/super_feast.jpg',
  './events/super_chairman.jpg',
  './events/super_garage.jpg',
  './events/super_picket_line.jpg',
  './events/godlike_red_wedding.jpg',
  './events/godlike_declares_himself_mayor.jpg',
  './events/godlike_boss_of_bosses.jpg',
  './events/godlike_opens_the_vault.jpg',
  './events/godlike_takes_the_city.jpg',
  './events/godlike_golden.jpg',
  './assets/ledger/ledger-group-general.png',
  './assets/ledger/ledger-group-rare.png',
  './assets/ledger/ledger-group-super-rare.png',
  './assets/ledger/ledger-group-godlike.png',
  './assets/ledger/ledger-group-golden-godlike.png',
  './assets/ledger/icons/locked.png',
  './assets/ledger/icons/locked-general.png',
  './assets/ledger/icons/locked-rare.png',
  './assets/ledger/icons/locked-super-rare.png',
  './assets/ledger/icons/locked-godlike.png',
  './assets/ledger/icons/locked-golden-godlike.png',
  './assets/ledger/icons/made_man.png',
  './assets/ledger/icons/debt_survivor.png',
  './assets/ledger/icons/first_million.png',
  './assets/ledger/icons/connected.png',
  './assets/ledger/icons/bootlegger.png',
  './assets/ledger/icons/smoke_merchant.png',
  './assets/ledger/icons/dough_capone.png',
  './assets/ledger/icons/girls_best_fiend.png',
  './assets/ledger/icons/the_collector.png',
  './assets/ledger/icons/high_roller.png',
  './assets/ledger/icons/diamond_hands.png',
  './assets/ledger/icons/empire_builder.png',
  './assets/ledger/icons/pier_pressure.png',
  './assets/ledger/icons/king_of_docks.png',
  './assets/ledger/icons/smooth_operator.png',
  './assets/ledger/icons/market_maven.png',
  './assets/ledger/icons/loan_survivor.png',
  './assets/ledger/icons/club_fed.png',
  './assets/ledger/icons/buy_hard.png',
  './assets/ledger/icons/buy_hard_2.png',
  './assets/ledger/icons/one_hp_wonder.png',
  './assets/ledger/icons/ups_and_downs.png',
  './assets/ledger/icons/artful_dodger.png',
  './assets/ledger/icons/cognac_barbarian.png',
  './assets/ledger/icons/witness_reinvestment.png',
  './assets/ledger/icons/scotch_and_awe.png',
  './assets/ledger/icons/silence_of_loans.png',
  './assets/ledger/icons/shopaholic.png',
  './assets/ledger/icons/survivor.png',
  './assets/ledger/icons/pasta_la_vista.png',
  './assets/ledger/icons/gnocchi_horror_show.png',
  './assets/ledger/icons/ship_happens.png',
  './assets/ledger/icons/titanic_markup.png',
  './assets/ledger/icons/jazz_stinger.png',
  './assets/ledger/icons/great_gats_got.png',
  './assets/ledger/icons/dow_jonesing.png',
  './assets/ledger/icons/margin_of_terror.png',
  './assets/ledger/icons/bribe_and_prejudice.png',
  './assets/ledger/icons/license_to_ill.png',
  './assets/ledger/icons/pallet_wounds.png',
  './assets/ledger/icons/crate_expectations.png',
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
  './assets/ledger/icons/ziegfeld.png',
  './assets/ledger/icons/hollywood.png',
  './assets/ledger/icons/wales.png',
  './assets/ledger/icons/wallst.png',
  './assets/ledger/icons/ruth.png',
  './assets/ledger/icons/walker.png',
  './assets/ledger/icons/red_wedding.png',
  './assets/ledger/icons/declares_himself_mayor.png',
  './assets/ledger/icons/boss_of_bosses.png',
  './assets/ledger/icons/opens_the_vault.png',
  './assets/ledger/icons/takes_the_city.png',
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

const ICON_PATTERN = /(?:apple-touch-icon|icon-(?:180|192|512))\.png(?:\?.*)?$/;
/** App shell — network-first so ledger/UI fixes reach installed PWAs without a stale trap. */
const SHELL_PATTERN = /\/(gangwars\.html|gangwars\.css|engine\.js|ledger\.js|tips\.js|ledger-ui\.js|scores-ui\.js|event-ui\.js|travel-ui\.js|market-ui\.js|bank-ui\.js|standard-events\.js|feds-event\.js|audio\.js|sw\.js)$/;
/** Ledger art — network-first so regenerated -base PNGs are not trapped in cache-first. */
const LEDGER_PATTERN = /\/assets\/ledger\//;
/** Goods art — network-first so replaced market icons show immediately after deploy. */
const GOODS_PATTERN = /\/assets\/goods\/[^/]+\.png$/;
/** Event art — network-first so regenerated event cards are not trapped in cache-first. */
const EVENT_PATTERN = /\/events\/[^/]+\.(?:jpg|png)$/;

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(ASSETS.map(url => c.add(url)))
    )
  );
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
  if (SHELL_PATTERN.test(path) || LEDGER_PATTERN.test(path) || GOODS_PATTERN.test(path) || EVENT_PATTERN.test(path)) {
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
