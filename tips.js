/* ============================================================================
   ONBOARDING TIPS — account-wide contextual tips. No DOM (testable).
   ============================================================================ */

const TIPS_STORAGE_KEY = 'gw:tips.v2';
const LEGACY_TIPS_STORAGE_KEY = 'gw:tips';
const LEGACY_TUTORIAL_KEY = 'gw:tutorialDone';

const TIP_DEFINITIONS = [
  {
    id: 'marketIntro',
    triggers: ['game:firstMarket'],
    title: 'THE STREETS',
    bodyTemplate: 'marketIntro',
    when(ctx) { return ctx && ctx.day === 1; },
  },
  {
    id: 'debt',
    triggers: ['travel:dayAdvanced'],
    title: "THE DON'S DEBT",
    bodyTemplate: 'debt',
    when(ctx) { return ctx && ctx.day === 2; },
  },
  {
    id: 'bank',
    triggers: ['location:donReturn', 'bank:opened'],
    title: 'THE FAMILY VAULT',
    bodyTemplate: 'bank',
    when(ctx) { return ctx && ctx.returnVisit; },
  },
  {
    id: 'guns',
    triggers: ['event:gunOffer', 'event:fedsUnarmed'],
    title: 'PACK HEAT',
    bodyTemplate: 'guns',
  },
  {
    id: 'cash',
    triggers: ['event:mugging'],
    title: 'LOOSE CASH',
    bodyTemplate: 'cash',
  },
];

const TIP_BY_ID = Object.fromEntries(TIP_DEFINITIONS.map(t => [t.id, t]));

const BODY_TEMPLATES = {
  marketIntro() {
    return 'Prices change every district. MOVE costs a day — and the Don collects interest.';
  },
  debt(cfg, money) {
    return `Your debt compounds at ${Math.round(cfg.loanInterest * 100)}% every day you travel. Pay him down at Little Italy before it eats your profits — the Don caps total debt at ${money(cfg.maxTotalDebt)}.`;
  },
  bank(cfg, money) {
    return `Bank your cash at Little Italy only. Savings earn ${Math.round(cfg.bankInterest * 100)}% daily — plus a ${Math.round(cfg.conservativeBankBonus * 100)}% bonus when your debt is under half the cap.`;
  },
  guns() {
    return 'Feds show up on the road. Buy guns when offered — without one, you can only run or bribe.';
  },
  cash() {
    return 'Muggings hit harder when you\'re carrying a lot of cash. Bank it at Little Italy before you travel — the streets notice a fat wallet.';
  },
};

function allTipIds() {
  return TIP_DEFINITIONS.map(t => t.id);
}

function emptyTips() {
  return { version: 2, seen: {}, skippedAll: false };
}

function migrateTips(raw) {
  if (!raw || typeof raw !== 'object') return emptyTips();
  return {
    version: 2,
    seen: { ...(raw.seen || {}) },
    skippedAll: !!raw.skippedAll,
  };
}

function hasSeenTip(id, state) {
  if (!state || state.skippedAll) return true;
  return !!state.seen[id];
}

function markTipSeen(id, state) {
  if (!state) return;
  if (!state.seen) state.seen = {};
  state.seen[id] = true;
}

function skipAllTips(state) {
  if (!state) return;
  state.skippedAll = true;
  if (!state.seen) state.seen = {};
  allTipIds().forEach(id => { state.seen[id] = true; });
}

function matchTips(trigger, ctx, state) {
  if (!state || state.skippedAll) return [];
  return TIP_DEFINITIONS.filter(t => {
    if (!t.triggers.includes(trigger)) return false;
    if (hasSeenTip(t.id, state)) return false;
    if (typeof t.when === 'function' && !t.when(ctx)) return false;
    return true;
  });
}

function getTipById(id) {
  return TIP_BY_ID[id] || null;
}

function resolveTipBody(tip, config, formatMoney) {
  if (!tip) return '';
  const fn = BODY_TEMPLATES[tip.bodyTemplate];
  if (!fn) return '';
  const money = typeof formatMoney === 'function'
    ? formatMoney
    : n => '$' + Math.round(n).toLocaleString('en-US');
  return fn(config || {}, money);
}

function enqueueTipIds(ids, queue) {
  const q = Array.isArray(queue) ? queue : [];
  ids.forEach(id => {
    if (!q.includes(id)) q.push(id);
  });
  return q;
}

function loadTips(storage) {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return emptyTips();
  let raw = null;
  try { raw = JSON.parse(store.getItem(TIPS_STORAGE_KEY)); } catch (e) { raw = null; }
  if (raw) return migrateTips(raw);
  // Ignore gw:tips v1 (often auto-filled with all-seen via old tutorialDone migration).
  return emptyTips();
}

function saveTips(state, storage) {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store || !state) return;
  try { store.setItem(TIPS_STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage full */ }
}

if (typeof module !== 'undefined') {
  module.exports = {
    TIPS_STORAGE_KEY,
    LEGACY_TIPS_STORAGE_KEY,
    LEGACY_TUTORIAL_KEY,
    TIP_DEFINITIONS,
    allTipIds,
    emptyTips,
    migrateTips,
    hasSeenTip,
    markTipSeen,
    skipAllTips,
    matchTips,
    getTipById,
    resolveTipBody,
    enqueueTipIds,
    loadTips,
    saveTips,
  };
}
