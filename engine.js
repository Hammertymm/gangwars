/* ============================================================================
   ENGINE — Contraband trading mechanics. No DOM (testable).
   ============================================================================ */
const CONFIG = {
  days: 30,
  startCash: 10000,
  startDebt: 25000,
  startSpace: 100,
  startHealth: 10,
  loanInterest: 0.10,
  bankInterest: 0.06,
  conservativeBankBonus: 0.02,
  unavailableChance: 1/8,
  maxBorrow: 25000,
  maxTotalDebt: 100000,
  maxTravelEvents: 2,
  day1StallActions: 5,
  maxGuns: 2,
};

const LOCATIONS = ["Little Italy","Dock #13","Kitty Kat Club","Uptown","Warehouse District","City Hall"];
const HOME = "Little Italy";

const LOCATION_FLAVOR = {
  "Little Italy":        "The old families run these streets. Respect earns profit, disrespect earns a funeral.",
  "Dock #13":            "Rum-runners unload under cover of darkness while customs agents look the other way.",
  "Kitty Kat Club":      "Jazz, dames, liquor and trouble. Business is always booming.",
  "Uptown":              "The rich pay top dollar for things they shouldn't have.",
  "Warehouse District":  "If it's stolen, hidden, or fenced, it passes through here.",
  "City Hall":           "The law is for sale. The price changes daily.",
};

const TERRITORY_MODIFIERS = {
  "Little Italy":       { homeDiscount: 0.03 },
  "Dock #13":           { variance: 1.28 },
  "Kitty Kat Club":     { alcoholBonus: 0.05 },
  "Uptown":             { luxuryBonus: 0.26 },
  "Warehouse District": { criminalBonus: 0.10 },
  "City Hall":          { bias: -0.01 },
};

const GOODS = [
  {id:"moonshine",    name:"Moonshine",     low:50,    high:175},
  {id:"cigars",       name:"Cuban Cigars",  low:175,   high:780},
  {id:"bathgin",      name:"Bathtub Gin",   low:550,   high:1750},
  {id:"art",          name:"Forged Art",    low:1400,  high:5200},
  {id:"scotch",       name:"Aged Scotch",   low:4000,  high:13775},
  {id:"counterfeits", name:"Counterfeits",  low:12000, high:32300},
  {id:"cognac",       name:"Fine Cognac",   low:24000, high:58900},
  {id:"furcoats",     name:"Fur Coats",     low:24000, high:78000},
  {id:"champagne",    name:"Champagne",     low:34000, high:92000},
  {id:"diamonds",     name:"Diamonds",      low:48000, high:144000},
];
const GOOD = Object.fromEntries(GOODS.map(d=>[d.id,d]));

const FAM_ALCOHOL  = new Set(['bathgin','moonshine','scotch','cognac','champagne']);
const FAM_LUXURY   = new Set(['cigars','furcoats','diamonds']);
const FAM_CRIMINAL = new Set(['art','counterfeits']);

const RARE_EVENTS = [
  {id:'luciano',   commodity:'cigars',       district:'Little Italy',       img:'events/rare_luciano.jpg',   lines:['LUCKY LUCIANO CALLS A MEETING','RUMORS OF A NEW ORDER SPREAD']},
  {id:'rumrow',    commodity:'moonshine',    district:'Dock #13',             img:'events/rare_rumrow.jpg',    lines:['THE SILENT FLEET RETURNS TO HARBOR','RUM ROW SAID TO BE BUSIER THAN EVER']},
  {id:'midnight',  commodity:'moonshine',    district:'Dock #13',             img:'events/rare_midnight.jpg',  lines:['THE MIDNIGHT RUN REACHES THE CITY','RUM RUNNERS EVADE PATROL BOATS']},
  {id:'ellington', commodity:'diamonds',     district:'Kitty Kat Club',       img:'events/rare_ellington.jpg', lines:['DUKE ELLINGTON HEADLINES TONIGHT','KITTY KAT CLUB EXPECTS RECORD CROWDS']},
  {id:'armstrong', commodity:'champagne',    district:'Kitty Kat Club',       img:'events/rare_armstrong.jpg', lines:['LOUIS ARMSTRONG PLAYS TONIGHT','THE DISTRICT SWINGS INTO THE SMALL HOURS']},
  {id:'schultz',   commodity:'furcoats',     district:'Uptown',               img:'events/rare_schultz.jpg',   lines:['DUTCH SCHULTZ EYES NEW TERRITORY','ESTABLISHED INTERESTS GROW UNEASY']},
  {id:'lansky',    commodity:'diamonds',     district:'Uptown',               img:'events/rare_lansky.jpg',    lines:['MEYER LANSKY ENTERS THE PICTURE','MONEY CHANGES HANDS RAPIDLY']},
  {id:'capone',    commodity:'counterfeits', district:'Warehouse District', img:'events/rare_capone.jpg',    lines:['AL CAPONE SEEN MEETING ASSOCIATES','RIVALS KEEP A LOW PROFILE TONIGHT']},
  {id:'rothstein', commodity:'art',          district:'City Hall',            img:'events/rare_rothstein.jpg', lines:['ARNOLD ROTHSTEIN TAKES AN INTEREST','SPECULATION SWEEPS THE DISTRICT']},
  {id:'madden',    commodity:'champagne',    district:'City Hall',            img:'events/rare_madden.jpg',    lines:['OWNEY MADDEN BACKS ANOTHER BIG NIGHT','THE FIX IS IN AT CITY HALL']},
];

// 12 Super Rare events — 2 per location. Visiting the event district on its
// day multiplies every available price there by 5 (see resolveTravelMarket).
const SUPER_RARE_EVENTS = [
  {id:'lindbergh',   district:'Dock #13',           img:'events/super_lindbergh.jpg',   title:'THE AVIATOR',     desc:'Lindbergh lands at Dock #13. Crowds surge, cameras pop, and every waterfront price takes flight.'},
  {id:'mauretania',  district:'Dock #13',           img:'events/super_mauretania.jpg',  title:'THE LINER',       desc:'Mauretania docks to roaring crowds. Trunks, crates, and contraband move fast at Dock #13.'},
  {id:'ziegfeld',    district:'Kitty Kat Club',     img:'events/super_ziegfeld.jpg',    title:'THE MARQUEE',     desc:'Ziegfeld fever hits the Kitty Kat Club. Bright lights, rich fools, and prices with chorus-line legs.'},
  {id:'hollywood',   district:'Kitty Kat Club',     img:'events/super_hollywood.jpg',   title:'THE TALKIES',     desc:'Hollywood comes to the Kitty Kat Club. Cameras roll, champagne flows, and prices learn to talk.'},
  {id:'wales',       district:'Uptown',             img:'events/super_wales.jpg',       title:'THE GENTLEMAN',   desc:'The Prince of Wales charms Uptown. High society opens its purse and forgets to close it.'},
  {id:'wallst',      district:'Uptown',             img:'events/super_wallst.jpg',      title:'THE MARKET',      desc:'Wall Street is roaring Uptown. Ticker tape flies, fortunes swell, and prices lose their manners.'},
  {id:'ruth',        district:'City Hall',          img:'events/super_ruth.jpg',        title:'THE SLUGGER',     desc:'Babe Ruth fever grips City Hall. The crowd wants a hero, and every seller wants a bigger cut.'},
  {id:'walker',      district:'City Hall',          img:'events/super_walker.jpg',      title:'THE MAYOR',       desc:'Mayor Walker works the City Hall crowd. Smiles up front, envelopes out back, prices everywhere.'},
  {id:'feast',       district:'Little Italy',       img:'events/super_feast.jpg',       title:'THE FEAST',       desc:'Little Italy takes to the streets. Lanterns glow, saints watch, and every back room does brisk business.'},
  {id:'chairman',    district:'Little Italy',       img:'events/super_chairman.jpg',    title:'THE CHAIRMAN',    desc:'A young boss takes the head table in Little Italy. Quiet words, thick envelopes, expensive consequences.'},
  {id:'garage',      district:'Warehouse District', img:'events/super_garage.jpg',      title:'THE GARAGE',      desc:'Something ugly happened in the warehouse garage. Now every crate has a story and a higher price.'},
  {id:'picket_line', district:'Warehouse District', img:'events/super_picket_line.jpg', title:'THE PICKET LINE', desc:'The Warehouse District stops moving. The workers fold their arms, and the prices stand at attention.'},
];

const GODLIKE_EVENTS = [
  {id:'in_town',     img:'events/godlike_in_town.jpg',     lines:['BIG DADDY J IS IN TOWN','EVERYBODY WANTS A PIECE OF THE ACTION']},
  {id:'interest',    img:'events/godlike_interest.jpg',    lines:['BIG DADDY J TAKES AN INTEREST','MONEY CHANGES HANDS RAPIDLY']},
  {id:'move',        img:'events/godlike_move.jpg',        lines:['BIG DADDY J MAKES A MOVE','THE DISTRICT WILL BE TALKING ABOUT IT FOR YEARS']},
  {id:'celebration', img:'events/godlike_celebration.jpg', lines:['BIG DADDY J THROWS A CELEBRATION','NO EXPENSE IS BEING SPARED']},
  {id:'history',     img:'events/godlike_history.jpg',     lines:['BIG DADDY J MAKES HISTORY','THE CITY WILL REMEMBER THIS DAY']},
];

const GOLDEN_GODLIKE = {
  id:'golden',
  img:'events/godlike_golden.jpg',
  lines:['GOLDEN SHOWER!!!','EVERYWHERE!!!'],
};

// Golden Godlike rolls first; this conditional value yields an effective 1-in-50 Godlike run rate.
const GODLIKE_CHANCE = 0.02 / (1 - 0.01);
const GOLDEN_GODLIKE_CHANCE = 0.01;
const RARE_EVENT_CHANCE = 0.10;
const SUPER_RARE_EVENT_CHANCE = 0.05;

const DEFAULT_EVENT_RATES = {
  rare: RARE_EVENT_CHANCE,
  superRare: SUPER_RARE_EVENT_CHANCE,
  godlike: GODLIKE_CHANCE,
  golden: GOLDEN_GODLIKE_CHANCE,
};

function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function chance(p){ return Math.random() < p; }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function applyTerritoryPrice(d, location, basePrice){
  const mod = TERRITORY_MODIFIERS[location] || {};
  let price = basePrice;
  if (mod.luxuryBonus && FAM_LUXURY.has(d.id)) price = Math.round(price * (1 + mod.luxuryBonus));
  if (mod.criminalBonus && FAM_CRIMINAL.has(d.id)) price = Math.round(price * (1 + mod.criminalBonus));
  if (mod.alcoholBonus && FAM_ALCOHOL.has(d.id)) price = Math.round(price * (1 + mod.alcoholBonus));
  if (mod.bias) price = Math.round(price * (1 + mod.bias));
  if (mod.homeDiscount) price = Math.round(price * (1 - mod.homeDiscount));
  return Math.max(1, price);
}

/** Roll bounds for a good at a location (territory variance widens low/high before randInt). */
function marketPriceBounds(d, location){
  const mod = TERRITORY_MODIFIERS[location] || {};
  let low = d.low, high = d.high;
  if (mod.variance && mod.variance > 1) {
    const spread = high - low;
    const extra = spread * (mod.variance - 1) / 2;
    low = Math.max(1, Math.round(low - extra));
    high = Math.round(high + extra);
  }
  return { low, high };
}

function rollMarket(location){
  const prices = {};
  GOODS.forEach(d=>{
    if (chance(CONFIG.unavailableChance)) { prices[d.id] = null; return; }
    const { low, high } = marketPriceBounds(d, location);
    prices[d.id] = applyTerritoryPrice(d, location, randInt(low, high));
  });
  let anomaly = null;
  if (chance(0.38)){
    const avail = GOODS.filter(d=>prices[d.id]!=null);
    if (avail.length){
      const d = pick(avail); const roll = Math.random();
      if (roll < 0.34){
        prices[d.id] = Math.round(prices[d.id]*4);
        anomaly = {type:'spike', itemId:d.id, itemName:d.name};
      } else if (roll < 0.55){
        prices[d.id] = Math.round(prices[d.id]*8);
        anomaly = {type:'surge', itemId:d.id, itemName:d.name};
      } else {
        prices[d.id] = Math.max(1, Math.round(prices[d.id]/4));
        anomaly = {type:'flood', itemId:d.id, itemName:d.name};
      }
    }
  }
  return { prices, anomaly };
}

function spaceUsed(inv){ return Object.values(inv).reduce((a,b)=>a+b,0); }
function spaceLeft(s){ return s.space - spaceUsed(s.inventory); }
function netWorth(s){ return s.cash + s.bank - s.debt; }
const PERFECT_SCORE_NET_WORTH = 50000000;
function classicScore(s){
  const nw = Math.max(0, netWorth(s));
  return Math.max(0, Math.min(100, Math.round(100 * nw / PERFECT_SCORE_NET_WORTH)));
}

const RANKS = [
  'Street Runner','Associate','Wise Guy','Racketeer','Capo',
  'Underboss','Consigliere','Boss','Godfather','Big Daddy J',
];
const RANK_MIN_WORTH = [
  0, 10000000, 15000000, 20000000, 25000000,
  30000000, 35000000, 40000000, 45000000, 50000000,
];
function getRank(worth){
  const nw = Math.max(0, worth);
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (nw >= RANK_MIN_WORTH[i]) return RANKS[i];
  }
  return RANKS[0];
}
function minWorthForRank(rankIndex){
  return RANK_MIN_WORTH[Math.min(10, Math.max(0, rankIndex))];
}

/** Feds fight kill chance — capped so gun stacking cannot trivialize encounters. */
function fightKillChance(guns){
  return Math.min(0.85, 0.45 + 0.12 * Math.max(0, guns));
}

/** Chance the Feds land a hit each fight round (scales with round count and late game). */
function fedsCounterHitChance(guns, round, day){
  const gunMitigation = Math.min(0.12, 0.04 * Math.max(0, guns));
  let p = 0.30 + 0.03 * Math.max(0, round - 1) - gunMitigation;
  if (day > 20) p += 0.05;
  return Math.min(0.48, Math.max(0.18, p));
}

function gunEventCost(baseCost, guns){
  return Math.round(baseCost * (1 + 0.5 * Math.max(0, guns)));
}

const STASH_UPGRADE_TIERS = [
  { add: 5, unitCost: 100 },
  { add: 10, unitCost: 100 },
  { add: 15, unitCost: 100 },
  { add: 20, unitCost: 100 },
  { add: 30, unitCost: 100 },
];

function rollStashUpgrade(){
  const tier = pick(STASH_UPGRADE_TIERS);
  return { add: tier.add, cost: tier.add * randInt(90, 110) };
}

/** First fight round with max guns — one agent drops guaranteed (Enforcer path). */
function fedsApplyFightKill(s, cops, fightRound){
  if (fightRound === 1 && s.guns >= CONFIG.maxGuns && cops > 0) return cops - 1;
  if (chance(fightKillChance(s.guns))) return cops - 1;
  return cops;
}

function effectiveBankInterest(s){
  const bonus = s.debt <= CONFIG.maxTotalDebt * 0.5 ? CONFIG.conservativeBankBonus : 0;
  return CONFIG.bankInterest + bonus;
}

function checkDebtCap(s){
  if (s.debt >= CONFIG.maxTotalDebt) {
    s.debt = CONFIG.maxTotalDebt;
    s.over = true;
    return "The Don called in your marker — you owe more than he allows.";
  }
  return null;
}

function maxBorrowAmount(s){
  const room = CONFIG.maxTotalDebt - s.debt;
  return Math.max(0, Math.min(CONFIG.maxBorrow, room));
}

function tickStallPressure(s){
  if (s.day !== 1 || s.over) return null;
  s.stallActions = (s.stallActions || 0) + 1;
  if (s.stallActions > 0 && s.stallActions % CONFIG.day1StallActions === 0) {
    const capMsg = applyDailyInterest(s);
    if (capMsg) return capMsg;
    return "The Don's patience ran out — interest hits while you linger.";
  }
  return null;
}

function applyDailyInterest(s){
  if ((s.debtInterestFreeze || 0) > 0) {
    s.debtInterestFreeze -= 1;
  } else {
    s.debt = Math.round(s.debt * (1 + CONFIG.loanInterest));
  }
  const bankRate = effectiveBankInterest(s);
  if (bankRate > 0) s.bank = Math.round(s.bank * (1 + bankRate));
  return checkDebtCap(s);
}

function grantDebtInterestFreeze(s, days = 1){
  s.debtInterestFreeze = Math.max(s.debtInterestFreeze || 0, days);
}

function bankDepositLimit(s){
  const threshold = CONFIG.maxTotalDebt * 0.5;
  if (s.debt <= threshold) return s.cash;
  return Math.floor(s.cash * 0.25);
}

function buy(s, id, qty){
  const price = s.prices[id];
  if (price==null || qty<=0) return "Not available.";
  const cost = price*qty;
  if (cost > s.cash) return "You can't afford that many.";
  if (qty > spaceLeft(s)) return "No room left in the stash.";
  if (!s.costBasis) s.costBasis = {};
  const existing = s.inventory[id]||0;
  s.costBasis[id] = Math.round((existing*(s.costBasis[id]||0) + qty*price) / (existing+qty));
  s.cash -= cost; s.inventory[id] = existing + qty; return null;
}

function sell(s, id, qty){
  const price = s.prices[id];
  if (price==null || qty<=0) return "No buyers here right now.";
  if (qty > (s.inventory[id]||0)) return "You don't have that many.";
  s.cash += price * qty; s.inventory[id] -= qty;
  if (s.inventory[id]===0){ delete s.inventory[id]; if(s.costBasis) delete s.costBasis[id]; }
  return null;
}

function bankRepay(s, amount){
  amount = Math.floor(amount);
  if (amount <= 0) return "Enter an amount.";
  if (amount > s.cash) return "You don't have that much cash.";
  if (amount > s.debt) return "That's more than you owe.";
  s.cash -= amount; s.debt -= amount; return null;
}

function bankBorrow(s, amount){
  amount = Math.floor(amount);
  if (amount <= 0) return "Enter an amount.";
  if (amount > CONFIG.maxBorrow) return `The Don won't lend more than $${CONFIG.maxBorrow.toLocaleString()} at once.`;
  if (s.debt + amount > CONFIG.maxTotalDebt) return `The Don won't let you owe more than $${CONFIG.maxTotalDebt.toLocaleString()}.`;
  s.cash += amount; s.debt += amount; return null;
}

function bankDeposit(s, amount){
  amount = Math.floor(amount);
  if (amount <= 0) return "Enter an amount.";
  const limit = bankDepositLimit(s);
  if (amount > limit) return "The Don won't let you hide that much while you're deep in his debt.";
  if (amount > s.cash) return "You don't have that much cash.";
  s.cash -= amount; s.bank += amount; return null;
}

function bankWithdraw(s, amount){
  amount = Math.floor(amount);
  if (amount <= 0) return "Enter an amount.";
  if (amount > s.bank) return "That's more than you have in the bank.";
  s.bank -= amount; s.cash += amount; return null;
}

function avgCost(s, id){
  return s.costBasis && s.costBasis[id] ? s.costBasis[id] : null;
}

function profitPct(s, id, price){
  const avg = avgCost(s, id);
  if (!avg || !price) return null;
  return Math.round(((price - avg) / avg) * 100);
}

function newGame(rates){
  const r = { ...DEFAULT_EVENT_RATES, ...(rates || {}) };
  const events = {};
  if (chance(r.rare)){
    const re = pick(RARE_EVENTS);
    if (re) events.rare = {...re, day: randInt(5, 25)};
  }
  if (chance(r.superRare)){
    const sr = pick(SUPER_RARE_EVENTS);
    if (sr) events.superRare = {...sr, day: randInt(5, 25)};
  }
  if (chance(r.golden)){
    events.goldenGodlike = {...GOLDEN_GODLIKE, day: randInt(5, 25)};
  } else if (chance(r.godlike)){
    const gl = pick(GODLIKE_EVENTS);
    if (gl) events.godlike = {...gl, day: randInt(5, 25), district: pick(LOCATIONS)};
  }
  const market0 = rollMarket(HOME);
  return {
    schemaVersion: 1,
    day: 1, location: HOME, cash: CONFIG.startCash, bank: 0, debt: CONFIG.startDebt,
    space: CONFIG.startSpace, health: CONFIG.startHealth, guns: 0,
    inventory: {}, costBasis: {}, events,
    prices: market0.prices, anomaly: market0.anomaly || null, log: [], over: false, stallActions: 0,
    debtInterestFreeze: 0,
    runStats: {
      districtsVisited: { [HOME]: true },
      dockVisits: 0,
      moonshineSold: 0,
      cigarsSold: 0,
      buys: {},
      sells: {},
      commoditiesTouched: {},
      didBorrow: false,
      diamondSellProfit: 0,
      maxSpace: CONFIG.startSpace,
      spentBuying: 0,
      fedFightsWon: 0,
      commodityProfit: {},
      boughtDuringFlood: {},
      upsAndDowns: false,
      maxDebtReached: 0,
    },
  };
}

function migrateSave(state){
  if (!state || typeof state !== 'object') return null;
  if (!state.schemaVersion) state.schemaVersion = 0;
  const remap = {
    spices:'cigars', perfume:'cigars', bourbon:'scotch', cigs:'cigars',
    artwork:'art', jewellery:'counterfeits', slots:'furcoats',
  };
  for (const [oldId, newId] of Object.entries(remap)){
    if (state.inventory && state.inventory[oldId]){
      state.inventory[newId] = (state.inventory[newId]||0) + state.inventory[oldId];
      delete state.inventory[oldId];
    }
    if (state.costBasis && state.costBasis[oldId]){
      if (!state.costBasis[newId]) state.costBasis[newId] = state.costBasis[oldId];
      delete state.costBasis[oldId];
    }
    if (state.prices && state.prices[oldId] !== undefined){
      if (state.prices[newId] == null) state.prices[newId] = state.prices[oldId];
      delete state.prices[oldId];
    }
  }
  ['perfume','bourbon','cigs'].forEach(id=>{
    if (state.inventory) delete state.inventory[id];
    if (state.costBasis) delete state.costBasis[id];
    if (state.prices) delete state.prices[id];
  });
  if (!state.events) state.events = {};
  if (!state.costBasis) state.costBasis = {};
  if (state.stallActions == null) state.stallActions = 0;
  if (state.debtInterestFreeze == null) state.debtInterestFreeze = 0;
  if (!state.runStats || typeof state.runStats !== 'object') {
    state.runStats = {
      districtsVisited: state.location ? { [state.location]: true } : {},
      dockVisits: 0, moonshineSold: 0, cigarsSold: 0,
      buys: {}, sells: {}, commoditiesTouched: {},
      didBorrow: false, diamondSellProfit: 0,
      maxSpace: state.space || CONFIG.startSpace,
    };
  }
  return state;
}

function resolveTravelMarket(state, dest){
  const m = rollMarket(dest);
  const prices = m.prices;
  let anomaly = m.anomaly;
  const sr = state.events && state.events.superRare;
  const gk = state.events && state.events.godlike;
  const golden = state.events && state.events.goldenGodlike;
  const re = state.events && state.events.rare;

  if (sr && state.day === sr.day && dest === sr.district){
    Object.keys(prices).forEach(id=>{ if (prices[id]) prices[id] = Math.round(prices[id] * 5); });
  }
  if (golden && state.day === golden.day){
    Object.keys(prices).forEach(id=>{ if (prices[id]) prices[id] = Math.round(prices[id] * 10); });
  } else if (gk && state.day === gk.day && dest === gk.district){
    Object.keys(prices).forEach(id=>{ if (prices[id]) prices[id] = Math.round(prices[id] * 10); });
  }
  if (re && state.day === re.day && dest === re.district){
    const spikeGood = GOOD[re.commodity];
    if (spikeGood){
      prices[re.commodity] = Math.round(randInt(spikeGood.low, spikeGood.high) * 4);
      anomaly = {type:'spike', itemId: re.commodity, itemName: spikeGood.name};
    }
  }

  return { prices, anomaly, sr, gk, golden, re };
}

if (typeof module !== "undefined") {
  module.exports = {
    CONFIG, GOODS, GOOD, LOCATIONS, HOME, LOCATION_FLAVOR, TERRITORY_MODIFIERS,
    FAM_ALCOHOL, FAM_LUXURY, FAM_CRIMINAL, RARE_EVENTS, SUPER_RARE_EVENTS, GODLIKE_EVENTS, GOLDEN_GODLIKE,
    GODLIKE_CHANCE, GOLDEN_GODLIKE_CHANCE, RARE_EVENT_CHANCE, SUPER_RARE_EVENT_CHANCE, DEFAULT_EVENT_RATES,
    rollMarket, applyTerritoryPrice, marketPriceBounds, spaceUsed, spaceLeft, netWorth, classicScore, PERFECT_SCORE_NET_WORTH, getRank, minWorthForRank, RANK_MIN_WORTH, RANKS,
    applyDailyInterest, buy, sell, bankRepay, bankBorrow, bankDeposit, bankWithdraw,
    avgCost, profitPct, bankDepositLimit, grantDebtInterestFreeze, newGame, migrateSave, resolveTravelMarket,
    fightKillChance, fedsCounterHitChance, fedsApplyFightKill, gunEventCost,
    rollStashUpgrade, STASH_UPGRADE_TIERS, effectiveBankInterest, checkDebtCap,
    maxBorrowAmount, tickStallPressure,
    randInt, chance, pick,
  };
}
