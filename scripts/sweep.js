#!/usr/bin/env node
/* Parameter sweep harness.
   Re-implements the full game loop (engine math + UI travel-event math) with
   every tunable exposed as a knob so we can A/B different number choices. */

const engine = require('../engine.js');
const {
  GOODS, GOOD, LOCATIONS, HOME,
  rollMarket: engineRollMarket, applyTerritoryPrice,
  buy, sell, bankRepay, bankDeposit,
  spaceLeft, netWorth, getRank, profitPct,
  randInt, chance, pick,
} = engine;

/* ---- baseline knobs (mirror current game) ---- */
const BASE = {
  days: 30,
  startCash: 10000,
  startDebt: 25000,
  startSpace: 100,
  startHealth: 10,
  loanInterest: 0.10,
  bankInterest: 0.06,
  maxBorrow: 25000,
  unavailableChance: 1 / 8,
  anomalyChance: 0.38,
  muggingPct: 0.15,
  muggingChance: 1 / 12,
  findChance: 1 / 12,
  stashChance: 1 / 7,
  gunChance: 1 / 7,
  fedsChance: 1 / 7,
  perfectScoreNW: 20000000,
  scoreDivisor: 157.5,
  rareChance: 0.04,
  superRareChance: 0.01,
  godlikeChance: 0.002,
};

function score(nw, K) {
  const v = Math.max(0, nw);
  if (v >= K.perfectScoreNW) return 100;
  return Math.max(0, Math.min(99, Math.round(Math.sqrt(v / K.scoreDivisor))));
}

/* localized rollMarket so anomaly + unavailable chances are tunable */
const TM = engine.TERRITORY_MODIFIERS;
function rollMarket(location, K) {
  const mod = TM[location] || {};
  const prices = {};
  GOODS.forEach(d => {
    if (chance(K.unavailableChance)) { prices[d.id] = null; return; }
    let low = d.low, high = d.high;
    if (mod.variance && mod.variance > 1) {
      const spread = high - low;
      const extra = spread * (mod.variance - 1) / 2;
      low = Math.max(1, Math.round(low - extra));
      high = Math.round(high + extra);
    }
    prices[d.id] = applyTerritoryPrice(d, location, randInt(low, high));
  });
  if (chance(K.anomalyChance)) {
    const avail = GOODS.filter(d => prices[d.id] != null);
    if (avail.length) {
      const d = pick(avail); const roll = Math.random();
      if (roll < 0.34) prices[d.id] = Math.round(prices[d.id] * 4);
      else if (roll < 0.55) prices[d.id] = Math.round(prices[d.id] * 8);
      else prices[d.id] = Math.max(1, Math.round(prices[d.id] / 4));
    }
  }
  return prices;
}

function newGame(K) {
  return {
    day: 1, location: HOME, cash: K.startCash, bank: 0, debt: K.startDebt,
    space: K.startSpace, health: K.startHealth, guns: 0,
    inventory: {}, costBasis: {}, prices: rollMarket(HOME, K),
    over: false, dead: false,
  };
}

function applyInterest(s, K) {
  s.debt = Math.round(s.debt * (1 + K.loanInterest));
  if (K.bankInterest > 0) s.bank = Math.round(s.bank * (1 + K.bankInterest));
}

function hit(s) { s.health -= 1; return s.health <= 0; }

function runEvents(s, K, opts) {
  if (chance(K.muggingChance)) {
    const loss = Math.min(s.cash, randInt(50, Math.max(100, Math.round(s.cash * K.muggingPct))));
    s.cash -= loss; s.t.muggingLoss += loss;
  }
  if (chance(K.findChance) && spaceLeft(s) > 0) {
    const d = pick(GOODS);
    s.inventory[d.id] = (s.inventory[d.id] || 0) + Math.min(spaceLeft(s), randInt(2, 7));
  }
  if (chance(K.stashChance)) {
    const add = pick([10, 15, 20, 30]); const cost = add * randInt(90, 110);
    if (s.cash >= cost && opts.buyStash) { s.cash -= cost; s.space += add; }
  }
  if (chance(K.gunChance)) {
    const cost = randInt(1500, 2500);
    if (s.cash >= cost && s.guns === 0 && opts.buyGun) { s.cash -= cost; s.guns++; }
  }
  if (chance(K.fedsChance)) {
    let cops = randInt(1, 1 + Math.min(3, Math.floor(s.day / 8)));
    s.t.feds++;
    for (let r = 0; r < 30 && cops > 0; r++) {
      const bribe = Math.min(s.cash, randInt(2000, 8000) * cops);
      if (opts.bribe && bribe > 0 && s.cash >= bribe * 0.5) { s.cash -= bribe; return; }
      if (s.guns > 0 && opts.fight && cops <= 2) {
        if (chance(0.45 + 0.12 * s.guns)) { cops--; if (cops <= 0) { s.cash += randInt(3750, 10000); return; } }
        if (chance(0.35) && hit(s)) { s.over = true; s.dead = true; return; }
        continue;
      }
      if (chance(0.62)) return;
      if (hit(s)) { s.over = true; s.dead = true; return; }
      const owned = Object.keys(s.inventory);
      if (owned.length) { const id = pick(owned); const lost = Math.min(s.inventory[id], randInt(1, 5)); s.inventory[id] -= lost; if (s.inventory[id] <= 0) delete s.inventory[id]; }
    }
  }
}

function trade(s, K, opts) {
  for (const d of GOODS) {
    const qty = s.inventory[d.id] || 0;
    if (qty <= 0 || s.prices[d.id] == null) continue;
    const pct = profitPct(s, d.id, s.prices[d.id]);
    if (pct != null && pct >= opts.sellProfitPct) sell(s, d.id, qty);
  }
  let best = null, bestScore = -Infinity;
  for (const d of GOODS) {
    const price = s.prices[d.id];
    if (price == null) continue;
    const mid = (d.low + d.high) / 2;
    const sc = (mid - price) / mid;
    if (sc > bestScore && price < mid * opts.buyThreshold) { bestScore = sc; best = d; }
  }
  if (!best) return;
  const price = s.prices[best.id];
  const qty = Math.min(Math.floor(s.cash / price), spaceLeft(s), opts.maxBuyQty);
  if (qty > 0) buy(s, best.id, qty);
}

function bankAtHome(s, K, opts) {
  if (s.location !== HOME) return;
  if (opts.repay && s.debt > 0 && s.cash > K.startCash) {
    const pay = Math.min(s.cash - 5000, s.debt, Math.floor(s.cash * opts.repayFraction));
    if (pay > 0) bankRepay(s, pay);
  }
  if (opts.useBank && s.cash > 15000) {
    const dep = Math.floor(s.cash * (opts.depositFraction || 0.3));
    if (dep > 0) bankDeposit(s, dep);
  }
}

function playGame(K, opts) {
  const s = newGame(K);
  s.t = { muggingLoss: 0, feds: 0 };
  while (s.day <= K.days && !s.over) {
    trade(s, K, opts);
    bankAtHome(s, K, opts);
    const dest = pick(LOCATIONS.filter(l => l !== s.location));
    s.location = dest; s.day += 1; applyInterest(s, K);
    if (s.day > K.days) break;
    s.prices = rollMarket(dest, K);
    runEvents(s, K, opts);
    if (!s.over) trade(s, K, opts);
  }
  const nw = netWorth(s);
  return { nw, score: score(nw, K), rank: getRank(score(nw, K)), dead: s.dead, debt: s.debt, t: s.t };
}

const PROFILES = {
  competent: { sellProfitPct: 15, buyThreshold: 0.85, maxBuyQty: 50, buyStash: true, buyGun: true, bribe: true, fight: true, repay: true, repayFraction: 0.25, useBank: true, depositFraction: 0.3 },
  casual:    { sellProfitPct: 60, buyThreshold: 0.6, maxBuyQty: 5, buyStash: false, buyGun: false, bribe: true, fight: false, repay: true, repayFraction: 0.1, useBank: false },
  greedy:    { sellProfitPct: 8, buyThreshold: 1.0, maxBuyQty: 100, buyStash: true, buyGun: true, bribe: false, fight: true, repay: false, useBank: false },
};

function batch(K, profile, n) {
  const res = [];
  for (let i = 0; i < n; i++) res.push(playGame(K, PROFILES[profile]));
  return res;
}

function stats(res) {
  const n = res.length;
  const nws = res.map(r => r.nw).sort((a, b) => a - b);
  const avg = a => Math.round(a.reduce((x, y) => x + y, 0) / a.length);
  const p = q => nws[Math.floor(q * (n - 1))];
  const pc = c => (100 * c / n).toFixed(1);
  return {
    avg: avg(res.map(r => r.nw)),
    median: p(0.5),
    p90: p(0.9),
    s100: +pc(res.filter(r => r.score >= 100).length),
    s90: +pc(res.filter(r => r.score >= 90).length),
    neg: +pc(res.filter(r => r.nw < 0).length),
    nobody: +pc(res.filter(r => r.rank === 'Nobody').length),
    deaths: +pc(res.filter(r => r.dead).length),
    avgMug: avg(res.map(r => r.t.muggingLoss)),
  };
}

function row(label, K, n) {
  const c = stats(batch(K, 'competent', n));
  const cz = stats(batch(K, 'casual', n));
  return { label, competent: c, casual: cz };
}

const N = parseInt(process.argv[2] || '4000', 10);
console.log(`\n=== PARAMETER SWEEP (${N} games per profile per scenario) ===\n`);

const scenarios = [
  ['baseline', { ...BASE }],
  ['interest_08', { ...BASE, loanInterest: 0.08 }],
  ['interest_12', { ...BASE, loanInterest: 0.12 }],
  ['interest_15', { ...BASE, loanInterest: 0.15 }],
  ['mugging_25pct', { ...BASE, muggingPct: 0.25 }],
  ['mugging_08pct', { ...BASE, muggingPct: 0.08 }],
  ['feds_harder', { ...BASE, fedsChance: 1 / 5 }],
  ['anomaly_50', { ...BASE, anomalyChance: 0.50 }],
  ['anomaly_25', { ...BASE, anomalyChance: 0.25 }],
  ['score100_8M', { ...BASE, perfectScoreNW: 8000000 }],
  ['score100_10M', { ...BASE, perfectScoreNW: 10000000 }],
  ['score100_3M', { ...BASE, perfectScoreNW: 3000000 }],
  ['days_21', { ...BASE, days: 21 }],
  ['days_40', { ...BASE, days: 40 }],
  ['borrow_50k', { ...BASE, maxBorrow: 50000 }],
];

const out = scenarios.map(([label, K]) => row(label, K, N));

const pad = (s, w) => String(s).padEnd(w);
const padn = (s, w) => String(s).padStart(w);
console.log('SCENARIO         | COMPETENT median / s100% / s90% / neg%   | CASUAL median / s100% / s90% / neg% / nobody%');
console.log('-'.repeat(115));
for (const r of out) {
  const c = r.competent, z = r.casual;
  console.log(
    pad(r.label, 16) + ' | ' +
    padn('$' + (c.median / 1e6).toFixed(1) + 'M', 8) + ' ' + padn(c.s100 + '%', 6) + ' ' + padn(c.s90 + '%', 6) + ' ' + padn(c.neg + '%', 6) + '       | ' +
    padn('$' + (z.median / 1e3).toFixed(0) + 'k', 8) + ' ' + padn(z.s100 + '%', 6) + ' ' + padn(z.s90 + '%', 6) + ' ' + padn(z.neg + '%', 6) + ' ' + padn(z.nobody + '%', 7)
  );
}
console.log('\nNote: competent = skilled arbitrage bot; casual = sloppy human-like bot.\n');
