# Crime Ledger UI — Handover Prompt for Claude

Use this document as your primary briefing. The user will attach a **full repo zip** plus **iPhone Safari screenshots** showing bugs still present after commit `2127ff4` (SW `gangwars-v61`, asset `?v=61`).

---

## Your mission

Fix the **Crime Ledger** screen in the Gang Wars PWA so it matches the reference designs on **real iPhone Safari / home-screen PWA**, not just desktop Playwright. The user still sees text artifacts, remnants, and overlays covering the graphics.

**Do not declare victory until verified on mobile Safari (390×844) or Playwright WebKit iPhone profile.** Desktop Chromium tests currently all pass (59 tests) but **do not reproduce** what the user sees.

---

## Project context

- **Repo:** Gang Wars — vanilla JS PWA, no build step
- **Live URL:** https://hammertymm.github.io/GangWars/gangwars.html
- **Latest commit:** `2127ff4` — "Fix Crime Ledger divider ghost text and Safari icon sizing."
- **Stack:** `gangwars.html` + `ledger.js` + `ledger-ui.js` + `ledger-blueprint.js` + PNG assets under `assets/ledger/`
- **Design references (source of truth):** `docs/ui-standards/ledger-*.png` (473×1024)
- **Automated review captures (Playwright, may look correct):** `docs/review/ledger-screenshots/`
- **Test baselines:** `tests/ledger-baselines/`

---

## Architecture (how the ledger is supposed to work)

Each ledger screen = **one PNG base image** + **HTML overlays** positioned by blueprint rects on a 473×1024 canvas.

```
ledgerShell(baseAsset, overlayHtml, hits, back)
  └── .ledger-art-frame (aspect-ratio 473/1024, container-type: size)
        ├── <img src="assets/ledger/*-base.png?v=61">   ← static art, counters inpainted out
        ├── .ledger-overlay-layer                       ← home row labels, total counter
        ├── .ledger-header-overlay                      ← category header counter (.ledger-counter.cat)
        ├── .ledger-list-panel                          ← scrollable achievement rows (category views)
        └── .ledger-hit buttons                         ← invisible tap targets
```

### Text generation (JavaScript — live data)

| UI text | Generator | DOM class |
|---------|-----------|-----------|
| `0 / 40 FOUND` | `LedgerUI.renderHome()` → `ledgerCounterHtml(..., bp.totalCounter, "total")` | `.ledger-counter.total` |
| `GENERAL 0 / 14`, etc. | `renderHome()` → `ledgerRowLabelHtml(cat.title, n, total, rl)` | `.ledger-row-label` |
| `0 OF 5 DISCOVERED` / `0 / 14 FOUND` | `renderCategory()` → `ledgerCounterHtml(categoryCounterText(...), bp.counter, "cat")` | `.ledger-counter.cat` |
| `UNKNOWN` / `???` rows | `buildListRows()` | `.ledger-list-row` |

All positioned via `ledgerRectStyle(rect)` → percentage `left/top/width/height` against `LEDGER_CANVAS` (473×1024).

### Baked text (PNG — must be erased from `-base.png`)

`scripts/prepare-ledger-assets.py` inpaints dynamic text regions from full PNGs into `-base.png` variants. If inpaint misses pixels, you get **double layers** (baked + HTML).

**Home-specific lesson (commit 2127ff4):** `center_row_labels()` moved HTML overlays to row-center Y, but artwork text sits ~18–23px lower on divider ornaments. Fix attempted: separate `rowInpaint` strips (bottom 32px of each row hit band). User still sees bugs — fix incomplete or different failure on device.

**Category-specific concern:** Each category has `counter`, `gap`, and `listPanel` inpaint regions. Gap fill uses `sample_fill_color()` — on device user sees **brown/tan bars** with counter text overlapping header art and first list row.

---

## User-reported bugs (June 2026 iPhone screenshots — attach these)

The user marked problem areas with white boxes / X. Compare against `docs/ui-standards/` references.

### Bug A — Home: stacked ghost text block (center of list)

All labels appear **stacked in one vertical column** over the middle rows:

```
0 / 40 FOUND
GENERAL 0 / 14
RARE 0 / 10
SUPER RARE 0 / 10
GODLIKE 0 / 5
GOLDEN GODLIKE 0 / 1
```

Looks like either:
- all `.ledger-row-label` + `.ledger-counter.total` divs share the same computed position on iOS, OR
- baked PNG text + HTML overlays both visible and visually collapsed, OR
- stale cached assets (less likely if v61 confirmed loaded)

### Bug B — Category: header counter bleeding into first list row

On RARE, GODLIKE, etc. (empty and partial states):

- Header shows correct `0 OF N DISCOVERED` under category title in PNG art
- **Same text fragment** (`OF 10 DISCOVERED`, `OF 5 DISCOVER`, `OF 1 DISCOVERED`) appears again **inside the first `.ledger-list-row`**, overlapping the crown/trophy/BOOTLEGGER row
- Partial RARE: brown rectangular block behind the stray text over BOOTLEGGER row

Likely causes to investigate:
1. `.ledger-counter.cat` absolute `%` positioning broken on iOS Safari (counter rect overlaps `listPanel.y`)
2. Category counter inpaint rect wrong Y — baked text remains at different Y than HTML overlay
3. `.ledger-list-panel` has `background:#000` but gap inpaint fill is brown — panel or counter overlaps header zone
4. `ledger-header-overlay` and `.ledger-list-panel` z-index stacking; counter not clipped to header zone

### Bug C — Golden Godlike: counter bar over title graphic

`0 OF 1 DISCOVERED` renders as a **horizontal brown bar** across the "GOLDEN GODLIKE" header illustration (user X'd this). Counter blueprint: `y:382` — may overlap title art; inpaint gap may be wrong.

### Bug D — Padlock / icon sizing (may be improved in v61)

Category list lock icons were giant on WebKit (percentage CSS vars failed). v61 switched to `cqh`/`cqw` + absolute-positioned `img`. Verify on device — user screenshots show normal-sized lock icons in UNKNOWN rows but header row artifacts remain.

---

## Key files (read in this order)

1. `ledger-ui.js` — `renderHome`, `renderCategory`, `buildListRows`, `ledgerRectStyle`, `listPanelStyleVars`
2. `gangwars.html` — `.ledger-*` CSS (lines ~218–265), especially `container-type`, `cqw`/`cqh`, absolute overlays
3. `scripts/ledger-blueprint.json` — all rect coordinates + `rowInpaint` + category `inpaint`
4. `ledger-blueprint.js` — auto-generated runtime subset
5. `scripts/measure-ledger-counters.py` — measures rects from ui-standards; `center_row_labels`, `home_row_inpaint_strips`
6. `scripts/prepare-ledger-assets.py` — inpaint pipeline, `sample_fill_color`, gap rects
7. `sw.js` — cache `gangwars-v61`, network-first for `/assets/ledger/`
8. `ledger.graphics.spec.js` — Playwright visual tests (390 + 540 viewports)

---

## Commands

```bash
# Regenerate blueprint + base PNGs after changing measurement/inpaint
python scripts/measure-ledger-counters.py
python scripts/prepare-ledger-assets.py

# Full test suite (31 unit + 28 graphics)
npm run audit:ledger

# Update screenshot baselines after intentional visual change
npm run audit:ledger:capture
```

**Playwright uses desktop Chromium by default** — add WebKit + iPhone 13 device profile tests or manual Safari verification.

Debug probe script (local, not committed): `scripts/debug-ledger-probe.js`

---

## What was already tried (do not repeat blindly)

| Attempt | Commit | Result |
|---------|--------|--------|
| Inline HTML counters, remove right-edge counters | `fbc7e42` | Tests pass; device still broken |
| SW v60 network-first, `?v=60` cache bust | `07392b3` | User unchanged |
| Full row label HTML + inpaint | `07392b3` | Partial |
| Separate `rowInpaint` bottom strips + `cqh` icon sizing | `2127ff4` | Playwright pass; **user still broken on iPhone** |

### Confirmed root cause (home, local pixel analysis)

- HTML overlays at blueprint Y (centered in row hits)
- Baked PNG text at ~18–23px lower (on divider ornaments)
- Two visible layers = "ghost text on dividers"

### Confirmed root cause (category icons, Playwright iPhone)

- Pre-v61: `--row-h: 5.6818%` → icon wrap collapsed to 2px, img blew up to 284×342px
- Post-v61: `cqh`/`cqw` + absolute img → 17×17px in probe logs

---

## Recommended investigation path

1. **Reproduce on WebKit iPhone 13** (Playwright `devices['iPhone 13']`) — capture DOM rects for every `.ledger-counter`, `.ledger-row-label`, `.ledger-list-panel` vs `.ledger-art-frame` bounds. Compare to Chromium.

2. **Category counter overlap:** Check if `bp.counter` rect intersects `bp.listPanel` or first row Y on WebKit. Consider:
   - Moving `.ledger-counter.cat` inside a clipped header sub-container (not full-frame overlay)
   - Expanding category counter inpaint to match **measured** text Y in source PNG (same bug as home)
   - Removing HTML category counter entirely if baked into header art zone incorrectly

3. **Home stacked block:** If all labels share `top:0` or same rect on iOS, `%` positioning against `.ledger-art-frame` may fail when nested `container-type: size` on both `.ledger-art-screen` and `.ledger-art-frame`. Try:
   - Single container query root
   - Pixel positioning via JS after layout (`getBoundingClientRect` on img)
   - CSS `top: calc(...)` from blueprint coords without `%`

4. **Gap inpaint brown bars:** `sample_fill_color` may sample gold/brown from counter pixels → visible bar when HTML counter misaligned. Verify `-base.png` gap regions visually.

5. **Cache verification:** Confirm device loads `?v=61` and `gangwars-v61`. User must clear site data / reinstall PWA after deploy.

6. **Alternative architecture (if CSS overlay approach is fundamentally broken on iOS):** Render counters as plain text nodes inside flex rows matching reference layout instead of absolute overlays on PNG — larger refactor but eliminates double-layer problem.

---

## Reference images in repo

| Purpose | Path |
|---------|------|
| Design source (home) | `docs/ui-standards/ledger-home.png` |
| Design source (categories) | `docs/ui-standards/ledger-general.png`, `ledger-rare.png`, `ledger-super-rare.png`, `ledger-godlike.png`, `ledger-golden-godlike.png` |
| Playwright captures (390px) | `docs/review/ledger-screenshots/ledger-*-390.png` |
| Playwright captures (540px) | `docs/review/ledger-screenshots/ledger-*-540.png` |
| Manifest | `docs/review/ledger-screenshots/manifest.json` |

**User device screenshots (June 17 ~15:53–15:54, attach with zip):**

- Home empty — stacked ghost text over rows
- RARE partial — `OF 10 DISCOVERED` over BOOTLEGGER row
- GODLIKE empty — `OF 5 DISCOVER` over first row / THE DON area
- GOLDEN GODLIKE empty — brown bar `0 OF 1 DISCOVERED` over title art

(Cursor session also saved copies under workspace `assets/c__Users_jarro_...` paths if present in zip.)

---

## Success criteria

- [ ] Home: exactly **one** label per row, no stacked block, no divider ghosts
- [ ] Category: header counter only under category title in header zone — **never** in list rows
- [ ] No brown inpaint bars visible except matching reference art
- [ ] Lock icons small, contained in row icon box
- [ ] `npm run audit:ledger` passes including **WebKit iPhone** if added
- [ ] User confirms on physical iPhone PWA after cache clear

---

## Constraints

- Vanilla JS, no build step
- Terminology: use **Contraband/GOODS** — no "DRUGS" references
- Bump `LEDGER_ASSET_VERSION` in `ledger-ui.js` and `CACHE` in `sw.js` when changing assets or SW behavior
- Do not trust Playwright Chromium alone — user device is the acceptance test

---

## Copy-paste prompt for Claude

```
I'm handing off a Crime Ledger UI bug in the Gang Wars PWA (vanilla JS, no build).

Read docs/review/CRIME-LEDGER-HANDOVER.md in the repo zip first.

Latest commit: 2127ff4 (SW gangwars-v61). All 59 Playwright/Chromium tests pass, but my iPhone Safari PWA still shows:
1) Home: all row labels stacked in one block over the list
2) Category screens: "0 OF N DISCOVERED" text bleeding into the first achievement row / over header art (brown bars)
3) Graphics still covered by text remnants

Attached: repo zip + iPhone screenshots (white boxes mark bugs).
Reference designs: docs/ui-standards/ledger-*.png
Fix for real iPhone Safari, not desktop Chromium only. Debug with WebKit iPhone profile or device logs before claiming fixed.
```
