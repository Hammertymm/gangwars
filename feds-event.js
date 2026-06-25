/* Feds encounter flow for Gang Wars. */
(function(root){
  function create(ctx){
    const getState = ctx.getState;
    const getAudio = ctx.getAudio;
    const app = ctx.app;
    const modalRoot = ctx.modalRoot;
    const modalEl = () => modalRoot || app;
    const render = ctx.render;
    const money = ctx.money;
    const randInt = ctx.randInt;
    const chance = ctx.chance;
    const pick = ctx.pick;

    function resolveFedsAudio(){
      const audio = getAudio && getAudio();
      if (audio) {
        audio.duckMusic(false);
        audio.stopTensionMusic();
      }
    }

    function eventFeds(next){
      const S = getState();
      if (S.guns === 0) ctx.emitTipEvent("event:fedsUnarmed", { guns: 0 });
      let maxCops = 1 + Math.min(3, Math.floor(S.day / 8));
      if (S.day > 20) maxCops += 1;
      let cops = randInt(1, maxCops);
      let fightRound = 0;
      let fedsAudioStarted = false;
      const bribeScale = S.day > 20 ? 1.5 : 1;

      const draw = (msg)=>{
        ctx.setModal(function(){
          const S = getState();
          const canFight = S.guns > 0;
          if (!fedsAudioStarted) {
            ctx.audioPlay("sfx.combat.siren");
            const audio = getAudio && getAudio();
            if (audio) {
              audio.duckMusic(true);
              audio.playMusic("music.fedsTension");
            }
            fedsAudioStarted = true;
          }
          const imgSrc = ctx.eventImgSrc('feds');
          modalEl().innerHTML=`<div class="modal"><div class="ev-popup" role="dialog" aria-modal="true">
            <div class="ev-left" style="background-image:url('${imgSrc}')" role="img" aria-label="The Feds"></div>
            <div class="ev-right">
              <div class="ev-body"><div>
                Agent Hayes spotted you &mdash; <b>${cops}</b> ${cops>1?'agents':'agent'} closing in.<br><br>
                HP: <b>${S.health}/${ctx.CONFIG.startHealth}</b> &nbsp;&middot;&nbsp; Guns: <b>${S.guns}</b>
                ${msg?`<br><br><span style="color:var(--red)">${msg}</span>`:''}
              </div></div>
              <div class="ev-acts">
                <button class="red full" id="fight"${canFight?'':' style="opacity:.32"'}>FIGHT</button>
                <button class="full" id="run">RUN</button>
                <button class="amber full" id="bribe">PAYOFF</button>
                ${!canFight?"<span class=\"ev-warn\">No gun &mdash; can't fight back.</span>":''}
              </div>
            </div>
          </div></div>`;
          ctx.fitEventPopupToImage(imgSrc);
          document.getElementById("run").onclick = doRun;
          document.getElementById("bribe").onclick = doBribe;
          const fight = document.getElementById("fight");
          fight.onclick = ()=>{ if (canFight) doFight(); else ctx.audioPlay("sfx.combat.emptyClick"); };
          ctx.setModalEscape(null);
        });
        render();
      };

      const hit = ()=>{
        const S = getState();
        ctx.audioPlay("sfx.combat.punchOof", { variant: "random" });
        S.health -= 1;
        if (S.health <= 0) {
          ctx.audioPlay("sfx.combat.deathSting");
          ctx.endGame("The city has a short memory. By morning nobody will remember your name.");
          return true;
        }
        return false;
      };

      const doFight = ()=>{
        const S = getState();
        fightRound++;
        const copsBefore = cops;
        cops = ctx.fedsApplyFightKill(S, cops, fightRound);
        if (cops <= 0) {
          const reward = randInt(3750, 10000);
          S.cash += reward;
          ctx.grantDebtInterestFreeze(S, 1);
          ctx.recordFedFightWin(S);
          ctx.logMsg(`Beat the Feds, grabbed ${money(reward)}.`);
          ctx.clearModal();
          ctx.audioPlay("sfx.combat.tommyBurst");
          resolveFedsAudio();
          const winV = pick([
            `The smoke clears. The Feds don't get up. You do. The city has a long memory for days like this.`,
            `By evening the headlines had improved your reputation and damaged the truth. You can live with both.`,
            `Another raid fails. Another detective writes a longer report. Business resumes before the ink is dry.`,
            `They expected an easy arrest. They found you instead. Someone back at headquarters has difficult paperwork ahead.`,
            `Witnesses suddenly remembered urgent appointments. The official report will be remarkably uncomplicated.`,
            `A boy in a pressed suit tips his hat. "Big Daddy heard." He says nothing else. He doesn't need to.`,
            `Nobody saw enough to testify. Those who did suddenly remembered other appointments.`,
            `Agent Hayes tips his hat before limping off. Even he knows when today's argument is over.`,
            `Somebody underestimated you. The city won't make that mistake twice.`,
            `The street empties, the smoke settles, and Manhattan carries on as though nothing happened.`,
          ]);
          ctx.showEvent('feds', winV, "GO", next);
          return;
        }
        if (cops < copsBefore) ctx.audioPlay("sfx.combat.gunshot");
        if (chance(ctx.fedsCounterHitChance(S.guns, fightRound, S.day))) {
          if (hit()) return;
          draw("You took a hit!");
        } else {
          ctx.audioPlay("sfx.combat.emptyClick");
          draw("You missed \u2014 they're still on you.");
        }
      };

      const doRun = ()=>{
        const S = getState();
        if (chance(0.62)) {
          ctx.logMsg("Vanished into the streets.");
          ctx.clearModal();
          ctx.audioPlay("sfx.travel.screech");
          resolveFedsAudio();
          const runV = pick([
            `You turn one corner, then another. By the time the whistles catch up, you're already somebody else's problem.`,
            `Lunch hour arrives at exactly the right moment. A hundred hats later, even you couldn't pick yourself out.`,
            `The city keeps secrets. Today one of them kept you.`,
            `A brass band rounds the corner. By the final chorus you're applauding with everyone else.`,
            `You borrow a solemn face and join the mourners. Nobody questions grief.`,
            `They chase the obvious route. You stopped being obvious years ago.`,
            `You step onto a train just as the doors close. The Feds arrive in time to watch it leave.`,
            `You swap hats with a stranger. Five seconds later the Feds arrest a very confused insurance salesman.`,
            `You straighten your tie, slow your pace, and become just another citizen with somewhere to be.`,
            `Tomorrow's paper will report a dramatic pursuit. It won't mention where you stopped for lunch.`,
          ]);
          ctx.showEvent('feds', runV, "PHEW", next);
          return;
        }
        if (hit()) return;
        const owned = Object.keys(S.inventory);
        if (owned.length) {
          const id = pick(owned);
          const lost = Math.min(S.inventory[id], randInt(1, 5));
          S.inventory[id] -= lost;
          if (S.inventory[id] <= 0) delete S.inventory[id];
          ctx.logMsg(`Fled but dropped ${lost} ${ctx.GOOD[id].name} and took a hit.`);
        }
        draw("Couldn't shake them \u2014 took a hit and dropped some goods.");
      };

      const doBribe = ()=>{
        const S = getState();
        const cost = Math.min(S.cash, Math.round(randInt(2000, 8000) * cops * bribeScale));
        if (cost <= 0 || cost > S.cash) {
          draw("Nothing to pay them with.");
          return;
        }
        S.cash -= cost;
        ctx.logMsg(`Counted out ${money(cost)} into an open palm.`);
        ctx.clearModal();
        ctx.audioPlay("sfx.events.bribePaid");
        resolveFedsAudio();
        const brV = pick([
          `The money changes hands. Memories become remarkably unreliable. The street returns to normal.`,
          `The officer counts the cash twice, thanks you for your cooperation, and wishes you a pleasant afternoon.`,
          `Your contribution to public safety has been gratefully acknowledged.`,
          `Several receipts change hands. None explain what actually happened.`,
          `Before you reach for your wallet the officer nods. "Big Daddy already handled it."`,
          `Your name disappears from the paperwork before the ink has time to dry.`,
          `The paperwork moves with astonishing efficiency once accompanied by folding money.`,
          `Neither of you mentions the money. That's how you know you're both professionals.`,
          `"Would you like a receipt?" he asks. You both enjoy the joke more than expected.`,
          `"Best not mention this to Internal Affairs," he says. "They're happiest when they're surprised."`,
        ]);
        ctx.showEvent('feds', brV, "OK", next);
      };

      draw(null);
    }

    return { eventFeds };
  }

  const api = { create };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.GangWarsFedsEvent = api;
})(typeof window !== "undefined" ? window : globalThis);
