#!/usr/bin/env node
/* Capture all game screens at 390×844 and 540×900 via Playwright */

const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'review', 'screenshots');
const PORT = 8765;
const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '540', width: 540, height: 900 },
];

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);
      if (urlPath === '/') urlPath = '/gangwars.html';
      const filePath = path.join(ROOT, urlPath.replace(/^\//, ''));
      if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); return; }
        const ext = path.extname(filePath).toLowerCase();
        const types = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
        res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(PORT, () => resolve(server));
  });
}

function baseState(overrides = {}) {
  return {
    day: 5,
    location: 'Little Italy',
    cash: 45000,
    bank: 12000,
    debt: 28000,
    space: 100,
    health: 8,
    guns: 1,
    inventory: { moonshine: 12, cigars: 5, bathgin: 3 },
    costBasis: { moonshine: 120, cigars: 450, bathgin: 900 },
    events: {},
    prices: {
      moonshine: 180, cigars: 520, bathgin: 1100, art: 3200, scotch: 8000,
      counterfeits: 22000, cognac: 45000, furcoats: 75000, champagne: 95000, diamonds: 110000,
    },
    log: ['Day 4: Sold 3 Cuban Cigars.', 'Day 3: Arrived in Dock #13.'],
    over: false,
    ...overrides,
  };
}

async function injectAndRender(page, setupFn) {
  await page.goto(`http://127.0.0.1:${PORT}/gangwars.html`, { waitUntil: 'networkidle' });
  await page.evaluate((setup) => {
    localStorage.setItem('gw:tutorialDone', '1');
    if (setup.save) localStorage.setItem('gw:save', JSON.stringify(setup.save));
    else localStorage.removeItem('gw:save');
    if (setup.highscores) localStorage.setItem('gw:highscores', JSON.stringify(setup.highscores));
    if (setup.clearTutorial === false) localStorage.removeItem('gw:tutorialDone');
  }, setupFn);
  await page.reload({ waitUntil: 'networkidle' });
  if (setupFn.action) await page.evaluate(setupFn.action);
  await page.waitForTimeout(400);
}

async function capture(page, name, vpName) {
  const file = path.join(OUT_DIR, `${name}-${vpName}.png`);
  await page.locator('#crt').screenshot({ path: file });
  return `screenshots/${name}-${vpName}.png`;
}

async function main() {
  let playwright;
  try {
    playwright = require('playwright');
  } catch {
    console.error('Playwright not installed. Run: npm install --save-dev playwright && npx playwright install chromium');
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const server = await startServer();
  const browser = await playwright.chromium.launch();
  const captured = [];

  const screens = [
    {
      id: 'title',
      setup: { save: null },
      action: async (page) => {},
    },
    {
      id: 'title-continue',
      setup: { save: baseState() },
      action: async (page) => {
        await page.click('#cont');
        await page.waitForTimeout(300);
      },
    },
    {
      id: 'market',
      setup: { save: baseState() },
      action: async (page) => {
        await page.click('#cont');
        await page.waitForTimeout(300);
      },
    },
    {
      id: 'market-holdings',
      setup: { save: baseState({ inventory: { moonshine: 40, diamonds: 2, champagne: 1 }, costBasis: { moonshine: 100, diamonds: 98000, champagne: 80000 } }) },
      action: async (page) => { await page.click('#cont'); await page.waitForTimeout(300); },
    },
    {
      id: 'travel',
      setup: { save: baseState() },
      action: async (page) => {
        await page.click('#cont');
        await page.waitForTimeout(200);
        await page.click('#travel');
        await page.waitForTimeout(300);
      },
    },
    {
      id: 'trade-buy',
      setup: { save: baseState() },
      action: async (page) => {
        await page.click('#cont');
        await page.waitForTimeout(200);
        await page.locator('[data-buy="moonshine"]').click();
        await page.waitForTimeout(300);
      },
    },
    {
      id: 'trade-sell',
      setup: { save: baseState() },
      action: async (page) => {
        await page.click('#cont');
        await page.waitForTimeout(200);
        await page.locator('[data-sell="moonshine"]').click();
        await page.waitForTimeout(300);
      },
    },
    {
      id: 'bank',
      setup: { save: baseState() },
      action: async (page) => {
        await page.click('#cont');
        await page.waitForTimeout(200);
        await page.click('#bankbtn');
        await page.waitForTimeout(300);
      },
    },
    {
      id: 'high-scores',
      setup: {
        save: null,
        highscores: [
          { score: 85, worth: 2500000, date: '2026-06-01' },
          { score: 72, worth: 890000, date: '2026-06-10' },
          { score: 45, worth: 120000, date: '2026-06-14' },
        ],
      },
      action: async (page) => {
        await page.click('#scores');
        await page.waitForTimeout(300);
      },
    },
    {
      id: 'end-game',
      setup: { save: baseState({ over: true, day: 31, cash: 1200000, debt: 50000, bank: 200000, placement: 2 }) },
      action: async (page) => {
        await page.evaluate(() => {
          const s = JSON.parse(localStorage.getItem('gw:save'));
          s.over = true;
          s.day = 31;
          localStorage.setItem('gw:save', JSON.stringify(s));
        });
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(400);
      },
    },
    {
      id: 'tutorial',
      setup: { save: null, clearTutorial: false },
      action: async (page) => {
        await page.evaluate(() => localStorage.removeItem('gw:tutorialDone'));
        await page.reload({ waitUntil: 'networkidle' });
        await page.click('#new');
        await page.waitForTimeout(600);
      },
    },
  ];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    for (const screen of screens) {
      try {
        if (screen.id === 'tutorial') {
          await page.goto(`http://127.0.0.1:${PORT}/gangwars.html`, { waitUntil: 'networkidle' });
          await page.evaluate(() => {
            localStorage.removeItem('gw:tutorialDone');
            localStorage.removeItem('gw:save');
          });
          await page.reload({ waitUntil: 'networkidle' });
          await page.click('#new');
          await page.waitForTimeout(600);
        } else {
          await injectAndRender(page, screen.setup);
          if (screen.action) await screen.action(page);
        }
        const rel = await capture(page, screen.id, vp.name);
        captured.push({ screen: screen.id, viewport: vp.name, path: rel });
        console.log(`Captured ${screen.id} @ ${vp.name}`);
      } catch (e) {
        console.warn(`Failed ${screen.id} @ ${vp.name}:`, e.message);
      }
    }
    await context.close();
  }

  // Event popups — render representative ev-popup markup (matches game CSS)
  const EVENT_SAMPLES = [
    { id: 'event-feds', img: 'events/the_feds.png', body: 'Agent Hayes spotted you — <b>2</b> agents closing in.', btn: 'FIGHT' },
    { id: 'event-mugging', img: 'events/ambushed_rolled.png', body: 'Someone knew you were coming. You took a beating and lost <b>$1,200</b>.', btn: 'DAMN' },
    { id: 'event-dead-drop', img: 'events/dead_drop.png', body: 'Someone left a stash. You help yourself to <b>5 Moonshine</b>.', btn: 'NICE' },
    { id: 'event-rare', img: 'events/rare_capone.png', body: '<b>AL CAPONE SEEN MEETING ASSOCIATES</b><br><br>Counterfeits surging in Warehouse District.', btn: 'NOTED' },
    { id: 'event-anomaly', img: 'events/shortage.png', body: 'The Feds hit three stash houses. <b>Diamonds</b> has vanished from the streets.', btn: 'NOTED' },
  ];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${PORT}/gangwars.html`, { waitUntil: 'networkidle' });

    for (const ev of EVENT_SAMPLES) {
      await page.evaluate((sample) => {
        document.getElementById('crt').classList.remove('title-mode');
        document.getElementById('crt').classList.add('game-mode');
        document.getElementById('app').innerHTML = `<div class="modal"><div class="ev-popup" role="dialog" aria-modal="true">
          <div class="ev-left" style="background-image:url('${sample.img}')" role="img" aria-label="Event illustration"></div>
          <div class="ev-right">
            <div class="ev-body"><div>${sample.body}</div></div>
            <div class="ev-acts"><button class="amber full">${sample.btn}</button></div>
          </div>
        </div></div>`;
      }, ev);
      await page.waitForTimeout(300);
      const rel = await capture(page, ev.id, vp.name);
      captured.push({ screen: ev.id, viewport: vp.name, path: rel });
      console.log(`Captured ${ev.id} @ ${vp.name}`);
    }
    await context.close();
  }

  await browser.close();
  server.close();

  const manifest = { generatedAt: new Date().toISOString(), captured };
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nDone. ${captured.length} screenshots in ${OUT_DIR}`);
}

main().catch(e => { console.error(e); process.exit(1); });
