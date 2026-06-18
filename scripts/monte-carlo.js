#!/usr/bin/env node
/* Monte Carlo simulator — headless play using engine.js + UI event math from gangwars.html */

const {
  CONFIG, GOODS, GOOD, LOCATIONS, HOME,
  newGame, resolveTravelMarket, applyDailyInterest,
  buy, sell, bankRepay, bankBorrow, bankDeposit, bankWithdraw,
  spaceLeft, netWorth, classicScore, getRank, profitPct, avgCost, PERFECT_SCORE_NET_WORTH,
  randInt, chance, pick, fightKillChance, fedsCounterHitChance, fedsApplyFightKill, gunEventCost,
  rollStashUpgrade, maxBorrowAmount, tickStallPressure, checkDebtCap, grantDebtInterestFreeze,
} = require('../engine.js');

const RUNS = parseInt(process.argv[2] || '10000', 10);

function cloneState(s) {
  return JSON.parse(JSON.stringify(s));
}

function hit(s) {
  s.health -= 1;
  return s.health <= 0;
}

function runTravelEvents(s, opts) {
  const events = [];
  if (chance(1 / 12)) events.push('mugging');
  if (chance(1 / 12)) events.push('find');
  if (chance(1 / 7)) events.push('stash');
  if (chance(1 / 7)) events.push('gun');
  if (chance(1 / 7)) events.push('feds');
  for (let i = events.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [events[i], events[j]] = [events[j], events[i]];
  }
  const queue = events.slice(0, CONFIG.maxTravelEvents);

  for (const ev of queue) {
    if (s.over) break;
    switch (ev) {
      case 'mugging': {
        const loss = Math.min(s.cash, randInt(50, Math.max(100, Math.round(s.cash * 0.15))));
        s.cash -= loss;
        s.stats.muggingLoss += loss;
        s.stats.muggings++;
        break;
      }
      case 'find': {
        if (spaceLeft(s) <= 0) break;
        const d = pick(GOODS);
        const n = Math.min(spaceLeft(s), randInt(2, 7));
        s.inventory[d.id] = (s.inventory[d.id] || 0) + n;
        s.stats.finds++;
        break;
      }
      case 'stash': {
        const { add, cost } = rollStashUpgrade();
        if (s.cash >= cost && opts.buyStash) {
          s.cash -= cost;
          s.space += add;
          s.stats.stashBuys++;
        }
        break;
      }
      case 'gun': {
        const base = randInt(1500, 2500);
        const cost = gunEventCost(base, s.guns);
        if (s.cash >= cost && opts.buyGun && s.guns < CONFIG.maxGuns) {
          s.cash -= cost;
          s.guns += 1;
          s.stats.gunsBought++;
        }
        break;
      }
      case 'feds':
        resolveFeds(s, opts);
        break;
    }
  }
}

function resolveFeds(s, opts) {
  let maxCops = 1 + Math.min(3, Math.floor(s.day / 8));
  if (s.day > 20) maxCops += 1;
  let cops = randInt(1, maxCops);
  s.stats.fedsEncounters++;
  let rounds = 0;
  const bribeScale = s.day > 20 ? 1.5 : 1;

  while (cops > 0 && !s.over && rounds < 50) {
    rounds++;
    const bribeCost = Math.min(s.cash, Math.round(randInt(2000, 8000) * cops * bribeScale));
    if (opts.fedsPreferBribe && bribeCost > 0 && s.cash >= bribeCost * 0.5) {
      s.cash -= bribeCost;
      s.stats.fedsBribes++;
      return;
    }
    if (s.guns > 0 && opts.fedsFight) {
      cops = fedsApplyFightKill(s, cops, rounds);
      if (cops <= 0) {
        s.cash += randInt(3750, 10000);
        grantDebtInterestFreeze(s, 1);
        s.stats.fedsWins++;
        return;
      }
      if (chance(fedsCounterHitChance(s.guns, rounds, s.day)) && hit(s)) {
        s.over = true;
        s.deathReason = 'feds';
        s.stats.deaths++;
        return;
      }
      continue;
    }
    if (chance(0.62)) {
      s.stats.fedsEscaped++;
      return;
    }
    if (hit(s)) {
      s.over = true;
      s.deathReason = 'feds';
      s.stats.deaths++;
      return;
    }
    const owned = Object.keys(s.inventory);
    if (owned.length) {
      const id = pick(owned);
      const lost = Math.min(s.inventory[id], randInt(1, 5));
      s.inventory[id] -= lost;
      if (s.inventory[id] <= 0) delete s.inventory[id];
    }
  }
}

function pickDestination(s, opts) {
  const { golden, gk, sr, re } = s.events || {};
  const day = s.day;
  if (opts.chaseEvents) {
    if (golden && day === golden.day) return pick(LOCATIONS);
    if (gk && day === gk.day) return gk.district;
    if (sr && day === sr.day) return sr.district;
    if (re && day === re.day) return re.district;
  }
  if (opts.preferDock && chance(0.4)) return 'Dock #13';
  return pick(LOCATIONS.filter(l => l !== s.location));
}

function trade(s, opts) {
  for (const d of GOODS) {
    const qty = s.inventory[d.id] || 0;
    if (qty <= 0 || s.prices[d.id] == null) continue;
    const pct = profitPct(s, d.id, s.prices[d.id]);
    if (pct != null && pct >= opts.sellProfitPct) {
      sell(s, d.id, qty);
      s.stats.sells++;
    }
  }

  let best = null;
  let bestScore = -Infinity;
  for (const d of GOODS) {
    const price = s.prices[d.id];
    if (price == null) continue;
    const mid = (d.low + d.high) / 2;
    const score = (mid - price) / mid;
    if (score > bestScore && price < mid * opts.buyThreshold) {
      bestScore = score;
      best = d;
    }
  }
  if (!best) return;
  const price = s.prices[best.id];
  const maxQty = Math.min(
    Math.floor(s.cash / price),
    spaceLeft(s),
    opts.maxBuyQty
  );
  if (maxQty > 0 && buy(s, best.id, maxQty) === null) {
    s.stats.buys++;
  }
}

function bankAtHome(s, opts) {
  if (s.location !== HOME) return;
  if (opts.repayDebt && s.debt > 0 && s.cash > CONFIG.startCash) {
    const pay = Math.min(s.cash - 5000, s.debt, Math.floor(s.cash * opts.repayFraction));
    if (pay > 0) bankRepay(s, pay);
  }
  if (opts.useBank && s.cash > 15000) {
    const dep = Math.floor(s.cash * opts.depositFraction);
    if (dep > 0) bankDeposit(s, dep);
  }
}

function travelTo(s, dest, opts) {
  s.location = dest;
  s.day += 1;
  if (applyDailyInterest(s)) {
    s.over = true;
    s.deathReason = 'debt_cap';
    return;
  }
  s.stats.totalInterest += s.debt;

  if (s.day > CONFIG.days) {
    s.over = true;
    return;
  }

  const market = resolveTravelMarket(s, dest);
  s.prices = market.prices;
  if (market.golden && s.day === market.golden.day) s.stats.goldenDays++;
  if (market.gk && s.day === market.gk.day && dest === market.gk.district) s.stats.godlikeHits++;
  if (market.sr && s.day === market.sr.day && dest === market.sr.district) s.stats.superRareHits++;
  if (market.re && s.day === market.re.day && dest === market.re.district) s.stats.rareHits++;

  runTravelEvents(s, opts);
}

function playGame(opts) {
  const s = newGame();
  s.over = false;
  s.deathReason = null;
  s.stats = {
    buys: 0, sells: 0, muggings: 0, muggingLoss: 0, finds: 0,
    stashBuys: 0, gunsBought: 0, fedsEncounters: 0, fedsBribes: 0,
    fedsWins: 0, fedsEscaped: 0, deaths: 0,
    rareHits: 0, superRareHits: 0, godlikeHits: 0, goldenDays: 0,
    totalInterest: 0,
  };
  if (s.events.rare) s.stats.hasRare = 1;
  if (s.events.superRare) s.stats.hasSuperRare = 1;
  if (s.events.godlike) s.stats.hasGodlike = 1;
  if (s.events.goldenGodlike) s.stats.hasGolden = 1;

  while (!s.over && s.day <= CONFIG.days) {
    trade(s, opts);
    bankAtHome(s, opts);
    const dest = pickDestination(s, opts);
    travelTo(s, dest, opts);
    if (!s.over) trade(s, opts);
  }

  if (!s.over) s.over = true;
  const worth = netWorth(s);
  const score = classicScore(s);
  return {
    worth, score, rank: getRank(score),
    debt: s.debt, cash: s.cash, bank: s.bank,
    health: s.health, guns: s.guns, day: s.day,
    death: s.deathReason, stats: s.stats,
    events: s.events,
  };
}

const STRATEGIES = {
  competent: {
    sellProfitPct: 15,
    buyThreshold: 0.85,
    maxBuyQty: 50,
    chaseEvents: true,
    preferDock: false,
    buyStash: true,
    buyGun: true,
    fedsPreferBribe: true,
    fedsFight: true,
    repayDebt: true,
    repayFraction: 0.25,
    useBank: true,
    depositFraction: 0.3,
  },
  passive: {
    sellProfitPct: 999,
    buyThreshold: 0,
    maxBuyQty: 0,
    chaseEvents: false,
    preferDock: false,
    buyStash: false,
    buyGun: false,
    fedsPreferBribe: false,
    fedsFight: false,
    repayDebt: false,
    useBank: false,
  },
  aggressive: {
    sellProfitPct: 8,
    buyThreshold: 1.0,
    maxBuyQty: 100,
    chaseEvents: true,
    preferDock: true,
    buyStash: true,
    buyGun: true,
    fedsPreferBribe: false,
    fedsFight: true,
    repayDebt: false,
    useBank: false,
  },
  debtFocus: {
    sellProfitPct: 12,
    buyThreshold: 0.9,
    maxBuyQty: 30,
    chaseEvents: false,
    preferDock: false,
    buyStash: false,
    buyGun: false,
    fedsPreferBribe: true,
    fedsFight: false,
    repayDebt: true,
    repayFraction: 0.5,
    useBank: true,
    depositFraction: 0.2,
  },
};

function summarize(results, label) {
  const n = results.length;
  const worths = results.map(r => r.worth);
  const scores = results.map(r => r.score);
  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  const pct = (x) => (100 * x / n).toFixed(1);
  const sorted = [...worths].sort((a, b) => a - b);
  const p = (q) => sorted[Math.floor(q * (n - 1))];

  const deaths = results.filter(r => r.death).length;
  const negative = results.filter(r => r.worth < 0).length;
  const broke = results.filter(r => r.worth < -100000).length;
  const score100 = results.filter(r => r.score >= 100).length;
  const score90 = results.filter(r => r.score >= 90).length;
  const godfather = results.filter(r => r.rank === 'Big Daddy J').length;

  const rankCounts = {};
  for (const r of results) rankCounts[r.rank] = (rankCounts[r.rank] || 0) + 1;

  return {
    label,
    n,
    avgWorth: Math.round(avg(worths)),
    medianWorth: Math.round(p(0.5)),
    p90Worth: Math.round(p(0.9)),
    maxWorth: Math.max(...worths),
    minWorth: Math.min(...worths),
    avgScore: avg(scores).toFixed(1),
    deaths: `${deaths} (${pct(deaths)}%)`,
    negativeNW: `${negative} (${pct(negative)}%)`,
    deepDebt: `${broke} (${pct(broke)}%)`,
    score100: `${score100} (${pct(score100)}%)`,
    score90plus: `${score90} (${pct(score90)}%)`,
    bigDaddyJ: `${godfather} (${pct(godfather)}%)`,
    avgDebtEnd: Math.round(avg(results.map(r => r.debt))),
    avgFinalDay: avg(results.map(r => r.day)).toFixed(1),
    rankCounts,
    avgFeds: avg(results.map(r => r.stats.fedsEncounters)).toFixed(2),
    avgMuggingLoss: Math.round(avg(results.map(r => r.stats.muggingLoss))),
    eventRates: {
      rare: pct(results.filter(r => r.stats.hasRare).length),
      superRare: pct(results.filter(r => r.stats.hasSuperRare).length),
      godlike: pct(results.filter(r => r.stats.hasGodlike).length),
      golden: pct(results.filter(r => r.stats.hasGolden).length),
    },
  };
}

function runBatch(strategyName, count) {
  const opts = STRATEGIES[strategyName];
  const results = [];
  for (let i = 0; i < count; i++) results.push(playGame(opts));
  return summarize(results, strategyName);
}

function interestOnlySimulation(runs) {
  let totalDebt = 0;
  for (let i = 0; i < runs; i++) {
    const s = newGame();
    for (let d = 0; d < 30; d++) {
      applyDailyInterest(s);
    }
    totalDebt += s.debt;
  }
  return Math.round(totalDebt / runs);
}

function analyzeEventValue(runs) {
  const withGodlike = [];
  const withoutGodlike = [];
  for (let i = 0; i < runs; i++) {
    const r = playGame(STRATEGIES.competent);
    if (r.stats.hasGodlike || r.stats.hasGolden) withGodlike.push(r.worth);
    else withoutGodlike.push(r.worth);
  }
  const avg = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0;
  return { withGodlike: withGodlike.length, avgWith: avg(withGodlike), avgWithout: avg(withoutGodlike) };
}

console.log(`\n=== Gang Wars Monte Carlo (${RUNS} runs) ===\n`);

const perStrategy = Math.floor(RUNS / 4);
const summaries = [
  runBatch('competent', perStrategy),
  runBatch('aggressive', perStrategy),
  runBatch('debtFocus', perStrategy),
  runBatch('passive', perStrategy),
];

for (const s of summaries) {
  console.log(`--- ${s.label.toUpperCase()} (${s.n} games) ---`);
  console.log(`  Net worth: avg $${s.avgWorth.toLocaleString()} | median $${s.medianWorth.toLocaleString()} | p90 $${s.p90Worth.toLocaleString()} | max $${s.maxWorth.toLocaleString()}`);
  console.log(`  Score: avg ${s.avgScore} | 90+: ${s.score90plus} | 100: ${s.score100} | Big Daddy J: ${s.bigDaddyJ}`);
  console.log(`  Deaths: ${s.deaths} | Negative NW: ${s.negativeNW} | Deep debt (<-$100k): ${s.deepDebt}`);
  console.log(`  Avg end debt: $${s.avgDebtEnd.toLocaleString()} | Feds/run: ${s.avgFeds} | Avg mugging loss: $${s.avgMuggingLoss.toLocaleString()}`);
  console.log(`  Event roll rates: rare ${s.eventRates.rare}% super ${s.eventRates.superRare}% godlike ${s.eventRates.godlike}% golden ${s.eventRates.golden}%`);
  const topRanks = Object.entries(s.rankCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  console.log(`  Top ranks: ${topRanks.map(([r, c]) => `${r} ${(100 * c / s.n).toFixed(0)}%`).join(', ')}`);
  console.log('');
}

const debt30 = interestOnlySimulation(1000);
console.log(`--- MECHANICS CHECKS ---`);
console.log(`  Starting debt after 30 days interest-only (no travel): ~$${debt30.toLocaleString()} (vs start $25,000)`);
console.log(`  Perfect score threshold: $${PERFECT_SCORE_NET_WORTH.toLocaleString()} net worth`);

const ev = analyzeEventValue(2000);
console.log(`  Godlike/Golden runs (${ev.withGodlike}/2000): avg NW $${ev.avgWith.toLocaleString()} vs $${ev.avgWithout.toLocaleString()} without`);

console.log('\n=== FINDINGS (see stdout above + interpretation) ===\n');
