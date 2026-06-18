#!/usr/bin/env node
/* One-off: capture market screen + assert single goods name per row */

const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const PORT = 8766;
const OUT = path.join(ROOT, 'docs', 'review', 'screenshots', 'market-fix-proof-540.png');

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
        const types = { '.html': 'text/html', '.js': 'application/javascript', '.png': 'image/png', '.json': 'application/json' };
        res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(PORT, () => resolve(server));
  });
}

const save = {
  day: 1,
  location: 'Little Italy',
  cash: 10000,
  bank: 0,
  debt: 22000,
  space: 100,
  health: 10,
  guns: 0,
  inventory: {},
  costBasis: {},
  events: {},
  prices: {
    moonshine: 100, cigars: 350, bathgin: 900, art: 2800, scotch: 7500,
    counterfeits: 20000, cognac: 42000, furcoats: 70000, champagne: 88000, diamonds: 55909,
  },
  log: ['The streets are quiet.. for now.'],
  over: false,
  stallActions: 0,
  debtInterestFreeze: 0,
};

async function main() {
  const { chromium } = require('playwright');
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 540, height: 900 } });
  await page.goto(`http://127.0.0.1:${PORT}/gangwars.html`, { waitUntil: 'networkidle' });
  await page.evaluate((s) => {
    localStorage.setItem('gw:tutorialDone', '1');
    localStorage.setItem('gw:save', JSON.stringify(s));
  }, save);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.locator('#cont:not([disabled])').click({ timeout: 8000 });
  await page.waitForSelector('.market-row', { timeout: 8000 });
  await page.waitForTimeout(400);

  const audit = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.market-row')];
    return rows.map((row) => {
      const names = [...row.querySelectorAll('.goods-name')].map((el) => el.textContent.trim());
      const wrap = row.querySelector('.goods-icon-wrap');
      const img = row.querySelector('.goods-icon');
      const wr = wrap?.getBoundingClientRect();
      const ir = img?.getBoundingClientRect();
      const cs = wrap ? getComputedStyle(wrap) : null;
      const pad = cs ? parseFloat(cs.paddingTop) : 0;
      const clip =
        ir && wr
          ? ir.top < wr.top + pad - 0.5 ||
            ir.bottom > wr.bottom - pad + 0.5 ||
            ir.left < wr.left + pad - 0.5 ||
            ir.right > wr.right - pad + 0.5
          : null;
      return {
        names,
        nameCount: names.length,
        wrap: wr ? { w: Math.round(wr.width), h: Math.round(wr.height) } : null,
        img: ir ? { w: Math.round(ir.width), h: Math.round(ir.height) } : null,
        padding: pad,
        clipped: clip,
      };
    });
  });

  await page.locator('#crt').screenshot({ path: OUT });
  await browser.close();
  server.close();

  const allNames = audit.flatMap((r) => r.names);
  const dupRows = audit.filter((r) => r.nameCount !== 1);
  const clipped = audit.filter((r) => r.clipped);

  console.log('Screenshot:', OUT);
  console.log('Goods names (10 rows):', allNames);
  console.log('Duplicate-name rows:', dupRows.length);
  console.log('Clipped icons:', clipped.length);
  console.log('Row audit:', JSON.stringify(audit, null, 2));

  if (dupRows.length || allNames.length !== 10) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
