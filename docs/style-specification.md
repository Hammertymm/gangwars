# Gang Wars — Style Specification v1.1

## Purpose

This document defines the permanent visual standards for Gang Wars artwork and atmosphere.

It establishes:

- UI shell colours and typography
- Visual lanes (what style applies where)
- Event tier art rules (general → golden godlike)
- Big Daddy J (BDJ) character lock
- Technical export standards
- Quality control and governance

**Related standards (do not duplicate here):**

| Topic | Document |
|-------|----------|
| Popup, travel, end-screen **layout** | `docs/ui-standards/*.png`, `.cursor/rules/ui-layout-standards.mdc` |
| Event PNG **processing** | `scripts/event_art.py`, `scripts/split-*-events.py` |
| Rank card **processing** | `scripts/prepare-eos-assets.py` |
| Crime Ledger **integration** | Shipped in `ledger-ui.js`; brief for art refreshes: `docs/crime-ledger-integration-prompt.md` |

If future artwork conflicts with shipped assets, **the shipped assets are correct**.

---

# UI SHELL

The live game frame is an art-deco speakeasy: espresso black, cream text, gold accents. Portrait-only (`max-width: 540px`).

## Colour palette

| Token | Hex | Role |
|-------|-----|------|
| `--bg` | `#15110b` | Page background |
| `--panel` | `#201a11` | Panel fill |
| `--text` | `#ece1cd` | Body copy |
| `--dim` | `#9c8d73` | Secondary copy |
| `--amber` | `#e7c879` | Primary gold — titles, borders, emphasis |
| `--green` | `#c9a24a` | Accent gold (ledger counters use `#c9a85a`) |
| `--red` | `#cf6a5d` | Warnings / damage |
| `--border` | `#3a2f1d` | Panel borders |
| `--btnbg` | `#241d12` | Button fill |

Golden banner gradient (market): `#b8860b` → `#e7c879` → `#b8860b`.

## Typography

| Role | Font |
|------|------|
| Masthead, district titles, market headings | Serif — Didot, Bodoni MT, Playfair Display, Georgia |
| UI body, buttons, stats | Monospace — ui-monospace, SF Mono, Menlo, Consolas |
| Event popup narrative | Monospace body; `<b>` lines in gold |

Masthead uses **3px double gold** rules above and below `GANG WARS`.

## In-game asset treatment

Sepia pixel-art assets (districts, goods, rank cards) receive `filter: brightness(1.1)` in the UI for readability on dark backgrounds. Event popup art uses the same brightness boost on `.ev-left`.

---

# VISUAL LANES

Gang Wars uses **three coordinated lanes**. All share 1920s organised-crime mythology, warm tones, and high readability — but they are not the same rendering technique.

| Lane | Used for | Technique |
|------|----------|-----------|
| **A — Sepia pixel art** | District portraits, goods icons, rank cards | Crisp pixel art, tight warm palette |
| **B — Sepia engraving** | General, rare, and super-rare **event cards** | Cross-hatched newspaper / woodcut illustration, monochrome sepia |
| **C — Colour illustration** | Godlike and golden godlike **event cards** | Full-colour stylised illustration; BDJ scenes use rich gold, orange, purple, and controlled neon accents |

Do not mix lanes within a single asset category.

---

# LANE A — SEPIA PIXEL ART

## Applies to

- `assets/*.png` — six district portraits (`little-italy.png`, `dock-13.png`, etc.)
- `assets/goods/*.png` — commodity icons
- `cards/*.png` — end-game rank cards (`nobody.png` … `big-daddy-j.png`)

## Style definition

- **Pixel art** — hard edges, no anti-aliased gradients
- Sepia / bronze / gold palette on black or near-black
- Strong silhouette readable at thumbnail size
- `image-rendering: pixelated` / `crisp-edges` in UI

## District portraits

- Square format (~341×341 from `assets/district-grid-source.png`)
- Single iconic scene per district
- Displayed in market header and travel rows (`object-fit: cover`)

## Goods icons

- Source size **96×96** RGBA (`scripts/gen-goods-icons.py`)
- Tight quantised palette (~32 colours), gold frame border
- Warm browns, bronze, gold highlights

## Rank cards

- Normalised to **400px width** + 1px black pad (`scripts/prepare-eos-assets.py`)
- Variable height (~680px) per rank
- Character portrait cards; sepia pixel-art treatment matching districts
- Shown in `.eos-card` gold frame on game-over screen

---

# LANE B — SEPIA ENGRAVING EVENTS

## Applies to

**30 event popup images** in `events/`:

| Tier | Count | Filename pattern | Source grid |
|------|------:|------------------|-------------|
| General / travel / market | 10 | `the_feds.png`, `shortage.png`, … | `assets/event-grid-source.png` |
| Rare | 10 | `rare_*.png` | `assets/rare-event-grid-source.png` |
| Super rare | 10 | `super_*.png` | `assets/super-rare-event-grid-source.png` |

Split via `scripts/split-event-grid.py`, `split_rare_events.py`, `split_super_rare_events.py`. Do not hand-edit individual PNGs — re-slice from source.

## Style definition

- **Cross-hatched ink / newspaper engraving** — not pixel art, not smooth digital painting
- **Monochrome sepia** — browns, tans, blacks; no full-colour rendering
- High detail, period-prohibition atmosphere
- Character-driven scenes: crowds, streets, docks, speakeasies, crime moments
- Vintage newspaper / woodblock print inspiration

## Titles (baked into art)

| Tier | Title treatment |
|------|-----------------|
| General (10) | Bold sans-serif, centred above illustration |
| Rare (10) | Gold **serif**, centred above illustration |
| Super rare (10) | Gold sans-serif **title at top** + **district label at bottom** (e.g. `CITY HALL`, `DOCK #13`, `KITTY KAT CLUB`, `UPTOWN`) |

Titles must remain readable at popup thumbnail size.

## Export standard

All event popup PNGs:

- **664px total height** (662px art + 1px black pad top/bottom)
- Variable width (~376–433px) preserving aspect ratio after crop
- Processed through `scripts/event_art.py` `export_panel()` — trim outer black gutter, light enhance, scale to height
- Displayed in `.ev-left` at `background-size: contain`

---

# LANE C — COLOUR ILLUSTRATION EVENTS (GODLIKE)

## Applies to

**6 event popup images** in `events/`:

| File | Event |
|------|-------|
| `godlike_in_town.png` | Big Daddy J Is In Town |
| `godlike_interest.png` | Big Daddy J Takes An Interest |
| `godlike_move.png` | Big Daddy J Makes A Move |
| `godlike_celebration.png` | Big Daddy J Throws A Celebration |
| `godlike_history.png` | Big Daddy J Makes History |
| `godlike_golden.png` | Golden Shower!!! Everywhere!!! |

Sources: `assets/godlike-event-grid-source.png` (5-panel row), `assets/godlike-golden-source.png` (single portrait). Split via `scripts/split_godlike_events.py`, `split_golden_godlike.py`.

## Style definition

- **Full-colour stylised illustration** — richer and more saturated than Lane B
- Big Daddy J is always the visual dominant (see BDJ lock below)
- City nightlife, celebrations, harbour, skyline
- Controlled **gold, orange, amber, purple** accents; neon signage allowed where established in reference art (e.g. Kitty Kat Club)
- Same cross-hatched / period-illustration **line quality** as Lane B, but with colour

## Titles (baked into art)

- Bold **gold/orange sans-serif** title at top
- **District label at bottom** on the five godlike grid panels
- Golden godlike: large title `GOLDEN SHOWER!!!` top, `EVERYWHERE!!!` bottom

## Export standard

Same as Lane B: **664px height**, variable width, `export_panel()` pipeline. Godlike grid uses wider column gutters than standard 2×5 grids — re-slice from source only.

---

# BIG DADDY J (BDJ) MASTER CHARACTER LOCK

## Core identity

Big Daddy J is:

- The official mascot of Gang Wars
- The face of the franchise
- The kingpin, the legend, the city's most influential figure

He is never:

- A side character, henchman, comic relief, or subordinate figure
- Clean-shaven or slim-framed

## Canonical reference library

Permanent source of truth — **do not drift from these**:

| Reference | File |
|-----------|------|
| Is In Town | `events/godlike_in_town.png` |
| Takes An Interest | `events/godlike_interest.png` |
| Makes A Move | `events/godlike_move.png` |
| Throws A Celebration | `events/godlike_celebration.png` |
| Makes History | `events/godlike_history.png` |
| Golden Shower | `events/godlike_golden.png` |

Source grids: `assets/godlike-event-grid-source.png`, `assets/godlike-golden-source.png`.

Rank card: `cards/big-daddy-j.png` (Lane A sepia pixel art — same character, different lane rules).

## Facial lock

- Heavy-set face, strong jawline
- Full dark beard, thick connected moustache
- Dark eyebrows, confident smile
- Friendly but commanding expression

## Headwear & clothing

- Dark fedora, medium brim, classic 1920s styling
- Dark pinstripe three-piece suit, white dress shirt, dark tie
- Pocket square, gold watch chain, red flower lapel pin (colour tier)

## Visual role

Whenever BDJ appears:

- He is the focal point; crowds react to him
- Events revolve around him; he visually dominates the scene

## Trigger rule

Whenever a prompt contains **Big Daddy J**, **BDJ**, **The Boss**, **Boss Man**, **The Kingpin**, **The Legend**, or **The Face of Gang Wars** — use the canonical reference library above.

---

# CRIME LEDGER ARTWORK

Crime Ledger is **integrated** (473×1024 reference screens, base PNG + dynamic overlays). Achievement rules live in [`ledger.js`](../../ledger.js); rendering in [`ledger-ui.js`](../../ledger-ui.js).

**Reference screens:** [`docs/ui-standards/ledger-home.png`](ui-standards/ledger-home.png), [`ledger-general.png`](ui-standards/ledger-general.png), [`ledger-rare.png`](ui-standards/ledger-rare.png), [`ledger-super-rare.png`](ui-standards/ledger-super-rare.png), [`ledger-godlike.png`](ui-standards/ledger-godlike.png), [`ledger-golden-godlike.png`](ui-standards/ledger-golden-godlike.png)

**Replacing art:** [`docs/crime-ledger-integration-prompt.md`](crime-ledger-integration-prompt.md) — agent brief for a new graphics pack.

| Piece | Location |
|-------|----------|
| Screen `-base` PNGs | `assets/ledger/*-base.png` |
| Achievement icons | `assets/ledger/icons/{id}.png` |
| Layout rects | `scripts/ledger-blueprint.json` |
| Asset prep | `scripts/prepare-ledger-assets.py`, `scripts/split-ledger-icons.py` |

Do not reference deleted legacy ledger PNG paths from commits before `9956b89`.

---

# TONE

Combination of humour and legendary gangster mythology. The world should feel:

- Fun, memorable, larger than life
- Celebratory and iconic — not grim realism

---

# PROHIBITED STYLES

Never use in any lane:

- Anime, manga, chibi
- Modern glossy mobile-game art
- Photorealistic photography or photobashing
- Raw 3D renders
- Cyberpunk or unrelated sci-fi styling
- Pastel or neon-dominant palettes **outside** established godlike reference scenes
- Styles that break lane rules (e.g. full-colour on a rare event card, pixel art on a godlike popup)

Lane-specific bans:

- **Lane A:** smooth vector icons, gradient-heavy UI illustration
- **Lane B:** full colour, smooth digital painting without cross-hatch texture
- **Lane C:** reverting godlike scenes to monochrome sepia

---

# QUALITY CONTROL CHECKLIST

Before approving any Gang Wars artwork:

- [ ] Correct **lane** for asset category
- [ ] Matches shipped reference set for that tier
- [ ] Readable at thumbnail / popup size
- [ ] Clear focal point and storytelling
- [ ] Consistent warm Gang Wars atmosphere
- [ ] BDJ matches character lock (if applicable)
- [ ] Event PNGs export to **664px height** via `export_panel()`
- [ ] No prohibited styles present

## Readability lock

Every asset must pass the **thumbnail test**: subject recognisable, story understandable, focal point obvious; event titles readable where baked into art.

---

# SUCCESS CRITERIA

A player should instantly recognise Gang Wars artwork, Big Daddy J, and the distinction between everyday sepia events and godlike colour spectacles — without labels or explanation.

This specification is the permanent visual standard for Gang Wars.
