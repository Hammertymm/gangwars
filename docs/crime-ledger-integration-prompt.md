# Crime Ledger Graphics Integration — Agent Prompt

> **Status:** Integrated on `main` (commit `a77291d` and later). Use this brief when **refreshing** Crime Ledger screen art or icon grids — not for initial wiring.

Use this document as the full task brief when integrating a new Crime Ledger graphics pack.
Attach all screen artwork to the same conversation.

---

## TASK

Integrate the attached Crime Ledger graphics pack into Gang Wars seamlessly.

The legacy Crime Ledger visual system was fully removed. Achievement logic is intact.
Wire the **new attached artwork** into the existing navigation and data layer — do not redesign
achievements, do not change game mechanics, and do not reintroduce deleted legacy assets.

---

## ATTACHED INPUTS (provided with this prompt)

Expected screens (6 total):

| Screen | categoryId | Achievement count |
|--------|------------|------------------:|
| Crime Ledger Home | — | total + 5 category rows |
| General | `general` | 14 |
| Rare | `rare` | 10 |
| Super Rare | `superRare` | 10 |
| Godlike | `godlike` | 5 |
| Golden Godlike | `goldenGodlike` | 1 |

Map each attached image to the correct screen. If filenames are ambiguous, infer from on-screen
labels (GENERAL, RARE, SUPER RARE, GODLIKE, GOLDEN GODLIKE, GANG WARS masthead).

If images include regions for dynamic counters, prefer **base PNG + transparent overlay** pattern.
Measure hit/counter rects and save to `scripts/ledger-blueprint.json`.

Save assets under `assets/ledger/` (directory exists; see `assets/ledger/README.md`).

---

## READ FIRST (mandatory)

Before writing code, read:

| File | Purpose |
|------|---------|
| `ledger.js` | Achievement definitions & data API — **DO NOT change contracts** |
| `ledger.test.js` | Must pass unchanged |
| `ledger-ui.js` | UI renderer — `LedgerUI.render(app, ctx)` |
| `gangwars.html` | Routing, `renderLedgerRoute()`, `window.GangWarsLedger` |
| `docs/style-specification.md` | UI palette, visual lanes |
| `.cursor/rules/ui-layout-standards.mdc` | Portrait-only; do not alter popup/travel/end screens |
| `sw.js` | Add new assets; bump `CACHE` version |

**DO NOT modify:**

- `ledger.js` data models, category IDs, achievement IDs, unlock logic
- `engine.js` event/achievement linkage
- Event popup, travel, or end-screen layouts
- Achievement persistence key (`gw:ledger`) or save shape

---

## CURRENT INTEGRATION SURFACE

### Routing state (`gangwars.html`)

| Variable | Values |
|----------|--------|
| `ledgerView` | `null` \| `"home"` \| `"category"` |
| `ledgerViewCat` | `null` \| `general` \| `rare` \| `superRare` \| `godlike` \| `goldenGodlike` |
| `ledgerFocusId` | achievement id string or `null` |
| `ledgerReturn` | return context when opened mid-game |
| `pendingUnlockQueue` | newly unlocked ids awaiting presentation |
| `pendingCompleteQueue` | category ids or `"master"` awaiting completion popup |

### Navigation hooks (wire UI to these)

| Function | Action |
|----------|--------|
| `openLedgerFromTitle()` | Title screen LEDGER button → home |
| `openLedgerCategory(catId)` | Home → category list |
| `openLedgerReveal(id)` | Jump to category with row focus |
| `exitLedgerCategory()` | Back to home (or restore prior screen) |
| `exitLedgerHome()` | Exit ledger entirely |
| `ledgerUiCtx()` | Context object passed to `LedgerUI.render()` |

### `ledgerUiCtx()` shape

```javascript
{
  view: ledgerView,           // "home" | "category"
  catId: ledgerViewCat,       // category id when view === "category"
  focusId: ledgerFocusId,     // achievement id to scroll/highlight/reveal
  ledger,                     // live ledger state object
  onOpenCategory,             // (catId) => void
  onBackHome,                 // () => void  — category back → home
  onBackCategory,             // () => void  — used as back from category
  onRevealComplete,           // () => void  — after general reveal animation
}
```

### Public API (`window.GangWarsLedger`)

- `getLedger()`, `getViewState()`, `getPendingUnlocks()`, `getPendingCompletions()`
- `ledgerUiCtx()`, `ledgerProgressText()`, `saveLedger()`
- `openLedgerFromTitle`, `openLedgerCategory`, `openLedgerReveal`, `exitLedgerCategory`, `exitLedgerHome`
- `getAchievementCardImage(id)` — event-tier card PNG path for unlock reveal

### Render hook

`renderLedgerRoute()` in `gangwars.html` calls:

```javascript
LedgerUI.render(app, ledgerUiCtx());
```

Implement or update `LedgerUI.render` in `ledger-ui.js`. Do not move routing state out of `gangwars.html`.

---

## ACHIEVEMENT DATA CONTRACT (read-only)

Source of truth: `LEDGER_CATEGORIES` in `ledger.js` (40 achievements).

### Counter formats

| categoryId | Home row | Category screen header |
|------------|----------|------------------------|
| `general` | `{n} / 14 FOUND` | `{found} / 14 FOUND` |
| `rare` | `{n} / 10` | `{n} OF 10 DISCOVERED` |
| `superRare` | `{n} / 10` | `{n} OF 10 DISCOVERED` |
| `godlike` | `{n} / 5` | `{n} OF 5 DISCOVERED` |
| `goldenGodlike` | `{n} / 1` | `{n} OF 1 DISCOVERED` |

Home total: `{countDiscovered(ledger)} / 40 FOUND`

### Per-achievement record (`ledger.achievements[id]`)

- `unlocked`, `revealed`, `unlockDate`, `triggerCount`

### List row display rules

| State | General | Event tiers (rare+) |
|-------|---------|---------------------|
| Locked | `???` | `UNKNOWN` |
| Unlocked, not revealed | Reveal animation → title + ✓ | Card reveal popup first |
| Revealed | Title + ✓ | Title + ✓ |

### Helpers (from `ledger.js`, already global)

`isUnlocked`, `isRevealed`, `revealAchievement`, `countUnlocked`, `countDiscovered`,
`getAchievementTitle`, `getCategoryForAchievement`, `isCategoryComplete`,
`markCategoryCompleteShown`, `checkMasterComplete`, `LEDGER_TOTAL`, `LEDGER_CATEGORIES`

### Event card images (unlock reveal popups)

Use `getAchievementCardImage(id)` in `gangwars.html`:

| categoryId | Path pattern |
|------------|--------------|
| `rare` | `events/rare_{id}.png` |
| `superRare` | `events/super_{id}.png` |
| `godlike` | `events/godlike_{id}.png` |
| `goldenGodlike` | `events/godlike_golden.png` |

---

## IMPLEMENTATION STEPS

### 1. Asset ingest

Save attached images to `assets/ledger/`, e.g.:

```
crime-ledger-home-base.png   (or .png if counters are dynamic)
ledger-general-base.png
ledger-rare-base.png
ledger-super-rare-base.png
ledger-godlike-base.png
ledger-golden-godlike-base.png
```

Normalize to portrait canvas matching attached art aspect ratio. Document final size in
`scripts/ledger-blueprint.json` (`canvas: { w, h }`).

### 2. Implement `ledger-ui.js`

- `LedgerUI.render(app, ctx)` — home vs category branching
- Percentage-positioned transparent `.ledger-hit` buttons over base PNG
- Dynamic `.ledger-counter` overlays (gold `#c9a85a`, muted `#9a8860`)
- General list: 14 rows, scroll if needed
- Back button hit target on every screen (not Escape-only)

Shared helper in `ledger-ui.js`:

```javascript
ledgerRectStyle(r)  // r = { x, y, w, h } in canvas pixels
```

### 3. CSS in `gangwars.html`

Base mount classes already exist (`.ledger-play`, `.ledger-art-screen`, `.ledger-art-frame`,
`.ledger-mode`). Extend with list rows, counters, hits, completion popups, card reveal as needed.
Follow title-screen art-frame pattern (`container-type: size`, aspect-ratio frame).

### 4. Re-enable achievement presentation flow

`tryShowAchievementFlow()` in `gangwars.html` drives unlock presentation:

1. `pendingUnlockQueue` non-empty → "Achievement Found" popup
2. On dismiss:
   - **general** → `captureLedgerReturn()`; `openLedgerReveal(id)`; run reveal animation;
     `revealAchievement()`; `onRevealComplete()`
   - **event tiers** → full-screen card via `getAchievementCardImage(id)`; then list focus
3. `pendingCompleteQueue` → category/master completion popup
   - On dismiss → `markCategoryCompleteShown()` or `ledger.masterCompleteShown = true`

Drain queues without permanently blocking gameplay.

### 5. Service worker

Add all `assets/ledger/*.png` to `sw.js` `ASSETS`. Bump `CACHE` version.

### 6. Style compliance

- Portrait-only, `#crt` max-width 540px
- `--amber` `#e7c879` for UI chrome; ledger counters `#c9a85a`
- Do not alter `.ev-popup`, `.travel-play`, or `.eos` layouts

---

## LAYOUT PATTERN

```
.ledger-play
  └── .ledger-art-screen          (flex center, black bg, container-type: size)
        └── .ledger-art-frame     (aspect-ratio w/h)
              ├── <img base>      (full bleed, pointer-events: none)
              ├── .ledger-overlay-layer   (counters + list, pointer-events: none)
              └── .ledger-hit       (absolute % positioned buttons)
```

Document rects in `scripts/ledger-blueprint.json`:

```json
{
  "canvas": { "w": 473, "h": 1024 },
  "screens": {
    "home": { "baseAsset": "...", "totalCounter": {}, "rowHits": [], "back": {} },
    "general": { "listPanel": {}, "rowHeight": 38, "scroll": true, "back": {} }
  }
}
```

---

## VALIDATION (must pass)

- [ ] `npm test` — `ledger.test.js` + `engine.test.js` unchanged and passing
- [ ] Title LEDGER button opens home with new art
- [ ] Each category row opens correct screen
- [ ] Counters reflect live `ledger` state
- [ ] Back navigation: category → home → title (or game if mid-run)
- [ ] Unlock during gameplay triggers presentation flow
- [ ] General reveal animation on first unlock
- [ ] Event unlock shows event card then list entry
- [ ] Category/master completion popups fire once
- [ ] `gw:ledger` save/load unchanged
- [ ] `sw.js` caches all new PNGs
- [ ] No changes to `ledger.js` achievement definitions

---

## OUTPUT REQUIRED

- Asset file list and screen mapping
- `scripts/ledger-blueprint.json` with measured rects
- Summary of files changed
- Confirmation all validation checks passed
