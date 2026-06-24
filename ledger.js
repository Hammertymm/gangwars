/* ============================================================================
   CRIME LEDGER — account-wide achievement collection. No DOM (testable).
   ============================================================================ */

const LEDGER_CATEGORIES = [
  {
    id: 'general',
    title: 'GENERAL',
    completeTitle: 'GENERAL COLLECTION COMPLETE',
    achievements: [
      { id: 'made_man',             title: 'PROHIBITION ACCOMPLISHED',     description: 'Complete a full run.' },
      { id: 'bootlegger',           title: 'GIN AND BEER IT',              description: 'Move 100 units of moonshine.' },
      { id: 'smoke_merchant',       title: 'STOGIE NIGHTS',                description: 'Move 100 units of cigars.' },
      { id: 'dough_capone',         title: 'DOUGH CAPONE',                 description: 'Hold $10M in cash.' },
      { id: 'girls_best_fiend',     title: 'GIRLS\' BEST FIEND',           description: 'Earn $1M profit on diamonds.' },
      { id: 'empire_builder',       title: 'STASH GORDON',                 description: 'Grow stash to 150 units.' },
      { id: 'pier_pressure',        title: 'PIER PRESSURE',                description: 'Visit Dock #13 thirteen times.' },
      { id: 'market_maven',         title: 'BUY CURIOUS',                  description: 'Buy and sell every commodity at least 3 times.' },
      { id: 'loan_survivor',        title: 'LOAN SURVIVOR',                description: 'Finish a run after borrowing at least once, with debt paid off.' },
      { id: 'club_fed',             title: 'CLUB FED',                     description: 'Win 10 Fed fights in one run.' },
      { id: 'buy_hard',             title: 'BUY HARD',                     description: 'Spend $25M buying goods in one run.' },
      { id: 'buy_hard_2',           title: 'BUY HARD 2',                   description: 'Spend $50M buying goods in one run.' },
      { id: 'one_hp_wonder',        title: 'ONE HP WONDER',                description: 'Finish a full run with exactly 1 health remaining.' },
      { id: 'ups_and_downs',        title: 'UPS AND DOWNS',                description: 'Buy during a flood, then sell the same commodity during a spike or surge in the same run.' },
      { id: 'artful_dodger',        title: 'ARTFUL DODGER',                description: 'Earn $10M profit from Forged Art in one run.' },
      { id: 'cognac_barbarian',     title: 'COGNAC THE BARBARIAN',         description: 'Earn $20M profit from Fine Cognac in one run.' },
      { id: 'witness_reinvestment', title: 'WITNESS REINVESTMENT PROGRAM', description: 'Deposit $25M into the bank across all runs.' },
      { id: 'scotch_and_awe',       title: 'SCOTCH AND AWE',               description: 'Earn $15M profit from Aged Scotch in one run.' },
      { id: 'silence_of_loans',     title: 'THE SILENCE OF THE LOANS',     description: 'Survive all 30 days after climbing over $90K in debt.' },
      { id: 'shopaholic',           title: 'SHOPAHOLIC',                   description: 'Buy 1,000 total units across all runs.' },
    ],
  },
  {
    id: 'rare',
    title: 'RARE',
    completeTitle: 'RARE COLLECTION COMPLETE',
    achievements: [
      { id: 'luciano', title: 'THE MEETING', description: 'Lucky Luciano gathers the families.' },
      { id: 'rumrow', title: 'THE FLEET', description: 'The silent fleet returns to harbor.' },
      { id: 'midnight', title: 'THE DELIVERY', description: 'A midnight run reaches the city.' },
      { id: 'ellington', title: 'THE LOUNGE', description: 'Duke Ellington headlines tonight.' },
      { id: 'armstrong', title: 'THE JAZZ', description: 'Louis Armstrong plays the district.' },
      { id: 'schultz', title: 'THE INTEL', description: 'Dutch Schultz eyes new territory.' },
      { id: 'lansky', title: 'THE SHADOW', description: 'Meyer Lansky enters the picture.' },
      { id: 'capone', title: 'THE BOSS', description: 'Al Capone is seen meeting associates.' },
      { id: 'rothstein', title: 'THE FIX', description: 'Arnold Rothstein takes an interest.' },
      { id: 'madden', title: 'THE ACCOUNTANT', description: 'Owney Madden backs another big night.' },
    ],
  },
  {
    id: 'superRare',
    title: 'SUPER RARE',
    completeTitle: 'SUPER RARE COLLECTION COMPLETE',
    achievements: [
      { id: 'lindbergh', title: 'THE AVIATOR', description: 'Lindbergh arrives to great fanfare.' },
      { id: 'mauretania', title: 'THE LINER', description: 'Mauretania docks to huge crowds.' },
      { id: 'ziegfeld', title: 'THE MARQUEE', description: 'Ziegfeld fever sweeps the city.' },
      { id: 'hollywood', title: 'THE TALKIES', description: 'Moving pictures are all the rage.' },
      { id: 'wales', title: 'THE GENTLEMAN', description: 'The Prince of Wales is in town.' },
      { id: 'wallst', title: 'THE MARKET', description: 'Stock market fortunes grow again.' },
      { id: 'ruth', title: 'THE SLUGGER', description: 'Babe Ruth fever sweeps the city.' },
      { id: 'walker', title: 'THE MAYOR', description: 'Mayor Walker visits the district.' },
      { id: 'feast', title: 'THE FEAST', description: 'Little Italy floods the streets.' },
      { id: 'chairman', title: 'THE CHAIRMAN', description: 'A young boss takes the head table.' },
      { id: 'garage', title: 'THE GARAGE', description: 'Something ugly in the warehouse garage.' },
      { id: 'picket_line', title: 'THE PICKET LINE', description: 'The Warehouse stops moving.' },
    ],
  },
  {
    id: 'godlike',
    title: 'GODLIKE',
    completeTitle: 'BIG DADDY J KNOWS YOUR NAME',
    achievements: [
      { id: 'in_town', title: 'THE ARRIVAL', description: 'Big Daddy J is in town.' },
      { id: 'interest', title: 'THE MASTERMIND', description: 'Big Daddy J takes an interest.' },
      { id: 'move', title: 'THE STRATEGIST', description: 'Big Daddy J makes a move.' },
      { id: 'celebration', title: 'THE TOAST', description: 'Big Daddy J throws a celebration.' },
      { id: 'history', title: 'THE LEGEND', description: 'Big Daddy J makes history.' },
    ],
  },
  {
    id: 'goldenGodlike',
    title: 'GOLDEN GODLIKE',
    completeTitle: 'TOUCHED BY GOLD',
    achievements: [
      { id: 'golden', title: 'GOLDEN SHOWER', description: 'Everybody gets drenched in gold.' },
    ],
  },
];

const ACHIEVEMENT_BY_ID = Object.fromEntries(
  LEDGER_CATEGORIES.flatMap(cat => cat.achievements.map(a => [a.id, { ...a, categoryId: cat.id }]))
);

const LEDGER_TOTAL = LEDGER_CATEGORIES.reduce((n, c) => n + c.achievements.length, 0);

const EVENT_ACHIEVEMENT_IDS = LEDGER_CATEGORIES
  .filter(cat => cat.id !== 'general')
  .flatMap(cat => cat.achievements.map(a => a.id));

const EVENT_PITY_BASE_RARE = 0.10;
const EVENT_PITY_COMPOUND = 1.04;
const EVENT_PITY_TRAVELS_PER_STEP = 1;
const EVENT_PITY_RARE_CAP = 0.40;
const EVENT_PITY_SUPER_CAP = 0.16;
const EVENT_PITY_GOLDEN_CAP = 0.01;
// Golden Godlike rolls first, so this conditional cap yields an effective 4% Godlike cap.
const EVENT_PITY_GODLIKE_CAP = 0.04 / (1 - EVENT_PITY_GOLDEN_CAP);

function engineApi(){
  if (typeof netWorth === 'function' && typeof GOODS !== 'undefined' && typeof CONFIG !== 'undefined') {
    return { netWorth, GOODS, CONFIG };
  }
  return require('./engine.js');
}

const CATEGORY_COMPLETE_KEYS = {
  general: 'generalComplete',
  rare: 'rareComplete',
  superRare: 'superRareComplete',
  godlike: 'godlikeComplete',
  goldenGodlike: 'goldenGodlikeComplete',
};

function defaultRunStats(startSpace){
  return {
    districtsVisited: {},
    dockVisits: 0,
    moonshineSold: 0,
    cigarsSold: 0,
    buys: {},
    sells: {},
    commoditiesTouched: {},
    didBorrow: false,
    diamondSellProfit: 0,
    maxSpace: startSpace,
    spentBuying: 0,
    fedFightsWon: 0,
    commodityProfit: {},
    boughtDuringFlood: {},
    upsAndDowns: false,
    maxDebtReached: 0,
    leftHome: false,
  };
}

function migrateRunStats(state){
  if (!state.runStats || typeof state.runStats !== 'object') {
    state.runStats = defaultRunStats(state.space || 100);
  }
  const rs = state.runStats;
  if (!rs.districtsVisited) rs.districtsVisited = {};
  if (!rs.buys) rs.buys = {};
  if (!rs.sells) rs.sells = {};
  if (!rs.commoditiesTouched) rs.commoditiesTouched = {};
  if (rs.dockVisits == null) rs.dockVisits = 0;
  if (rs.moonshineSold == null) rs.moonshineSold = 0;
  if (rs.cigarsSold == null) rs.cigarsSold = 0;
  if (rs.didBorrow == null) rs.didBorrow = false;
  if (rs.diamondSellProfit == null) rs.diamondSellProfit = 0;
  if (rs.maxSpace == null) rs.maxSpace = state.space || 100;
  if (rs.spentBuying == null) rs.spentBuying = 0;
  if (rs.fedFightsWon == null) rs.fedFightsWon = 0;
  if (!rs.commodityProfit) rs.commodityProfit = {};
  if (!rs.boughtDuringFlood) rs.boughtDuringFlood = {};
  if (rs.upsAndDowns == null) rs.upsAndDowns = false;
  if (rs.maxDebtReached == null) rs.maxDebtReached = 0;
  if (rs.leftHome == null) rs.leftHome = false;
  return state;
}

function emptyLedger(){
  return {
    achievements: {},
    categoryComplete: {},
    masterComplete: false,
    masterCompleteShown: false,
    travelsSinceEventUnlock: 0,
    bankDepositedTotal: 0,
    unitsBoughtTotal: 0,
  };
}

function migrateLedger(raw){
  if (!raw || typeof raw !== 'object') return emptyLedger();
  const ledger = emptyLedger();
  ledger.achievements = raw.achievements && typeof raw.achievements === 'object' ? { ...raw.achievements } : {};
  ledger.categoryComplete = raw.categoryComplete && typeof raw.categoryComplete === 'object'
    ? { ...raw.categoryComplete } : {};
  ledger.masterComplete = !!raw.masterComplete;
  ledger.masterCompleteShown = !!raw.masterCompleteShown;
  ledger.travelsSinceEventUnlock = raw.travelsSinceEventUnlock || 0;
  ledger.bankDepositedTotal = raw.bankDepositedTotal || 0;
  ledger.unitsBoughtTotal = raw.unitsBoughtTotal || 0;
  return ledger;
}

function getAchievementRecord(ledger, id){
  return ledger.achievements[id] || null;
}

function isUnlocked(ledger, id){
  return !!getAchievementRecord(ledger, id)?.unlocked;
}

function isRevealed(ledger, id){
  const rec = getAchievementRecord(ledger, id);
  return !!(rec && rec.unlocked && rec.revealed);
}

function unlockAchievement(ledger, id){
  if (!ACHIEVEMENT_BY_ID[id]) return null;
  if (isUnlocked(ledger, id)) {
    const rec = ledger.achievements[id];
    rec.triggerCount = (rec.triggerCount || 1) + 1;
    return null;
  }
  ledger.achievements[id] = {
    unlocked: true,
    revealed: false,
    unlockDate: new Date().toISOString(),
    triggerCount: 1,
  };
  return id;
}

function revealAchievement(ledger, id){
  const rec = getAchievementRecord(ledger, id);
  if (!rec || !rec.unlocked) return false;
  rec.revealed = true;
  return true;
}

function countUnlocked(ledger, categoryId){
  const cat = LEDGER_CATEGORIES.find(c => c.id === categoryId);
  if (!cat) return 0;
  return cat.achievements.filter(a => isUnlocked(ledger, a.id)).length;
}

function countRevealed(ledger){
  return Object.keys(ACHIEVEMENT_BY_ID).filter(id => isRevealed(ledger, id)).length;
}

function countDiscovered(ledger){
  return Object.keys(ACHIEVEMENT_BY_ID).filter(id => isUnlocked(ledger, id)).length;
}

function isCategoryComplete(ledger, categoryId){
  const cat = LEDGER_CATEGORIES.find(c => c.id === categoryId);
  if (!cat) return false;
  return cat.achievements.every(a => isUnlocked(ledger, a.id));
}

function checkMasterComplete(ledger){
  return Object.keys(ACHIEVEMENT_BY_ID).every(id => isUnlocked(ledger, id));
}

function categoryCompleteKey(categoryId){
  return CATEGORY_COMPLETE_KEYS[categoryId] || `${categoryId}Complete`;
}

function markCategoryCompleteShown(ledger, categoryId){
  ledger.categoryComplete[categoryCompleteKey(categoryId)] = true;
}

function wasCategoryCompleteShown(ledger, categoryId){
  return !!ledger.categoryComplete[categoryCompleteKey(categoryId)];
}

function pendingCategoryCompletions(ledger){
  return LEDGER_CATEGORIES
    .filter(cat => isCategoryComplete(ledger, cat.id) && !wasCategoryCompleteShown(ledger, cat.id))
    .map(cat => cat.id);
}

function recordDistrictVisit(state, location){
  migrateRunStats(state);
  state.runStats.districtsVisited[location] = true;
  if (location === 'Dock #13') state.runStats.dockVisits += 1;
}

function recordBuy(state, id, qty, cost){
  migrateRunStats(state);
  const rs = state.runStats;
  rs.buys[id] = (rs.buys[id] || 0) + qty;
  rs.commoditiesTouched[id] = true;
  rs.spentBuying += Math.max(0, cost || 0);
  // UPS and DOWNS — remember anything bought while its market was flooded.
  if (state.anomaly && state.anomaly.type === 'flood' && state.anomaly.itemId === id) {
    rs.boughtDuringFlood[id] = true;
  }
}

function recordSell(state, id, qty, profit){
  migrateRunStats(state);
  const rs = state.runStats;
  rs.sells[id] = (rs.sells[id] || 0) + qty;
  rs.commoditiesTouched[id] = true;
  if (id === 'moonshine') rs.moonshineSold += qty;
  if (id === 'cigars') rs.cigarsSold += qty;
  if (profit > 0) {
    rs.commodityProfit[id] = (rs.commodityProfit[id] || 0) + profit;
    if (id === 'diamonds') rs.diamondSellProfit += profit;
  }
  // UPS and DOWNS — sold during a spike/surge what was bought during a flood.
  if (state.anomaly && (state.anomaly.type === 'spike' || state.anomaly.type === 'surge')
      && state.anomaly.itemId === id && rs.boughtDuringFlood[id]) {
    rs.upsAndDowns = true;
  }
}

function recordFedFightWin(state){
  migrateRunStats(state);
  state.runStats.fedFightsWon += 1;
}

function recordBorrow(state){
  migrateRunStats(state);
  state.runStats.didBorrow = true;
}

/* Cross-run cumulative counters live on the ledger (account-wide). */
function recordBankDeposit(ledger, amount){
  ledger.bankDepositedTotal = (ledger.bankDepositedTotal || 0) + Math.max(0, amount || 0);
}

function recordUnitsBought(ledger, qty){
  ledger.unitsBoughtTotal = (ledger.unitsBoughtTotal || 0) + Math.max(0, qty || 0);
}

function recordSpaceChange(state){
  migrateRunStats(state);
  if (state.space > state.runStats.maxSpace) state.runStats.maxSpace = state.space;
}

// In-run GENERAL achievements — checked after every market/bank/travel action.
function checkGeneralAchievements(state, ledger){
  const { GOODS } = engineApi();
  const unlocks = [];
  const rs = state.runStats;
  rs.maxDebtReached = Math.max(rs.maxDebtReached || 0, state.debt || 0);
  const maybe = id => {
    const u = unlockAchievement(ledger, id);
    if (u) unlocks.push(u);
  };

  // Single-run thresholds.
  if (state.cash >= 10000000) maybe('dough_capone');
  if ((rs.commodityProfit.diamonds || 0) >= 1000000) maybe('girls_best_fiend');
  if (state.space >= 150) maybe('empire_builder');
  if (rs.dockVisits >= 13) maybe('pier_pressure');
  if (rs.moonshineSold >= 100) maybe('bootlegger');
  if (rs.cigarsSold >= 100) maybe('smoke_merchant');
  if (rs.fedFightsWon >= 10) maybe('club_fed');
  if (rs.spentBuying >= 25000000) maybe('buy_hard');
  if (rs.spentBuying >= 50000000) maybe('buy_hard_2');
  if ((rs.commodityProfit.art || 0) >= 10000000) maybe('artful_dodger');
  if ((rs.commodityProfit.cognac || 0) >= 20000000) maybe('cognac_barbarian');
  if ((rs.commodityProfit.scotch || 0) >= 15000000) maybe('scotch_and_awe');
  if (rs.upsAndDowns) maybe('ups_and_downs');

  const mavenOk = GOODS.every(d =>
    (rs.buys[d.id] || 0) >= 3 && (rs.sells[d.id] || 0) >= 3
  );
  if (mavenOk) maybe('market_maven');

  // Account-wide cumulative thresholds.
  if ((ledger.bankDepositedTotal || 0) >= 25000000) maybe('witness_reinvestment');
  if ((ledger.unitsBoughtTotal || 0) >= 1000) maybe('shopaholic');

  return unlocks;
}

// End-of-run GENERAL achievements — checked once when a run is over.
function checkEndRunAchievements(state, ledger){
  const unlocks = [];
  const rs = state.runStats;
  const maybe = id => {
    const u = unlockAchievement(ledger, id);
    if (u) unlocks.push(u);
  };

  maybe('made_man');                                         // complete a full run
  if (rs.didBorrow && state.debt === 0) maybe('loan_survivor');
  if (state.health === 1) maybe('one_hp_wonder');
  if (state.day > engineApi().CONFIG.days && (rs.maxDebtReached || 0) > 90000) maybe('silence_of_loans');

  return unlocks;
}

function unlockEventAchievement(ledger, eventId){
  const u = unlockAchievement(ledger, eventId);
  return u ? [u] : [];
}

function getCategoryForAchievement(id){
  return ACHIEVEMENT_BY_ID[id]?.categoryId || null;
}

function getAchievementTitle(id){
  return ACHIEVEMENT_BY_ID[id]?.title || id.toUpperCase();
}

function getAchievementDescription(id){
  return ACHIEVEMENT_BY_ID[id]?.description || '';
}

function isEventAchievementId(id){
  return EVENT_ACHIEVEMENT_IDS.includes(id);
}

function countEventAchievementsUnlocked(ledger){
  return EVENT_ACHIEVEMENT_IDS.filter(id => isUnlocked(ledger, id)).length;
}

function isEventLedgerSlow(ledger){
  return countEventAchievementsUnlocked(ledger) < EVENT_ACHIEVEMENT_IDS.length / 2;
}

function eventRollChances(ledger){
  const engine = engineApi();
  const base = {
    rare: engine.RARE_EVENT_CHANCE ?? EVENT_PITY_BASE_RARE,
    superRare: engine.SUPER_RARE_EVENT_CHANCE ?? 0.05,
    godlike: engine.GODLIKE_CHANCE ?? (0.02 / (1 - 0.01)),
    golden: engine.GOLDEN_GODLIKE_CHANCE ?? 0.01,
  };
  if (!ledger || !isEventLedgerSlow(ledger)) return base;
  const steps = Math.floor((ledger.travelsSinceEventUnlock || 0) / EVENT_PITY_TRAVELS_PER_STEP);
  const mult = Math.pow(EVENT_PITY_COMPOUND, steps);
  return {
    rare: Math.min(EVENT_PITY_RARE_CAP, base.rare * mult),
    superRare: Math.min(EVENT_PITY_SUPER_CAP, base.superRare * mult),
    godlike: Math.min(EVENT_PITY_GODLIKE_CAP, base.godlike * mult),
    golden: Math.min(EVENT_PITY_GOLDEN_CAP, base.golden * mult),
  };
}

function recordEventPityTravel(ledger){
  if (!ledger || !isEventLedgerSlow(ledger)) return;
  ledger.travelsSinceEventUnlock = (ledger.travelsSinceEventUnlock || 0) + 1;
}

function resetEventPity(ledger){
  if (!ledger) return;
  ledger.travelsSinceEventUnlock = 0;
}

if (typeof module !== 'undefined') {
  module.exports = {
    LEDGER_CATEGORIES,
    ACHIEVEMENT_BY_ID,
    LEDGER_TOTAL,
    EVENT_ACHIEVEMENT_IDS,
    emptyLedger,
    migrateLedger,
    migrateRunStats,
    defaultRunStats,
    unlockAchievement,
    revealAchievement,
    isUnlocked,
    isRevealed,
    countUnlocked,
    countRevealed,
    countDiscovered,
    isCategoryComplete,
    checkMasterComplete,
    markCategoryCompleteShown,
    wasCategoryCompleteShown,
    pendingCategoryCompletions,
    recordDistrictVisit,
    recordBuy,
    recordSell,
    recordFedFightWin,
    recordBorrow,
    recordBankDeposit,
    recordUnitsBought,
    recordSpaceChange,
    checkGeneralAchievements,
    checkEndRunAchievements,
    unlockEventAchievement,
    getCategoryForAchievement,
    getAchievementTitle,
    getAchievementDescription,
    categoryCompleteKey,
    isEventAchievementId,
    isEventLedgerSlow,
    eventRollChances,
    recordEventPityTravel,
    resetEventPity,
    countEventAchievementsUnlocked,
  };
}
