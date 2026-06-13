# GangWars

# Gang Wars — Prohibition 1929

A browser-based trading game set in 1920s Prohibition-era New York. Buy low, sell high, pay the Don before the clock runs out.

Built as a Progressive Web App — installs on your phone, plays offline, no app store required.

-----

## Gameplay

You have **30 days** and **$2,000** to make your fortune running contraband across six territories. The Don lent you $5,500 to get started and he charges **10% interest per day**, compounding. Pay him back before day 30 or the debt will swallow everything you’ve made.

Each day you can:

- **Buy and sell** eight contraband goods at whatever the market is paying
- **Move** to another territory — prices vary by location and reset every day
- **Visit the Don** (in Little Italy) to repay debt, borrow more, or stash cash safely in the bank

The market is volatile. Shortages send prices through the roof. Flooded supply crashes them. Learn the ranges, move fast, and get out before the Feds catch up with you.

**Your score** is your net worth on day 30: cash + bank − debt. $50M is a perfect 100.

-----

## Territories

|Territory     |Notes                                 |
|--------------|--------------------------------------|
|Little Italy  |Home base — Don & bank are here       |
|The Docks     |High traffic, unpredictable prices    |
|Downtown      |Established market, reliable mid-range|
|Speakeasy Row |Premium goods, premium prices         |
|Uptown        |Wealthy clientele, expensive tastes   |
|The Rail Yards|Rough area, volatile market           |

-----

## Goods

Prices fluctuate daily within their ranges. Events can push them well above or below.

|Goods      |Low    |High   |
|-----------|-------|-------|
|Beer       |$10    |$59    |
|Bathtub Gin|$70    |$249   |
|Moonshine  |$300   |$899   |
|Rum        |$600   |$1,349 |
|Bourbon    |$1,000 |$3,499 |
|Scotch     |$1,000 |$4,499 |
|Cognac     |$5,000 |$13,999|
|Champagne  |$15,000|$29,999|

-----

## Random Events

Each time you move, the streets may have something waiting for you:

- **Price spike** — a police raid or dry spell sends one good through the roof
- **Flooded market** — a rival’s shipment dumped cheap, prices collapse
- **Lucky haul** — a ditched crate, free stock if you have the stash space
- **Rival crew** — you get jumped and lose some cash
- **Hidden compartments** — a mechanic offers to rig your car for extra carry capacity
- **A piece for sale** — a contact offers you a gun (useful if the Feds find you)
- **The Feds** — Agent Hayes and his men. Fight, run, or pay them off

-----

## The Feds

Getting caught means choosing fast:

- **Fight** — only if you’re armed. Win and you walk away with their cash. Lose a round and you take a hit. Ten hits and it’s over.
- **Run** — decent odds of escape. Take a hit and drop some goods if they stay on you.
- **Pay off** — costs cash, always works. Gets more expensive with more agents.

Encounters get harder as the days go on.

-----

## Market Screen — Var Column

The **Var** column shows the difference between the current market price and what you paid (your average cost per unit):

- **Green** — market is above your cost. Profit if you sell now.
- **Red** — market is below your cost. Selling means a loss.
- **Dot** — you’re not holding any of that good.

Uses a weighted average if you’ve bought at multiple prices.

-----

## Install as an App (PWA)

This game is a Progressive Web App. No app store, no account.

**iPhone / iPad (Safari):**

1. Open the game URL in Safari
1. Tap the **Share** button
1. Tap **Add to Home Screen**
1. Tap **Add**

**Android (Chrome):**

1. Open the game URL in Chrome
1. Tap the **⋮** menu
1. Tap **Add to Home Screen**

**Windows / Mac:**

1. Open in Chrome or Edge
1. Look for the install icon in the address bar
1. Click **Install**

Once installed, the game works fully offline.

-----

## Files

|File           |Purpose                                                 |
|---------------|--------------------------------------------------------|
|`gangwars.html`|The entire game — engine, UI, and all assets in one file|
|`manifest.json`|PWA manifest — name, icon, display settings             |
|`sw.js`        |Service worker — caches the game for offline play       |
|`icon-192.png` |App icon (home screen, Android)                         |
|`icon-512.png` |App icon (splash screen, high-res displays)             |

-----

## Technical Notes

- **No dependencies** — vanilla JavaScript, no frameworks, no build step
- **No backend** — all game state lives in `localStorage`; nothing is sent anywhere
- **No accounts** — no login, no data collection, no tracking
- **Single file** — the entire game engine and UI is self-contained in `gangwars.html`; the other four files exist only to enable PWA installation and offline caching
- **Offline** — service worker caches all files on first load; works with no connection after that
- **Save state** — your current run, high scores, and settings are saved automatically in your browser’s local storage

-----

## Game Design

Gang Wars is a faithful recreation of the classic 1984 DOS trading game *Drug Wars* by John E. Dell, reskinned to a Prohibition-era setting. The core mechanics — prices, ranges, event odds, debt interest, combat — are reproduced from the original documented ruleset. All names, locations, flavor text, and artwork are original.

The gameplay loop is unchanged: the same risk/reward decisions, the same compounding pressure of the loan shark’s interest, the same rush of finding a flooded market two stops from where you just bought at full price.

-----

*Run the rackets. Pay the Don. Thirty days.*
