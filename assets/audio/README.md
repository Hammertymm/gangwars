# Gang Wars — Audio sourcing (best outcome)

Placeholders are silent. This is the recommended path to **real, cohesive, legal** audio.

## Recommended strategy (best outcome)

| Layer | Source | Why |
|-------|--------|-----|
| **Title jazz** | [OpenGameArt “Swingshot”](https://opengameart.org/content/nes-chiptune-swingshot-swing-jazz) (CC0) | Already 8-bit swing jazz in OGG — perfect fit |
| **UI + modals + economy clicks** | [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds) (CC0) | Clean, consistent, game-ready |
| **Impacts / punches / metal** | [Kenney Impact Sounds](https://kenney.nl/assets/impact-sounds) (CC0) | Gun-adjacent hits, footsteps, thuds |
| **Coins / RPG foley** | [Kenney RPG Audio](https://kenney.nl/assets/rpg-audio) (CC0) | Drops, cloth, slices |
| **Period flavor** | [Freesound.org](https://freesound.org/) — filter **CC0 only** | Siren, register, revolver, screech |
| **Other music loops** | Same pack as title OR one Fiverr order (~$30–50) | Run ambient, feds tension, ledger — same composer |

**Do not use** random MP3 scrapers or “free download” sites without a clear license.

---

## Quick install (automated Tier A)

Requires **ffmpeg** (`winget install ffmpeg`).

```powershell
python scripts/install-audio-best.py --fetch
```

This installs:

- `music/title-speakeasy-jazz.ogg` — Swingshot (CC0, Haley Halcyon / OpenGameArt)
- ~15 Kenney Interface mappings (button, modals, errors, stingers, rank reveal, etc.)

---

## Manual Tier B (30 minutes — biggest quality jump)

1. Go to [kenney.nl/assets](https://kenney.nl/assets/category:Audio) and download (CC0, free):
   - **Impact Sounds**
   - **RPG Audio**
   - **Casino Audio** (optional — chips/coins)

2. Pick files and convert (examples — listen and adjust):

```powershell
ffmpeg -i impactMetal_heavy_004.ogg -c:a libvorbis -q:a 5 assets/audio/sfx/combat/gunshot.ogg
ffmpeg -i impactSoft_medium_002.ogg -c:a libvorbis -q:a 5 assets/audio/sfx/combat/punch-oof-01.ogg
ffmpeg -i footstepConcrete_004.ogg -c:a libvorbis -q:a 5 assets/audio/sfx/combat/footsteps-flee.ogg
```

3. On Freesound (license = **Creative Commons 0**), search and convert:
   - `vintage police siren short` → `sfx/combat/siren.ogg`
   - `cash register cha ching` → `sfx/economy/cash-register.ogg` (if Kenney bong isn’t right)
   - `tire screech short` → `sfx/travel/tires-screech.ogg`
   - `revolver dry fire` → `sfx/combat/empty-click.ogg`
   - `tommy gun burst short` → `sfx/combat/tommy-burst.ogg`

4. Drop OGG at the **exact catalog path** — no code changes.

Full ID list: see `docs/audio-catalog.md` (local) or `audio.js` → `AUDIO_CATALOG`.

---

## Music beyond the title

**Good enough:** Use Swingshot at lower volume for `music.run` until you have custom loops.

**Best:** One commission brief for the same artist/style:

- 8-bit speakeasy jazz loop (title) — already have Swingshot
- Noir ambient loop 30–60s (`run-ambient.ogg`)
- Low tension pulse (`feds-tension.ogg`)
- Muted study loop (`ledger-ambient.ogg`)

Fiverr search: *“chiptune jazz game loop seamless OGG”*.

Alternative CC0: [Free NES Music Pack](https://opengameart.org/content/free-nes-music-pack) — track `nes_07-jazz`; extract loops with ffmpeg/Audacity.

---

## File rules

- **SFX:** mono, trim silence, 0.1–1.5s, `-q:a 5`
- **Music:** stereo OK, seamless loop, `-q:a 6`, target &lt;500 KB
- Replace placeholders in place under `assets/audio/`

---

## Credits (optional but nice)

| Asset | Author | License |
|-------|--------|---------|
| Swingshot / title theme | Haley Halcyon | CC0 via OpenGameArt |
| Interface/UI sounds | Kenney | CC0 |
| Impact/RPG (when added) | Kenney | CC0 |
| Freesound picks | per file page | CC0 |

---

## Regenerate silent placeholders

```powershell
python scripts/generate-audio-placeholders.py
```

Only use this to reset missing files — it overwrites with silence.
