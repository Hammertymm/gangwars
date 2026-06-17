/* ============================================================================
   CRIME LEDGER UI — graphics mount (implement per docs/crime-ledger-integration-prompt.md)
   ============================================================================ */

/** Design canvas — update when new art is measured. */
const LEDGER_CANVAS = { w: 473, h: 1024 };

function ledgerRectStyle(r) {
  const { w: W, h: H } = LEDGER_CANVAS;
  return `left:${(r.x / W) * 100}%;top:${(r.y / H) * 100}%;width:${(r.w / W) * 100}%;height:${(r.h / H) * 100}%`;
}

const LedgerUI = {
  /**
   * @param {HTMLElement} app  #app mount
   * @param {object} ctx       from ledgerUiCtx() in gangwars.html
   */
  render(app, ctx) {
    if (!app || !ctx) return;
    const view = ctx.view === "category" ? "category" : "home";
    const cat = ctx.catId || "";
    app.innerHTML = `<div class="play ledger-play">
      <div class="ledger-art-screen">
        <div class="ledger-art-frame" data-ledger-view="${view}" data-ledger-cat="${cat}" data-ledger-pending="graphics">
          <p class="ledger-pending-msg">CRIME LEDGER</p>
        </div>
      </div>
    </div>`;
  },
};

if (typeof module !== "undefined") {
  module.exports = { LedgerUI, LEDGER_CANVAS, ledgerRectStyle };
}
