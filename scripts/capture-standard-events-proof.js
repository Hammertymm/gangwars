#!/usr/bin/env node
/* Capture all 10 standard event popups + assert edge-to-edge art */

const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const PORT = 8768;
const OUT_DIR = path.join(ROOT, 'docs', 'review', 'screenshots', 'standard-events-proof');

const EVENTS = [
  { id: 'the-feds', file: 'events/the_feds.png', title: 'THE FEDS' },
  { id: 'ambushed-rolled', file: 'events/ambushed_rolled.png', title: 'AMBUSHED / ROLLED' },
  { id: 'dead-drop', file: 'events/dead_drop.png', title: 'DEAD DROP' },
  { id: 'packing-iron', file: 'events/packing_iron.png', title: 'PACKING IRON' },
  { id: 'upgrade-available', file: 'events/upgrade_available.png', title: 'UPGRADE AVAILABLE' },
  { id: 'shortage', file: 'events/shortage.png', title: 'SHORTAGE' },
  { id: 'buying-frenzy', file: 'events/buying_frenzy.png', title: 'BUYING FRENZY' },
  { id: 'flooded-market', file: 'events/flooded_market.png', title: 'FLOODED MARKET' },
  { id: 'super-rare-event', file: 'events/super_rare_event.png', title: 'SUPER RARE EVENT' },
  { id: 'rare-event-intel', file: 'events/rare_event_intel.png', title: 'RARE EVENT / INTEL' },
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
        const types = { '.html': 'text/html', '.js': 'application/javascript', '.png': 'image/png', '.json': 'application/json' };
        res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(PORT, () => resolve(server));
  });
}

async function mountPopup(page, file, title) {
  await page.evaluate(({ file, title }) => {
    const crt = document.getElementById('crt');
    crt.classList.remove('title-mode');
    crt.classList.add('game-mode');
    document.getElementById('app').innerHTML = `<div class="modal"><div class="ev-popup" role="dialog" aria-modal="true">
      <div class="ev-left" style="background-image:url('${file}')" role="img" aria-label="${title}"></div>
      <div class="ev-right">
        <div class="ev-body"><div><b>${title}</b><br><br>Standard event popup verification.</div></div>
        <div class="ev-acts"><button class="amber full" type="button">OK</button></div>
      </div>
    </div></div>`;
  }, { file, title });
  await page.waitForSelector('.ev-popup', { timeout: 5000 });
  await page.waitForTimeout(300);
}

async function auditPopup(page) {
  return page.evaluate(() => {
    const left = document.querySelector('.ev-left');
    if (!left) return { ok: false, reason: 'no .ev-left' };
    const cs = getComputedStyle(left);
    const r = left.getBoundingClientRect();
    return {
      ok: cs.paddingTop === '0px' && cs.paddingLeft === '0px' && cs.backgroundSize === 'cover',
      padding: cs.padding,
      backgroundSize: cs.backgroundSize,
      backgroundPosition: cs.backgroundPosition,
      panel: { w: Math.round(r.width), h: Math.round(r.height) },
      backgroundImage: cs.backgroundImage.slice(0, 100),
    };
  });
}

async function main() {
  const { chromium } = require('playwright');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 540, height: 900 } });
  await page.goto(`http://127.0.0.1:${PORT}/gangwars.html`, { waitUntil: 'networkidle' });

  const results = [];
  for (const ev of EVENTS) {
    await mountPopup(page, ev.file, ev.title);
    const audit = await auditPopup(page);
    const shot = path.join(OUT_DIR, `${ev.id}-540.png`);
    await page.locator('.ev-popup').screenshot({ path: shot });
    const dim = fs.existsSync(path.join(ROOT, ev.file))
      ? require('pngjs').PNG.sync.read(fs.readFileSync(path.join(ROOT, ev.file)))
      : null;
    results.push({
      filename: path.basename(ev.file),
      exportDimensions: dim ? `${dim.width}x${dim.height}` : null,
      audit,
      screenshot: path.relative(ROOT, shot).replace(/\\/g, '/'),
    });
  }

  await browser.close();
  server.close();

  const failed = results.filter((r) => !r.audit.ok);
  console.log(JSON.stringify({ results, allPass: failed.length === 0 }, null, 2));
  if (failed.length) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
