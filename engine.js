/* ============================================================================
   ENGINE — Drug Wars mechanics. No DOM (testable).
   ============================================================================ */
const CONFIG = {
  days: 30,
  startCash: 10000,
  startDebt: 25000,
  startSpace: 100,
  startHealth: 10,
  loanInterest: 0.10,
  bankInterest: 0.06,
  unavailableChance: 1/8,
  maxBorrow: 25000,
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
  "Little Italy":       {},
  "Dock #13":           { variance: 1.35 },
  "Kitty Kat Club":     { alcoholBonus: 0.08 },
  "Uptown":             { luxuryBonus: 0.12 },
  "Warehouse District": { criminalBonus: 0.10 },
  "City Hall":          { bias: -0.06 },
};

const DRUGS = [
  {id:"moonshine",    name:"Moonshine",     low:50,    high:250},
  {id:"cigars",       name:"Cuban Cigars",  low:200,   high:700},
  {id:"bathgin",      name:"Bathtub Gin",   low:600,   high:2000},
  {id:"art",          name:"Forged Art",    low:1500,  high:5500},
  {id:"scotch",       name:"Aged Scotch",   low:4500,  high:16000},
  {id:"counterfeits", name:"Counterfeits",  low:13000, high:35000},
  {id:"cognac",       name:"Fine Cognac",   low:28000, high:65000},
  {id:"furcoats",     name:"Fur Coats",     low:52000, high:100000},
  {id:"champagne",    name:"Champagne",     low:78000, high:115000},
  {id:"diamonds",     name:"Diamonds",      low:96000, high:140000},
];
const DRUG = Object.fromEntries(DRUGS.map(d=>[d.id,d]));

const FAM_ALCOHOL  = new Set(['bathgin','moonshine','scotch','cognac','champagne']);
const FAM_LUXURY   = new Set(['cigars','furcoats','diamonds']);
const FAM_CRIMINAL = new Set(['art','counterfeits']);

const RARE_EVENTS = [
  {id:'capone',    commodity:'counterfeits', district:'Warehouse District', img:'events/rare_capone.png',    lines:['AL CAPONE SEEN MEETING ASSOCIATES','RIVALS KEEP A LOW PROFILE TONIGHT']},
  {id:'luciano',   commodity:'cigars',       district:'Little Italy',       img:'events/rare_luciano.png',   lines:['LUCKY LUCIANO CALLS A MEETING','RUMORS OF A NEW ORDER SPREAD']},
  {id:'schultz',   commodity:'furcoats',     district:'Uptown',               img:'events/rare_schultz.png',   lines:['DUTCH SCHULTZ EYES NEW TERRITORY','ESTABLISHED INTERESTS GROW UNEASY']},
  {id:'madden',    commodity:'champagne',    district:'Kitty Kat Club',       img:'events/rare_madden.png',    lines:['OWNEY MADDEN BACKS ANOTHER BIG NIGHT','KITTY KAT CLUB EXPECTS RECORD CROWDS']},
  {id:'rothstein', commodity:'art',          district:'City Hall',            img:'events/rare_rothstein.png', lines:['ARNOLD ROTHSTEIN TAKES AN INTEREST','SPECULATION SWEEPS THE DISTRICT']},
  {id:'lansky',    commodity:'diamonds',     district:'Uptown',               img:'events/rare_lansky.png',    lines:['MEYER LANSKY ENTERS THE PICTURE','MONEY CHANGES HANDS RAPIDLY']},
  {id:'ellington', commodity:'diamonds',     district:'Kitty Kat Club',       img:'events/rare_ellington.png', lines:['DUKE ELLINGTON HEADLINES TONIGHT','KITTY KAT CLUB EXPECTS RECORD CROWDS']},
  {id:'armstrong', commodity:'champagne',    district:'Kitty Kat Club',       img:'events/rare_armstrong.png', lines:['LOUIS ARMSTRONG PLAYS TONIGHT','THE DISTRICT SWINGS INTO THE SMALL HOURS']},
  {id:'rumrow',    commodity:'moonshine',    district:'Dock #13',             img:'events/rare_rumrow.png',    lines:['THE SILENT FLEET RETURNS TO HARBOR','RUM ROW SAID TO BE BUSIER THAN EVER']},
  {id:'midnight',  commodity:'moonshine',    district:'Dock #13',             img:'events/rare_midnight.png',  lines:['THE MIDNIGHT RUN REACHES THE CITY','RUM RUNNERS EVADE PATROL BOATS']},
];

const SUPER_RARE_EVENTS = [
  {id:'ruth',       district:'Kitty Kat Club', img:'events/super_ruth.png',       lines:['BABE RUTH FEVER SWEEPS THE CITY','VISITORS POUR IN FROM EVERYWHERE']},
  {id:'lindbergh',  district:'Dock #13',       img:'events/super_lindbergh.png',  lines:['LINDBERGH ARRIVES TO GREAT FANFARE','THE CITY STOPS TO WATCH']},
  {id:'dempsey',    district:'Kitty Kat Club', img:'events/super_dempsey.png',    lines:['A BIG FIGHT DRAWS NEAR','DEMPSEY MANIA GRIPS THE DISTRICT']},
  {id:'wales',      district:'Uptown',         img:'events/super_wales.png',      lines:['THE PRINCE OF WALES IS IN TOWN','NO EXPENSE IS BEING SPARED']},
  {id:'kkrevue',    district:'Kitty Kat Club', img:'events/super_kkrevue.png',    lines:['THE KITTY KAT CLUB DEBUTS A NEW REVUE',"THE CITY'S ELITE FLOCK TO THE DISTRICT"]},
  {id:'mauretania', district:'Dock #13',       img:'events/super_mauretania.png', lines:['MAURETANIA DOCKS TO HUGE CROWDS','THE WATERFRONT HAS NEVER BEEN BUSIER']},
  {id:'ziegfeld',   district:'Kitty Kat Club', img:'events/super_ziegfeld.png',   lines:['ZIEGFELD FEVER SWEEPS THE CITY','EVERYBODY WANTS THE BEST SEAT']},
  {id:'wallst',     district:'Uptown',         img:'events/super_wallst.png',     lines:['STOCK MARKET FORTUNES GROW AGAIN','UPSCALE DISTRICTS REPORT RECORD TRADE']},
  {id:'walker',     district:'City Hall',      img:'events/super_walker.png',     lines:['MAYOR WALKER VISITS THE DISTRICT','EVERY TABLE IN TOWN IS RESERVED']},
  {id:'hollywood',  district:'Kitty Kat Club', img:'events/super_hollywood.png',  lines:['THE TALKIES ARE ALL THE RAGE','THEATRES SELL OUT ACROSS THE DISTRICT']},
];

const GODLIKE_EVENTS = [
  {id:'in_town',     img:'events/godlike_in_town.png',     lines:['BIG DADDY J IS IN TOWN','EVERYBODY WANTS A PIECE OF THE ACTION']},
  {id:'interest',    img:'events/godlike_interest.png',    lines:['BIG DADDY J TAKES AN INTEREST','MONEY CHANGES HANDS RAPIDLY']},
  {id:'move',        img:'events/godlike_move.png',        lines:['BIG DADDY J MAKES A MOVE','THE DISTRICT WILL BE TALKING ABOUT IT FOR YEARS']},
  {id:'celebration', img:'events/godlike_celebration.png', lines:['BIG DADDY J THROWS A CELEBRATION','NO EXPENSE IS BEING SPARED']},
  {id:'history',     img:'events/godlike_history.png',     lines:['BIG DADDY J MAKES HISTORY','THE CITY WILL REMEMBER THIS DAY']},
];

const GOLDEN_GODLIKE = {
  id:'golden',
  img:'events/godlike_golden.png',
  lines:['GOLDEN SHOWER!!!','EVERYWHERE!!!'],
};

const GODLIKE_CHANCE = 0.005;
const GOLDEN_GODLIKE_CHANCE = 0.001;

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
  return Math.max(1, price);
}

function rollMarket(location){
  const mod = TERRITORY_MODIFIERS[location] || {};
  const prices = {};
  DRUGS.forEach(d=>{
    if (chance(CONFIG.unavailableChance)) { prices[d.id] = null; return; }
    let low = d.low, high = d.high;
    if (mod.variance && mod.variance > 1) {
      const spread = high - low;
      const extra = spread * (mod.variance - 1) / 2;
      low = Math.max(1, Math.round(low - extra));
      high = Math.round(high + extra);
    }
    prices[d.id] = applyTerritoryPrice(d, location, randInt(low, high));
  });
  let anomaly = null;
  if (chance(0.38)){
    const avail = DRUGS.filter(d=>prices[d.id]!=null);
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
const PERFECT_SCORE_NET_WORTH = 10000000;
function classicScore(s){
  const nw = Math.max(0, netWorth(s));
  return Math.max(0, Math.min(100, Math.round(100 * Math.sqrt(nw / PERFECT_SCORE_NET_WORTH))));
}

const RANKS = [
  'Nobody','Pickpocket','Hustler','Rum Runner','Bootlegger',
  'Racketeer','Wise Guy','Crew Boss','Underboss','Godfather','Big Daddy J',
];
function getRank(score){ return RANKS[Math.min(10, Math.floor(Math.max(0, score) / 10))]; }

function applyDailyInterest(s){
  s.debt = Math.round(s.debt * (1 + CONFIG.loanInterest));
  if (CONFIG.bankInterest > 0) s.bank = Math.round(s.bank * (1 + CONFIG.bankInterest));
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
  s.cash += price*qty; s.inventory[id] -= qty;
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
  s.cash += amount; s.debt += amount; return null;
}

function bankDeposit(s, amount){
  amount = Math.floor(amount);
  if (amount <= 0) return "Enter an amount.";
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

function newGame(){
  const events = {};
  if (chance(0.04)){
    const re = pick(RARE_EVENTS);
    if (re) events.rare = {...re, day: randInt(5, 25)};
  }
  if (chance(0.01)){
    const sr = pick(SUPER_RARE_EVENTS);
    if (sr) events.superRare = {...sr, day: randInt(5, 25)};
  }
  if (chance(GOLDEN_GODLIKE_CHANCE)){
    events.goldenGodlike = {...GOLDEN_GODLIKE, day: randInt(5, 25)};
  } else if (chance(GODLIKE_CHANCE)){
    const gl = pick(GODLIKE_EVENTS);
    if (gl) events.godlike = {...gl, day: randInt(5, 25), district: pick(LOCATIONS)};
  }
  return {
    day: 1, location: HOME, cash: CONFIG.startCash, bank: 0, debt: CONFIG.startDebt,
    space: CONFIG.startSpace, health: CONFIG.startHealth, guns: 0,
    inventory: {}, costBasis: {}, events,
    prices: rollMarket(HOME).prices, log: [], over: false,
  };
}

function migrateSave(state){
  if (!state || typeof state !== 'object') return null;
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
    Object.keys(prices).forEach(id=>{ if (prices[id]) prices[id] = Math.round(prices[id] * 3); });
  }
  if (golden && state.day === golden.day){
    Object.keys(prices).forEach(id=>{ if (prices[id]) prices[id] = Math.round(prices[id] * 10); });
  } else if (gk && state.day === gk.day && dest === gk.district){
    Object.keys(prices).forEach(id=>{ if (prices[id]) prices[id] = Math.round(prices[id] * 10); });
  }
  if (re && state.day === re.day && dest === re.district){
    const reDrug = DRUG[re.commodity];
    if (reDrug){
      prices[re.commodity] = Math.round(randInt(reDrug.low, reDrug.high) * 4);
      anomaly = {type:'spike', itemId: re.commodity, itemName: reDrug.name};
    }
  }

  return { prices, anomaly, sr, gk, golden, re };
}

if (typeof module !== "undefined") {
  module.exports = {
    CONFIG, DRUGS, DRUG, LOCATIONS, HOME, LOCATION_FLAVOR, TERRITORY_MODIFIERS,
    FAM_ALCOHOL, FAM_LUXURY, FAM_CRIMINAL, RARE_EVENTS, SUPER_RARE_EVENTS, GODLIKE_EVENTS, GOLDEN_GODLIKE,
    GODLIKE_CHANCE, GOLDEN_GODLIKE_CHANCE,
    rollMarket, applyTerritoryPrice, spaceUsed, spaceLeft, netWorth, classicScore, PERFECT_SCORE_NET_WORTH, getRank, RANKS,
    applyDailyInterest, buy, sell, bankRepay, bankBorrow, bankDeposit, bankWithdraw,
    avgCost, profitPct, newGame, migrateSave, resolveTravelMarket,
    randInt, chance, pick,
  };
}
