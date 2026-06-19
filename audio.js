/* ============================================================================
   AUDIO — Sound catalog, music/SFX playback, settings. No DOM.
   ============================================================================ */

const AUDIO_SETTINGS_KEY = 'gw:audio';
const AUDIO_BASE = 'assets/audio/';
const MAX_SFX = 4;
const MUSIC_FADE_MS = 300;
const DEFAULT_DUCK = 0.45;

const AUDIO_DEFAULTS = {
  muted: false,
  musicVolume: 0.6,
  sfxVolume: 0.8,
};

/** @type {Record<string, { path: string, type: 'sfx'|'music', loop?: boolean, volume?: number, variants?: string[] }>} */
const AUDIO_CATALOG = {
  /* ── Music (Tier 1) ── */
  'music.title':        { path: 'music/title-speakeasy-jazz.ogg', type: 'music', loop: true,  volume: 0.55 },
  'music.run':          { path: 'music/run-ambient.ogg',          type: 'music', loop: true,  volume: 0.35 },
  'music.fedsTension':  { path: 'music/feds-tension.ogg',         type: 'music', loop: true,  volume: 0.4 },
  'music.ledger':       { path: 'music/ledger-ambient.ogg',       type: 'music', loop: true,  volume: 0.4 },
  'music.endNeutral':   { path: 'music/end-neutral.ogg',          type: 'music', loop: false, volume: 0.5 },
  /* ── Music (Tier 2/3 reserved) ── */
  'music.endTriumph':   { path: 'music/end-triumph.ogg',          type: 'music', loop: false, volume: 0.55 },
  'music.kittyKat':     { path: 'music/kitty-kat-club.ogg',       type: 'music', loop: true,  volume: 0.4 },
  'music.dock':         { path: 'music/dock-ambient.ogg',         type: 'music', loop: true,  volume: 0.35 },
  'music.golden':       { path: 'music/golden-shower.ogg',        type: 'music', loop: true,  volume: 0.5 },

  /* ── Combat (Tier 1) ── */
  'sfx.combat.gunshot':     { path: 'sfx/combat/gunshot.ogg',         type: 'sfx', volume: 0.85 },
  'sfx.combat.emptyClick':  { path: 'sfx/combat/empty-click.ogg',     type: 'sfx', volume: 0.7 },
  'sfx.combat.punchOof':    { path: 'sfx/combat/punch-oof-01.ogg',    type: 'sfx', volume: 0.8,
    variants: ['sfx/combat/punch-oof-02.ogg'] },
  'sfx.combat.siren':       { path: 'sfx/combat/siren.ogg',           type: 'sfx', volume: 0.75 },
  /* ── Combat (Tier 2 reserved) ── */
  'sfx.combat.tommyBurst':  { path: 'sfx/combat/tommy-burst.ogg',     type: 'sfx', volume: 0.9 },
  'sfx.combat.footsteps':   { path: 'sfx/combat/footsteps-flee.ogg',  type: 'sfx', volume: 0.6 },
  'sfx.combat.deathSting':  { path: 'sfx/combat/death-sting.ogg',     type: 'sfx', volume: 0.85 },

  /* ── Economy (Tier 1) ── */
  'sfx.economy.cashRegister': { path: 'sfx/economy/cash-register.ogg', type: 'sfx', volume: 0.8 },
  'sfx.economy.coinsBuy':     { path: 'sfx/economy/coins-buy.ogg',     type: 'sfx', volume: 0.7 },
  'sfx.economy.bills':        { path: 'sfx/economy/bills-shuffle.ogg', type: 'sfx', volume: 0.65 },
  'sfx.economy.debtPaid':     { path: 'sfx/economy/debt-paid.ogg',     type: 'sfx', volume: 0.75 },
  'sfx.economy.loanTaken':    { path: 'sfx/economy/loan-taken.ogg',    type: 'sfx', volume: 0.7 },
  'sfx.economy.errorDeny':    { path: 'sfx/economy/error-deny.ogg',    type: 'sfx', volume: 0.65 },
  /* ── Economy (Tier 2 reserved) ── */
  'sfx.economy.vaultClose':   { path: 'sfx/economy/vault-close.ogg',   type: 'sfx', volume: 0.7 },
  'sfx.economy.bigSale':      { path: 'sfx/economy/big-sale.ogg',      type: 'sfx', volume: 0.85 },

  /* ── Travel (Tier 1) ── */
  'sfx.travel.engineStart': { path: 'sfx/travel/engine-start.ogg',   type: 'sfx', volume: 0.7 },
  'sfx.travel.arrival':     { path: 'sfx/travel/arrival.ogg',        type: 'sfx', volume: 0.65 },
  'sfx.travel.dayTick':     { path: 'sfx/travel/day-tick.ogg',       type: 'sfx', volume: 0.55 },
  'sfx.travel.screech':     { path: 'sfx/travel/tires-screech.ogg',  type: 'sfx', volume: 0.75 },

  /* ── Events (Tier 1 stingers + modals) ── */
  'sfx.events.modalOpen':  { path: 'sfx/events/modal-open.ogg',  type: 'sfx', volume: 0.5 },
  'sfx.events.modalClose': { path: 'sfx/events/modal-close.ogg', type: 'sfx', volume: 0.45 },
  'sfx.events.stinger.golden':    { path: 'sfx/events/stinger-golden.ogg',    type: 'sfx', volume: 0.9 },
  'sfx.events.stinger.godlike':   { path: 'sfx/events/stinger-godlike.ogg',   type: 'sfx', volume: 0.85 },
  'sfx.events.stinger.superRare': { path: 'sfx/events/stinger-super-rare.ogg', type: 'sfx', volume: 0.8 },
  'sfx.events.stinger.rare':      { path: 'sfx/events/stinger-rare.ogg',      type: 'sfx', volume: 0.75 },
  'sfx.events.stinger.spike':     { path: 'sfx/events/stinger-spike.ogg',     type: 'sfx', volume: 0.7 },
  'sfx.events.stinger.surge':     { path: 'sfx/events/stinger-surge.ogg',     type: 'sfx', volume: 0.75 },
  'sfx.events.stinger.flood':     { path: 'sfx/events/stinger-flood.ogg',     type: 'sfx', volume: 0.7 },
  /* ── Events (Tier 2 reserved) ── */
  'sfx.events.mugging':       { path: 'sfx/events/mugging.ogg',        type: 'sfx', volume: 0.8 },
  'sfx.events.deadDrop':        { path: 'sfx/events/dead-drop.ogg',      type: 'sfx', volume: 0.75 },
  'sfx.events.stashUpgrade':    { path: 'sfx/events/stash-upgrade.ogg',  type: 'sfx', volume: 0.7 },
  'sfx.events.gunOffer':        { path: 'sfx/events/gun-offer.ogg',      type: 'sfx', volume: 0.7 },
  'sfx.events.bribePaid':       { path: 'sfx/events/bribe-paid.ogg',     type: 'sfx', volume: 0.65 },

  /* ── UI (Tier 1) ── */
  'sfx.ui.buttonTap': { path: 'sfx/ui/button-tap.ogg', type: 'sfx', volume: 0.45 },

  /* ── Achievement / Ledger (Tier 1 + reserved) ── */
  'sfx.achievement.found':            { path: 'sfx/achievement/found.ogg',             type: 'sfx', volume: 0.8 },
  'sfx.achievement.cardReveal':       { path: 'sfx/achievement/card-reveal.ogg',       type: 'sfx', volume: 0.85 },
  'sfx.achievement.categoryComplete': { path: 'sfx/achievement/category-complete.ogg', type: 'sfx', volume: 0.9 },
  'sfx.achievement.crimeLord':        { path: 'sfx/achievement/crime-lord.ogg',        type: 'sfx', volume: 1 },
  'sfx.ledger.pageTurn':              { path: 'sfx/ledger/page-turn.ogg',              type: 'sfx', volume: 0.5 },

  /* ── End of run (Tier 1 + reserved) ── */
  'sfx.end.rankReveal':   { path: 'sfx/end/rank-reveal.ogg',   type: 'sfx', volume: 0.85 },
  'sfx.end.runComplete':  { path: 'sfx/end/run-complete.ogg',  type: 'sfx', volume: 0.7 },
};

const SCENE_MUSIC = {
  title:  'music.title',
  ledger: 'music.ledger',
  market: 'music.run',
  scores: null,
  end:    null,
};

let settings = { ...AUDIO_DEFAULTS };
let initialized = false;
let audioUnlocked = false;
/** @type {HTMLAudioElement|null} */
let musicEl = null;
let currentMusicId = null;
let musicFadeTimer = null;
let isDucked = false;
let duckAmount = DEFAULT_DUCK;
/** @type {HTMLAudioElement[]} */
let sfxPool = [];
let currentScene = null;
const warnedMissing = new Set();

function isBrowser() {
  return typeof window !== 'undefined' && typeof Audio !== 'undefined';
}

function loadSettings() {
  if (typeof localStorage === 'undefined') return { ...AUDIO_DEFAULTS };
  try {
    const raw = localStorage.getItem(AUDIO_SETTINGS_KEY);
    if (!raw) return { ...AUDIO_DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      muted: !!parsed.muted,
      musicVolume: clamp01(parsed.musicVolume ?? AUDIO_DEFAULTS.musicVolume),
      sfxVolume: clamp01(parsed.sfxVolume ?? AUDIO_DEFAULTS.sfxVolume),
    };
  } catch (_) {
    return { ...AUDIO_DEFAULTS };
  }
}

function saveSettings() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings));
  } catch (_) {}
}

function clamp01(n) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

function resolvePath(relativePath) {
  return AUDIO_BASE + relativePath;
}

function catalogEntry(id) {
  return AUDIO_CATALOG[id] || null;
}

function pickSfxPath(entry, opts) {
  const variantIndex = opts && opts.variant != null ? opts.variant : 0;
  if (variantIndex > 0 && entry.variants && entry.variants[variantIndex - 1]) {
    return resolvePath(entry.variants[variantIndex - 1]);
  }
  if (opts && opts.variant === 'random' && entry.variants && entry.variants.length) {
    const all = [entry.path, ...entry.variants];
    return resolvePath(all[Math.floor(Math.random() * all.length)]);
  }
  return resolvePath(entry.path);
}

function effectiveVolume(entry, channel, override) {
  if (settings.muted) return 0;
  const base = entry.volume != null ? entry.volume : 1;
  const channelVol = channel === 'music' ? settings.musicVolume : settings.sfxVolume;
  let vol = base * channelVol;
  if (typeof override === 'number') vol *= clamp01(override);
  if (channel === 'music' && isDucked) vol *= (1 - duckAmount);
  return clamp01(vol);
}

function warnMissing(id) {
  if (warnedMissing.has(id)) return;
  warnedMissing.add(id);
  if (typeof console !== 'undefined' && console.warn) {
    console.warn('[GangWarsAudio] missing or failed:', id);
  }
}

function acquireSfxElement() {
  const idle = sfxPool.find(el => el.paused || el.ended);
  if (idle) return idle;
  if (sfxPool.length < MAX_SFX) {
    const el = new Audio();
    el.preload = 'auto';
    sfxPool.push(el);
    return el;
  }
  return sfxPool[0];
}

function applyMusicVolume(entry) {
  if (!musicEl || !entry) return;
  musicEl.volume = effectiveVolume(entry, 'music');
}

function fadeMusicTo(targetVolume, durationMs, onDone) {
  if (!musicEl) {
    if (onDone) onDone();
    return;
  }
  if (musicFadeTimer) {
    clearInterval(musicFadeTimer);
    musicFadeTimer = null;
  }
  const start = musicEl.volume;
  const delta = targetVolume - start;
  if (!durationMs || Math.abs(delta) < 0.001) {
    musicEl.volume = targetVolume;
    if (onDone) onDone();
    return;
  }
  const steps = Math.max(1, Math.round(durationMs / 16));
  let step = 0;
  musicFadeTimer = setInterval(() => {
    step += 1;
    musicEl.volume = start + delta * (step / steps);
    if (step >= steps) {
      clearInterval(musicFadeTimer);
      musicFadeTimer = null;
      musicEl.volume = targetVolume;
      if (onDone) onDone();
    }
  }, 16);
}

function stopMusicElement(fadeMs) {
  if (!musicEl) return;
  const el = musicEl;
  const finish = () => {
    el.pause();
    el.currentTime = 0;
    el.onended = null;
    if (musicEl === el) {
      musicEl = null;
      currentMusicId = null;
    }
  };
  if (fadeMs && fadeMs > 0 && !settings.muted) {
    fadeMusicTo(0, fadeMs, finish);
  } else {
    if (musicFadeTimer) {
      clearInterval(musicFadeTimer);
      musicFadeTimer = null;
    }
    finish();
  }
}

function init() {
  if (initialized) return;
  initialized = true;
  settings = loadSettings();
}

function unlock() {
  init();
  if (audioUnlocked) return;
  audioUnlocked = true;
  if (!isBrowser()) return;
  try {
    const probe = new Audio();
    probe.volume = 0;
    const p = probe.play();
    if (p && typeof p.then === 'function') {
      p.then(() => { probe.pause(); probe.currentTime = 0; }).catch(() => {});
    }
  } catch (_) {}
}

function play(id, opts) {
  init();
  if (!isBrowser() || !audioUnlocked) return;
  const entry = catalogEntry(id);
  if (!entry || entry.type !== 'sfx') {
    warnMissing(id);
    return;
  }
  const src = pickSfxPath(entry, opts);
  const el = acquireSfxElement();
  el.volume = effectiveVolume(entry, 'sfx', opts && opts.volume);
  if (opts && opts.rate) el.playbackRate = opts.rate;
  else el.playbackRate = 1;
  el.loop = false;
  el.src = src;
  const p = el.play();
  if (p && typeof p.catch === 'function') {
    p.catch(() => warnMissing(id));
  }
}

function playMusic(id, opts) {
  init();
  if (!isBrowser() || !audioUnlocked) return;
  const entry = catalogEntry(id);
  if (!entry || entry.type !== 'music') {
    warnMissing(id);
    return;
  }
  if (currentMusicId === id && musicEl && !musicEl.paused) return;

  const fadeMs = (opts && opts.fadeMs != null) ? opts.fadeMs : MUSIC_FADE_MS;
  const src = resolvePath(entry.path);
  const startNew = () => {
    const el = new Audio(src);
    el.loop = !!entry.loop;
    el.preload = 'auto';
    el.volume = 0;
    musicEl = el;
    currentMusicId = id;
    el.onended = () => {
      if (musicEl === el && !entry.loop) {
        musicEl = null;
        currentMusicId = null;
      }
    };
    const p = el.play();
    const target = effectiveVolume(entry, 'music', opts && opts.volume);
    fadeMusicTo(target, fadeMs);
    if (p && typeof p.catch === 'function') {
      p.catch(() => warnMissing(id));
    }
  };

  if (musicEl && currentMusicId !== id) {
    fadeMusicTo(0, fadeMs, () => {
      if (musicEl) {
        musicEl.pause();
        musicEl = null;
        currentMusicId = null;
      }
      startNew();
    });
  } else if (!musicEl) {
    startNew();
  }
}

function stopMusic(fadeMs) {
  stopMusicElement(typeof fadeMs === 'number' ? fadeMs : MUSIC_FADE_MS);
}

function stopTensionMusic() {
  if (currentMusicId === 'music.fedsTension') stopMusic(MUSIC_FADE_MS);
}

function duckMusic(on, amount) {
  isDucked = !!on;
  if (typeof amount === 'number') duckAmount = clamp01(amount);
  if (currentMusicId) {
    const entry = catalogEntry(currentMusicId);
    if (entry) applyMusicVolume(entry);
  }
}

function setMuted(muted) {
  init();
  settings.muted = !!muted;
  saveSettings();
  if (settings.muted) {
    if (musicEl) musicEl.volume = 0;
    sfxPool.forEach(el => { el.pause(); });
  } else if (currentMusicId) {
    const entry = catalogEntry(currentMusicId);
    if (entry) applyMusicVolume(entry);
  }
}

function setVolume(channel, value) {
  init();
  const v = clamp01(value);
  if (channel === 'music') settings.musicVolume = v;
  else if (channel === 'sfx') settings.sfxVolume = v;
  saveSettings();
  if (currentMusicId) {
    const entry = catalogEntry(currentMusicId);
    if (entry) applyMusicVolume(entry);
  }
}

function getSettings() {
  init();
  return { ...settings };
}

function isMuted() {
  init();
  return settings.muted;
}

function preload(id) {
  init();
  if (!isBrowser()) return;
  const entry = catalogEntry(id);
  if (!entry) return;
  const el = new Audio(resolvePath(entry.path));
  el.preload = 'auto';
  el.load();
}

function onScene(sceneId) {
  init();
  if (currentScene === sceneId) return;
  currentScene = sceneId;
  const musicId = SCENE_MUSIC[sceneId];
  if (musicId) playMusic(musicId);
  else stopMusic(MUSIC_FADE_MS);
}

/**
 * @param {{ tier?: string, anomalyType?: string, eventId?: string }} ctx
 */
function eventStinger(ctx) {
  if (!ctx) return;
  if (ctx.tier === 'golden') return play('sfx.events.stinger.golden');
  if (ctx.tier === 'godlike') return play('sfx.events.stinger.godlike');
  if (ctx.tier === 'superRare') return play('sfx.events.stinger.superRare');
  if (ctx.tier === 'rare') return play('sfx.events.stinger.rare');
  if (ctx.anomalyType === 'spike') return play('sfx.events.stinger.spike');
  if (ctx.anomalyType === 'surge') return play('sfx.events.stinger.surge');
  if (ctx.anomalyType === 'flood') return play('sfx.events.stinger.flood');
}

function getCatalogIds() {
  return Object.keys(AUDIO_CATALOG);
}

function getCatalogManifest() {
  return Object.entries(AUDIO_CATALOG).map(([id, entry]) => ({
    id,
    path: resolvePath(entry.path),
    type: entry.type,
    loop: !!entry.loop,
    volume: entry.volume != null ? entry.volume : 1,
    variants: (entry.variants || []).map(v => resolvePath(v)),
  }));
}

const GangWarsAudio = {
  init,
  unlock,
  play,
  playMusic,
  stopMusic,
  stopTensionMusic,
  duckMusic,
  setMuted,
  setVolume,
  getSettings,
  isMuted,
  preload,
  onScene,
  eventStinger,
  getCatalogIds,
  getCatalogManifest,
  AUDIO_CATALOG,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GangWarsAudio;
}
if (typeof window !== 'undefined') {
  window.GangWarsAudio = GangWarsAudio;
}
