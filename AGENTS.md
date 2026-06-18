# AGENTS.md

## Cursor Cloud specific instructions

Gang Wars is a single vanilla-JS Progressive Web App (no backend, no build step, no database). All state lives in browser `localStorage`. Standard commands live in `package.json` `scripts` and `README.md` ("Technical Notes"); prefer those over duplicating here.

### Running the game (manual / browser testing)
- There is no `npm start`. Serve the repo root statically, then open `gangwars.html`:
  - `node scripts/ledger-test-server.js` → http://127.0.0.1:8765/gangwars.html (this is the same server Playwright launches).
- The service worker (`sw.js`) intentionally does NOT register on `localhost`/`127.0.0.1`, so offline/PWA caching can only be exercised on a non-local host (e.g. GitHub Pages). This is expected locally, not a bug.

### Tests
- `npm test` (engine + ledger logic) is the only gate CI runs and is fast/deterministic. Use it as the primary check.
- `npm run test:ledger:graphics` are Playwright pixel-regression tests against committed baselines in `tests/ledger-baselines/`. They are highly sensitive to the rendering environment: on this VM most cases fail purely due to font/anti-aliasing differences (`maxDiffPixelRatio: 0.01`) even though the screens render correctly. Treat graphics-test diffs as environmental unless the rendered layout/content is actually wrong (compare the `-actual.png` in `test-results/`). Do NOT commit re-baselined snapshots from this environment.

### Notes
- The `docs/review/ledger-screenshots/*.png` files can show up as "modified" in the working tree from snapshot/checkout filters even without edits; discard them (`git checkout -- docs/review/ledger-screenshots/`) rather than committing.
- Python asset scripts in `scripts/*.py` need Pillow and are only for regenerating PNG art — not required for developing or testing the game.
