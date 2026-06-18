/* Shared helpers for Crime Ledger asset + graphics tests */

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const ROOT = path.join(__dirname, '..');
const LEDGER_DIR = path.join(ROOT, 'assets', 'ledger');
const ICONS_DIR = path.join(LEDGER_DIR, 'icons');
const BLUEPRINT_JSON = path.join(ROOT, 'scripts', 'ledger-blueprint.json');
const BLUEPRINT_JS = path.join(ROOT, 'ledger-blueprint.js');

const RUNTIME_SCREEN_KEYS = ['home', 'general', 'rare', 'superRare', 'godlike', 'goldenGodlike'];
const RUNTIME_OMIT = new Set(['asset', 'inpaint', 'rowCount']);

const CANVAS_W = 473;
const CANVAS_H = 1024;
const ICON_SIZE = 136;
const ICON_MIN_FILL = 0.35;

function readPng(filePath) {
  return PNG.sync.read(fs.readFileSync(filePath));
}

function pngDimensions(filePath) {
  const { width, height } = readPng(filePath);
  return { width, height };
}

function alphaContentBbox(png) {
  const { width, height, data } = png;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (width * y + x) << 2;
      if (data[i + 3] > 16) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) return null;
  return {
    x: minX,
    y: minY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
  };
}

function iconContentFillRatio(filePath) {
  const png = readPng(filePath);
  const bbox = alphaContentBbox(png);
  if (!bbox) return { widthRatio: 0, heightRatio: 0 };
  return {
    widthRatio: bbox.w / png.width,
    heightRatio: bbox.h / png.height,
    bbox,
  };
}

function loadBlueprintJson() {
  return JSON.parse(fs.readFileSync(BLUEPRINT_JSON, 'utf8'));
}

function runtimeBlueprintFromJson(blueprint) {
  const out = {};
  for (const key of RUNTIME_SCREEN_KEYS) {
    const spec = blueprint[key];
    out[key] = Object.fromEntries(
      Object.entries(spec).filter(([k]) => !RUNTIME_OMIT.has(k))
    );
  }
  return out;
}

function loadRuntimeBlueprintJs() {
  const text = fs.readFileSync(BLUEPRINT_JS, 'utf8');
  const m = text.match(/const LEDGER_BLUEPRINT = (\{[\s\S]*\});\s*$/);
  if (!m) throw new Error('Could not parse LEDGER_BLUEPRINT from ledger-blueprint.js');
  return JSON.parse(m[1]);
}

function rectsOverlap(a, b) {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}

function checkInpaintRegionsApplied(fullPath, basePath, inpaintRects) {
  const full = readPng(fullPath);
  const base = readPng(basePath);
  const failures = [];
  for (const r of inpaintRects) {
    let changed = 0;
    let checked = 0;
    for (let y = r.y; y < r.y + r.h && y < CANVAS_H; y++) {
      for (let x = r.x; x < r.x + r.w && x < CANVAS_W; x++) {
        checked++;
        const fi = (full.width * y + x) << 2;
        const bi = (base.width * y + x) << 2;
        const fr = full.data[fi];
        const fg = full.data[fi + 1];
        const fb = full.data[fi + 2];
        const br = base.data[bi];
        const bg = base.data[bi + 1];
        const bb = base.data[bi + 2];
        if (fr !== br || fg !== bg || fb !== bb) changed++;
      }
    }
    if (checked > 0 && changed / checked < 0.15) {
      failures.push({ rect: r.label || 'inpaint', changed, checked });
    }
  }
  return failures;
}

function checkInpaintRegionsBlack(basePath, inpaintRects) {
  const png = readPng(basePath);
  const failures = [];
  for (const r of inpaintRects) {
    for (let y = r.y; y < r.y + r.h && y < CANVAS_H; y++) {
      for (let x = r.x; x < r.x + r.w && x < CANVAS_W; x++) {
        const i = (png.width * y + x) << 2;
        const r8 = png.data[i];
        const g = png.data[i + 1];
        const b = png.data[i + 2];
        if (r8 > 8 || g > 8 || b > 8) {
          failures.push({ rect: r.label || 'inpaint', x, y, rgb: [r8, g, b] });
          if (failures.length >= 5) return failures;
        }
      }
    }
  }
  return failures;
}

function ledgerSwAssetPaths(swContent) {
  const re = /['"](\.\/assets\/ledger\/[^'"]+\.png)['"]/g;
  const paths = new Set();
  let m;
  while ((m = re.exec(swContent))) paths.add(m[1]);
  return [...paths].sort();
}

function expectedSwLedgerPaths(blueprint, achievementIds) {
  const paths = new Set();
  for (const key of RUNTIME_SCREEN_KEYS) {
    paths.add(`./assets/ledger/${blueprint[key].baseAsset}`);
  }
  paths.add('./assets/ledger/icons/locked.png');
  for (const id of achievementIds) paths.add(`./assets/ledger/icons/${id}.png`);
  return [...paths].sort();
}

function allAchievementIds(ledgerCategories) {
  return ledgerCategories.flatMap(c => c.achievements.map(a => a.id));
}

function startStaticServer(port = 8765) {
  const http = require('http');
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);
      if (urlPath === '/') urlPath = '/gangwars.html';
      const filePath = path.join(ROOT, urlPath.replace(/^\//, ''));
      if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end();
        return;
      }
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const types = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
        };
        res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(port, () => resolve(server));
  });
}

module.exports = {
  ROOT,
  LEDGER_DIR,
  ICONS_DIR,
  BLUEPRINT_JSON,
  BLUEPRINT_JS,
  RUNTIME_SCREEN_KEYS,
  CANVAS_W,
  CANVAS_H,
  ICON_SIZE,
  ICON_MIN_FILL,
  readPng,
  pngDimensions,
  alphaContentBbox,
  iconContentFillRatio,
  loadBlueprintJson,
  runtimeBlueprintFromJson,
  loadRuntimeBlueprintJs,
  rectsOverlap,
  checkInpaintRegionsBlack,
  checkInpaintRegionsApplied,
  ledgerSwAssetPaths,
  expectedSwLedgerPaths,
  allAchievementIds,
  startStaticServer,
};
