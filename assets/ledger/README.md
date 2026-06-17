# Crime Ledger assets

Screen art and achievement icons for the Crime Ledger UI (`ledger-ui.js`).

**Integration spec:** [`docs/crime-ledger-integration-prompt.md`](../../docs/crime-ledger-integration-prompt.md)

**UI reference screens:** [`docs/ui-standards/ledger-*.png`](../../docs/ui-standards/)

## Screen art (473×1024 canvas)

| File | Purpose |
|------|---------|
| `crime-ledger-home-base.png` | Home — category rows + total counter overlay |
| `ledger-general-base.png` | General category list (14 rows, scroll) |
| `ledger-rare-base.png` | Rare category list |
| `ledger-super-rare-base.png` | Super Rare category list |
| `ledger-godlike-base.png` | Godlike category list |
| `ledger-golden-godlike-base.png` | Golden Godlike category list |

Full reference PNGs (with baked counters for design) sit alongside each `-base` file. The game renders **`-base` variants only**; counters and list rows are drawn in HTML.

## Icons

`icons/{achievementId}.png` — 40 achievement thumbnails (136×136 square, transparent).

`icons/locked.png` — padlock shown for undiscovered entries.

## Source grids (for re-slicing)

| File | Layout |
|------|--------|
| `general-icons-source.png` | 5 + 5 + 4 |
| `rare-icons-source.png` | 2×5 |
| `super-rare-icons-source.png` | 2×5 |
| `godlike-icons-source.png` | 2×3 (5 godlike + golden) |

Regenerate icons: `python scripts/split-ledger-icons.py`

## Testing

Crime Ledger has dedicated graphic and integration tests (separate from `npm test`):

| Command | What it checks |
|---------|----------------|
| `npm run test:ledger` | Achievement logic + static assets (473×1024 screens, 136×136 icons, blueprint sync, SW cache, inpaint) |
| `npm run test:ledger:graphics` | Playwright: 6 screens × 2 data states + general reveal, DOM structure, pixel regression |
| `npm run audit:ledger` | Both of the above |
| `npm run audit:ledger:capture` | Refresh pixel baselines after intentional art/layout changes |

**First-time setup for graphics tests:**

```bash
npm install
npx playwright install chromium
```

**Baselines:** committed under `tests/ledger-baselines/`. After changing screen art or overlay rects, run `npm run audit:ledger:capture` and review diffs.

**Review captures:** `docs/review/ledger-screenshots/` (written on each graphics test run).

## Pipeline

1. Drop updated screen PNGs (or replace `*-base` sources via full PNGs + blueprint `inpaint` rects).
2. `python scripts/prepare-ledger-assets.py` — normalize to 473×1024, regenerate `-base` variants.
3. Update rects in `scripts/ledger-blueprint.json` if layout changed.
4. Register new paths in `sw.js` and bump `CACHE`.
