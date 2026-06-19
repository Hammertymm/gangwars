/* ============================================================================
   CRIME LEDGER UI — v63 unified template
   Home: blueprint overlay on base PNG (unchanged).
   Categories: in-flow header image + HTML title/counter + 10-slot normal-flow rows.
   No blueprint coords for category layout. No cqh. iOS Safari safe.
   ============================================================================ */

const LEDGER_CANVAS        = { w: 473, h: 1024 };
const LEDGER_ASSET_PREFIX  = "assets/ledger/";
const LEDGER_ICON_PREFIX   = "assets/ledger/icons/";
const LEDGER_ASSET_VERSION = "65";

const LEDGER_HEADER_IMAGE = {
  general:       "ledger-header-general.png",
  rare:          "ledger-header-rare.png",
  superRare:     "ledger-header-super-rare.png",
  godlike:       "ledger-header-godlike.png",
  goldenGodlike: "ledger-header-golden-godlike.png",
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

function ledgerCounterHtml(text, rect, cls) {
  return `<div class="ledger-counter${cls ? " "+cls : ""}" style="${ledgerRectStyle(rect)}">${text}</div>`;
}

function ledgerRowLabelHtml(title, count, total, rect) {
  return `<div class="ledger-row-label" style="${ledgerRectStyle(rect)}">${count} / ${total}</div>`;
}

function categoryCounterText(catId, found, total) {
  if (catId === "general") return `${found} / ${total} FOUND`;
  return `${found} OF ${total} DISCOVERED`;
}

function listPanelStyleVars(bp) { return ""; }

const HIDDEN_ACHIEVEMENT_DESC = "Achievement not yet discovered.";

function buildListRows(cat, ledger, focusId) {
  const isGeneral = cat.id === "general";
  return cat.achievements.map(a => {
    const unlocked = isUnlocked(ledger, a.id);
    const revealed  = isRevealed(ledger, a.id);
    const focus     = focusId === a.id ? " reveal-focus" : "";
    const hiddenTitle = isGeneral ? "???" : "UNKNOWN";
    let title    = hiddenTitle;
    let desc     = HIDDEN_ACHIEVEMENT_DESC;
    let mark     = "";
    let iconHtml = `<div class="ledger-row-icon locked"><img src="${LEDGER_ICON_PREFIX}locked.png" alt="" decoding="async"></div>`;
    if (revealed) {
      title    = getAchievementTitle(a.id);
      desc     = getAchievementDescription(a.id);
      if (unlocked) mark = "\u2713";
      iconHtml = `<div class="ledger-row-icon revealed"><img src="${ledgerIconPath(a.id)}" alt="" decoding="async"></div>`;
    }
    const titleCls = revealed ? "" : " hidden";
    const descCls  = revealed ? "" : " placeholder";
    return `<div class="ledger-list-row${focus}" data-aid="${a.id}">
      ${iconHtml}
      <div class="ledger-row-copy">
        <div class="ledger-row-title${titleCls}">${title}</div>
        <div class="ledger-row-desc${descCls}">${desc}</div>
      </div>
      <span class="ledger-row-mark">${mark}</span>
    </div>`;
  }).join("");
}

/* ── HOME PAGE shell — blueprint overlay, unchanged ─────────────────────── */
function ledgerShell(baseAsset, overlayHtml, hitHtml, backRect) {
  const { w, h } = LEDGER_CANVAS;
  return `<div class="play ledger-play"><div class="ledger-art-screen"><div class="ledger-art-frame">
    <img src="${ledgerAssetPath(baseAsset)}" width="${w}" height="${h}" decoding="async" alt="">
    <div class="ledger-overlay-layer">${overlayHtml}</div>
    ${hitHtml}
    <button type="button" class="ledger-hit" id="ledgerBack" aria-label="Back" style="${ledgerRectStyle(backRect)}"></button>
  </div></div></div>`;
}

/* ── CATEGORY PAGE — unified template shell ─────────────────────────────── */
function categoryShell(catId, cat, counterText, rows) {
  const img = ledgerAssetPath(LEDGER_HEADER_IMAGE[catId]);
  return `<div class="play ledger-play ledger-template-page">
    <div class="ledger-tpl-inner">
      <img class="ledger-tpl-img" src="${img}" alt="" decoding="async">
      <div class="ledger-tpl-header">
        <div class="ledger-tpl-title">${cat.title}</div>
        <div class="ledger-tpl-divider"><span class="ledger-tpl-ornament">&#x2B29;&#x25C6;&#x2B29;</span></div>
        <div class="ledger-tpl-counter">${counterText}</div>
        <div class="ledger-tpl-divider"><span class="ledger-tpl-ornament">&#x2B29;&#x25C6;&#x2B29;</span></div>
      </div>
      <div class="ledger-tpl-separator"></div>
      <div class="ledger-tpl-list">${rows}</div>
      <button type="button" class="ledger-tpl-back" id="ledgerBack">BACK</button>
    </div>
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
  titleEl.textContent = "???";
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
    const bp    = LEDGER_BLUEPRINT.home;
    const found = countDiscovered(ctx.ledger);
    const counters = ledgerCounterHtml(`${found} / ${LEDGER_TOTAL} FOUND`, bp.totalCounter, "total");
    const rowParts = (bp.rowLabels || bp.rowCounters).map(rl => {
      const cat = LEDGER_CATEGORIES.find(c => c.id === rl.id);
      const n   = countUnlocked(ctx.ledger, rl.id);
      return ledgerRowLabelHtml(cat.title, n, cat.achievements.length, rl);
    }).join("");
    const hits = bp.rowHits.map(rh => {
      const cat = LEDGER_CATEGORIES.find(c => c.id === rh.id);
      return `<button type="button" class="ledger-hit" data-cat="${rh.id}" aria-label="${cat.title}" style="${ledgerRectStyle(rh)}"></button>`;
    }).join("");
    app.innerHTML = ledgerShell(bp.baseAsset, counters + rowParts, hits, bp.back);
    bp.rowHits.forEach(rh => {
      const btn = app.querySelector(`[data-cat="${rh.id}"]`);
      if (btn) btn.onclick = () => ctx.onOpenCategory(rh.id);
    });
    document.getElementById("ledgerBack").onclick = ctx.onBackHome;
  },

  renderCategory(app, catId, ctx) {
    const cat = LEDGER_CATEGORIES.find(c => c.id === catId);
    if (!cat) { ctx.onBackHome(); return; }
    const found       = countUnlocked(ctx.ledger, catId);
    const counterText = categoryCounterText(catId, found, cat.achievements.length);
    const rows        = buildListRows(cat, ctx.ledger, ctx.focusId);
    app.innerHTML     = categoryShell(catId, cat, counterText, rows);
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
      const list = app.querySelector(".ledger-tpl-list");
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
