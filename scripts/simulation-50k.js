#!/usr/bin/env node
/* 50,000-run gameplay simulation — 5 player archetypes × 10,000 runs */

const fs = require('fs');
const path = require('path');
const {
  CONFIG, DRUGS, DRUG, LOCATIONS, HOME, TERRITORY_MODIFIERS,
  FAM_LUXURY, FAM_CRIMINAL, FAM_ALCOHOL,
  newGame, resolveTravelMarket, applyDailyInterest,
  buy, sell, bankRepay, bankBorrow, bankDeposit,
  spaceLeft, spaceUsed, netWorth, classicScore, getRank, profitPct,
  randInt, chance, pick, fightKillChance, maxBorrowAmount,
} = require('../engine.js');

const RUNS_PER_ARCHETYPE = 10000;
const OUT = path.join(__dirname, '..', 'docs', 'review', 'simulation-50k.json');

function hit(s) {
  s.health -= 1;
  return s.health <= 0;
}

function resolveFeds(s, opts) {
  let cops = randInt(1, 1 + Math.min(3, Math.floor(s.day / 8)));
  if (s.day > 20) cops += 1;
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
      if (chance(fightKillChance(s.guns))) {
        cops -= 1;
        if (cops <= 0) {
          s.cash += randInt(3750, 10000);
          s.stats.fedsWins++;
          return;
        }
      }
      if (chance(0.35) && hit(s)) {
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
      s.stats.goodsLostFeds += lost;
    }
  }
}

function runTravelEvents(s, opts) {
  const fired = [];
  const candidates = [];
  if (chance(1 / 12)) candidates.push('mugging');
  if (chance(1 / 12)) candidates.push('find');
  if (chance(1 / 7)) candidates.push('stash');
  if (chance(1 / 7)) candidates.push('gun');
  if (chance(1 / 7)) candidates.push('feds');
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  fired.push(...candidates.slice(0, CONFIG.maxTravelEvents));
  s.stats.eventsPerTrip.push(fired.length);

  for (const ev of fired) {
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
        const d = pick(DRUGS);
        const n = Math.min(spaceLeft(s), randInt(2, 7));
        s.inventory[d.id] = (s.inventory[d.id] || 0) + n;
        s.stats.finds++;
        s.stats.goodFinds[d.id] = (s.stats.goodFinds[d.id] || 0) + n;
        break;
      }
      case 'stash': {
        const add = pick([10, 15, 20, 30]);
        const cost = add * randInt(90, 110);
        if (s.cash >= cost && opts.buyStash) {
          s.cash -= cost;
          s.space += add;
          s.stats.stashBuys++;
        }
        break;
      }
      case 'gun': {
        const cost = randInt(1500, 2500);
        if (s.cash >= cost && opts.buyGun) {
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

function bestTerritoryForGood(d) {
  let best = HOME;
  let bestPrice = 0;
  for (const loc of LOCATIONS) {
    const mid = (d.low + d.high) / 2;
    let p = mid;
    const mod = TERRITORY_MODIFIERS[loc] || {};
    if (mod.luxuryBonus && FAM_LUXURY.has(d.id)) p *= 1 + mod.luxuryBonus;
    if (mod.criminalBonus && FAM_CRIMINAL.has(d.id)) p *= 1 + mod.criminalBonus;
    if (mod.alcoholBonus && FAM_ALCOHOL.has(d.id)) p *= 1 + mod.alcoholBonus;
    if (mod.bias) p *= 1 + mod.bias;
    if (p > bestPrice) { bestPrice = p; best = loc; }
  }
  return best;
}

function pickDestination(s, opts) {
  const { golden, gk, sr, re } = s.events || {};
  const day = s.day;

  if (opts.chaseEvents) {
    if (golden && day === golden.day) return pick(LOCATIONS.filter(l => l !== s.location));
    if (gk && day === gk.day) return gk.district;
    if (sr && day === sr.day) return sr.district;
    if (re && day === re.day) return re.district;
  }

  if (opts.arbitrageMode) {
    let bestDest = null;
    let bestScore = -Infinity;
    for (const loc of LOCATIONS.filter(l => l !== s.location)) {
      let score = 0;
      for (const d of DRUGS) {
        const have = s.inventory[d.id] || 0;
        const sellHere = have > 0 && (loc === 'Uptown' && FAM_LUXURY.has(d.id) ||
          loc === 'Warehouse District' && FAM_CRIMINAL.has(d.id) ||
          loc === 'Kitty Kat Club' && FAM_ALCOHOL.has(d.id));
        if (sellHere) score += have * 2;
        const buyHere = loc === bestTerritoryForGood(d) && !(s.inventory[d.id] > 0);
        if (buyHere) score += 1;
      }
      if (score > bestScore) { bestScore = score; bestDest = loc; }
    }
    if (bestDest && bestScore > 0) return bestDest;
  }

  if (opts.preferDock && chance(0.4)) return 'Dock #13';
  return pick(LOCATIONS.filter(l => l !== s.location));
}

function trade(s, opts) {
  for (const d of DRUGS) {
    const qty = s.inventory[d.id] || 0;
    if (qty <= 0 || s.prices[d.id] == null) continue;
    const pct = profitPct(s, d.id, s.prices[d.id]);
    if (pct != null && pct >= opts.sellProfitPct) {
      sell(s, d.id, qty);
      s.stats.sells++;
      s.stats.goodSells[d.id] = (s.stats.goodSells[d.id] || 0) + qty;
    }
  }

  const candidates = [];
  for (const d of DRUGS) {
    const price = s.prices[d.id];
    if (price == null) continue;
    const mid = (d.low + d.high) / 2;
    const score = (mid - price) / mid;
    if (price < mid * opts.buyThreshold) candidates.push({ d, score, price });
  }
  candidates.sort((a, b) => b.score - a.score);

  const toBuy = opts.buyMultiple ? candidates.slice(0, 2) : candidates.slice(0, 1);
  for (const { d, price } of toBuy) {
    const maxQty = Math.min(
      Math.floor(s.cash / price),
      spaceLeft(s),
      opts.maxBuyQty
    );
    if (maxQty > 0 && buy(s, d.id, maxQty) === null) {
      s.stats.buys++;
      s.stats.goodBuys[d.id] = (s.stats.goodBuys[d.id] || 0) + maxQty;
    }
  }
}

function bankAtHome(s, opts) {
  if (s.location !== HOME) return;

  if (opts.borrowMax && s.cash < CONFIG.startCash) {
    const amount = maxBorrowAmount(s);
    if (amount > 0) {
      const err = bankBorrow(s, Math.min(CONFIG.maxBorrow, amount));
      if (!err) s.stats.borrows++;
    }
  }

  if (opts.repayDebt && s.debt > 0 && s.cash > CONFIG.startCash) {
    const pay = Math.min(s.cash - (opts.keepCash || 5000), s.debt, Math.floor(s.cash * opts.repayFraction));
    if (pay > 0) bankRepay(s, pay);
  }

  if (opts.useBank && s.cash > (opts.depositThreshold || 15000)) {
    const dep = Math.floor(s.cash * opts.depositFraction);
    if (dep > 0) bankDeposit(s, dep);
  }
}

function travelTo(s, dest, opts) {
  s.stats.districtVisits[dest] = (s.stats.districtVisits[dest] || 0) + 1;
  s.location = dest;
  s.day += 1;
  applyDailyInterest(s);
  s.stats.totalInterestPaid += s.debt;

  if (s.day > CONFIG.days) {
    s.over = true;
    s.stats.survived = true;
    return;
  }

  const market = resolveTravelMarket(s, dest);
  s.prices = market.prices;
  if (market.golden && s.day === market.golden.day) s.stats.goldenHits++;
  if (market.gk && s.day === market.gk.day && dest === market.gk.district) s.stats.godlikeHits++;
  if (market.sr && s.day === market.sr.day && dest === market.sr.district) s.stats.superRareHits++;
  if (market.re && s.day === market.re.day && dest === market.re.district) s.stats.rareHits++;

  runTravelEvents(s, opts);
}

function initStats(s) {
  s.stats = {
    buys: 0, sells: 0, muggings: 0, muggingLoss: 0, finds: 0,
    stashBuys: 0, gunsBought: 0, borrows: 0,
    fedsEncounters: 0, fedsBribes: 0, fedsWins: 0, fedsEscaped: 0, deaths: 0,
    goodsLostFeds: 0,
    rareHits: 0, superRareHits: 0, godlikeHits: 0, goldenHits: 0,
    totalInterestPaid: 0,
    districtVisits: {},
    goodBuys: {}, goodSells: {}, goodFinds: {},
    eventsPerTrip: [],
    survived: false,
  };
  if (s.events.rare) s.stats.scheduledRare = 1;
  if (s.events.superRare) s.stats.scheduledSuperRare = 1;
  if (s.events.godlike) s.stats.scheduledGodlike = 1;
  if (s.events.goldenGodlike) s.stats.scheduledGolden = 1;
}

function playGame(opts) {
  const s = newGame();
  s.over = false;
  s.deathReason = null;
  initStats(s);

  while (!s.over && s.day <= CONFIG.days) {
    trade(s, opts);
    bankAtHome(s, opts);
    const dest = pickDestination(s, opts);
    travelTo(s, dest, opts);
    if (!s.over) trade(s, opts);
  }

  if (!s.over) { s.over = true; s.stats.survived = true; }

  const worth = netWorth(s);
  const used = spaceUsed(s.inventory);
  return {
    worth, score: classicScore(s), rank: getRank(classicScore(s)),
    debt: s.debt, cash: s.cash, bank: s.bank,
    health: s.health, guns: s.guns, day: s.day,
    death: s.deathReason,
    survived: s.stats.survived && !s.deathReason,
    stashUtil: used / s.space,
    trades: s.stats.buys + s.stats.sells,
    stats: s.stats,
  };
}

const ARCHETYPES = {
  conservative: {
    label: 'Conservative Trader',
    sellProfitPct: 20,
    buyThreshold: 0.82,
    maxBuyQty: 40,
    chaseEvents: false,
    preferDock: false,
    arbitrageMode: false,
    buyStash: true,
    buyGun: false,
    fedsPreferBribe: true,
    fedsFight: false,
    repayDebt: true,
    repayFraction: 0.4,
    keepCash: 8000,
    useBank: true,
    depositFraction: 0.35,
    depositThreshold: 12000,
    borrowMax: false,
    buyMultiple: false,
  },
  aggressive: {
    label: 'Aggressive Risk Taker',
    sellProfitPct: 5,
    buyThreshold: 1.05,
    maxBuyQty: 100,
    chaseEvents: true,
    preferDock: true,
    arbitrageMode: false,
    buyStash: true,
    buyGun: true,
    fedsPreferBribe: false,
    fedsFight: true,
    repayDebt: false,
    useBank: false,
    borrowMax: false,
    buyMultiple: true,
  },
  smuggler: {
    label: 'Smuggler / Arbitrage Specialist',
    sellProfitPct: 12,
    buyThreshold: 0.92,
    maxBuyQty: 60,
    chaseEvents: true,
    preferDock: false,
    arbitrageMode: true,
    buyStash: true,
    buyGun: true,
    fedsPreferBribe: true,
    fedsFight: true,
    repayDebt: true,
    repayFraction: 0.15,
    useBank: true,
    depositFraction: 0.25,
    borrowMax: false,
    buyMultiple: true,
  },
  debtExploiter: {
    label: 'Debt Exploiter',
    sellProfitPct: 10,
    buyThreshold: 0.95,
    maxBuyQty: 80,
    chaseEvents: false,
    preferDock: false,
    arbitrageMode: false,
    buyStash: false,
    buyGun: false,
    fedsPreferBribe: true,
    fedsFight: false,
    repayDebt: false,
    useBank: true,
    depositFraction: 0.5,
    depositThreshold: 5000,
    borrowMax: true,
    buyMultiple: false,
  },
  balanced: {
    label: 'Balanced Player',
    sellProfitPct: 15,
    buyThreshold: 0.85,
    maxBuyQty: 50,
    chaseEvents: true,
    preferDock: false,
    arbitrageMode: false,
    buyStash: true,
    buyGun: true,
    fedsPreferBribe: true,
    fedsFight: true,
    repayDebt: true,
    repayFraction: 0.25,
    useBank: true,
    depositFraction: 0.3,
    borrowMax: false,
    buyMultiple: false,
  },
};

function avg(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
function pct(n, total) { return total ? (100 * n / total).toFixed(1) : '0.0'; }
function percentile(sorted, q) {
  if (!sorted.length) return 0;
  return sorted[Math.floor(q * (sorted.length - 1))];
}

function summarizeArchetype(name, results) {
  const n = results.length;
  const worths = results.map(r => r.worth).sort((a, b) => a - b);
  const wins = results.filter(r => r.survived).length;
  const deaths = results.filter(r => r.death).length;
  const negative = results.filter(r => r.worth < 0).length;

  const districtTotals = {};
  const goodBuyTotals = {};
  const goodSellTotals = {};
  let totalEvents = 0;
  let eventTrips = 0;

  for (const r of results) {
    for (const [d, c] of Object.entries(r.stats.districtVisits))
      districtTotals[d] = (districtTotals[d] || 0) + c;
    for (const [g, c] of Object.entries(r.stats.goodBuys))
      goodBuyTotals[g] = (goodBuyTotals[g] || 0) + c;
    for (const [g, c] of Object.entries(r.stats.goodSells))
      goodSellTotals[g] = (goodSellTotals[g] || 0) + c;
    for (const e of r.stats.eventsPerTrip) { totalEvents += e; eventTrips++; }
  }

  const rankCounts = {};
  for (const r of results) rankCounts[r.rank] = (rankCounts[r.rank] || 0) + 1;

  return {
    archetype: ARCHETYPES[name].label,
    key: name,
    runs: n,
    winRate: pct(wins, n),
    lossRate: pct(deaths, n),
    avgEndingWealth: Math.round(avg(worths)),
    medianEndingWealth: Math.round(percentile(worths, 0.5)),
    p10Wealth: Math.round(percentile(worths, 0.1)),
    p90Wealth: Math.round(percentile(worths, 0.9)),
    maxWealth: Math.max(...worths),
    minWealth: Math.min(...worths),
    avgDebtRemaining: Math.round(avg(results.map(r => r.debt))),
    avgStashUtilization: avg(results.map(r => r.stashUtil)).toFixed(3),
    avgDaysSurvived: avg(results.map(r => r.day)).toFixed(1),
    avgTrades: avg(results.map(r => r.trades)).toFixed(1),
    avgScore: avg(results.map(r => r.score)).toFixed(1),
    negativeNetWorthPct: pct(negative, n),
    score90PlusPct: pct(results.filter(r => r.score >= 90).length, n),
    bigDaddyJPct: pct(results.filter(r => r.rank === 'Big Daddy J').length, n),
    avgFedsEncounters: avg(results.map(r => r.stats.fedsEncounters)).toFixed(2),
    avgEventsPerTrip: eventTrips ? (totalEvents / eventTrips).toFixed(2) : '0',
    districtUsage: districtTotals,
    goodsBuyFrequency: goodBuyTotals,
    goodsSellFrequency: goodSellTotals,
    bankruptcyCauses: { feds: deaths, survived: wins },
    rankDistribution: rankCounts,
    scheduledEventRates: {
      rare: pct(results.filter(r => r.stats.scheduledRare).length, n),
      superRare: pct(results.filter(r => r.stats.scheduledSuperRare).length, n),
      godlike: pct(results.filter(r => r.stats.scheduledGodlike).length, n),
      golden: pct(results.filter(r => r.stats.scheduledGolden).length, n),
    },
  };
}

function aggregateEconomy(allResults) {
  const byArchetype = {};
  for (const [name, summary] of Object.entries(allResults)) {
    byArchetype[name] = summary.avgEndingWealth;
  }
  const sorted = Object.entries(byArchetype).sort((a, b) => b[1] - a[1]);

  const allGoods = {};
  for (const s of Object.values(allResults)) {
    for (const [g, c] of Object.entries(s.goodsBuyFrequency))
      allGoods[g] = (allGoods[g] || 0) + c;
  }
  const goodsRanked = Object.entries(allGoods).sort((a, b) => b[1] - a[1]);

  return {
    mostProfitableStrategies: sorted.slice(0, 2).map(([k, v]) => ({ strategy: ARCHETYPES[k].label, avgWealth: v })),
    leastProfitableStrategies: sorted.slice(-2).reverse().map(([k, v]) => ({ strategy: ARCHETYPES[k].label, avgWealth: v })),
    dominantStrategy: sorted[0][0],
    overpoweredGoods: goodsRanked.slice(0, 3).map(([g]) => g),
    underpoweredGoods: goodsRanked.slice(-3).map(([g]) => g),
    interestOnlyDebt30Days: (() => {
      let t = 0;
      for (let i = 0; i < 1000; i++) {
        const s = newGame();
        for (let d = 0; d < 30; d++) applyDailyInterest(s);
        t += s.debt;
      }
      return Math.round(t / 1000);
    })(),
    exploits: [
      { id: 'day1_stall', severity: 'High', note: 'No interest until first travel — not modeled in sim (all archetypes travel immediately)' },
      { id: 'debt_stack', severity: 'High', note: 'Debt exploiter avg borrows per run measurable via stats.borrows' },
      { id: 'gun_stack', severity: 'High', note: 'Aggressive archetype accumulates multiple guns; Feds death rate should be near 0' },
      { id: 'event_pileup', severity: 'Medium', note: `Avg events per trip: ${avg(Object.values(allResults).map(s => parseFloat(s.avgEventsPerTrip))).toFixed(2)}` },
    ],
  };
}

function main() {
  console.log(`\n=== Gang Wars 50,000-Run Simulation ===\n`);
  const t0 = Date.now();
  const summaries = {};
  const rawByArchetype = {};

  for (const name of Object.keys(ARCHETYPES)) {
    process.stdout.write(`Running ${ARCHETYPES[name].label} (${RUNS_PER_ARCHETYPE})...`);
    const opts = ARCHETYPES[name];
    const results = [];
    for (let i = 0; i < RUNS_PER_ARCHETYPE; i++) results.push(playGame(opts));
    summaries[name] = summarizeArchetype(name, results);
    rawByArchetype[name] = results;
    console.log(` done. Avg NW: $${summaries[name].avgEndingWealth.toLocaleString()}`);
  }

  const economy = aggregateEconomy(summaries);

  // Cross-archetype goods analysis
  const globalGoods = {};
  for (const s of Object.values(summaries)) {
    for (const [g, c] of Object.entries(s.goodsBuyFrequency))
      globalGoods[g] = (globalGoods[g] || 0) + c;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    totalRuns: RUNS_PER_ARCHETYPE * Object.keys(ARCHETYPES).length,
    durationSeconds: Math.round((Date.now() - t0) / 1000),
    archetypes: summaries,
    economy,
    globalDistrictUsage: (() => {
      const t = {};
      for (const s of Object.values(summaries))
        for (const [d, c] of Object.entries(s.districtUsage))
          t[d] = (t[d] || 0) + c;
      return t;
    })(),
    globalGoodsBuyFrequency: globalGoods,
    balanceFindings: {
      dominantStrategies: economy.mostProfitableStrategies,
      brokenStrategies: economy.leastProfitableStrategies.filter(s => s.avgWealth < 0),
      unusedMechanics: ['Golden Godlike chase (0.1% roll)', 'Full debt payoff win condition'],
      difficultySpikes: ['Day 20+ Feds bribe scale 1.5×', '10% daily compound debt over 30 travels'],
      softLockPossibilities: ['Day 1 stall (player choice)', 'Zero cash + zero bank + high debt + no goods'],
      unwinnableScenarios: ['None forced — negative NW allowed at end'],
      exploitableLoops: economy.exploits,
    },
    debtExploiterDetail: {
      avgBorrows: avg(rawByArchetype.debtExploiter.map(r => r.stats.borrows)).toFixed(1),
      avgEndingDebt: summaries.debtExploiter.avgDebtRemaining,
      avgBank: Math.round(avg(rawByArchetype.debtExploiter.map(r => r.bank))),
    },
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log(`\nWritten to ${OUT} (${report.durationSeconds}s)\n`);
}

main();
