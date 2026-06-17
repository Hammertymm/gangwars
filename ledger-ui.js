/* ============================================================================
   CRIME LEDGER UI — reference PNG base + transparent dynamic overlays
   Blueprint: ledger-blueprint.js (generated from scripts/ledger-blueprint.json)
   ============================================================================ */

const LEDGER_CANVAS = { w: 473, h: 1024 };
const LEDGER_ASSET_PREFIX = "assets/ledger/";
const LEDGER_ICON_PREFIX = "assets/ledger/icons/";
const LOCKED_PLACEHOLDER = "Achievement not yet discovered.";

function ledgerRectStyle(r) {
  const { w: W, h: H } = LEDGER_CANVAS;
  return `left:${(r.x / W) * 100}%;top:${(r.y / H) * 100}%;width:${(r.w / W) * 100}%;height:${(r.h / H) * 100}%`;
}

function ledgerAssetPath(name) {
  return LEDGER_ASSET_PREFIX + name;
}

function ledgerIconPath(id) {
  return LEDGER_ICON_PREFIX + id + ".png";
}

function ledgerCounterHtml(text, rect, cls) {
  return `<div class="ledger-counter${cls ? " " + cls : ""}" style="${ledgerRectStyle(rect)}">${text}</div>`;
}

function categoryCounterText(catId, found, total) {
  if (catId === "general") return `${found} / ${total} FOUND`;
  return `${found} OF ${total} DISCOVERED`;
}

function listPanelStyleVars(bp) {
  const rowPct = ((bp.rowHeight / bp.listPanel.h) * 100).toFixed(4);
  const iconScale = (bp.iconBox.h / bp.rowHeight).toFixed(4);
  const iconPadPct = ((bp.iconBox.x / bp.listPanel.w) * 100).toFixed(3);
  return `--row-h:${rowPct}%;--icon-scale:${iconScale};--icon-pad:${iconPadPct}%`;
}

function buildListRows(cat, ledger, focusId) {
  const isGeneral = cat.id === "general";
  return cat.achievements.map(a => {
    const unlocked = isUnlocked(ledger, a.id);
    const revealed = isRevealed(ledger, a.id);
    const focus = focusId === a.id ? " reveal-focus" : "";
    const showContent = revealed;
    const iconSrc = showContent ? ledgerIconPath(a.id) : LEDGER_ICON_PREFIX + "locked.png";
    let title = isGeneral ? "???" : "UNKNOWN";
    let desc = LOCKED_PLACEHOLDER;
    let mark = "";
    if (showContent) {
      title = getAchievementTitle(a.id);
      desc = getAchievementDescription(a.id);
      if (unlocked) mark = "✓";
    }
    const titleCls = showContent ? "" : " hidden";
    const descCls = showContent ? "" : " placeholder";
    return `<div class="ledger-list-row${focus}" data-aid="${a.id}">
      <div class="ledger-row-icon${showContent ? " revealed" : " locked"}">
        <img src="${iconSrc}" alt="" decoding="async">
      </div>
      <div class="ledger-row-copy">
        <div class="ledger-row-title${titleCls}">${title}</div>
        <div class="ledger-row-desc${descCls}">${desc}</div>
      </div>
      <span class="ledger-row-mark">${mark}</span>
    </div>`;
  }).join("");
}

function ledgerShell(baseAsset, overlayHtml, hitHtml, backRect) {
  const { w, h } = LEDGER_CANVAS;
  return `<div class="play ledger-play"><div class="ledger-art-screen"><div class="ledger-art-frame">
    <img src="${ledgerAssetPath(baseAsset)}" width="${w}" height="${h}" decoding="async" alt="">
    <div class="ledger-overlay-layer">${overlayHtml}</div>
    ${hitHtml}
    <button type="button" class="ledger-hit" id="ledgerBack" aria-label="Back" style="${ledgerRectStyle(backRect)}"></button>
  </div></div></div>`;
}

function runRevealAnimation(rowEl, achievementId, onDone) {
  const titleEl = rowEl.querySelector(".ledger-row-title");
  const descEl = rowEl.querySelector(".ledger-row-desc");
  const iconImg = rowEl.querySelector(".ledger-row-icon img");
  const iconWrap = rowEl.querySelector(".ledger-row-icon");
  const fullText = getAchievementTitle(achievementId);
  const fullDesc = getAchievementDescription(achievementId);
  const chars = fullText.length;
  const steps = Math.max(chars, 1);
  const duration = Math.min(1000, Math.max(500, chars * 35));
  const stepMs = duration / steps;
  let i = 0;
  titleEl.textContent = "???";
  titleEl.classList.add("hidden");
  descEl.textContent = "";
  descEl.classList.add("placeholder");
  rowEl.classList.add("reveal-focus");
  const tick = () => {
    i++;
    const shown = Math.ceil((i / steps) * chars);
    titleEl.textContent = fullText.slice(0, shown) + "?".repeat(Math.max(0, chars - shown));
    if (i >= steps) {
      titleEl.textContent = fullText;
      titleEl.classList.remove("hidden");
      descEl.textContent = fullDesc;
      descEl.classList.remove("placeholder");
      const markEl = rowEl.querySelector(".ledger-row-mark");
      if (markEl) markEl.textContent = "✓";
      if (iconImg) iconImg.src = ledgerIconPath(achievementId);
      if (iconWrap) {
        iconWrap.classList.remove("locked");
        iconWrap.classList.add("revealed");
      }
      onDone();
      return;
    }
    setTimeout(tick, stepMs);
  };
  setTimeout(tick, stepMs);
}

const LedgerUI = {
  renderHome(app, ctx) {
    const bp = LEDGER_BLUEPRINT.home;
    const found = countDiscovered(ctx.ledger);
    const counters = ledgerCounterHtml(`${found} / ${LEDGER_TOTAL} FOUND`, bp.totalCounter, "total");
    const rowParts = bp.rowCounters.map(rc => {
      const cat = LEDGER_CATEGORIES.find(c => c.id === rc.id);
      const n = countUnlocked(ctx.ledger, rc.id);
      return ledgerCounterHtml(`${n} / ${cat.achievements.length}`, rc, "row");
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
    const bp = LEDGER_BLUEPRINT[catId];
    if (!cat || !bp) {
      ctx.onBackHome();
      return;
    }
    const found = countUnlocked(ctx.ledger, catId);
    const rows = buildListRows(cat, ctx.ledger, ctx.focusId);
    const scrollCls = bp.scroll ? " scroll" : "";
    const panelStyle = ledgerRectStyle(bp.listPanel);
    const inner = ledgerCounterHtml(categoryCounterText(catId, found, cat.achievements.length), bp.counter, "cat")
      + `<div class="ledger-list-panel${scrollCls}" style="${panelStyle}">`
      + `<div class="ledger-list-inner" style="${listPanelStyleVars(bp)}">${rows}</div></div>`;
    app.innerHTML = ledgerShell(bp.baseAsset, inner, "", bp.back);
    document.getElementById("ledgerBack").onclick = ctx.onBackCategory;
    if (ctx.focusId && isUnlocked(ctx.ledger, ctx.focusId) && !isRevealed(ctx.ledger, ctx.focusId) && catId === "general") {
      const row = app.querySelector(`[data-aid="${ctx.focusId}"]`);
      if (row) {
        runRevealAnimation(row, ctx.focusId, () => {
          revealAchievement(ctx.ledger, ctx.focusId);
          ctx.onRevealComplete();
        });
      }
    } else if (ctx.focusId) {
      const row = app.querySelector(`[data-aid="${ctx.focusId}"]`);
      if (row) row.scrollIntoView({ block: "nearest" });
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
  module.exports = { LedgerUI, LEDGER_CANVAS, ledgerRectStyle };
}
