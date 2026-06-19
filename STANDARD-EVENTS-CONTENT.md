# Gang Wars — Standard Event Content Reference

> **Generated from:** `gangwars.html` (UI copy, variants, buttons) and `engine.js` (mechanics, rare/super/godlike data)  
> **Purpose:** Full text export for content analysis and editing. Every variant, button label, template variable, and mechanic note is included.

---

## How to read this document

| Symbol | Meaning |
|--------|---------|
| `{ITEM}` | Replaced at runtime with the affected good’s display name (e.g. `Bathtub Gin`) |
| `${n}` | Random quantity (see event mechanics) |
| `${d.name}` | Random good’s display name from `GOODS` |
| `${money(...)}` | Formatted currency (e.g. `$1,495`) |
| `${loss}` | Cash lost (mugging) |
| `${cost}` | Purchase cost (stash upgrade / gun) |
| `${add}` | Stash space added |
| `${reward}` | Cash reward (Feds fight win) |
| `${cops}` | Number of federal agents |
| `${gk.district}` / `${sr.district}` / `${re.district}` | District name from event roll |
| `${spikeGood.name}` | Rare event commodity display name |
| `${golden.lines[0]}` / `${golden.lines[1]}` | Headline lines from `engine.js` |
| `${re.lines[0]}` / `${re.lines[1]}` | Rare event headline lines |
| `${sr.lines[0]}` / `${sr.lines[1]}` | Super rare headline lines |

**Variant titles** in `[title, body]` arrays are stored in code but **not shown in the popup** — only the body string is rendered. Titles are listed here for completeness.

---

## Goods (for `{ITEM}` / random pick context)

| ID | Display name |
|----|--------------|
| `moonshine` | Moonshine |
| `cigars` | Cuban Cigars |
| `bathgin` | Bathtub Gin |
| `art` | Forged Art |
| `scotch` | Aged Scotch |
| `counterfeits` | Counterfeits |
| `cognac` | Fine Cognac |
| `furcoats` | Fur Coats |
| `champagne` | Champagne |
| `diamonds` | Diamonds |

---

## Standard event art map (`EV_IMG`)

| Category key | Image file | Used for |
|--------------|------------|----------|
| `shortage` | `events/shortage.png` | Market spike anomaly |
| `frenzy` | `events/buying_frenzy.png` | Market surge anomaly |
| `flood` | `events/flooded_market.png` | Market flood anomaly |
| `find` | `events/dead_drop.png` | Dead drop / free goods |
| `stash` | `events/upgrade_available.png` | Stash upgrade offer |
| `gun` | `events/packing_iron.png` | Gun purchase offer |
| `feds` | `events/the_feds.png` | Federal encounter |
| `mugging` | `events/ambushed_rolled.png` | Ambush / robbery |
| `intel` | `events/rare_event_intel.png` | Rare event popup (fallback) |
| `celeb` | `events/super_rare_event.png` | Super rare popup (fallback) |
| `bigdaddy` | `cards/big-daddy-j.png` | Golden godlike popup (fallback) |

Individual rare/super/godlike events use their own PNG paths from `engine.js` when set (e.g. `events/rare_capone.png`).

---

# PART 1 — MARKET ANOMALY EVENTS (on travel)

Triggered when no golden/godlike/super/rare market event takes priority. Engine rolls anomaly on **38%** of travels (`rollMarket`). Within anomaly: **34%** spike, **21%** surge (0.34–0.55), **45%** flood.

Popup: single button **`NOTED`**. Image from `anomalyImg` mapping: spike→shortage, surge→frenzy, flood→flood.

Body = one random string from `ANOMALY_BODIES[type]` with `{ITEM}` → `anomaly.itemName`.

---

## 1. SPIKE / SHORTAGE (`type: 'spike'`)

**Price effect:** selected good × **4**  
**Image:** `events/shortage.png`

### Variant 1
The Feds hit three stash houses overnight. You won't find {ITEM} on the streets anymore. Name your price.

### Variant 2
The Feds have been busy. They seized half the {ITEM} moving through this city — it's locked in an evidence locker downtown. Prices just went through the roof.

### Variant 3
Nobody knows how the Feds knew where to look. Somebody talked. Now there's no {ITEM} left on the street and everyone's pointing fingers at each other.

### Variant 4
Word is the Feds have a new list and every name on it dealt in {ITEM}. The smart ones cleared out. What's left on the street is selling for a king's ransom.

### Variant 5
Word on the street is Big Daddy J quietly bought up every available unit of {ITEM} in three districts before dawn. Nobody knows why. Nobody asks why. The shortage is total and the price is his to set.

### Variant 6
BDJ put the word out last night that he won't be moving {ITEM} through his usual channels this week. When Big Daddy J steps back from a market, everyone else follows. The supply has dried up overnight.

### Variant 7
Father Dempsey at St Anthony's delivered a Sunday sermon specifically naming {ITEM} as "the commodity of the morally destitute." By Monday morning half his congregation had panic-bought every unit in the district as a precaution.

### Variant 8
The Tribune ran a front-page story this morning claiming {ITEM} supplies had collapsed. The story was wrong. Unfortunately every supplier in the city read it before any of them thought to check. The resulting panic has made the story accidentally correct.

### Variant 9
A {ITEM} supplier found religion on Wednesday. By Thursday he'd destroyed his entire stock in what witnesses describe as a joyful bonfire outside his warehouse on Canal Street. He is reportedly at peace. The market is not.

### Variant 10
A hand-lettered sign appeared overnight on the corner of Broadway and Canal: "BUY {ITEM}. SHORTAGE COMING. — A FRIEND FROM 1959." The ones who didn't ignore it are very pleased with themselves this morning.

**Button:** `NOTED`

---

## 2. SURGE / BUYING FRENZY (`type: 'surge'`)

**Price effect:** selected good × **8**  
**Image:** `events/buying_frenzy.png`

### Variant 1
Word spread fast — there's a shortage of {ITEM} and the clubs are in a panic. Prices are going wild.

### Variant 2
A tipping point hit the market hard. {ITEM} prices are at levels nobody would have believed yesterday. Get in while it lasts.

### Variant 3
Two suppliers got cold feet and pulled out overnight. The {ITEM} trade has been fought over and the price shows it.

### Variant 4
Rothstein's old network collapsed overnight and took half the {ITEM} supply in this city with it. What's left has been fought over at prices nobody saw coming.

### Variant 5
Every retailer of {ITEM} in four districts received the same visit last night — pay up or close down. Most chose to close. The ones still open are charging whatever they like and the buyers are paying it.

### Variant 6
A doctor — credentials unverified, confidence immaculate — published a letter in the Tribune recommending {ITEM} as beneficial to nervous temperament and general urban fatigue. His patients are buying in bulk.

### Variant 7
A queue formed outside a {ITEM} supplier on Delancey Street at four in the morning. Nobody in the queue knows who started it or why. Each person joined because the queue was already there. The supplier sold out before noon.

### Variant 8
Word got around that Big Daddy J has been moving heavily into {ITEM} this week — buying, not selling. When BDJ accumulates, the smart money follows. Half the district is now chasing the same commodity he is.

### Variant 9
Big Daddy J is throwing one of his legendary gatherings this weekend. His procurement man has been buying {ITEM} across every district since Monday. What he doesn't secure, the guests will expect to find elsewhere.

### Variant 10
Big Daddy J said three words to three people at his club on Monday night. Nobody knows what the words were. By Tuesday morning the {ITEM} market was moving like a freight train. BDJ doesn't need to explain himself.

**Button:** `NOTED`

---

## 3. FLOOD / FLOODED MARKET (`type: 'flood'`)

**Price effect:** selected good ÷ **4** (minimum 1)  
**Image:** `events/flooded_market.png`

### Variant 1
A hijacked shipment of {ITEM} got scattered across the docks. Someone's offloading it fast and cheap.

### Variant 2
Someone's liquidating fast. A full shipment of {ITEM} just flooded the street and the price has collapsed. Move quickly.

### Variant 3
A deal went badly wrong last night. The survivor is offloading {ITEM} at any price just to disappear. Get in before he does.

### Variant 4
Big Bill Thompson bet the city's impounded {ITEM} stockpile on a boxing match. The wrong man won. It's all hitting the street at once and nobody in City Hall is admitting anything.

### Variant 5
A Bronx attorney is liquidating the estate of one Salvatore Minetti, deceased, whose will specified that his entire stock of {ITEM} be sold at any price and the proceeds donated to the church. The market is awash.

### Variant 6
A shipping clerk misread a decimal point and ordered ten times the required quantity of {ITEM}. His employer has been offloading the surplus since Tuesday at progressively more desperate prices.

### Variant 7
Big Daddy J flooded the {ITEM} market overnight — deliberately, surgically, and at significant personal cost. Word is he's sending a message to an operator who moved on his territory. BDJ doesn't argue. He adjusts the market.

### Variant 8
BDJ is rotating his operation — moving out of {ITEM} entirely and into something nobody's talking about yet. When he exits a market he exits completely. The price collapse is the sound of Big Daddy J closing a door.

### Variant 9
A woman sold an enormous quantity of {ITEM} at the exchange this morning at prices that suggested she simply needed it gone. As she left she said quietly: "It won't be worth anything after 1933 anyway. Enjoy it while it lasts."

### Variant 10
A man with too many pockets has been selling {ITEM} below market rate since Tuesday. When asked why, he shrugged: "I bought these in 2019 for considerably less than you'd believe. At this price I'm still ahead."

**Button:** `NOTED`

---

# PART 2 — TRAVEL ENCOUNTER EVENTS (random on move)

After market event, up to **`CONFIG.maxTravelEvents` (2)** encounters drawn from shuffled candidates:

| Event | Roll chance | Skip if |
|-------|-------------|---------|
| Mugging | 1/12 | — |
| Find (dead drop) | 1/12 | No stash space |
| Stash upgrade | 1/7 | `S.cash < cost` |
| Gun | 1/7 | `S.guns >= CONFIG.maxGuns` (2) or `S.cash < cost` |
| Feds | 1/7 | — |

---

## 4. AMBUSHED & ROLLED / MUGGING (`mugging`)

**Image:** `events/ambushed_rolled.png`  
**Mechanics:** `loss = min(cash, randInt(50, max(100, round(cash×0.15))))` — cash deducted  
**Log:** `Ambushed — lost ${money(loss)}.`  
**Button:** `DAMN`

### Variant 1
- **Stored title:** AMBUSHED  
- **Body (shown):** Someone knew you were coming. You took a beating and lost ${money(loss)} before you could run.

### Variant 2
- **Stored title:** ROLLED  
- **Body:** A welcoming committee was waiting around the corner. They were fast, organised, and ${money(loss)} richer when they left.

### Variant 3
- **Stored title:** CLASSIC MISTAKE  
- **Body:** You stopped to help a man who'd dropped his groceries. His friend took ${money(loss)} from your coat. The groceries were fake. The money was real.

### Variant 4
- **Stored title:** SENT A MESSAGE  
- **Body:** This wasn't random. Someone paid to have you roughed up and ${money(loss)} lifted. You need to think about who.

### Variant 5
- **Stored title:** OUTSMARTED  
- **Body:** You were robbed by a man pretending to be a lamppost. In hindsight the signs were there. ${money(loss)} gone and your pride in tatters.

### Variant 6
- **Stored title:** CAPONE'S REGARDS  
- **Body:** A man in a very good suit handed you an envelope and took ${money(loss)} from your coat. He said Mr Capone sends his regards. You didn't argue.

### Variant 7
- **Stored title:** THE EXAMPLE  
- **Body:** Three men. Organised, quiet, professional. They took ${money(loss)} and left you breathing as a courtesy. Before they walked away the big one said: "Tell whoever sent you that the answer is still no." Nobody sent you. You decide not to mention that.

### Variant 8
- **Stored title:** THE TEMPERANCE LADY  
- **Body:** A woman from the Women's Christian Temperance Union cornered you outside a drugstore, delivered a twenty-minute sermon on the moral ruin of alcohol, and somehow talked you out of ${money(loss)} as a "voluntary donation to the cause." You aren't entirely sure what happened.

### Variant 9
- **Stored title:** THE CONFESSION  
- **Body:** A priest sat down beside you on a bench, listened to everything you said, gave a considered absolution, and left with ${money(loss)} from your coat. You are fairly certain priests don't do that. You are completely certain he was not a priest.

### Variant 10
- **Stored title:** THE ASSOCIATE TAX  
- **Body:** A man with a BDJ pocket square and a handshake like a hydraulic press explained that operating in this district carries a ${money(loss)} associate fee payable immediately. He called it an investment. You called it unavoidable. You both had a point.

---

## 5. DEAD DROP / FIND (`find`)

**Image:** `events/dead_drop.png`  
**Mechanics:** Random good `d = pick(GOODS)`; `n = min(spaceLeft, randInt(2, 7))`; add `n` to inventory  
**Log:** `Dead drop — picked up ${n} ${d.name}.`  
**Button:** `NICE`

### Variant 1
- **Stored title:** DEAD DROP  
- **Body:** Someone left a stash and never came back. You help yourself to **${n} ${d.name}** before anyone's the wiser.

### Variant 2
- **Stored title:** VALENTINE'S LEFTOVERS  
- **Body:** Whatever went down in that garage on Clark Street, the men who stashed **${n} ${d.name}** won't be coming back. You will.

### Variant 3
- **Stored title:** GENNA BROTHERS' GIFT  
- **Body:** The Gennas are finished and their operation is scattered to the wind. A stash of **${n} ${d.name}** sits in a Cicero warehouse with no one left to claim it.

### Variant 4
- **Stored title:** THE TRAIL IS WARM  
- **Body:** Someone died for these goods and the trail is still warm. A chalk outline on the warehouse floor, a toppled hand-truck. You don't ask who he was. You take the **${n} ${d.name}** and keep moving.

### Variant 5
- **Stored title:** LEFT FOR DEAD  
- **Body:** A runner is slumped against a dumpster in the alley — alive, barely. He can't move and he knows it. "Take it," he says, and nods at the bag. You take the **${n} ${d.name}**. Some questions answer themselves.

### Variant 6
- **Stored title:** LETTER ATTACHED  
- **Body:** A crate wedged behind a dumpster, a sealed envelope nailed to the lid. The letter is addressed to no one and signed with a single initial. Inside: **${n} ${d.name}**. You keep the goods and burn the letter.

### Variant 7
- **Stored title:** THE EMPTY HEARSE  
- **Body:** An unattended hearse is parked outside a church with the back door open. The coffin is empty. A wooden crate beside it is not. **${n} ${d.name}**, packed in straw, undamaged. Whatever funeral was planned, it wasn't for these.

### Variant 8
- **Stored title:** COMPLIMENTS OF MR J  
- **Body:** A boy in a pressed suit finds you at the corner. "Compliments of Big Daddy J," he says, and hands over a delivery slip for **${n} ${d.name}** at an address two streets over. It's waiting, just like the boy said.

### Variant 9
- **Stored title:** THE ARRANGEMENT  
- **Body:** A storage clerk slides you a key without looking up. "Mr J settled the account last month. Said someone would collect." The locker holds **${n} ${d.name}**. You never asked for a benefactor. Apparently one chose you anyway.

### Variant 10
- **Stored title:** THE LOOP  
- **Body:** Tucked into a crate of **${n} ${d.name}** — a note: "For whoever finds this: I've already been to '33 and you make it. Don't change anything." You take the goods. The note is harder to put down.

---

## 6. UPGRADE AVAILABLE / STASH (`stash`)

**Image:** `events/upgrade_available.png`  
**Mechanics:** `rollStashUpgrade()` → tier from `STASH_UPGRADE_TIERS`: add ∈ {5,10,15,20,30}, cost = add × randInt(90,110). Skipped if cash < cost.  
**On BUY:** cash − cost, space + add, log `+${add} stash space.`  
**Buttons:** `BUY` / `PASS`

### Variant 1
A mechanic at the yard can fit **+${add}** extra hidden crates into your vehicle for ${money(cost)}. Do it?

### Variant 2
A Ford engineer — allegedly — offers to modify your Model T with **+${add}** hidden crates for ${money(cost)}. He claims Mr Ford himself suggested the design. This is almost certainly not true.

### Variant 3
A grease-stained man slides a card across the bar. Says he can build **+${add}** hidden crates into your vehicle for ${money(cost)}. Doesn't ask what you're carrying. Doesn't want to know.

### Variant 4
A mechanic with two broken fingers and a nervous eye explains that the man who broke them suggested he find you specifically. He can add **+${add}** hidden crates for ${money(cost)}. He doesn't say who sent him. You don't ask. The work is excellent.

### Variant 5
A man introduces himself as the brother of a city alderman and insists this makes him a qualified vehicle engineer. He has a wrench, a confident expression, and a plan for adding **+${add}** hidden crates for ${money(cost)}. His one reference is his brother, who is currently under indictment.

### Variant 6
A man in a three-piece suit produces a rolled certificate claiming to hold US Patent No. 1,847,293 for "Concealed Automotive Cargo Innovation." He will license the installation of **+${add}** hidden crates for ${money(cost)}. The patent may be real. The man almost certainly isn't.

### Variant 7
A carpenter — apparently blind, navigating entirely by touch — offers to build **+${add}** hidden crates into your vehicle for ${money(cost)}. You watch him work for two minutes. He is better at this than anyone you have ever seen. You stop asking questions.

### Variant 8
Word reaches you that Big Daddy J has put a man at your disposal. He can fit **+${add}** hidden crates for ${money(cost)} in materials only. "Mr J covers the labour," the man says. "He said you'd understand why." You don't. You take the upgrade.

### Variant 9
A man claiming to be a logistics optimisation specialist offers to add **+${add}** hidden crates for ${money(cost)}. He keeps muttering that in eighty years this will all be done with computers. You don't know what a computer is. The extra space is real and that's enough.

### Variant 10
A woman hands you a folded schematic — extraordinarily precise, printed on material that isn't quite paper — showing exactly how **+${add}** hidden crates can be built into your vehicle. "The engineering holds up," she says. "We checked." She charges ${money(cost)} and refuses to answer any other questions.

---

## 7. PACKING IRON / GUN (`gun`)

**Image:** `events/packing_iron.png`  
**Mechanics:** `base = randInt(1500, 2500)`; `cost = gunEventCost(base, guns)` = round(base × (1 + 0.5 × guns)). Max 2 guns.  
**On BUY:** cash − cost, guns + 1, log `Bought a gun.`  
**Buttons:** `BUY` / `PASS`

### Variant 1
Someone's selling out of a bag in the alley. Clean piece, ${money(cost)}. The Feds won't wait for you to be unarmed.

### Variant 2
A man claims he's moving hardware left over from one of Capone's operations. Clean piece, ${money(cost)}, no serial number. Take it or leave it.

### Variant 3
A contact with War Department connections is quietly moving government-issue hardware. ${money(cost)} gets you something Eliot Ness himself would respect.

### Variant 4
The piece on the table has a history you don't want to know about. ${money(cost)}, no questions, no paperwork. In this city that's a bargain.

### Variant 5
Ness's boys confiscated these from the Circus Café last Tuesday. By Wednesday they were back on the street. ${money(cost)} and it's yours. Don't ask how.

### Variant 6
A face you half-recognise leans across the bar. "You've been moving through this city unarmed. That's either very brave or very stupid and I can't tell which. ${money(cost)} fixes both problems." He puts a piece on the rail.

### Variant 7
A deacon from the First Baptist Church explains that the Lord moves in mysterious ways, one of which apparently involves him selling firearms from a carpet bag in a speakeasy. Clean piece, ${money(cost)}, comes with a blessing at no extra charge.

### Variant 8
A case arrives at your hotel addressed in Big Daddy J's hand. Inside: a clean piece, oiled and wrapped in velvet, and a note: "The streets are getting busy. ${money(cost)} for the case. Consider the advice free."

### Variant 9
Big Daddy J's man finds you at the bar. "Mr J says you've been running naked out there. He'd consider it a personal favour if you'd see someone." The someone is two blocks away and will deal at ${money(cost)} on BDJ's word alone.

### Variant 10
A man in a peculiar jacket examines the piece on the table with nostalgic reverence. "In a hundred years," he says, "people will pay twenty times this at auction just to own one." He sells it for ${money(cost)} and seems genuinely sad to let it go.

---

## 8. THE FEDS (`feds`)

**Image:** `events/the_feds.png`  
**Multi-phase encounter** with choice buttons on main screen, then outcome popups.

### Phase A — Initial / combat screen (repeated while fight continues)

**Body template:**
```
Agent Hayes spotted you — ${cops} agent(s) closing in.

HP: ${S.health}/${CONFIG.startHealth} · Guns: ${S.guns}
[Optional red message from prior action]
```

**Agent count:** `maxCops = 1 + min(3, floor(day/8))`; if `day > 20` then +1; `cops = randInt(1, maxCops)`

**Choice buttons:**
| Button | Enabled when | Action |
|--------|--------------|--------|
| `FIGHT` | `S.guns > 0` | Combat round |
| `RUN` | always | 62% escape, else hit + maybe drop goods |
| `PAYOFF` | always | Pay bribe |

**Warning (if no gun):** `No gun — can't fight back.`

---

### Phase B — FIGHT outcomes

**Fight kill:** each round, `fedsApplyFightKill` — round 1 with max guns guarantees one kill; else `fightKillChance(guns)` capped at 85%.

**If all cops down (win):**
- Reward: `randInt(3750, 10000)` cash
- `grantDebtInterestFreeze(S, 1)` — 1 day interest freeze
- Log: `Beat the Feds, grabbed ${money(reward)}.`
- **Button:** `GO`

#### Win variant 1
- **Title:** LAST MAN STANDING  
- **Body:** Last man standing. You grab ${money(reward)} off the bodies and disappear into the night.

#### Win variant 2
- **Title:** ONE FOR THE PAPERS  
- **Body:** This one will make the Tribune tomorrow. You don't wait to read it. You take ${money(reward)} and put six blocks between yourself and the scene.

#### Win variant 3
- **Title:** ANOTHER VICTORY FOR ORGANISED CRIME  
- **Body:** Capone himself couldn't have handled it cleaner. ${money(reward)} off the floor, coat straightened, gone before the echo fades.

#### Win variant 4
- **Title:** IZZY PICKED THE WRONG MARK  
- **Body:** The disguise was convincing — you'll give him that. But a fishmonger who moves like a middleweight is a fishmonger worth questioning. ${money(reward)} richer, one legend humbled.

#### Win variant 5
- **Title:** CLEAN HANDS  
- **Body:** You didn't plan it this way, but here you are. ${money(reward)} off the floor, a hat that fits better than yours, and a story you will never tell anyone. You straighten your coat and walk north. The city doesn't notice.

#### Win variant 6
- **Title:** NOTED  
- **Body:** As the dust settles a man in a very good suit materialises from a doorway, surveys the scene, and nods once. "Mr J will hear about this," he says — approvingly. He hands you ${money(reward)}. "For the inconvenience." Big Daddy J rewards people who handle their problems cleanly.

**If cop hits player:** HP −1; game over at 0: *"The city has a short memory. By morning nobody will remember your name."*  
**Combat messages (stay on Phase A):** `You took a hit!` / `You missed — they're still on you.`

**Counter-hit chance:** `fedsCounterHitChance(guns, round, day)` — base 30% + 3% per round after first, −4% per gun (max −12%), +5% if day > 20, clamped 18%–48%.

---

### Phase C — RUN outcomes

**Success (62%):** Log `Vanished into the streets.` — **Button:** `PHEW`

#### Run success variant 1
- **Title:** GONE  
- **Body:** You know these streets better than they do. Gone before they could blink.

#### Run success variant 2
- **Title:** INTO THE CROWD  
- **Body:** You ducked into the lunch crowd on Michigan Avenue and let the city swallow you whole. Ness's men walked right past.

#### Run success variant 3
- **Title:** THE BACK WAY  
- **Body:** Three alleys, a fire escape, and a borrowed hat. By the time they reached the corner you were four blocks north having a coffee.

#### Run success variant 4
- **Title:** LOST IN THE PARADE  
- **Body:** By sheer luck a temperance march turned onto the street at precisely the right moment. You joined the procession, took a pamphlet, and were gone before anyone noticed the irony.

#### Run success variant 5
- **Title:** THE FUNERAL  
- **Body:** You joined a funeral procession for four blocks, accepted condolences from twelve strangers, signed a guestbook under a false name, and ate a finger sandwich before the agents lost the trail entirely. You didn't know the deceased. He would have understood.

#### Run success variant 6
- **Title:** THE LEFT TURN  
- **Body:** A man grabbed your sleeve as you ran and pulled you into a doorway you hadn't noticed. "Trust the left turn," he said. You took it. It worked. When you came back to thank him he was gone. On the wall: a chalk arrow pointing left and a year — 1987 — that means nothing to you.

**Run failure:** HP −1; may drop `randInt(1,5)` of random held good; Phase A message: `Couldn't shake them — took a hit and dropped some goods.`

---

### Phase D — PAYOFF / BRIBE outcomes

**Cost:** `min(cash, round(randInt(2000,8000) × cops × bribeScale))` where `bribeScale = 1.5` if day > 20 else `1`.  
**Log:** `Counted out ${money(cost)} into an open palm.`  
**Button:** `OK`

If cost ≤ 0 or cost > cash: stay on Phase A with `Nothing to pay them with.`

#### Bribe variant 1
- **Title:** NOBODY SAW ANYTHING  
- **Body:** You count out ${money(cost)} into an open palm. Nobody saw anything. Nobody ever does.

#### Bribe variant 2
- **Title:** CITY RATES  
- **Body:** ${money(cost)} in a folded newspaper, slid across the bar. Agent Hayes pockets it without breaking eye contact. Standard rate. Standard result.

#### Bribe variant 3
- **Title:** CIVIC DONATION  
- **Body:** You explained to the officers that ${money(cost)} was a voluntary contribution to the Policemen's Benevolent Fund. They thanked you for your generosity and wished you a good evening.

#### Bribe variant 4
- **Title:** ABOVE BOARD  
- **Body:** You told them it was a consulting fee for advice on avoiding criminal activity. They accepted ${money(cost)} and advised you to use the north exit. Everybody wins.

#### Bribe variant 5
- **Title:** ALREADY HANDLED  
- **Body:** You reach for your wallet and the lead agent stops you. "Already handled," he says, and walks away. A folded note in your pocket in Big Daddy J's handwriting: "${money(cost)} from your next settlement. Consider it a loan from a friend." The accounting with Big Daddy J is always precise. Always.

#### Bribe variant 6
- **Title:** CAMERAS  
- **Body:** Agent Hayes pocketed ${money(cost)} without blinking, then stared at you for a long moment. "In seventy years they're going to have cameras on every corner and none of this is going to be possible." He sounded genuinely nostalgic about something that hasn't happened yet.

---

# PART 3 — SCHEDULED MARKET EVENTS (rare / super / godlike / golden)

These use the same popup UI (`showEvent`) but fire on travel when the run’s pre-rolled event day matches. Priority: **golden > godlike > super rare > rare > daily anomaly**.

---

## 9. RARE EVENT / INTEL (`intel` fallback image)

**Default image:** `events/rare_event_intel.png` (overridden per event by `re.img`)  
**Roll chance:** ~4.5% at new game (`RARE_EVENT_CHANCE`)  
**Event day:** random day 5–25  
**Price effect (in event district on event day):** commodity set to `randInt(low, high) × 4`

### Popup templates

**If player travels TO event district on event day:**
```
**${re.lines[0]}**

${re.lines[1]}
```
**Button:** `INTERESTING`

**If player travels elsewhere on event day (and spikeGood exists):**
```
**${re.lines[0]}**

${re.lines[1]} ${spikeGood.name} prices are surging in ${re.district}.
```
**Button:** `NOTED`

### All rare events (full `engine.js` data)

| ID | Commodity | District | Image | Line 1 | Line 2 |
|----|-----------|----------|-------|--------|--------|
| `luciano` | cigars | Little Italy | `events/rare_luciano.png` | LUCKY LUCIANO CALLS A MEETING | RUMORS OF A NEW ORDER SPREAD |
| `rumrow` | moonshine | Dock #13 | `events/rare_rumrow.png` | THE SILENT FLEET RETURNS TO HARBOR | RUM ROW SAID TO BE BUSIER THAN EVER |
| `midnight` | moonshine | Dock #13 | `events/rare_midnight.png` | THE MIDNIGHT RUN REACHES THE CITY | RUM RUNNERS EVADE PATROL BOATS |
| `ellington` | diamonds | Kitty Kat Club | `events/rare_ellington.png` | DUKE ELLINGTON HEADLINES TONIGHT | KITTY KAT CLUB EXPECTS RECORD CROWDS |
| `armstrong` | champagne | Kitty Kat Club | `events/rare_armstrong.png` | LOUIS ARMSTRONG PLAYS TONIGHT | THE DISTRICT SWINGS INTO THE SMALL HOURS |
| `schultz` | furcoats | Uptown | `events/rare_schultz.png` | DUTCH SCHULTZ EYES NEW TERRITORY | ESTABLISHED INTERESTS GROW UNEASY |
| `lansky` | diamonds | Uptown | `events/rare_lansky.png` | MEYER LANSKY ENTERS THE PICTURE | MONEY CHANGES HANDS RAPIDLY |
| `capone` | counterfeits | Warehouse District | `events/rare_capone.png` | AL CAPONE SEEN MEETING ASSOCIATES | RIVALS KEEP A LOW PROFILE TONIGHT |
| `rothstein` | art | City Hall | `events/rare_rothstein.png` | ARNOLD ROTHSTEIN TAKES AN INTEREST | SPECULATION SWEEPS THE DISTRICT |
| `madden` | champagne | City Hall | `events/rare_madden.png` | OWNEY MADDEN BACKS ANOTHER BIG NIGHT | THE FIX IS IN AT CITY HALL |

---

## 10. SUPER RARE EVENT (`celeb` fallback image)

**Default image:** `events/super_rare_event.png` (overridden per event by `sr.img`)  
**Roll chance:** ~1% at new game (`SUPER_RARE_EVENT_CHANCE`)  
**Price effect (in event district on event day):** all goods × **3**

### Popup templates

**If player travels TO event district on event day:**
```
**${sr.lines[0]}**

${sr.lines[1]} Every price in the district is climbing.
```
**Button:** `LET'S GO`

**If player travels elsewhere on event day:**
```
**${sr.lines[0]}**

${sr.lines[1]} Head to ${sr.district} for the action.
```
**Button:** `NOTED`

### All super rare events

| ID | District | Image | Line 1 | Line 2 |
|----|----------|-------|--------|--------|
| `lindbergh` | Dock #13 | `events/super_lindbergh.png` | LINDBERGH ARRIVES TO GREAT FANFARE | THE CITY STOPS TO WATCH |
| `mauretania` | Dock #13 | `events/super_mauretania.png` | MAURETANIA DOCKS TO HUGE CROWDS | THE WATERFRONT HAS NEVER BEEN BUSIER |
| `dempsey` | Kitty Kat Club | `events/super_dempsey.png` | A BIG FIGHT DRAWS NEAR | DEMPSEY MANIA GRIPS THE DISTRICT |
| `kkrevue` | Kitty Kat Club | `events/super_kkrevue.png` | THE KITTY KAT CLUB DEBUTS A NEW REVUE | THE CITY'S ELITE FLOCK TO THE DISTRICT |
| `ziegfeld` | Kitty Kat Club | `events/super_ziegfeld.png` | ZIEGFELD FEVER SWEEPS THE CITY | EVERYBODY WANTS THE BEST SEAT |
| `hollywood` | Kitty Kat Club | `events/super_hollywood.png` | THE TALKIES ARE ALL THE RAGE | THEATRES SELL OUT ACROSS THE DISTRICT |
| `wales` | Uptown | `events/super_wales.png` | THE PRINCE OF WALES IS IN TOWN | NO EXPENSE IS BEING SPARED |
| `wallst` | Uptown | `events/super_wallst.png` | STOCK MARKET FORTUNES GROW AGAIN | UPSCALE DISTRICTS REPORT RECORD TRADE |
| `ruth` | City Hall | `events/super_ruth.png` | BABE RUTH FEVER SWEEPS THE CITY | CITY HALL DECLARES A DAY OF CELEBRATION |
| `walker` | City Hall | `events/super_walker.png` | MAYOR WALKER VISITS THE DISTRICT | EVERY TABLE IN TOWN IS RESERVED |

---

## 11. GODLIKE EVENTS (Big Daddy J district day)

**Roll chance:** ~0.5% at new game (`GODLIKE_CHANCE`), unless golden rolled  
**District:** random from `LOCATIONS` at roll time  
**Price effect (in godlike district on event day):** all goods × **10**

### Popup templates

**If player travels TO godlike district on event day:**
```
**${gk.lines[0]}**

${gk.lines[1]}
```
**Button:** `BIG DADDY J`  
**Image:** `gk.img` or fallback `bigdaddy`

**If player travels elsewhere on event day:**
```
**BIG DADDY J IS ACROSS TOWN**

He's making moves in ${gk.district}. Every price there is climbing.
```
**Button:** `NOTED`

### All godlike events

| ID | Image | Line 1 | Line 2 |
|----|-------|--------|--------|
| `in_town` | `events/godlike_in_town.png` | BIG DADDY J IS IN TOWN | EVERYBODY WANTS A PIECE OF THE ACTION |
| `interest` | `events/godlike_interest.png` | BIG DADDY J TAKES AN INTEREST | MONEY CHANGES HANDS RAPIDLY |
| `move` | `events/godlike_move.png` | BIG DADDY J MAKES A MOVE | THE DISTRICT WILL BE TALKING ABOUT IT FOR YEARS |
| `celebration` | `events/godlike_celebration.png` | BIG DADDY J THROWS A CELEBRATION | NO EXPENSE IS BEING SPARED |
| `history` | `events/godlike_history.png` | BIG DADDY J MAKES HISTORY | THE CITY WILL REMEMBER THIS DAY |

---

## 12. GOLDEN GODLIKE (`golden`)

**Roll chance:** ~0.1% at new game (`GOLDEN_GODLIKE_CHANCE` = godlike/5)  
**Price effect (any district on event day):** all goods × **10**  
**Image:** `events/godlike_golden.png` or fallback `bigdaddy`

### Popup (single template)
```
**GOLDEN SHOWER!!!**

EVERYWHERE!!! Every price in the city is climbing.
```
**Button:** `GOLDEN`

**Market banner (while active on event day):** `✦ Golden Shower — every price in the city ×10 ✦`

---

# APPENDIX — Related UI copy (not travel popups)

## Tutorial steps (first-run overlay, not standard event art)

| Step | Title | Body |
|------|-------|------|
| 1 | THE DON'S DEBT | Your debt compounds at 8% every day you travel. Pay him down at Little Italy before it eats your profits — the Don caps total debt at ${money(CONFIG.maxTotalDebt)}. |
| 2 | THE FAMILY VAULT | Bank your cash at Little Italy only. Savings earn ${Math.round(CONFIG.bankInterest*100)}% daily — plus a ${Math.round(CONFIG.conservativeBankBonus*100)}% bonus when your debt is under half the cap. |
| 3 | PACK HEAT | Feds show up on the road. Buy guns when offered — without one, you can only run or bribe. |
| 4 | LOOSE CASH | Muggings hit harder when you're carrying a lot of cash. Bank it at Little Italy before you travel — the streets notice a fat wallet. |

**Tutorial buttons:** `SKIP` / `NEXT` (final step: `PLAY`)

---

## Source file locations for editors

| Content | File | Symbol |
|---------|------|--------|
| Market anomaly bodies | `gangwars.html` | `ANOMALY_BODIES` |
| Mugging / find / stash / gun variants | `gangwars.html` | `eventMugging`, `eventFind`, `eventStash`, `eventGun` |
| Feds encounter | `gangwars.html` | `eventFeds` |
| Rare/super/godlike data | `engine.js` | `RARE_EVENTS`, `SUPER_RARE_EVENTS`, `GODLIKE_EVENTS`, `GOLDEN_GODLIKE` |
| Travel popup assembly | `gangwars.html` | `travelTo()` |
| Image keys | `gangwars.html` | `EV_IMG` |

---

*End of reference. Edit copy in source files above; this document is a snapshot for analysis only.*
