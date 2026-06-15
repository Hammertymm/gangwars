#!/usr/bin/env node
/* Asset validation — inventory, references, orphans, dimensions */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'review', 'asset-validation.json');

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

function walkImages(dir, base = ROOT) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === 'docs') continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) results.push(...walkImages(full, base));
    else if (IMAGE_EXT.has(path.extname(ent.name).toLowerCase()))
      results.push(path.relative(base, full).replace(/\\/g, '/'));
  }
  return results;
}

function readFile(p) {
  return fs.readFileSync(path.join(ROOT, p), 'utf8');
}

function extractRefs() {
  const refs = new Set();
  const files = ['gangwars.html', 'engine.js', 'sw.js', 'manifest.json', 'index.html', 'README.md'];
  const patterns = [
    /(?:src|href)=["']([^"']+\.(?:png|jpg|jpeg|webp))["']/gi,
    /['"]((?:assets|events|cards|title-screen|icon|apple-touch)[^'"]+\.(?:png|jpg|jpeg))['"]/gi,
    /\.\/(?:assets|events|cards|title-screen|icon|apple-touch)[^\s'"]+\.(?:png|jpg|jpeg)/gi,
  ];
  for (const f of files) {
    try {
      const content = readFile(f);
      for (const re of patterns) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(content))) {
          let r = m[1] || m[0];
          r = r.replace(/^\.\//, '').replace(/^\/+/, '');
          refs.add(r);
        }
      }
      // engine.js img: 'events/...'
      const imgFields = content.matchAll(/img:\s*['"]([^'"]+\.png)['"]/g);
      for (const m of imgFields) refs.add(m[1]);
    } catch (_) {}
  }
  // rank cards derived at runtime
  const ranks = ['nobody','pickpocket','hustler','rum-runner','bootlegger','racketeer','wise-guy','crew-boss','underboss','godfather','big-daddy-j'];
  ranks.forEach(r => refs.add(`cards/${r}.png`));
  // goods derived from DRUGS ids
  const engine = readFile('engine.js');
  const ids = [...engine.matchAll(/id:\s*"(\w+)"/g)].map(m => m[1]).filter((id, i, a) => a.indexOf(id) === i && id.length > 2);
  const drugIds = ['moonshine','cigars','bathgin','art','scotch','counterfeits','cognac','furcoats','champagne','diamonds'];
  drugIds.forEach(id => refs.add(`assets/goods/${id}.png`));
  refs.add('title-screen.png');
  refs.add('apple-touch-icon.png');
  refs.add('icon-192.png');
  refs.add('icon-512.png');
  return refs;
}

function isValidRef(r) {
  return r && !r.includes('${') && !r.includes('*');
}

function readPngSize(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    if (buf.length < 24) return null;
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  } catch { return null; }
}

function readJpgSize(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) break;
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker === 0xc0 || marker === 0xc2)
        return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 9) };
      i += 2 + len;
    }
  } catch {}
  return null;
}

function getDimensions(relPath) {
  const full = path.join(ROOT, relPath);
  const ext = path.extname(relPath).toLowerCase();
  if (ext === '.png') return readPngSize(full);
  if (ext === '.jpg' || ext === '.jpeg') return readJpgSize(full);
  return null;
}

function hashFile(relPath) {
  const crypto = require('crypto');
  const buf = fs.readFileSync(path.join(ROOT, relPath));
  return crypto.createHash('md5').update(buf).digest('hex');
}

const DISTRICTS = {
  'Little Italy': 'assets/little-italy.png',
  'Dock #13': 'assets/dock-13.png',
  'Kitty Kat Club': 'assets/kitty-kat-club.png',
  'Uptown': 'assets/uptown.png',
  'Warehouse District': 'assets/warehouse-district.png',
  'City Hall': 'assets/city-hall.png',
};

function main() {
  const onDisk = walkImages(ROOT).sort();
  const refs = extractRefs();
  const refList = [...refs].sort();

  const orphans = onDisk.filter(f => {
    if (f.startsWith('docs/')) return false;
    const validRefs = refList.filter(isValidRef);
    return !validRefs.some(r => r === f || f.endsWith(r));
  });

  const missing = refList.filter(r => isValidRef(r) && !onDisk.includes(r));

  const dimensions = {};
  for (const f of onDisk) {
    if (f.startsWith('docs/')) continue;
    const dim = getDimensions(f);
    if (dim) dimensions[f] = dim;
  }

  // duplicate detection by md5
  const byHash = {};
  for (const f of onDisk) {
    if (f.startsWith('docs/')) continue;
    try {
      const h = hashFile(f);
      if (!byHash[h]) byHash[h] = [];
      byHash[h].push(f);
    } catch (_) {}
  }
  const duplicates = Object.values(byHash).filter(g => g.length > 1);

  const districtMatrix = {};
  for (const [name, img] of Object.entries(DISTRICTS)) {
    const exists = onDisk.includes(img);
    const dim = dimensions[img];
    districtMatrix[name] = {
      image: img,
      exists,
      dimensions: dim,
      marketHeader: exists,
      travelScreen: exists,
      inSwPrecache: readFile('sw.js').includes(img.replace(/^\.\//, './' + img.split('/').pop() === img ? img : img)),
    };
  }
  // fix sw check
  const swContent = readFile('sw.js');
  for (const [name, img] of Object.entries(DISTRICTS)) {
    districtMatrix[name].inSwPrecache = swContent.includes(`'./${img}'`);
  }

  const goodsIcons = drugIds => drugIds.map(id => {
    const p = `assets/goods/${id}.png`;
    const dim = dimensions[p];
    return { id, path: p, exists: onDisk.includes(p), dimensions: dim, expected: '40x40' };
  });
  const drugIds = ['moonshine','cigars','bathgin','art','scotch','counterfeits','cognac','furcoats','champagne','diamonds'];

  const report = {
    generatedAt: new Date().toISOString().slice(0, 10),
    totalImagesOnDisk: onDisk.filter(f => !f.startsWith('docs/')).length,
    totalReferences: refList.length,
    missing,
    orphans,
    duplicates,
    dimensions,
    districtMatrix,
    goodsIcons: goodsIcons(drugIds),
    categories: {
      districts: onDisk.filter(f => f.startsWith('assets/') && !f.includes('goods/')),
      goods: onDisk.filter(f => f.startsWith('assets/goods/')),
      events: onDisk.filter(f => f.startsWith('events/')),
      cards: onDisk.filter(f => f.startsWith('cards/')),
      root: onDisk.filter(f => !f.includes('/') && IMAGE_EXT.has(path.extname(f))),
    },
    summary: {
      missingCount: missing.length,
      orphanCount: orphans.length,
      docOnlyOrphans: onDisk.filter(f => f === 'hero.jpg'),
      duplicateGroups: duplicates.length,
      allDistrictsPresent: Object.values(districtMatrix).every(d => d.exists),
      allGoodsPresent: drugIds.every(id => onDisk.includes(`assets/goods/${id}.png`)),
    },
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log(`Asset audit written to ${OUT}`);
  console.log(`  On disk: ${report.totalImagesOnDisk} | Missing: ${missing.length} | Orphans: ${orphans.length}`);
  if (missing.length) console.log('  Missing:', missing.join(', '));
  if (orphans.length) console.log('  Orphans:', orphans.join(', '));
}

main();
