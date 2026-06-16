/* ============================================================================
   CRIME LEDGER — account-wide achievement collection. No DOM (testable).
   ============================================================================ */

const LEDGER_CATEGORIES = [
  {
    id: 'general',
    title: 'GENERAL',
    completeTitle: 'GENERAL COLLECTION COMPLETE',
    achievements: [
      { id: 'made_man', title: 'MADE MAN' },
      { id: 'debt_survivor', title: 'DEBT SURVIVOR' },
      { id: 'first_million', title: 'FIRST MILLION' },
      { id: 'connected', title: 'CONNECTED' },
      { id: 'bootlegger', title: 'BOOTLEGGER' },
      { id: 'smoke_merchant', title: 'SMOKE MERCHANT' },
      { id: 'the_collector', title: 'THE COLLECTOR' },
      { id: 'high_roller', title: 'HIGH ROLLER' },
      { id: 'diamond_hands', title: 'DIAMOND HANDS' },
      { id: 'empire_builder', title: 'EMPIRE BUILDER' },
      { id: 'king_of_docks', title: 'KING OF THE DOCKS' },
      { id: 'smooth_operator', title: 'SMOOTH OPERATOR' },
      { id: 'market_maven', title: 'MARKET MAVEN' },
      { id: 'survivor', title: 'SURVIVOR' },
    ],
  },
  {
    id: 'rare',
    title: 'RARE',
    completeTitle: 'RARE COLLECTION COMPLETE',
    achievements: [
      { id: 'luciano', title: 'LUCKY LUCIANO CALLS A MEETING' },
      { id: 'rumrow', title: 'THE SILENT FLEET RETURNS TO HARBOR' },
      { id: 'midnight', title: 'THE MIDNIGHT RUN REACHES THE CITY' },
      { id: 'ellington', title: 'DUKE ELLINGTON HEADLINES TONIGHT' },
      { id: 'armstrong', title: 'LOUIS ARMSTRONG PLAYS TONIGHT' },
      { id: 'schultz', title: 'DUTCH SCHULTZ EYES NEW TERRITORY' },
      { id: 'lansky', title: 'MEYER LANSKY ENTERS THE PICTURE' },
      { id: 'capone', title: 'AL CAPONE SEEN MEETING ASSOCIATES' },
      { id: 'rothstein', title: 'ARNOLD ROTHSTEIN TAKES AN INTEREST' },
      { id: 'madden', title: 'OWNEY MADDEN BACKS ANOTHER BIG NIGHT' },
    ],
  },
  {
    id: 'superRare',
    title: 'SUPER RARE',
    completeTitle: 'SUPER RARE COLLECTION COMPLETE',
    achievements: [
      { id: 'lindbergh', title: 'LINDBERGH ARRIVES TO GREAT FANFARE' },
      { id: 'mauretania', title: 'MAURETANIA DOCKS TO HUGE CROWDS' },
      { id: 'dempsey', title: 'A BIG FIGHT DRAWS NEAR' },
      { id: 'kkrevue', title: 'THE KITTY KAT CLUB DEBUTS A NEW REVUE' },
      { id: 'ziegfeld', title: 'ZIEGFELD FEVER SWEEPS THE CITY' },
      { id: 'hollywood', title: 'THE TALKIES ARE ALL THE RAGE' },
      { id: 'wales', title: 'THE PRINCE OF WALES IS IN TOWN' },
      { id: 'wallst', title: 'STOCK MARKET FORTUNES GROW AGAIN' },
      { id: 'ruth', title: 'BABE RUTH FEVER SWEEPS THE CITY' },
      { id: 'walker', title: 'MAYOR WALKER VISITS THE DISTRICT' },
    ],
  },
  {
    id: 'godlike',
    title: 'GODLIKE',
    completeTitle: 'BIG DADDY J KNOWS YOUR NAME',
    achievements: [
      { id: 'in_town', title: 'BIG DADDY J IS IN TOWN' },
      { id: 'interest', title: 'BIG DADDY J TAKES AN INTEREST' },
      { id: 'move', title: 'BIG DADDY J MAKES A MOVE' },
      { id: 'celebration', title: 'BIG DADDY J THROWS A CELEBRATION' },
      { id: 'history', title: 'BIG DADDY J MAKES HISTORY' },
    ],
  },
  {
    id: 'goldenGodlike',
    title: 'GOLDEN GODLIKE',
    completeTitle: 'TOUCHED BY GOLD',
    achievements: [
      { id: 'golden', title: 'GOLDEN SHOWER!!!' },
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

const EVENT_PITY_BASE_RARE = 0.045;
const EVENT_PITY_COMPOUND = 1.04;
const EVENT_PITY_TRAVELS_PER_STEP = 1;
const EVENT_PITY_RARE_CAP = 0.20;
const EVENT_PITY_SUPER_CAP = 0.08;
const EVENT_PITY_GODLIKE_CAP = 0.02;
const EVENT_PITY_GOLDEN_CAP = EVENT_PITY_GODLIKE_CAP / 5;

function engineApi(){
  if (typeof netWorth === 'function' && typeof DRUGS !== 'undefined' && typeof CONFIG !== 'undefined') {
    return { netWorth, DRUGS, CONFIG };
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
  return state;
}

function emptyLedger(){
  return {
    achievements: {},
    categoryComplete: {},
    masterComplete: false,
    masterCompleteShown: false,
    travelsSinceEventUnlock: 0,
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

function recordBuy(state, id, qty){
  migrateRunStats(state);
  state.runStats.buys[id] = (state.runStats.buys[id] || 0) + qty;
  state.runStats.commoditiesTouched[id] = true;
}

function recordSell(state, id, qty, profit){
  migrateRunStats(state);
  state.runStats.sells[id] = (state.runStats.sells[id] || 0) + qty;
  state.runStats.commoditiesTouched[id] = true;
  if (id === 'moonshine') state.runStats.moonshineSold += qty;
  if (id === 'cigars') state.runStats.cigarsSold += qty;
  if (id === 'diamonds' && profit > 0) state.runStats.diamondSellProfit += profit;
}

function recordBorrow(state){
  migrateRunStats(state);
  state.runStats.didBorrow = true;
}

function recordSpaceChange(state){
  migrateRunStats(state);
  if (state.space > state.runStats.maxSpace) state.runStats.maxSpace = state.space;
}

function checkGeneralAchievements(state, ledger){
  const { netWorth, DRUGS } = engineApi();
  const unlocks = [];
  const rs = state.runStats;
  const maybe = id => {
    const u = unlockAchievement(ledger, id);
    if (u) unlocks.push(u);
  };

  if (netWorth(state) >= 1000000) maybe('first_million');
  if (state.cash >= 2500000) maybe('high_roller');
  if (rs.moonshineSold >= 100) maybe('bootlegger');
  if (rs.cigarsSold >= 100) maybe('smoke_merchant');
  if (rs.diamondSellProfit >= 100000) maybe('diamond_hands');
  if (state.space >= 150) maybe('empire_builder');
  if (rs.dockVisits >= 12) maybe('king_of_docks');
  if (Object.keys(rs.districtsVisited).length >= 6) maybe('connected');

  const allCommodities = DRUGS.length;
  if (Object.keys(rs.commoditiesTouched).length >= allCommodities) maybe('the_collector');

  const mavenOk = DRUGS.every(d =>
    (rs.buys[d.id] || 0) >= 3 && (rs.sells[d.id] || 0) >= 3
  );
  if (mavenOk) maybe('market_maven');

  if (state.day >= 30 && !state.over) maybe('survivor');

  return unlocks;
}

function checkEndRunAchievements(state, ledger){
  const { CONFIG, netWorth } = engineApi();
  const unlocks = [];
  const maybe = id => {
    const u = unlockAchievement(ledger, id);
    if (u) unlocks.push(u);
  };

  maybe('made_man');
  if (state.debt === 0) maybe('debt_survivor');
  if (!state.runStats.didBorrow && state.day > CONFIG.days && netWorth(state) > 0) maybe('smooth_operator');
  if (state.day > CONFIG.days || (state.day === CONFIG.days && state.over)) maybe('survivor');

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
    superRare: engine.SUPER_RARE_EVENT_CHANCE ?? 0.01,
    godlike: engine.GODLIKE_CHANCE ?? 0.005,
    golden: engine.GOLDEN_GODLIKE_CHANCE ?? 0.001,
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
    recordBorrow,
    recordSpaceChange,
    checkGeneralAchievements,
    checkEndRunAchievements,
    unlockEventAchievement,
    getCategoryForAchievement,
    getAchievementTitle,
    categoryCompleteKey,
    isEventAchievementId,
    isEventLedgerSlow,
    eventRollChances,
    recordEventPityTravel,
    resetEventPity,
    countEventAchievementsUnlocked,
  };
}
