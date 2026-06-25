/* Market grid and trade modal for Gang Wars. */
(function(root){
  const GOODS_IMG_VERSION = "160x250-v3";

  function create(ctx){
    const app = ctx.app;
    const modalRoot = ctx.modalRoot;
    const modalEl = () => modalRoot || app;
    const render = ctx.render;
    const setModal = ctx.setModal;
    const getState = ctx.getState;
    const money = ctx.money;
    const goodsImg = Object.fromEntries(ctx.GOODS.map(d => [d.id, `assets/goods/${d.id}.png?v=${GOODS_IMG_VERSION}`]));

    function renderMarket(){
      const S = getState();
      const used = ctx.spaceUsed(S.inventory);
      const rows = ctx.GOODS.map(d=>{
        const p = S.prices[d.id];
        const have = S.inventory[d.id] || 0;
        const dead = p == null;
        return `<div class="market-row${dead?' dead':''}">
          <span class="goods-icon-wrap" data-good="${d.id}" data-initial="${(d.name||'?').charAt(0)}"><img class="goods-icon" src="${goodsImg[d.id]||''}" alt="${d.name}" onerror="this.onerror=null;this.style.display='none';this.closest('.goods-icon-wrap').classList.add('no-icon');"></span>
          <div class="card-content">
            <div class="card-name-row"><span class="goods-name">${d.name}</span></div>
            <div class="card-price-row"><span class="price-cell${dead?' na':''}">${dead?'&mdash;':money(p)}</span><span class="stock-cell${have?' have':''}">${have||'-'}</span></div>
            <div class="market-actions">
              <button class="sellbtn" data-sell="${d.id}" ${have?'':'disabled'} style="${have?'':'opacity:.28;'}">SELL</button>
              <button class="buybtn" data-buy="${d.id}" ${dead?'disabled':''}>BUY</button>
            </div>
          </div>
        </div>`;
      }).join("");
      const goldenActive = S.events?.goldenGodlike && S.day === S.events.goldenGodlike.day;
      const dayFlip = String(S.day).padStart(2, "0").split("").map(d =>
        `<div class="flip-digit"><span>${d}</span></div>`
      ).join("");
      app.innerHTML = `<div class="play market-play">
        <div class="loc-header">
          <div class="loc-copy">
            <div class="loc-header-title">${S.location}</div>
            <p class="loc-header-desc">${ctx.LOCATION_FLAVOR[S.location]||""}</p>
          </div>
          <div class="loc-day">
            <div class="day-counter" aria-label="Day ${S.day} of ${ctx.CONFIG.days}">
              <div class="day-counter-frame">
                <span class="day-counter-label">Day</span>
                <div class="day-counter-inset">
                  <div class="day-flip" aria-hidden="true">${dayFlip}</div>
                </div>
                <span class="day-counter-sub">of ${ctx.CONFIG.days}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="market-mid">
          ${goldenActive?'<div class="market-golden-banner" role="status">&#10022; Golden Shower &mdash; every price in the city &times;10 &#10022;</div>':''}
          <div class="market-head">
            <span class="market-head-title">MARKET</span>
          </div>
          <div class="market-rows">${rows}</div>
        </div>
        <div class="bot-bar">
          <div class="bot-stats">
            <div class="bot-stat"><span class="bot-label">CASH</span><span class="bot-val">${money(S.cash)}</span></div>
            <div class="bot-stat right"><span class="bot-label">DON DEBT</span><span class="bot-val red">${money(S.debt)}</span></div>
          </div>
          <div class="bot-sub">
            <span>BANK ${money(S.bank)}</span>
            <span>GUNS ${S.guns}</span>
            <span>STASH ${used}/${S.space}</span>
            <span>HP ${S.health}/${ctx.CONFIG.startHealth}</span>
          </div>
          ${S.debt>=ctx.CONFIG.maxTotalDebt*0.9?'<p class="debt-warn" role="status">The Don is losing patience, get in over $100k and its curtains</p>':''}
          <p class="save-err" id="save-err" role="alert"></p>
          <div class="actions">
            <button class="amber" id="travel">MOVE &#9654;</button>
            <button id="bankbtn" ${S.location===ctx.HOME?'':'disabled'}>THE DON / BANK</button>
          </div>
        </div>
      </div>`;
      app.querySelectorAll("[data-buy]").forEach(b=> b.onclick=()=>openTrade(b.dataset.buy,"buy"));
      app.querySelectorAll("[data-sell]").forEach(b=> b.onclick=()=>openTrade(b.dataset.sell,"sell"));
      document.getElementById("travel").onclick = ctx.renderTravel;
      const bank = document.getElementById("bankbtn");
      if (bank && S.location === ctx.HOME) bank.onclick = ctx.openBank;
      ctx.save();
    }

    function openTrade(id, mode){
      const S = getState();
      const d = ctx.GOOD[id];
      const price = S.prices[id];
      const maxFor = ()=> mode === "buy"
        ? Math.min(Math.floor(S.cash / price), ctx.spaceLeft(S))
        : (S.inventory[id] || 0);
      let qty = maxFor();
      setModal(function(){
        const S = getState();
        const max = maxFor();
        if (qty > max) qty = max;
        const avg = mode === "sell" ? ctx.avgCost(S, id) : null;
        const pct = mode === "sell" ? ctx.profitPct(S, id, price) : null;
        modalEl().innerHTML = `<div class="modal"><div class="card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <h2 id="modal-title">${mode==="buy"?"BUY":"SELL"} ${d.name}</h2>
          <p>Price <span class="price">${money(price)}</span> each<br>
            ${mode==="buy"?`can afford ${max}`:`you hold ${S.inventory[id]||0}`}</p>
          ${avg!=null?`<p class="profit ${pct>=0?'up':'down'}">Avg cost ${money(avg)} &middot; ${pct>=0?'+':''}${pct}%</p>`:''}
          <label for="qty" class="na">Quantity</label>
          <input type="number" id="qty" min="0" max="${max}" value="${qty}" inputmode="numeric" aria-label="Quantity" />
          <div class="qtybtns">
            <button data-q="1">+1</button><button data-q="10">+10</button>
            <button data-q="half">&frac12;</button><button data-q="max">MAX</button>
          </div>
          <p class="center">Total <span class="price" id="tot">${money(price*qty)}</span></p>
          <p class="err" id="terr"></p>
          <div class="btns">
            <button class="amber" id="confirm">${mode==="buy"?"BUY":"SELL"} ${qty}</button>
            <button id="cancel">CLOSE</button>
          </div>
        </div></div>`;
        const input = document.getElementById("qty");
        const total = document.getElementById("tot");
        const confirm = document.getElementById("confirm");
        const setQ = v=>{
          qty = Math.max(0, Math.min(maxFor(), Math.floor(v || 0)));
          input.value = qty;
          total.textContent = money(price * qty);
          confirm.textContent = `${mode==="buy"?"BUY":"SELL"} ${qty}`;
        };
        input.oninput = ()=>setQ(+input.value);
        modalEl().querySelectorAll("[data-q]").forEach(b=> b.onclick=()=>{
          const q = b.dataset.q;
          setQ(q === "max" ? maxFor() : q === "half" ? Math.floor(maxFor() / 2) : qty + (+q));
        });
        ctx.bindModalCard(modalEl().querySelector(".card"));
        document.getElementById("cancel").onclick = ctx.dismissModal;
        confirm.onclick = ()=>{
          const err = mode === "buy" ? ctx.buy(S, id, qty) : ctx.sell(S, id, qty);
          if (err){ document.getElementById("terr").textContent = err; ctx.audioPlay("sfx.economy.errorDeny"); return; }
          ctx.audioPlay(mode === "buy" ? "sfx.economy.coinsBuy" : "sfx.economy.cashRegister");
          if (mode === "buy") {
            ctx.recordBuy(S, id, qty, price * qty);
            ctx.recordUnitsBought(ctx.getLedger(), qty);
            ctx.saveLedger();
          } else {
            const avg = ctx.avgCost(S, id);
            const profit = avg ? (price - avg) * qty : 0;
            ctx.recordSell(S, id, qty, profit);
          }
          ctx.announce(`${mode==="buy"?"Bought":"Sold"} ${qty} ${d.name} for ${money(price*qty)}.`);
          ctx.afterMarketAction(`${mode==="buy"?"Bought":"Sold"} ${qty} ${d.name}.`);
          ctx.checkRunAchievements();
          ctx.clearModal();
          if (ctx.tryShowPostFlow()) return;
          render();
        };
      });
      render();
    }

    return { renderMarket, openTrade };
  }

  const api = { create };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.GangWarsMarketUI = api;
})(typeof window !== "undefined" ? window : globalThis);
