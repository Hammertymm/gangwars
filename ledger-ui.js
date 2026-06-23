/* ============================================================================
   CRIME LEDGER UI — v64 unified template
   Home: blueprint overlay on base PNG (unchanged).
   Categories: in-flow header image + HTML title/counter + 10-slot normal-flow rows.
   No blueprint coords for category layout. No cqh. iOS Safari safe.
   ============================================================================ */

const LEDGER_CANVAS        = { w: 473, h: 1024 };
const LEDGER_ASSET_PREFIX  = "assets/ledger/";
const LEDGER_ICON_PREFIX   = "assets/ledger/icons/";
const LEDGER_ASSET_VERSION = "67";

const LEDGER_HEADER_IMAGE = {
  general:       "ledger-header-general.jpg",
  rare:          "ledger-header-rare.jpg",
  superRare:     "ledger-header-super-rare.jpg",
  godlike:       "ledger-header-godlike.jpg",
  goldenGodlike: "ledger-header-golden-godlike.jpg",
};

function ledgerRectStyle(r) {
  const { w: W, h: H } = LEDGER_CANVAS;
  return `left:${(r.x/W)*100}%;top:${(r.y/H)*100}%;width:${(r.w/W)*100}%;height:${(r.h/H)*100}%`;
}

function ledgerAssetPath(name) {
  return `${LEDGER_ASSET_PREFIX}${name}?v=${LEDGER_ASSET_VERSION}`;
}

function ledgerIconPath(id) {
  return LEDGER_ICON_PREFIX + id + ".png";
}

function categoryCounterText(catId, found, total) {
  return `${found} / ${total} FOUND`;
}

function listPanelStyleVars(bp) { return ""; }

const HIDDEN_ACHIEVEMENT_DESC = "Discover achievement to reveal description.";

/* Achievement rows reuse the High Scores leaderboard row container (.slb-row)
   for identical height/borders/spacing; inner .ledger-row-* hooks keep the
   reveal animation working. */
function buildListRows(cat, ledger, focusId) {
  return cat.achievements.map((a, idx) => {
    const unlocked = isUnlocked(ledger, a.id);
    const revealed  = isRevealed(ledger, a.id);
    const focus     = focusId === a.id ? " reveal-focus" : "";
    let title    = "UNKNOWN";
    let desc     = HIDDEN_ACHIEVEMENT_DESC;
    let mark     = "";
    let iconSrc  = `${LEDGER_ICON_PREFIX}locked.png`;
    let iconState = "locked";
    if (revealed) {
      title    = getAchievementTitle(a.id);
      desc     = getAchievementDescription(a.id);
      if (unlocked) mark = "\u2713";
      iconSrc  = ledgerIconPath(a.id);
      iconState = "revealed";
    }
    const titleCls = revealed ? "" : " hidden";
    const descCls  = revealed ? "" : " placeholder";
    const descHtml = desc ? `<div class="ledger-row-desc${descCls}">${desc}</div>` : "";
    return `<div class="slb-row ach-row${focus}" data-aid="${a.id}">
      <span class="slb-pos">${idx + 1}.</span>
      <div class="ledger-row-icon ${iconState}"><img src="${iconSrc}" alt="" decoding="async" onerror="this.onerror=null;this.style.display='none'"></div>
      <div class="ledger-row-copy">
        <div class="ledger-row-title${titleCls}">${title}</div>
        ${descHtml}
      </div>
      <span class="ledger-row-mark">${mark}</span>
    </div>`;
  }).join("");
}

/* ── HOME PAGE shell — reuses the High Scores screen layout ─────────────────
   Hero banner + a leaderboard-style row per category (thumbnail, title,
   progress bar, found/total count). Replaces the baked-art + hotspot shell. */
function homeShell(rows, found, total) {
  const heroImg = ledgerAssetPath("crime-ledger-home-base.jpg");
  return `<div class="play scores-play ledger-home">
    <div class="scores-hero">
      <img src="${heroImg}" alt="" class="scores-hero-img ledger-home-hero-img">
      <div class="scores-hero-overlay"></div>
      <div class="scores-hero-title">
        <span class="eos-orn-line"></span>
        <span class="scores-hero-text">CRIME LEDGER</span>
        <span class="eos-orn-line r"></span>
      </div>
    </div>
    <div class="scores-lb-wrap ledger-home-list">${rows}</div>
    <div class="scores-foot ledger-home-foot">
      <div class="ledger-home-total">${found} / ${total} FOUND</div>
      <button type="button" class="full" id="ledgerBack">BACK</button>
    </div>
  </div>`;
}

/* ── CATEGORY PAGE — reuses the High Scores screen layout ───────────────────
   Header art is letterboxed behind the category title; the achievement list
   reuses the leaderboard container/rows and is the only scrolling region. */
function categoryShell(catId, cat, rows) {
  const img = ledgerAssetPath(LEDGER_HEADER_IMAGE[catId]);
  return `<div class="play scores-play ledger-scores">
    <div class="scores-hero">
      <img src="${img}" alt="" class="scores-hero-img">
      <div class="scores-hero-overlay"></div>
      <div class="scores-hero-title">
        <span class="eos-orn-line"></span>
        <span class="scores-hero-text">${cat.title}</span>
        <span class="eos-orn-line r"></span>
      </div>
    </div>
    <div class="scores-lb-wrap ach-list">${rows}</div>
    <div class="scores-foot"><button type="button" class="full" id="ledgerBack">BACK</button></div>
  </div>`;
}

/* ── REVEAL ANIMATION ───────────────────────────────────────────────────── */
function runRevealAnimation(rowEl, achievementId, onDone) {
  const titleEl  = rowEl.querySelector(".ledger-row-title");
  const descEl   = rowEl.querySelector(".ledger-row-desc");
  const iconImg  = rowEl.querySelector(".ledger-row-icon img");
  const iconWrap = rowEl.querySelector(".ledger-row-icon");
  const fullText = getAchievementTitle(achievementId);
  const fullDesc = getAchievementDescription(achievementId);
  const chars    = fullText.length;
  const steps    = Math.max(chars, 1);
  const duration = Math.min(1000, Math.max(500, chars * 35));
  const stepMs   = duration / steps;
  let i = 0;
  titleEl.textContent = "Unknown";
  titleEl.classList.add("hidden");
  if (descEl) { descEl.textContent = ""; descEl.classList.add("placeholder"); }
  rowEl.classList.add("reveal-focus");
  const tick = () => {
    i++;
    const shown = Math.ceil((i / steps) * chars);
    titleEl.textContent = fullText.slice(0, shown) + "?".repeat(Math.max(0, chars - shown));
    if (i >= steps) {
      titleEl.textContent = fullText;
      titleEl.classList.remove("hidden");
      if (descEl) { descEl.textContent = fullDesc; descEl.classList.remove("placeholder"); }
      const markEl = rowEl.querySelector(".ledger-row-mark");
      if (markEl) markEl.textContent = "\u2713";
      if (iconImg)  iconImg.src = ledgerIconPath(achievementId);
      if (iconWrap) { iconWrap.classList.remove("locked"); iconWrap.classList.add("revealed"); }
      onDone();
      return;
    }
    setTimeout(tick, stepMs);
  };
  setTimeout(tick, stepMs);
}

/* ── PUBLIC API ─────────────────────────────────────────────────────────── */
const LedgerUI = {
  renderHome(app, ctx) {
    const found = countDiscovered(ctx.ledger);
    const rows = LEDGER_CATEGORIES.map((cat, idx) => {
      const n     = countUnlocked(ctx.ledger, cat.id);
      const total = cat.achievements.length;
      const pct   = total ? Math.round((n / total) * 100) : 0;
      const done  = total && n >= total ? " complete" : "";
      const img   = ledgerAssetPath(LEDGER_HEADER_IMAGE[cat.id]);
      return `<button type="button" class="slb-row ledger-home-row${done}" data-cat="${cat.id}" aria-label="${cat.title}, ${n} of ${total} found">
        <span class="slb-pos">${idx + 1}.</span>
        <div class="ledger-home-thumb"><img src="${img}" alt="" decoding="async" onerror="this.onerror=null;this.style.display='none'"></div>
        <div class="ledger-home-copy">
          <div class="ledger-home-title">${cat.title}</div>
          <div class="ledger-home-bar"><span style="width:${pct}%"></span></div>
        </div>
        <span class="ledger-home-count">${n} / ${total}</span>
        <span class="ledger-home-chev" aria-hidden="true">›</span>
      </button>`;
    }).join("");
    app.innerHTML = homeShell(rows, found, LEDGER_TOTAL);
    LEDGER_CATEGORIES.forEach(cat => {
      const btn = app.querySelector(`[data-cat="${cat.id}"]`);
      if (btn) btn.onclick = () => ctx.onOpenCategory(cat.id);
    });
    document.getElementById("ledgerBack").onclick = ctx.onBackHome;
  },

  renderCategory(app, catId, ctx) {
    const cat = LEDGER_CATEGORIES.find(c => c.id === catId);
    if (!cat) { ctx.onBackHome(); return; }
    const rows = buildListRows(cat, ctx.ledger, ctx.focusId);
    app.innerHTML = categoryShell(catId, cat, rows);
    document.getElementById("ledgerBack").onclick = ctx.onBackCategory;
    if (ctx.focusId && isUnlocked(ctx.ledger, ctx.focusId) && !isRevealed(ctx.ledger, ctx.focusId)) {
      const row = app.querySelector(`[data-aid="${ctx.focusId}"]`);
      if (row) {
        runRevealAnimation(row, ctx.focusId, () => {
          revealAchievement(ctx.ledger, ctx.focusId);
          ctx.onRevealComplete();
        });
      }
    } else if (ctx.focusId) {
      const row = app.querySelector(`[data-aid="${ctx.focusId}"]`);
      const list = app.querySelector(".ach-list");
      if (row && list) row.scrollIntoView({ block: "nearest" });
    }
  },

  render(app, ctx) {
    if (!app || !ctx) return;
    if (ctx.view === "category" && ctx.catId) {
      this.renderCategory(app, ctx.catId, ctx);
    } else {
      this.renderHome(app, ctx);
    }
  },
};

if (typeof module !== "undefined") {
  module.exports = { LedgerUI, LEDGER_CANVAS, ledgerRectStyle, buildListRows, listPanelStyleVars };
}
