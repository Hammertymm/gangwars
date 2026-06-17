const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { rectsOverlap, ROOT } = require('./scripts/ledger-test-helpers.js');

const REVIEW_DIR = path.join(ROOT, 'docs', 'review', 'ledger-screenshots');
const MANIFEST_PATH = path.join(REVIEW_DIR, 'manifest.json');
const captured = [];

const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '540', width: 540, height: 900 },
];

const STATES = ['empty', 'partial'];
const CATEGORIES = [
  { id: 'general', rows: 14, base: 'ledger-general-base.png' },
  { id: 'rare', rows: 10, base: 'ledger-rare-base.png' },
  { id: 'superRare', rows: 10, base: 'ledger-super-rare-base.png' },
  { id: 'godlike', rows: 5, base: 'ledger-godlike-base.png' },
  { id: 'goldenGodlike', rows: 1, base: 'ledger-golden-godlike-base.png' },
];

async function applyLedgerState(page, stateName) {
  await page.goto('/gangwars.html');
  await page.waitForLoadState('networkidle');
  await page.evaluate((state) => {
    localStorage.setItem('gw:tutorialDone', '1');
    localStorage.removeItem('gw:save');
    const ledger = migrateLedger(null);
    if (state === 'partial') {
      unlockAchievement(ledger, 'bootlegger');
      revealAchievement(ledger, 'bootlegger');
      unlockAchievement(ledger, 'connected');
      revealAchievement(ledger, 'connected');
      unlockAchievement(ledger, 'capone');
    } else if (state === 'general-reveal') {
      unlockAchievement(ledger, 'bootlegger');
    }
    localStorage.setItem('gw:ledger', JSON.stringify(ledger));
  }, stateName);
  await page.reload({ waitUntil: 'networkidle' });
}

async function openLedgerHome(page) {
  await page.click('#ledger');
  await page.waitForSelector('#crt.ledger-mode');
  await page.waitForSelector('.ledger-art-frame > img');
}

async function assertHitTarget(page, selector) {
  const el = page.locator(selector).first();
  await expect(el).toBeVisible();
  const box = await el.boundingBox();
  expect(box).toBeTruthy();
  expect(box.width).toBeGreaterThan(0);
  expect(box.height).toBeGreaterThan(0);
  const pointerEvents = await el.evaluate(node => getComputedStyle(node).pointerEvents);
  expect(pointerEvents).not.toBe('none');
}

async function assertHomeStructure(page, stateName) {
  const imgSrc = await page.locator('.ledger-art-frame > img').getAttribute('src');
  expect(imgSrc).toContain('crime-ledger-home-base.png');

  await expect(page.locator('.ledger-counter.total')).toHaveCount(1);
  await expect(page.locator('.ledger-counter.row')).toHaveCount(5);
  await expect(page.locator('[data-cat]')).toHaveCount(5);
  await expect(page.locator('#ledgerBack')).toHaveCount(1);

  const backText = await page.locator('#ledgerBack').innerText();
  expect(backText.trim()).toBe('');

  const totalText = await page.locator('.ledger-counter.total').innerText();
  if (stateName === 'empty') {
    expect(totalText).toBe('0 / 40 FOUND');
  } else if (stateName === 'partial') {
    expect(totalText).toMatch(/3 \/ 40 FOUND/);
  }

  const boxes = await page.locator('.ledger-counter.row').evaluateAll(els =>
    els.map(el => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    })
  );
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      expect(rectsOverlap(boxes[i], boxes[j])).toBe(false);
    }
  }

  for (const sel of ['#ledgerBack', '[data-cat="general"]', '[data-cat="rare"]']) {
    await assertHitTarget(page, sel);
  }
}

async function assertCategoryStructure(page, cat, stateName) {
  const imgSrc = await page.locator('.ledger-art-frame > img').getAttribute('src');
  expect(imgSrc).toContain(cat.base);

  await expect(page.locator('.ledger-list-row')).toHaveCount(cat.rows);
  await expect(page.locator('#ledgerBack')).toHaveCount(1);
  expect((await page.locator('#ledgerBack').innerText()).trim()).toBe('');

  const iconSrcs = await page.locator('.ledger-row-icon img').evaluateAll(els =>
    els.map(el => el.getAttribute('src') || '')
  );
  expect(iconSrcs.length).toBe(cat.rows);
  iconSrcs.forEach(src => expect(src).toMatch(/assets\/ledger\/icons\/.+\.png$/));

  if (cat.id === 'general' && stateName === 'partial') {
    const bootlegger = page.locator('[data-aid="bootlegger"] .ledger-row-icon.revealed');
    await expect(bootlegger).toHaveCount(1);
  }

  if (cat.id === 'general' && stateName === 'general-reveal') {
    await expect(page.locator('[data-aid="bootlegger"].reveal-focus')).toHaveCount(1);
    await expect(page.locator('[data-aid="bootlegger"] .ledger-row-icon.revealed')).toHaveCount(1);
  }

  await assertHitTarget(page, '#ledgerBack');
}

async function captureReviewAndBaseline(page, snapshotName) {
  fs.mkdirSync(REVIEW_DIR, { recursive: true });
  const reviewPath = path.join(REVIEW_DIR, `${snapshotName}.png`);
  await page.locator('#crt').screenshot({ path: reviewPath });
  captured.push({ snapshot: snapshotName, path: `ledger-screenshots/${snapshotName}.png` });
  await expect(page.locator('#crt')).toHaveScreenshot(`${snapshotName}.png`);
}

test.afterAll(() => {
  fs.mkdirSync(REVIEW_DIR, { recursive: true });
  fs.writeFileSync(
    MANIFEST_PATH,
    JSON.stringify({ generatedAt: new Date().toISOString(), captured }, null, 2)
  );
});

for (const vp of VIEWPORTS) {
  test.describe(`ledger graphics @ ${vp.name}px`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const state of STATES) {
      test(`home — ${state}`, async ({ page }) => {
        await applyLedgerState(page, state);
        await openLedgerHome(page);
        await assertHomeStructure(page, state);
        await captureReviewAndBaseline(page, `ledger-home-${state}-${vp.name}`);
      });

      for (const cat of CATEGORIES) {
        test(`${cat.id} — ${state}`, async ({ page }) => {
          await applyLedgerState(page, state);
          await openLedgerHome(page);
          await page.click(`[data-cat="${cat.id}"]`);
          await page.waitForSelector('#crt.ledger-mode');
          await page.waitForSelector('.ledger-art-frame > img');
          await assertCategoryStructure(page, cat, state);
          await captureReviewAndBaseline(page, `ledger-${cat.id}-${state}-${vp.name}`);
        });
      }
    }

    test('general — general-reveal', async ({ page }) => {
      await applyLedgerState(page, 'general-reveal');
      await page.evaluate(() => {
        window.GangWarsLedger.openLedgerReveal('bootlegger');
      });
      await page.waitForSelector('#crt.ledger-mode');
      await page.waitForSelector('.ledger-art-frame > img');
      await expect(page.locator('[data-aid="bootlegger"].reveal-focus')).toHaveCount(1);
      await expect(page.locator('[data-aid="bootlegger"] .ledger-row-title')).toHaveText('BOOTLEGGER', {
        timeout: 5000,
      });
      await assertCategoryStructure(page, CATEGORIES[0], 'general-reveal');
      await captureReviewAndBaseline(page, `ledger-general-general-reveal-${vp.name}`);
    });
  });
}
