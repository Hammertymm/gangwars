#!/usr/bin/env node
/* 100,000-run gameplay simulation — 10 player archetypes × 10,000 runs */

const fs = require('fs');
const path = require('path');
const {
  CONFIG, GOODS, GOOD, LOCATIONS, HOME, TERRITORY_MODIFIERS,
  FAM_LUXURY, FAM_CRIMINAL, FAM_ALCOHOL,
  newGame, resolveTravelMarket, applyDailyInterest,
  buy, sell, bankRepay, bankBorrow, bankDeposit,
  spaceLeft, spaceUsed, netWorth, classicScore, getRank, profitPct, avgCost,
  randInt, chance, pick, fightKillChance, fedsCounterHitChance, fedsApplyFightKill, gunEventCost,
  rollStashUpgrade, maxBorrowAmount, tickStallPressure, checkDebtCap,
  bankDepositLimit, grantDebtInterestFreeze,
} = require('../engine.js');
const {
  LEDGER_CATEGORIES, LEDGER_TOTAL, emptyLedger,
  migrateRunStats, recordDistrictVisit, recordBuy, recordSell, recordBorrow,
  recordSpaceChange, checkGeneralAchievements, checkEndRunAchievements,
  unlockEventAchievement, countDiscovered, isCategoryComplete, checkMasterComplete,
  eventRollChances, recordEventPityTravel, resetEventPity,
  isEventLedgerSlow, countEventAchievementsUnlocked, isUnlocked,
} = require('../ledger.js');

const RUNS_PER_ARCHETYPE = 10000;
const OUT = path.join(__dirname, '..', 'docs', 'review', 'simulation-100k.json');

function hit(s) {
  s.health -= 1;
  return s.health <= 0;
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
        const d = pick(GOODS);
        const n = Math.min(spaceLeft(s), randInt(2, 7));
        s.inventory[d.id] = (s.inventory[d.id] || 0) + n;
        s.stats.finds++;
        s.stats.goodFinds[d.id] = (s.stats.goodFinds[d.id] || 0) + n;
        break;
      }
      case 'stash': {
        const { add, cost } = rollStashUpgrade();
        if (s.cash >= cost && opts.buyStash) {
          s.cash -= cost;
          s.space += add;
          recordSpaceChange(s);
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
      for (const d of GOODS) {
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

  if (opts.preferHome && s.location !== HOME && chance(opts.preferHomeWeight ?? 0.35)) return HOME;
  if (opts.preferUptown && chance(opts.preferUptownWeight ?? 0.45)) return 'Uptown';
  if (opts.preferDock && chance(opts.preferDockWeight ?? 0.4)) return 'Dock #13';
  return pick(LOCATIONS.filter(l => l !== s.location));
}

function syncLedger(s, ledger) {
  migrateRunStats(s);
  return checkGeneralAchievements(s, ledger);
}

function trade(s, opts, ledger) {
  const goods = opts.luxuryOnly ? GOODS.filter(d => FAM_LUXURY.has(d.id)) : GOODS;
  for (const d of goods) {
    const qty = s.inventory[d.id] || 0;
    if (qty <= 0 || s.prices[d.id] == null) continue;
    const pct = profitPct(s, d.id, s.prices[d.id]);
    if (pct != null && pct >= opts.sellProfitPct) {
      const price = s.prices[d.id];
      const avg = avgCost(s, d.id);
      const profit = avg ? (price - avg) * qty : 0;
      sell(s, d.id, qty);
      recordSell(s, d.id, qty, profit);
      s.stats.sells++;
      s.stats.goodSells[d.id] = (s.stats.goodSells[d.id] || 0) + qty;
    }
  }

  const candidates = [];
  for (const d of goods) {
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
      recordBuy(s, d.id, maxQty);
      s.stats.buys++;
      s.stats.goodBuys[d.id] = (s.stats.goodBuys[d.id] || 0) + maxQty;
    }
  }
  if (ledger) syncLedger(s, ledger);
}

function bankAtHome(s, opts, ledger) {
  if (s.location !== HOME) return;

  if (opts.borrowMax && s.cash < CONFIG.startCash) {
    const amount = maxBorrowAmount(s);
    if (amount > 0) {
      const err = bankBorrow(s, Math.min(CONFIG.maxBorrow, amount));
      if (!err) {
        recordBorrow(s);
        s.stats.borrows++;
      }
    }
  }

  if (opts.repayDebt && s.debt > 0 && s.cash > CONFIG.startCash) {
    const pay = Math.min(s.cash - (opts.keepCash || 5000), s.debt, Math.floor(s.cash * opts.repayFraction));
    if (pay > 0) bankRepay(s, pay);
  }

  if (opts.useBank && s.cash > (opts.depositThreshold || 15000)) {
    const dep = Math.min(Math.floor(s.cash * opts.depositFraction), bankDepositLimit(s));
    if (dep > 0) bankDeposit(s, dep);
  }
  if (ledger) syncLedger(s, ledger);
}

function travelTo(s, dest, opts, ledger) {
  recordDistrictVisit(s, dest);
  s.stats.districtVisits[dest] = (s.stats.districtVisits[dest] || 0) + 1;
  s.location = dest;
  s.day += 1;
  const capMsg = applyDailyInterest(s);
  if (capMsg) {
    s.over = true;
    s.deathReason = 'debt_cap';
    return;
  }
  s.stats.totalInterestPaid += s.debt;

  if (s.day > CONFIG.days) {
    s.over = true;
    s.stats.survived = true;
    return;
  }

  const market = resolveTravelMarket(s, dest);
  s.prices = market.prices;
  if (ledger) {
    const eventsBefore = countEventAchievementsUnlocked(ledger);
    if (market.golden && s.day === market.golden.day) unlockEventAchievement(ledger, 'golden');
    if (market.gk && s.day === market.gk.day) unlockEventAchievement(ledger, market.gk.id);
    if (market.sr && s.day === market.sr.day) unlockEventAchievement(ledger, market.sr.id);
    if (market.re && s.day === market.re.day) unlockEventAchievement(ledger, market.re.id);
    if (countEventAchievementsUnlocked(ledger) > eventsBefore) resetEventPity(ledger);
    syncLedger(s, ledger);
    if (isEventLedgerSlow(ledger) && countEventAchievementsUnlocked(ledger) === eventsBefore) {
      recordEventPityTravel(ledger);
    }
  }
  if (market.golden && s.day === market.golden.day) s.stats.goldenHits++;
  if (market.gk && s.day === market.gk.day && dest === market.gk.district) s.stats.godlikeHits++;
  if (market.sr && s.day === market.sr.day && dest === market.sr.district) s.stats.superRareHits++;
  if (market.re && s.day === market.re.day && dest === market.re.district) s.stats.rareHits++;

  recordSpaceChange(s);
  runTravelEvents(s, opts);
}

function initStats(s) {
  s.stats = {
    buys: 0, sells: 0, muggings: 0, muggingLoss: 0, finds: 0,
    stashBuys: 0, gunsBought: 0, borrows: 0,
    fedsEncounters: 0, fedsBribes: 0, fedsWins: 0, fedsEscaped: 0, deaths: 0,
    goodsLostFeds: 0,
    stallInterestHits: 0,
    debtCapHits: 0,
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

function playGame(opts, accountLedger) {
  const ledger = accountLedger || emptyLedger();
  const unlockedBefore = new Set(
    Object.keys(ledger.achievements).filter(id => isUnlocked(ledger, id))
  );
  const s = newGame(eventRollChances(ledger));
  s.over = false;
  s.deathReason = null;
  initStats(s);
  migrateRunStats(s);

  while (!s.over && s.day <= CONFIG.days) {
    if (opts.day1StallActions && s.day === 1) {
      for (let i = 0; i < opts.day1StallActions; i++) {
        trade(s, opts, ledger);
        bankAtHome(s, opts, ledger);
        const stall = tickStallPressure(s);
        if (stall) {
          if (s.over) {
            s.stats.debtCapHits++;
            break;
          }
          s.stats.stallInterestHits++;
        }
      }
    } else {
      trade(s, opts, ledger);
      bankAtHome(s, opts, ledger);
    }
    const dest = pickDestination(s, opts);
    travelTo(s, dest, opts, ledger);
    if (s.deathReason === 'debt_cap') s.stats.debtCapHits++;
    if (!s.over) trade(s, opts, ledger);
  }

  if (!s.over) { s.over = true; s.stats.survived = true; }
  checkEndRunAchievements(s, ledger);
  syncLedger(s, ledger);

  const worth = netWorth(s);
  const used = spaceUsed(s.inventory);
  const unlockedThisRun = Object.keys(ledger.achievements).filter(
    id => isUnlocked(ledger, id) && !unlockedBefore.has(id)
  );
  const categoriesComplete = LEDGER_CATEGORIES.filter(cat => isCategoryComplete(ledger, cat.id)).map(c => c.id);
  return {
    worth, score: classicScore(s), rank: getRank(classicScore(s)),
    debt: s.debt, cash: s.cash, bank: s.bank,
    health: s.health, guns: s.guns, day: s.day,
    death: s.deathReason,
    survived: s.stats.survived && !s.deathReason,
    stashUtil: used / s.space,
    trades: s.stats.buys + s.stats.sells,
    stats: s.stats,
    ledgerUnlocks: unlockedThisRun,
    ledgerUnlockCount: unlockedThisRun.length,
    ledgerMasterComplete: checkMasterComplete(ledger),
    ledgerCategoriesComplete: categoriesComplete,
  };
}

const ARCHETYPES = {
  conservative: {
    group: 'original',
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
    group: 'original',
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
    group: 'original',
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
    group: 'original',
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
    group: 'original',
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
  eventHunter: {
    group: 'new',
    label: 'Event Hunter',
    sellProfitPct: 8,
    buyThreshold: 1.0,
    maxBuyQty: 35,
    chaseEvents: true,
    preferDock: false,
    arbitrageMode: false,
    buyStash: true,
    buyGun: false,
    fedsPreferBribe: true,
    fedsFight: false,
    repayDebt: true,
    repayFraction: 0.15,
    keepCash: 5000,
    useBank: false,
    borrowMax: false,
    buyMultiple: false,
  },
  dockRunner: {
    group: 'new',
    label: 'Dock Runner',
    sellProfitPct: 10,
    buyThreshold: 0.88,
    maxBuyQty: 90,
    chaseEvents: false,
    preferDock: true,
    preferDockWeight: 0.65,
    arbitrageMode: false,
    buyStash: true,
    buyGun: true,
    fedsPreferBribe: true,
    fedsFight: true,
    repayDebt: true,
    repayFraction: 0.2,
    useBank: false,
    borrowMax: false,
    buyMultiple: true,
  },
  luxuryBroker: {
    group: 'new',
    label: 'Luxury Broker',
    sellProfitPct: 18,
    buyThreshold: 0.78,
    maxBuyQty: 40,
    luxuryOnly: true,
    chaseEvents: false,
    preferUptown: true,
    preferUptownWeight: 0.55,
    arbitrageMode: true,
    buyStash: true,
    buyGun: false,
    fedsPreferBribe: true,
    fedsFight: false,
    repayDebt: true,
    repayFraction: 0.3,
    keepCash: 10000,
    useBank: true,
    depositFraction: 0.4,
    depositThreshold: 15000,
    borrowMax: false,
    buyMultiple: false,
  },
  streetHustler: {
    group: 'new',
    label: 'Street Hustler',
    sellProfitPct: 3,
    buyThreshold: 1.08,
    maxBuyQty: 25,
    chaseEvents: false,
    preferDock: false,
    arbitrageMode: false,
    buyStash: false,
    buyGun: false,
    fedsPreferBribe: true,
    fedsFight: false,
    repayDebt: false,
    useBank: false,
    borrowMax: false,
    buyMultiple: true,
  },
  enforcer: {
    group: 'new',
    label: 'Enforcer',
    sellProfitPct: 12,
    buyThreshold: 0.9,
    maxBuyQty: 55,
    chaseEvents: false,
    preferDock: false,
    arbitrageMode: false,
    buyStash: true,
    buyGun: true,
    fedsPreferBribe: false,
    fedsFight: true,
    repayDebt: false,
    useBank: false,
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

  const achievementRates = {};
  const categoryCompleteRates = {};
  for (const cat of LEDGER_CATEGORIES) categoryCompleteRates[cat.id] = 0;
  let masterCompleteRuns = 0;
  let totalUnlocks = 0;

  for (const r of results) {
    totalUnlocks += r.ledgerUnlockCount;
    if (r.ledgerMasterComplete) masterCompleteRuns++;
    for (const id of r.ledgerUnlocks) achievementRates[id] = (achievementRates[id] || 0) + 1;
    for (const catId of r.ledgerCategoriesComplete) categoryCompleteRates[catId]++;
  }

  const achievementUnlockPct = {};
  for (const cat of LEDGER_CATEGORIES) {
    for (const a of cat.achievements) {
      achievementUnlockPct[a.id] = pct(achievementRates[a.id] || 0, n);
    }
  }

  return {
    archetype: ARCHETYPES[name].label,
    group: ARCHETYPES[name].group,
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
    avgStallInterestHits: avg(results.map(r => r.stats.stallInterestHits || 0)).toFixed(2),
    avgDebtCapHits: avg(results.map(r => r.stats.debtCapHits || 0)).toFixed(2),
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
    crimeLedger: {
      avgUnlocksPerRun: (totalUnlocks / n).toFixed(2),
      masterCompletePct: pct(masterCompleteRuns, n),
      categoryCompletePct: Object.fromEntries(
        Object.entries(categoryCompleteRates).map(([k, v]) => [k, pct(v, n)])
      ),
      achievementUnlockPct,
    },
  };
}

function aggregateCrimeLedger(allResults, rawByArchetype) {
  const cumulative = emptyLedger();
  const allRuns = Object.values(rawByArchetype).flat();
  const runsToFull = [];
  let runs = 0;

  for (const r of allRuns) {
    runs++;
    for (const id of r.ledgerUnlocks) {
      if (!cumulative.achievements[id]?.unlocked) {
        cumulative.achievements[id] = {
          unlocked: true,
          revealed: true,
          unlockDate: new Date().toISOString(),
          triggerCount: 1,
        };
      }
    }
    if (checkMasterComplete(cumulative) && !runsToFull.length) runsToFull.push(runs);
  }

  const globalRates = {};
  for (const cat of LEDGER_CATEGORIES) {
    for (const a of cat.achievements) {
      const hits = allRuns.filter(r => r.ledgerUnlocks.includes(a.id)).length;
      globalRates[a.id] = {
        title: a.title,
        category: cat.id,
        unlockPct: pct(hits, allRuns.length),
        runs: hits,
      };
    }
  }

  const byCategory = LEDGER_CATEGORIES.map(cat => ({
    id: cat.id,
    title: cat.title,
    total: cat.achievements.length,
    avgUnlocksPerRun: (
      allRuns.reduce((sum, r) => sum + r.ledgerUnlocks.filter(id =>
        cat.achievements.some(a => a.id === id)).length, 0) / allRuns.length
    ).toFixed(2),
    fullCategoryPct: pct(
      allRuns.filter(r => r.ledgerCategoriesComplete.includes(cat.id)).length,
      allRuns.length
    ),
    rarestInCategory: cat.achievements
      .map(a => ({ id: a.id, title: a.title, pct: globalRates[a.id].unlockPct }))
      .sort((a, b) => parseFloat(a.pct) - parseFloat(b.pct))
      .slice(0, 3),
  }));

  const sortedAchievements = Object.entries(globalRates)
    .sort((a, b) => parseFloat(a[1].unlockPct) - parseFloat(b[1].unlockPct));

  return {
    totalAchievements: LEDGER_TOTAL,
    avgUnlocksPerRun: (allRuns.reduce((s, r) => s + r.ledgerUnlockCount, 0) / allRuns.length).toFixed(2),
    masterCompleteSingleRunPct: pct(allRuns.filter(r => r.ledgerMasterComplete).length, allRuns.length),
    estimatedRunsToCompleteLedger: runsToFull[0] || null,
    cumulativeAfterAllRuns: countDiscovered(cumulative),
    categorySummary: byCategory,
    rarestAchievements: sortedAchievements.slice(0, 10).map(([id, v]) => ({
      id, title: v.title, category: v.category, unlockPct: v.unlockPct,
    })),
    commonAchievements: sortedAchievements.slice(-10).reverse().map(([id, v]) => ({
      id, title: v.title, category: v.category, unlockPct: v.unlockPct,
    })),
    generalAchievementRates: Object.fromEntries(
      LEDGER_CATEGORIES.find(c => c.id === 'general').achievements
        .map(a => [a.id, globalRates[a.id]])
    ),
    eventAchievementRates: Object.fromEntries(
      ['rare', 'superRare', 'godlike', 'goldenGodlike'].flatMap(catId =>
        LEDGER_CATEGORIES.find(c => c.id === catId).achievements
          .map(a => [a.id, globalRates[a.id]])
      )
    ),
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
        for (let d = 0; d < 30; d++) {
          applyDailyInterest(s);
          if (s.over) break;
        }
        t += s.debt;
      }
      return Math.round(t / 1000);
    })(),
    exploits: [
      { id: 'day1_stall', severity: 'Medium', note: 'Stall archetype triggers stall interest; debt cap ends run if debt hits ceiling' },
      { id: 'debt_stack', severity: 'Medium', note: 'Debt capped at $100k including compounded interest — game over at ceiling' },
      { id: 'gun_stack', severity: 'Low', note: `Gun cap ${CONFIG.maxGuns}; escalating purchase cost; Feds counter-hit scales per round` },
      { id: 'event_pileup', severity: 'Low', note: `Avg events per trip capped at ${CONFIG.maxTravelEvents}` },
    ],
  };
}

function main() {
  const archetypeCount = Object.keys(ARCHETYPES).length;
  console.log(`\n=== Gang Wars ${(RUNS_PER_ARCHETYPE * archetypeCount).toLocaleString()}-Run Simulation ===`);
  console.log(`${archetypeCount} archetypes (${RUNS_PER_ARCHETYPE.toLocaleString()} runs each)\n`);
  const t0 = Date.now();
  const summaries = {};
  const rawByArchetype = {};

  for (const name of Object.keys(ARCHETYPES)) {
    const meta = ARCHETYPES[name];
    process.stdout.write(`Running [${meta.group}] ${meta.label} (${RUNS_PER_ARCHETYPE})...`);
    const opts = meta;
    const results = [];
    for (let i = 0; i < RUNS_PER_ARCHETYPE; i++) {
      results.push(playGame(opts));
      if ((i + 1) % 2500 === 0) process.stdout.write(` ${i + 1}`);
    }
    summaries[name] = summarizeArchetype(name, results);
    rawByArchetype[name] = results;
    console.log(` done. Avg NW: $${summaries[name].avgEndingWealth.toLocaleString()}`);
  }

  const economy = aggregateEconomy(summaries);
  const crimeLedger = aggregateCrimeLedger(summaries, rawByArchetype);

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
    crimeLedger,
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
      difficultySpikes: ['Day 20+ extra Feds agent and +5% counter-hit', '8% daily compound debt; hard cap at $100k'],
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
  console.log(`\nWritten to ${OUT} (${report.durationSeconds}s)`);
  console.log(`\n--- Crime Ledger (${report.totalRuns.toLocaleString()} runs) ---`);
  console.log(`Avg unlocks/run: ${crimeLedger.avgUnlocksPerRun}`);
  console.log(`Master complete in single run: ${crimeLedger.masterCompleteSingleRunPct}%`);
  console.log(`Unique entries after all ${report.totalRuns} runs: ${crimeLedger.cumulativeAfterAllRuns}/${crimeLedger.totalAchievements}`);
  if (crimeLedger.estimatedRunsToCompleteLedger) {
    console.log(`First full ledger at run #${crimeLedger.estimatedRunsToCompleteLedger} (sequential sim)`);
  }
  console.log(`Rarest: ${crimeLedger.rarestAchievements.slice(0, 5).map(a => `${a.title} (${a.unlockPct}%)`).join(', ')}`);
  console.log('');
}

main();
