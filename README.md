# Gang Wars — Prohibition 1929

**🎮 Play now: [hammertymm.github.io/GangWars](https://hammertymm.github.io/GangWars/)**

A browser-based trading game set in 1920s Prohibition-era New York. Inspired by John E. Dell's classic 1984 DOS trading game — same mechanics, same pressure, different era.

Buy low. Sell high. Pay the Don before the clock runs out.

Runs as a Progressive Web App — installs on your phone, plays fully offline, no app store required.

-----

## Gameplay

You have **30 days** and **$10,000** to make your fortune running contraband across six territories. The Don lent you **$25,000** to get started and he charges **10% interest per day**, compounding. Pay him back before day 30 or the debt will swallow everything you’ve made.

Each day you can:

- **Buy and sell** contraband goods at whatever the market is paying that day
- **Move** to another territory — prices reset every time you travel
- **Visit the Don** (Little Italy only) to repay debt, borrow more, or deposit cash in the bank at 6% daily interest

The market is volatile. Shortages send prices through the roof. Flooded supply crashes them. Events — from police raids to celebrity appearances — can reshape the market for a day. Learn the ranges, read the city, move fast.

**Your score** is your net worth on day 30: cash + bank − debt. Score scales smoothly from 0 to **100**; a perfect **100** requires **$10M** net (Big Daddy J).

-----

## Territories

|Territory         |Character                                                   |
|------------------|------------------------------------------------------------|
|Little Italy      |Home base — the Don and the bank are here                   |
|Dock #13          |Where everything enters the city. High volume, unpredictable|
|Kitty Kat Club    |Jazz, nightlife, and deals made over drinks                 |
|Uptown            |Wealthy clientele. Premium prices for premium goods         |
|Warehouse District|No questions asked. The city’s logistical underworld        |
|City Hall         |The law is for sale. The price changes daily                |

-----

## Goods

Prices fluctuate daily within their ranges. Market events can push them well above or below normal.

|Good        |Low    |High    |Family  |
|------------|-------|--------|--------|
|Moonshine   |$50    |$250    |Alcohol |
|Cuban Cigars|$200   |$700    |Luxury  |
|Bathtub Gin |$600   |$2,000  |Alcohol |
|Forged Art  |$1,500 |$5,500  |Criminal|
|Aged Scotch |$4,500 |$16,000 |Alcohol |
|Counterfeits|$13,000|$35,000 |Criminal|
|Fine Cognac |$28,000|$65,000 |Alcohol |
|Fur Coats   |$52,000|$100,000|Luxury  |
|Champagne   |$78,000|$115,000|Alcohol |
|Diamonds    |$96,000|$140,000|Luxury  |

-----

## Market Events

Each time you travel, the city may have something waiting:

**Daily:**

- **Price spike** — a police raid or dry spell sends one good through the roof
- **Buying frenzy** — demand surge, prices climb hard
- **Flooded market** — a rival’s shipment dumped cheap, prices collapse
- **Lucky haul** — free stock if you have the stash space
- **Hidden compartments** — a mechanic offers to rig your vehicle for extra carry capacity
- **A piece for sale** — a contact offers you a gun (useful when the Feds show up)
- **The Feds** — Agent Hayes and his men. Fight, run, or pay them off

**Rare events (~1 in 25 runs):**
Historical figures — Capone, Luciano, Rothstein, Armstrong and others — trigger a forced price surge on their associated commodity in a specific district. You have to already be there to benefit.

**Super Rare (~1 in 100 runs):**
A major city event drives all prices in one district to 3× normal for a single day. Babe Ruth. Lindbergh. The Prince of Wales.

**Godlike (~1 in 200 runs):**
Big Daddy J comes to town. One district. One day. Ten times normal prices. The stuff of legend.

**Golden Godlike (~1 in 1,000 runs):**
The rarest roll in the game. Every district. One day. Ten times normal prices everywhere. If you see it, move.

-----

## Crime Ledger

Account-wide **40-entry achievement collection** — progress persists across runs in `localStorage` (`gw:ledger`).

Open **LEDGER** from the title screen to browse five categories:

| Category | Entries | Examples |
|----------|--------:|----------|
| General | 14 | Made Man, First Million, Survivor |
| Rare | 10 | Historical figures trigger district price spikes |
| Super Rare | 10 | City-wide headline events (Lindbergh, Ruth, Ziegfeld…) |
| Godlike | 5 | Big Daddy J visits one district at 10× prices |
| Golden Godlike | 1 | Golden Shower — every district at 10× for one day |

Unlocks during a run show an **Achievement Found** popup, then either a title reveal (general) or full event card (rare+), and finally the entry in the ledger list with icon, title, and description.

Complete all 40 to earn **Crime Lord** status.

Visual reference screens: [`docs/ui-standards/ledger-*.png`](docs/ui-standards/). Integration spec: [`docs/crime-ledger-integration-prompt.md`](docs/crime-ledger-integration-prompt.md).

-----

## The Feds

Getting caught means choosing fast:

- **Fight** — only if you’re armed. Win and you walk away with their cash. Ten hits and it’s over.
- **Run** — decent odds, no cost. Take a hit if they stay on you.
- **Pay off** — costs cash, always works. Gets more expensive with more agents.

-----

## Install as an App (PWA)

No app store. No account. No tracking.

**iPhone / iPad (Safari):**

1. Open the game URL in Safari
1. Tap the **Share** button
1. Tap **Add to Home Screen**
1. Tap **Add**

**Android (Chrome):**

1. Open the game URL in Chrome
1. Tap **⋮** → **Add to Home Screen**

**Desktop (Chrome / Edge):**

1. Look for the install icon in the address bar
1. Click **Install**

Once installed, the game works fully offline.

-----

## Files

|File              |Purpose                                              |
|------------------|-----------------------------------------------------|
|`gangwars.html`   |Game UI, styles, routing, and event copy             |
|`engine.js`       |Pure game logic — prices, travel, bank, save migration|
|`engine.test.js`  |Node unit tests for the engine                       |
|`ledger.js`       |Crime Ledger achievement definitions and unlock logic|
|`ledger-ui.js`    |Crime Ledger screen rendering (base PNG + overlays)  |
|`ledger.test.js`  |Node unit tests for the ledger                       |
|`ledger.assets.test.js`|Crime Ledger asset, blueprint, and SW integration tests |
|`ledger.graphics.spec.js`|Playwright graphic tests for all 6 ledger screens |
|`ledger-blueprint.js`|Runtime overlay layout (auto-generated from blueprint JSON) |
|`tests/ledger-baselines/`|Pixel regression baselines for ledger graphics tests |
|`assets/ledger/`  |Crime Ledger screen art, `-base` variants, and icons |
|`scripts/ledger-blueprint.json`|Hit/counter rects for ledger UI overlays   |
|`title-screen.png`|Title screen artwork                               |
|`manifest.json`   |PWA manifest — name, icons, display settings         |
|`sw.js`           |Service worker — caches the game for offline play    |
|`apple-touch-icon.png`|iOS home screen icon (180×180)                        |
|`icon-192.png`    |App icon (home screen, Android)                      |
|`icon-512.png`    |App icon (splash screen, high-res displays)          |
|`index.html`      |Redirect to `gangwars.html`                          |

-----

## Technical Notes

- **No dependencies** — vanilla JavaScript, no frameworks, no build step
- **No backend** — all game state lives in `localStorage`; nothing is sent anywhere
- **No accounts** — no login, no data collection, no tracking
- **Engine/UI split** — testable logic in `engine.js` and `ledger.js`; UI in `gangwars.html` and `ledger-ui.js`
- **Crime Ledger tests** — `npm run test:ledger` (logic + assets); `npm run test:ledger:graphics` (Playwright, requires `npx playwright install chromium`); `npm run audit:ledger` runs both
- **Offline** — service worker caches all files on first load; works with no connection thereafter
- **Save state** — current run (`gw:save`), high scores (`gw:highscores`), and Crime Ledger (`gw:ledger`) persist in browser local storage

-----

## Design Notes

Gang Wars is a faithful Prohibition-era reskin of the classic 1984 pocket trading game (John E. Dell). The core loop — volatile prices, compounding debt, territory movement, combat with law enforcement — is reproduced from the original. All names, locations, flavor text, historical references, and artwork are original.

Price ranges are scaled ×5 from the original documented values across 10 distinct trading tiers, giving the same risk/reward structure at a scale that feels right on modern screens.

The event system layers historical atmosphere over the mechanical core: 10 rare events tied to real Prohibition-era figures, 10 super-rare events drawn from 1929 headlines, and the Godlike tier — Big Daddy J — for runs that will be talked about.

-----

*The Don wants his money. The Feds want your neck. Thirty days.*