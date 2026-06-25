/* Bank / Don modal flow for Gang Wars. */
(function(root){
  function create(ctx){
    const app = ctx.app;
    const modalRoot = ctx.modalRoot;
    const modalEl = () => modalRoot || app;
    const render = ctx.render;
    const setModal = ctx.setModal;
    const dismissModal = ctx.dismissModal;
    const bindModalCard = ctx.bindModalCard;
    const getState = ctx.getState;
    const money = ctx.money;
    const audioPlay = ctx.audioPlay;

    function openBank(){
      const S = getState();
      ctx.emitTipEvent("bank:opened", { location: S.location, returnVisit: !!S.runStats?.leftHome });
      if (ctx.tryShowPostFlow()) return;
      let action = null;
      setModal(function(){
        const S = getState();
        const actions = {
          repay:    {label:"Pay the Don", max:Math.min(S.cash,S.debt), fn:v=>ctx.bankRepay(S,v), msg:v=>`Paid the Don ${money(v)}.`},
          borrow:   {label:"Borrow",      max:ctx.maxBorrowAmount(S),  fn:v=>ctx.bankBorrow(S,v), msg:v=>`Borrowed ${money(v)} from the Don.`},
          deposit:  {label:"Deposit",     max:ctx.bankDepositLimit(S), fn:v=>ctx.bankDeposit(S,v), msg:v=>`Banked ${money(v)}.`},
          withdraw: {label:"Withdraw",    max:S.bank,                  fn:v=>ctx.bankWithdraw(S,v), msg:v=>`Withdrew ${money(v)}.`},
        };
        if(!action){
          modalEl().innerHTML = `<div class="modal"><div class="card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <h2 id="modal-title">THE FAMILY VAULT</h2>
            <p>Your debt to the Don stands at <b class="red">${money(S.debt)}</b> &mdash; and it's climbing ${Math.round(ctx.CONFIG.loanInterest*100)}%/day.</p>
            <p>Bank <b>${money(S.bank)}</b> <span class="na">(+${Math.round(ctx.effectiveBankInterest(S)*100)}%/day)</span> &middot; Cash <b>${money(S.cash)}</b></p>
            <p class="na">The Don caps total debt at ${money(ctx.CONFIG.maxTotalDebt)}.</p>
            <div class="btns">
              <button class="amber" data-a="repay" ${S.debt>0&&S.cash>0?'':'disabled'}>SETTLE UP</button>
              <button data-a="borrow" ${ctx.maxBorrowAmount(S)>0?'':'disabled'}>BORROW</button>
              <button data-a="deposit" ${S.cash>0?'':'disabled'}>DEPOSIT</button>
              <button data-a="withdraw" ${S.bank>0?'':'disabled'}>WITHDRAW</button>
            </div>
            <button class="full" id="close" style="margin-top:10px">DONE</button>
          </div></div>`;
          modalEl().querySelectorAll("[data-a]").forEach(b=> b.onclick=()=>{ action=b.dataset.a; render(); });
          bindModalCard(modalEl().querySelector(".card"));
          document.getElementById("close").onclick=dismissModal;
        } else {
          const a=actions[action]; let qty=a.max>0?a.max:0;
          modalEl().innerHTML = `<div class="modal"><div class="card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <h2 id="modal-title">${a.label.toUpperCase()}</h2>
            <p>Max <span class="price">${money(a.max)}</span> &middot; Cash ${money(S.cash)}</p>
            <label for="amt" class="na">Amount</label>
            <input type="number" id="amt" min="0" max="${a.max}" value="${qty}" inputmode="numeric" aria-label="Amount" />
            <div class="qtybtns">
              <button data-q="1000">+1k</button><button data-q="10000">+10k</button>
              <button data-q="half">&frac12;</button><button data-q="max">MAX</button>
            </div>
            <div class="btns"><button class="amber" id="ok">CONFIRM</button><button id="back">BACK</button></div>
            <p class="err" id="berr"></p>
          </div></div>`;
          const input=document.getElementById("amt");
          const setQ=v=>{ qty=Math.max(0,Math.min(a.max,Math.floor(v||0))); input.value=qty; document.getElementById("berr").textContent=""; };
          input.oninput=()=>setQ(+input.value);
          modalEl().querySelectorAll("[data-q]").forEach(b=> b.onclick=()=>{ const q=b.dataset.q;
            setQ(q==="max"?a.max:q==="half"?Math.floor(a.max/2):qty+(+q)); });
          bindModalCard(modalEl().querySelector(".card"));
          document.getElementById("back").onclick=()=>{ action=null; render(); };
          document.getElementById("ok").onclick=()=>{
            if(qty<=0){ document.getElementById("berr").textContent="Enter an amount."; audioPlay("sfx.economy.errorDeny"); return; }
            const err = a.fn(qty);
            if(err){ document.getElementById("berr").textContent=err; audioPlay("sfx.economy.errorDeny"); return; }
            const bankSounds = { repay: "sfx.economy.debtPaid", borrow: "sfx.economy.loanTaken", deposit: "sfx.economy.bills", withdraw: "sfx.economy.bills" };
            audioPlay(bankSounds[action]);
            if (action === 'borrow') ctx.recordBorrow(S);
            if (action === 'deposit') { ctx.recordBankDeposit(ctx.getLedger(), qty); ctx.saveLedger(); }
            ctx.announce(a.msg(qty));
            ctx.afterMarketAction(a.msg(qty));
            ctx.checkRunAchievements();
            action=null;
            if (ctx.tryShowPostFlow()) return;
            render();
          };
        }
      });
      render();
    }

    return { openBank };
  }

  const api = { create };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.GangWarsBankUI = api;
})(typeof window !== "undefined" ? window : globalThis);
