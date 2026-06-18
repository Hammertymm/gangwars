GANG WARS - Crime Ledger fix (asset version v62 / SW gangwars-v62)
==================================================================
Extract this archive at the repo root (C:\Projects\gang-wars\), overwriting
the 11 files below, then commit + push. GitHub Pages redeploys automatically.

CHANGED FILES (upload all):
  gangwars.html                              (new .ledger CSS: in-flow image, no container-type:size/cqh)
  ledger-ui.js                               (LEDGER_ASSET_VERSION 62; home overlay = number only)
  ledger-blueprint.js                        (regenerated; coords now match the artwork)
  scripts/ledger-blueprint.json              (corrected coords + inpaint rects)
  sw.js                                      (CACHE gangwars-v62)
  assets/ledger/crime-ledger-home-base.png   (clean: numbers stripped, names kept)
  assets/ledger/ledger-general-base.png      (clean: counter + baked row stripped)
  assets/ledger/ledger-rare-base.png         (clean)
  assets/ledger/ledger-super-rare-base.png   (clean)
  assets/ledger/ledger-godlike-base.png      (clean)
  assets/ledger/ledger-golden-godlike-base.png (clean; crown watermark preserved)

AFTER DEPLOY - on the iPhone:
  Close the PWA, clear Safari site data for the GitHub Pages domain (or delete
  and re-add the home-screen app), reopen. The SW v62 bump forces fresh assets.

TESTS:
  npm run test:ledger     -> node tests (logic + assets) should pass
  npm run audit:ledger:capture   -> RE-CAPTURE Playwright baselines (the layout
                                    changed, so old screenshot baselines are stale)
