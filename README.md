# Gang Wars — Prohibition 1929

**🎮 Play now: [hammertymm.github.io/GangWars](https://hammertymm.github.io/GangWars/)**

Buy low. Sell high. Pay the Don before the clock runs out.

Runs as a Progressive Web App — installs on your phone, plays fully offline, no app store required.

-----

## Gameplay

You have **30 days** and **$10,000** to make your fortune running contraband across six territories. The Don lent you **$25,000** to get started and he charges **10% interest per day**, compounding. Pay him back before day 30 or the debt will swallow everything you’ve made.

Each day you can:

- **Buy and sell** contraband goods at whatever the market is paying that day
- **Move** to another territory — prices reset every time you travel
- **Visit the Don** (Little Italy only) to repay debt, borrow more, or deposit cash in the bank at 6% daily interest

The market is volatile. Shortages send prices through the roof. Flooded supply crashes them. Events — from police raids to celebrity appearances — can reshape the market for a day. Today’s price is all you get on the buy screen; when you sell, the game shows your average cost and profit % vs the current quote. Read the city, move fast.

**Your score** is your net worth on day 30: cash + bank − debt. Score scales smoothly from 0 to **100**; a perfect **100** requires **$50M** net (Big Daddy J).

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

Ten contraband tiers — from street moonshine to diamonds. Prices change every day you travel; market events can push them far above or below what you’ve seen before. The buy/sell screens show only today’s quote (not historical low/high bands). On **sell**, you also see your average cost and profit **%** vs the current price.

|Good        |Family  |
|------------|--------|
|Moonshine   |Alcohol |
|Cuban Cigars|Luxury  |
|Bathtub Gin |Alcohol |
|Forged Art  |Criminal|
|Aged Scotch |Alcohol |
|Counterfeits|Criminal|
|Fine Cognac |Alcohol |
|Fur Coats   |Luxury  |
|Champagne   |Alcohol |
|Diamonds    |Luxury  |

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
|`ledger.js`       |Crime Ledger achievement definitions and unlock logic|
|`ledger-ui.js`    |Crime Ledger screen rendering (base PNG + overlays)  |
|`audio.js`        |Audio catalog, music/SFX playback, mute settings     |
|`assets/audio/`   |Music and sound effect `.ogg` files                  |
|`ledger-blueprint.js`|Runtime overlay layout for Crime Ledger home screen |
|`assets/ledger/`  |Crime Ledger screen art, header images, and icons    |
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
- **Engine/UI split** — game logic in `engine.js` and `ledger.js`; UI in `gangwars.html` and `ledger-ui.js`
- **Offline** — service worker caches all files on first load; works with no connection thereafter
- **Save state** — current run (`gw:save`), high scores (`gw:highscores`), Crime Ledger (`gw:ledger`), and audio prefs (`gw:audio`) persist in browser local storage
- **Audio** — [`audio.js`](audio.js) drives music and SFX; assets live in [`assets/audio/`](assets/audio/). Placeholder files are generated via `python scripts/generate-audio-placeholders.py` — drop in real `.ogg` files by path to replace them. Full ID map: [`docs/audio-catalog.md`](docs/audio-catalog.md). Mute toggle on title screen and in-run masthead.

-----

## Design Notes

Gang Wars is a faithful Prohibition-era reskin of the classic 1984 pocket trading game (John E. Dell). The core loop — volatile prices, compounding debt, territory movement, combat with law enforcement — is reproduced from the original. All names, locations, flavor text, historical references, and artwork are original.

Price ranges are scaled ×5 from the original documented values across 10 distinct trading tiers, giving the same risk/reward structure at a scale that feels right on modern screens.

The event system layers historical atmosphere over the mechanical core: 10 rare events tied to real Prohibition-era figures, 10 super-rare events drawn from 1929 headlines, and the Godlike tier — Big Daddy J — for runs that will be talked about.

-----

*The Don wants his money. The Feds want your neck. Thirty days.*
