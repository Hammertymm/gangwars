const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const {
  ROOT,
  LEDGER_DIR,
  ICONS_DIR,
  RUNTIME_SCREEN_KEYS,
  CANVAS_W,
  CANVAS_H,
  ICON_SIZE,
  ICON_MIN_FILL,
  pngDimensions,
  iconContentFillRatio,
  loadBlueprintJson,
  runtimeBlueprintFromJson,
  loadRuntimeBlueprintJs,
  checkInpaintRegionsApplied,
  ledgerSwAssetPaths,
  expectedSwLedgerPaths,
  allAchievementIds,
} = require('./scripts/ledger-test-helpers.js');

require('./ledger.js');
const { LEDGER_CATEGORIES } = require('./ledger.js');

const achievementIds = allAchievementIds(LEDGER_CATEGORIES);

describe('ledger screen assets', () => {
  const blueprint = loadBlueprintJson();

  it('has 6 full and 6 base screen PNGs at 473×1024', () => {
    for (const key of RUNTIME_SCREEN_KEYS) {
      const spec = blueprint[key];
      for (const name of [spec.asset, spec.baseAsset]) {
        const p = path.join(LEDGER_DIR, name);
        assert.ok(fs.existsSync(p), `missing ${name}`);
        const dim = pngDimensions(p);
        assert.equal(dim.width, CANVAS_W, `${name} width`);
        assert.equal(dim.height, CANVAS_H, `${name} height`);
      }
    }
  });

  it('inpaint regions on -base PNGs differ from full PNG (dynamic text removed)', () => {
    for (const key of RUNTIME_SCREEN_KEYS) {
      const spec = blueprint[key];
      const fullPath = path.join(LEDGER_DIR, spec.asset);
      const basePath = path.join(LEDGER_DIR, spec.baseAsset);
      const failures = checkInpaintRegionsApplied(fullPath, basePath, spec.inpaint || []);
      assert.equal(
        failures.length,
        0,
        `${spec.baseAsset} inpaint not applied: ${JSON.stringify(failures[0] || {})}`
      );
    }
  });
});

describe('ledger icon assets', () => {
  it('has locked.png and one icon per achievement (41 total)', () => {
    const icons = fs.readdirSync(ICONS_DIR).filter(f => f.endsWith('.png'));
    assert.equal(icons.length, 41);
    assert.ok(icons.includes('locked.png'));
    for (const id of achievementIds) {
      assert.ok(icons.includes(`${id}.png`), `missing icon ${id}.png`);
    }
  });

  it('icons are 136×136 with sufficient content fill', () => {
    for (const id of [...achievementIds, 'locked']) {
      const p = path.join(ICONS_DIR, `${id}.png`);
      const dim = pngDimensions(p);
      assert.equal(dim.width, ICON_SIZE, `${id} width`);
      assert.equal(dim.height, ICON_SIZE, `${id} height`);
      const fill = iconContentFillRatio(p);
      const best = Math.max(fill.widthRatio, fill.heightRatio);
      assert.ok(
        best >= ICON_MIN_FILL,
        `${id}.png content fill ${(best * 100).toFixed(0)}% < ${ICON_MIN_FILL * 100}%`
      );
    }
  });
});

describe('ledger blueprint sync', () => {
  it('ledger-blueprint.js matches JSON runtime subset', () => {
    const fromJson = runtimeBlueprintFromJson(loadBlueprintJson());
    const fromJs = loadRuntimeBlueprintJs();
    assert.deepEqual(fromJs, fromJson);
  });
});

describe('ledger service worker integration', () => {
  it('sw.js precaches all base screens and icons', () => {
    const blueprint = loadBlueprintJson();
    const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
    const listed = ledgerSwAssetPaths(sw);
    const expected = expectedSwLedgerPaths(blueprint, achievementIds);
    assert.deepEqual(listed, expected);
  });
});

describe('ledger html script order', () => {
  it('loads ledger-blueprint.js before ledger-ui.js', () => {
    const html = fs.readFileSync(path.join(ROOT, 'gangwars.html'), 'utf8');
    const bp = html.indexOf('ledger-blueprint.js');
    const ui = html.indexOf('ledger-ui.js');
    assert.ok(bp >= 0 && ui >= 0);
    assert.ok(bp < ui, 'ledger-blueprint.js must load before ledger-ui.js');
  });
});
