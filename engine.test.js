const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  CONFIG, GOOD, GOODS, HOME, LOCATIONS, RARE_EVENTS, SUPER_RARE_EVENTS, GODLIKE_EVENTS, GOLDEN_GODLIKE,
  GODLIKE_CHANCE, GOLDEN_GODLIKE_CHANCE,
  rollMarket, buy, sell, newGame, migrateSave, resolveTravelMarket,
  bankBorrow, bankRepay, bankDeposit, bankWithdraw, applyDailyInterest,
  avgCost, profitPct, applyTerritoryPrice, marketPriceBounds, netWorth, classicScore, PERFECT_SCORE_NET_WORTH,
  TERRITORY_MODIFIERS, FAM_LUXURY, getRank, RANKS, maxBorrowAmount, fightKillChance, fedsCounterHitChance,
  gunEventCost, effectiveBankInterest, checkDebtCap, tickStallPressure,
  fedsApplyFightKill, rollStashUpgrade, grantDebtInterestFreeze, bankDepositLimit,
} = require('./engine.js');

describe('rollMarket', () => {
  it('returns prices for all goods at a location', () => {
    const { prices } = rollMarket(HOME);
    assert.equal(Object.keys(prices).length, GOODS.length);
  });

  it('applies Uptown luxury bonus to diamonds', () => {
    const base = 100000;
    const d = GOOD.diamonds;
    const uptown = applyTerritoryPrice(d, 'Uptown', base);
    const home = applyTerritoryPrice(d, HOME, base);
    assert.ok(uptown > home);
    assert.equal(uptown, Math.round(base * (1 + TERRITORY_MODIFIERS.Uptown.luxuryBonus)));
  });

  it('widens roll bounds at Dock #13', () => {
    const d = GOOD.bathgin;
    const dock = marketPriceBounds(d, 'Dock #13');
    const home = marketPriceBounds(d, HOME);
    assert.ok(dock.low < home.low);
    assert.ok(dock.high > home.high);
    assert.ok(dock.high - dock.low > home.high - home.low);
    // variance widens each end by (variance - 1) / 2 of catalog spread
    const spread = d.high - d.low;
    const extra = Math.round(spread * (TERRITORY_MODIFIERS['Dock #13'].variance - 1) / 2);
    assert.equal(dock.low, Math.max(1, d.low - extra));
    assert.equal(dock.high, d.high + extra);
  });
});

describe('buy / sell', () => {
  it('tracks cost basis and profit', () => {
    const s = newGame();
    s.prices.bathgin = 100;
    s.cash = 1000;
    assert.equal(buy(s, 'bathgin', 5), null);
    assert.equal(avgCost(s, 'bathgin'), 100);
    s.prices.bathgin = 150;
    assert.equal(profitPct(s, 'bathgin', 150), 50);
    assert.equal(sell(s, 'bathgin', 2), null);
    assert.equal(s.inventory.bathgin, 3);
  });
});

describe('bank', () => {
  it('enforces borrow cap', () => {
    const s = newGame();
    assert.match(bankBorrow(s, CONFIG.maxBorrow + 1), /won't lend/);
    assert.equal(bankBorrow(s, 1000), null);
    assert.equal(s.cash, CONFIG.startCash + 1000);
  });

  it('repays debt from cash', () => {
    const s = newGame();
    s.cash = 5000;
    s.debt = 3000;
    assert.equal(bankRepay(s, 2000), null);
    assert.equal(s.cash, 3000);
    assert.equal(s.debt, 1000);
  });

  it('rejects repay over debt or cash', () => {
    const s = newGame();
    s.cash = 1000;
    s.debt = 500;
    assert.match(bankRepay(s, 600), /more than you owe/);
    assert.match(bankRepay(s, 1500), /don't have/);
  });

  it('deposits and withdraws bank balance', () => {
    const s = newGame();
    s.cash = 4000;
    assert.equal(bankDeposit(s, 1500), null);
    assert.equal(s.cash, 2500);
    assert.equal(s.bank, 1500);
    assert.equal(bankWithdraw(s, 500), null);
    assert.equal(s.cash, 3000);
    assert.equal(s.bank, 1000);
  });

  it('rejects invalid bank amounts', () => {
    const s = newGame();
    assert.match(bankDeposit(s, 0), /Enter an amount/);
    assert.match(bankWithdraw(s, 1), /more than you have/);
  });

  it('enforces total debt cap', () => {
    const s = newGame();
    s.debt = CONFIG.maxTotalDebt - 5000;
    assert.match(bankBorrow(s, 10000), /won't let you owe/);
    assert.equal(bankBorrow(s, 5000), null);
    assert.equal(s.debt, CONFIG.maxTotalDebt);
  });

  it('maxBorrowAmount respects total debt room', () => {
    const s = newGame();
    assert.equal(maxBorrowAmount(s), CONFIG.maxBorrow);
    s.debt = CONFIG.maxTotalDebt - 3000;
    assert.equal(maxBorrowAmount(s), 3000);
    s.debt = CONFIG.maxTotalDebt;
    assert.equal(maxBorrowAmount(s), 0);
  });
});

describe('fightKillChance', () => {
  it('caps kill chance at 85%', () => {
    assert.equal(fightKillChance(0), 0.45);
    assert.equal(fightKillChance(4), 0.85);
    assert.equal(fightKillChance(10), 0.85);
  });
});

describe('tickStallPressure', () => {
  it('applies interest every N actions on day 1', () => {
    const s = newGame();
    s.debt = 10000;
    for (let i = 0; i < CONFIG.day1StallActions - 1; i++) assert.equal(tickStallPressure(s), null);
    const msg = tickStallPressure(s);
    assert.match(msg, /patience ran out/);
    assert.equal(s.debt, Math.round(10000 * (1 + CONFIG.loanInterest)));
  });
});

describe('applyDailyInterest', () => {
  it('compounds debt and bank balances', () => {
    const s = newGame();
    s.debt = 10000;
    s.bank = 10000;
    assert.equal(applyDailyInterest(s), null);
    assert.equal(s.debt, Math.round(10000 * (1 + CONFIG.loanInterest)));
    assert.equal(s.bank, Math.round(10000 * 1.08));
  });

  it('skips debt compound while interest freeze is active', () => {
    const s = newGame();
    s.debt = 10000;
    grantDebtInterestFreeze(s, 1);
    assert.equal(applyDailyInterest(s), null);
    assert.equal(s.debt, 10000);
    assert.equal(s.debtInterestFreeze, 0);
    applyDailyInterest(s);
    assert.equal(s.debt, Math.round(10000 * (1 + CONFIG.loanInterest)));
  });

  it('applies conservative bank bonus when debt is low', () => {
    const s = newGame();
    s.debt = 10000;
    s.bank = 5000;
    applyDailyInterest(s);
    assert.equal(s.bank, Math.round(5000 * (1 + CONFIG.bankInterest + CONFIG.conservativeBankBonus)));
  });
});

describe('checkDebtCap', () => {
  it('ends the run when debt reaches the cap', () => {
    const s = newGame();
    s.debt = CONFIG.maxTotalDebt;
    const msg = checkDebtCap(s);
    assert.match(msg, /called in your marker/);
    assert.equal(s.over, true);
  });
});

describe('fedsCounterHitChance', () => {
  it('rises with round count and late game', () => {
    assert.ok(fedsCounterHitChance(0, 3, 10) > fedsCounterHitChance(0, 1, 10));
    assert.ok(fedsCounterHitChance(0, 2, 25) > fedsCounterHitChance(0, 2, 10));
    assert.ok(fedsCounterHitChance(2, 2, 10) < fedsCounterHitChance(0, 2, 10));
  });
});

describe('gunEventCost', () => {
  it('scales cost for additional guns', () => {
    assert.equal(gunEventCost(2000, 0), 2000);
    assert.equal(gunEventCost(2000, 1), 3000);
  });
});

describe('classicScore', () => {
  it('derives score from net worth', () => {
    const s = newGame();
    s.cash = 0;
    s.bank = 0;
    s.debt = 0;
    assert.equal(classicScore(s), 0);
    assert.equal(netWorth(s), 0);
    s.cash = Math.round(PERFECT_SCORE_NET_WORTH * 0.81);
    assert.equal(classicScore(s), 90);
    s.cash = PERFECT_SCORE_NET_WORTH;
    assert.equal(classicScore(s), 100);
  });
});

describe('fedsApplyFightKill', () => {
  it('guarantees one kill on round 1 with max guns', () => {
    const s = newGame();
    s.guns = CONFIG.maxGuns;
    assert.equal(fedsApplyFightKill(s, 3, 1), 2);
    assert.equal(fedsApplyFightKill(s, 1, 1), 0);
  });

  it('uses normal odds after round 1', () => {
    const s = newGame();
    s.guns = 1;
    const realRandom = Math.random;
    Math.random = () => 1;
    assert.equal(fedsApplyFightKill(s, 2, 2), 2);
    Math.random = realRandom;
  });
});

describe('rollStashUpgrade', () => {
  it('includes a small +5 tier', () => {
    let sawSmall = false;
    for (let i = 0; i < 200; i++) {
      if (rollStashUpgrade().add === 5) sawSmall = true;
    }
    assert.ok(sawSmall);
  });
});

describe('bankDeposit', () => {
  it('limits deposits when debt exceeds half the cap', () => {
    const s = newGame();
    s.cash = 100000;
    s.debt = 60000;
    assert.equal(bankDepositLimit(s), 25000);
    assert.match(bankDeposit(s, 50000), /deep in his debt/);
    assert.equal(bankDeposit(s, 25000), null);
    assert.equal(s.bank, 25000);
  });
});

describe('commodity ladder', () => {
  it('steps buy-in and spread from street goods to luxury', () => {
    const moon = GOOD.moonshine;
    const fur = GOOD.furcoats;
    const dia = GOOD.diamonds;
    assert.ok(moon.high <= GOOD.cigars.low);
    assert.ok(GOOD.cognac.low <= fur.low);
    assert.ok(fur.low <= dia.low);
    assert.ok(GOOD.champagne.low < dia.low);
    assert.ok(GOOD.champagne.high < dia.high);
    assert.ok((fur.high - fur.low) / fur.low >= 2);
    assert.ok((dia.high - dia.low) / dia.low >= 2);
    assert.ok(fur.low <= CONFIG.startCash * 4);
  });
});

describe('migrateSave', () => {
  it('remaps legacy item ids', () => {
    const s = migrateSave({ inventory: { spices: 3, artwork: 1 }, costBasis: { spices: 50 }, events: {} });
    assert.equal(s.inventory.cigars, 3);
    assert.equal(s.inventory.art, 1);
    assert.equal(s.costBasis.cigars, 50);
  });
});

describe('RARE_EVENTS', () => {
  it('every entry has a district and commodity', () => {
    for (const re of RARE_EVENTS) {
      assert.ok(re.district, `${re.id} missing district`);
      assert.ok(LOCATIONS.includes(re.district), `${re.id} invalid district`);
      assert.ok(re.commodity && GOOD[re.commodity], `${re.id} invalid commodity`);
      assert.ok(re.img && re.img.startsWith('events/rare_'), `${re.id} missing img`);
    }
  });
});

describe('SUPER_RARE_EVENTS', () => {
  it('every entry has a district and img', () => {
    for (const sr of SUPER_RARE_EVENTS) {
      assert.ok(sr.district, `${sr.id} missing district`);
      assert.ok(LOCATIONS.includes(sr.district), `${sr.id} invalid district`);
      assert.ok(sr.img && sr.img.startsWith('events/super_'), `${sr.id} missing img`);
    }
  });
});

describe('GODLIKE_EVENTS', () => {
  it('every entry has lines and img', () => {
    for (const gl of GODLIKE_EVENTS) {
      assert.ok(gl.lines && gl.lines.length === 2, `${gl.id} missing lines`);
      assert.ok(gl.img && gl.img.startsWith('events/godlike_'), `${gl.id} missing img`);
    }
  });
});

describe('GOLDEN_GODLIKE', () => {
  it('has img and lines', () => {
    assert.ok(GOLDEN_GODLIKE.lines && GOLDEN_GODLIKE.lines.length === 2);
    assert.ok(GOLDEN_GODLIKE.img.startsWith('events/godlike_'));
  });

  it('is five times rarer than a standard godlike roll', () => {
    assert.equal(GOLDEN_GODLIKE_CHANCE, 0.001);
    assert.equal(GODLIKE_CHANCE, 0.005);
  });
});

describe('resolveTravelMarket', () => {
  it('applies rare spike only in matching district on event day', () => {
    const re = RARE_EVENTS[0];
    const s = newGame();
    s.day = 10;
    s.events.rare = { ...re, day: 10 };
    const wrong = resolveTravelMarket(s, HOME);
    const right = resolveTravelMarket(s, re.district);
    assert.notEqual(wrong.prices[re.commodity], right.prices[re.commodity]);
    assert.ok(right.prices[re.commodity] >= GOOD[re.commodity].low * 3);
  });

  it('applies godlike x10 only in matching district', () => {
    const rand = Math.random;
    Math.random = () => 0.55;
    try {
      const s = newGame();
      s.day = 12;
      s.events.godlike = { lines: ['A', 'B'], day: 12, district: 'Uptown' };
      const withEvent = resolveTravelMarket(s, 'Uptown');
      delete s.events.godlike;
      Math.random = () => 0.55;
      const without = resolveTravelMarket(s, 'Uptown');
      const id = GOODS.find(d => withEvent.prices[d.id] && without.prices[d.id])?.id;
      assert.ok(id);
      assert.equal(withEvent.prices[id], Math.round(without.prices[id] * 10));
    } finally {
      Math.random = rand;
    }
  });

  it('applies golden godlike x10 in every district on event day', () => {
    const rand = Math.random;
    Math.random = () => 0.55;
    try {
      const s = newGame();
      s.day = 9;
      s.events.goldenGodlike = { ...GOLDEN_GODLIKE, day: 9 };
      const home = resolveTravelMarket(s, HOME);
      delete s.events.goldenGodlike;
      Math.random = () => 0.55;
      const baselineHome = resolveTravelMarket(s, HOME);
      const id = GOODS.find(d => home.prices[d.id] && baselineHome.prices[d.id])?.id;
      assert.ok(id);
      assert.equal(home.prices[id], Math.round(baselineHome.prices[id] * 10));
    } finally {
      Math.random = rand;
    }
  });

  it('applies super rare x3 in matching district', () => {
    const sr = SUPER_RARE_EVENTS[0];
    const rand = Math.random;
    Math.random = () => 0.42;
    try {
      const s = newGame();
      s.day = 8;
      s.events.superRare = { ...sr, day: 8 };
      const withEvent = resolveTravelMarket(s, sr.district);
      delete s.events.superRare;
      const without = resolveTravelMarket(s, sr.district);
      const id = GOODS.find(d => withEvent.prices[d.id] && without.prices[d.id])?.id;
      assert.ok(id);
      assert.equal(withEvent.prices[id], Math.round(without.prices[id] * 3));
    } finally {
      Math.random = rand;
    }
  });
});

describe('newGame', () => {
  it('starts at home with rolled prices', () => {
    const s = newGame();
    assert.equal(s.location, HOME);
    assert.equal(s.day, 1);
    assert.ok(Object.values(s.prices).some(p => p != null));
  });
});

describe('getRank', () => {
  it('has 11 ranks matching the table', () => {
    assert.equal(RANKS.length, 11);
  });

  it('returns Nobody at 0', () => assert.equal(getRank(0), 'Nobody'));
  it('returns Pickpocket at 10', () => assert.equal(getRank(10), 'Pickpocket'));
  it('returns Wise Guy at 60', () => assert.equal(getRank(60), 'Wise Guy'));
  it('returns Wise Guy at 67', () => assert.equal(getRank(67), 'Wise Guy'));
  it('returns Crew Boss at 70', () => assert.equal(getRank(70), 'Crew Boss'));
  it('returns Crew Boss at 74', () => assert.equal(getRank(74), 'Crew Boss'));
  it('returns Godfather at 90', () => assert.equal(getRank(90), 'Godfather'));
  it('returns Godfather at 92', () => assert.equal(getRank(92), 'Godfather'));
  it('returns Big Daddy J at 100', () => assert.equal(getRank(100), 'Big Daddy J'));
  it('returns Big Daddy J for scores above 100', () => assert.equal(getRank(150), 'Big Daddy J'));
  it('returns Nobody for negative scores', () => assert.equal(getRank(-5), 'Nobody'));
});
