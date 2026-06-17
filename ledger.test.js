const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
require('./engine.js');
const {
  LEDGER_CATEGORIES,
  LEDGER_TOTAL,
  emptyLedger,
  migrateLedger,
  unlockAchievement,
  revealAchievement,
  isUnlocked,
  isRevealed,
  countDiscovered,
  isCategoryComplete,
  checkMasterComplete,
  markCategoryCompleteShown,
  wasCategoryCompleteShown,
  checkGeneralAchievements,
  checkEndRunAchievements,
  unlockEventAchievement,
  getCategoryForAchievement,
  getAchievementTitle,
  getAchievementDescription,
  defaultRunStats,
  recordBuy,
  recordSell,
  recordDistrictVisit,
  isEventLedgerSlow,
  eventRollChances,
  recordEventPityTravel,
  resetEventPity,
  countEventAchievementsUnlocked,
  EVENT_ACHIEVEMENT_IDS,
} = require('./ledger.js');
const { newGame, CONFIG, DRUGS, netWorth } = require('./engine.js');

describe('ledger definitions', () => {
  it('has exactly 40 achievements across 5 categories', () => {
    assert.equal(LEDGER_TOTAL, 40);
    assert.equal(LEDGER_CATEGORIES.length, 5);
    assert.equal(LEDGER_CATEGORIES[0].achievements.length, 14);
    assert.equal(LEDGER_CATEGORIES[1].achievements.length, 10);
    assert.equal(LEDGER_CATEGORIES[2].achievements.length, 10);
    assert.equal(LEDGER_CATEGORIES[3].achievements.length, 5);
    assert.equal(LEDGER_CATEGORIES[4].achievements.length, 1);
    assert.equal(LEDGER_CATEGORIES[4].achievements[0].title, 'GOLDEN SHOWER');
  });

  it('every achievement has title and description copy', () => {
    LEDGER_CATEGORIES.forEach(cat => {
      cat.achievements.forEach(a => {
        assert.ok(a.title && a.title.length > 0, `${a.id} missing title`);
        assert.ok(a.description && a.description.length > 0, `${a.id} missing description`);
        assert.equal(getAchievementTitle(a.id), a.title);
        assert.equal(getAchievementDescription(a.id), a.description);
      });
    });
  });

  it('assigns every achievement to exactly one category', () => {
    const ids = new Set();
    const totals = { general: 14, rare: 10, superRare: 10, godlike: 5, goldenGodlike: 1 };
    LEDGER_CATEGORIES.forEach(cat => {
      assert.equal(cat.achievements.length, totals[cat.id]);
      cat.achievements.forEach(a => {
        assert.ok(!ids.has(a.id), `duplicate achievement id: ${a.id}`);
        ids.add(a.id);
        assert.equal(getCategoryForAchievement(a.id), cat.id);
      });
    });
    assert.equal(ids.size, 40);
  });
});

describe('ledger persistence shape', () => {
  it('stores unlock metadata', () => {
    const ledger = emptyLedger();
    const id = unlockAchievement(ledger, 'capone');
    assert.equal(id, 'capone');
    assert.ok(isUnlocked(ledger, 'capone'));
    assert.equal(isRevealed(ledger, 'capone'), false);
    assert.ok(ledger.achievements.capone.unlockDate);
    assert.equal(ledger.achievements.capone.triggerCount, 1);
    unlockAchievement(ledger, 'capone');
    assert.equal(ledger.achievements.capone.triggerCount, 2);
  });

  it('migrates empty or partial saves', () => {
    const ledger = migrateLedger(null);
    assert.deepEqual(ledger.achievements, {});
    assert.equal(ledger.masterComplete, false);
  });
});

describe('unlock flows', () => {
  it('maps event ids to rare category', () => {
    const ledger = emptyLedger();
    unlockEventAchievement(ledger, 'luciano');
    assert.equal(getCategoryForAchievement('luciano'), 'rare');
    assert.equal(getAchievementTitle('golden'), 'GOLDEN SHOWER');
  });

  it('tracks category and master completion', () => {
    const ledger = emptyLedger();
    LEDGER_CATEGORIES.find(c => c.id === 'goldenGodlike').achievements.forEach(a => {
      unlockAchievement(ledger, a.id);
    });
    assert.ok(isCategoryComplete(ledger, 'goldenGodlike'));
    markCategoryCompleteShown(ledger, 'goldenGodlike');
    assert.ok(wasCategoryCompleteShown(ledger, 'goldenGodlike'));
  });
});

describe('general achievement checks', () => {
  it('unlocks first million from net worth', () => {
    const ledger = emptyLedger();
    const s = newGame();
    s.cash = 1000000;
    s.debt = 0;
    const ids = checkGeneralAchievements(s, ledger);
    assert.ok(ids.includes('first_million'));
    assert.ok(isUnlocked(ledger, 'first_million'));
  });

  it('unlocks bootlegger after selling moonshine', () => {
    const ledger = emptyLedger();
    const s = newGame();
    recordSell(s, 'moonshine', 100, 0);
    const ids = checkGeneralAchievements(s, ledger);
    assert.ok(ids.includes('bootlegger'));
  });

  it('unlocks connected after visiting all districts', () => {
    const ledger = emptyLedger();
    const s = newGame();
    DRUGS.forEach(() => {});
    ['Little Italy', 'Dock #13', 'Kitty Kat Club', 'Uptown', 'Warehouse District', 'City Hall']
      .forEach(loc => recordDistrictVisit(s, loc));
    const ids = checkGeneralAchievements(s, ledger);
    assert.ok(ids.includes('connected'));
  });
});

describe('end run achievements', () => {
  it('unlocks made man and smooth operator on a clean full run', () => {
    const ledger = emptyLedger();
    const s = newGame();
    s.over = true;
    s.day = 31;
    s.cash = 500000;
    const ids = checkEndRunAchievements(s, ledger);
    assert.ok(ids.includes('made_man'));
    assert.ok(ids.includes('smooth_operator'));
  });

  it('denies smooth operator after borrowing even on a full run', () => {
    const ledger = emptyLedger();
    const s = newGame();
    s.over = true;
    s.day = 31;
    s.cash = 500000;
    s.runStats.didBorrow = true;
    const ids = checkEndRunAchievements(s, ledger);
    assert.ok(!ids.includes('smooth_operator'));
  });

  it('unlocks debt survivor when debt cleared', () => {
    const ledger = emptyLedger();
    const s = newGame();
    s.over = true;
    s.debt = 0;
    s.day = 31;
    const ids = checkEndRunAchievements(s, ledger);
    assert.ok(ids.includes('debt_survivor'));
  });
});

describe('balance thresholds', () => {
  it('unlocks high roller at $2.5M cash', () => {
    const ledger = emptyLedger();
    const s = newGame();
    s.cash = 2500000;
    const ids = checkGeneralAchievements(s, ledger);
    assert.ok(ids.includes('high_roller'));
    s.cash = 2499999;
    const ledger2 = emptyLedger();
    assert.ok(!checkGeneralAchievements(s, ledger2).includes('high_roller'));
  });

  it('unlocks empire builder at 150 stash', () => {
    const ledger = emptyLedger();
    const s = newGame();
    s.space = 150;
    const ids = checkGeneralAchievements(s, ledger);
    assert.ok(ids.includes('empire_builder'));
  });

  it('unlocks market maven at 3 buys and 3 sells per commodity', () => {
    const ledger = emptyLedger();
    const s = newGame();
    DRUGS.forEach(d => {
      recordBuy(s, d.id, 3);
      recordSell(s, d.id, 3, 0);
    });
    const ids = checkGeneralAchievements(s, ledger);
    assert.ok(ids.includes('market_maven'));
    const ledger2 = emptyLedger();
    const s2 = newGame();
    DRUGS.forEach(d => {
      recordBuy(s2, d.id, 3);
      recordSell(s2, d.id, 2, 0);
    });
    assert.ok(!checkGeneralAchievements(s2, ledger2).includes('market_maven'));
  });
});

describe('event pity', () => {
  it('is slow when fewer than half of event achievements are unlocked', () => {
    const ledger = emptyLedger();
    assert.ok(isEventLedgerSlow(ledger));
    EVENT_ACHIEVEMENT_IDS.slice(0, 13).forEach(id => unlockAchievement(ledger, id));
    assert.ok(!isEventLedgerSlow(ledger));
  });

  it('compounds rare chance by 4% every travel when slow', () => {
    const ledger = emptyLedger();
    assert.equal(eventRollChances(ledger).rare, 0.045);
    ledger.travelsSinceEventUnlock = 1;
    assert.equal(eventRollChances(ledger).rare, 0.045 * 1.04);
    ledger.travelsSinceEventUnlock = 2;
    assert.ok(Math.abs(eventRollChances(ledger).rare - 0.045 * Math.pow(1.04, 2)) < 1e-10);
  });

  it('returns base rates when event ledger is not slow', () => {
    const ledger = emptyLedger();
    EVENT_ACHIEVEMENT_IDS.slice(0, 13).forEach(id => unlockAchievement(ledger, id));
    ledger.travelsSinceEventUnlock = 20;
    assert.equal(eventRollChances(ledger).rare, 0.045);
  });

  it('caps compounded rates', () => {
    const ledger = emptyLedger();
    ledger.travelsSinceEventUnlock = 200;
    const c = eventRollChances(ledger);
    assert.equal(c.rare, 0.20);
    assert.equal(c.superRare, 0.08);
    assert.equal(c.godlike, 0.02);
    assert.equal(c.golden, 0.004);
  });

  it('tracks and resets pity travels', () => {
    const ledger = emptyLedger();
    recordEventPityTravel(ledger);
    recordEventPityTravel(ledger);
    assert.equal(ledger.travelsSinceEventUnlock, 2);
    resetEventPity(ledger);
    assert.equal(ledger.travelsSinceEventUnlock, 0);
    assert.equal(countEventAchievementsUnlocked(ledger), 0);
  });
});

describe('master completion', () => {
  it('requires all 40 entries', () => {
    const ledger = emptyLedger();
    assert.equal(checkMasterComplete(ledger), false);
    LEDGER_CATEGORIES.flatMap(c => c.achievements).forEach(a => unlockAchievement(ledger, a.id));
    assert.equal(checkMasterComplete(ledger), true);
  });
});
