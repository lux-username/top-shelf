# Top Shelf — Depth & First-Impression Spec

> Written 2026-06-23. Addresses the recurring playtest reaction when the game is **shown** to
> someone: *"that's it?"* — read as "needs more challenge and more features."
> Read `top-shelf-handoff.md` (sacred rules), `top-shelf-level-design.md` (curve/teaching),
> and `top-shelf-engagement-ethics.md` (the guardrail) first — every item here is checked
> against them.

## Diagnosis (why "that's it?" happens)

Two separate problems, only one of which is actually "needs more features":

1. **The depth is locked away from the person judging it.** Shipping config is
   `PLAYTEST = false` (index.html:2692), so a fresh save unlocks **only Level 1** — a
   deliberately near-unfailable tutorial (3 types, 2 empty, no gimmick). When you hand the
   phone to a friend, that trivial board is the *only* thing they can legally touch. All 7
   mechanics, 10 departments, sealed layers, and the L90 combo set-pieces are invisible. The
   onboarding principle (front-load easy) collides head-on with the demo moment.
2. **The core verb reads as "solved" the instant it's understood.** Drag → clear. There is no
   *visible second axis* of challenge or mastery. We deliberately omit the
   dopamine/compulsion meta-layer for ethical reasons, which is correct — but it leaves a real
   hole that legitimate craft (mastery depth, spectacle, variety) can fill.

This spec covers the three approved directions: **Sampler/Tour**, **Par + live move tracker**,
and **New gimmick(s) / Conveyor mode**. (Zen/Endless was deliberately left out of scope.)

---

## Feature 1 — Sampler / Tour (fix the demo moment)

**Goal:** a brand-new viewer feels the *range* of the game in ~90 seconds, without unlocking
or spoiling their own progression run.

### Behavior
- A **"Take a tour"** entry on the title/menu, always available regardless of `save.unlocked`.
- Plays a short curated playlist (3 levels) that shows the arc:
  1. a gentle core-sort board (the verb),
  2. a visually-obvious gimmick board — **reserved 🪧** or **sealed-layers** (depth reads at a
     glance),
  3. a spicy late-game **combo** board (~L88-style: feature + reserved signs).
- Reuse **existing** level indices — no new content authoring. Candidate picks (tune by feel):
  an early CH1 level, a CH3/CH5 gimmick level, a CH9 Rush Hour level.
- **Tour mode does not touch progression:** no `save.unlocked` write, no advance into the real
  arc. After the 3rd, a card says "That's the tour — start from Level 1?" → drops them at the
  real Level 1.
- Framing copy on entry: *"A taste of what's ahead — these don't affect your progress."*

### Implementation notes
- Add `G.tour = true` (and a `G.tourSeq = [i,i,i]` + cursor) set by a `startTour()` that calls
  the existing `startLevel`/`buildLevelCached` path.
- Branch in `finishWin` (index.html:2408): when `G.tour`, skip the `save.unlocked` update and
  the normal Next-level card; show the tour-progress card instead.
- The tour is read-only w.r.t. `save`, so it's safe to expose with locks on.

### Ethics / principle check
- Optional, non-gating, no pressure. Pure **autonomy + competence preview**. Green-list §5.
- Risk: spoiling the journey. Mitigated by keeping it 3 levels, clearly labelled, and separate
  from the main flow.

### Optional add-on (not required)
- Gently steepen **Levels 2–4** so visible challenge arrives a touch sooner for the solo player
  too. Keep Level 1 near-unfailable (onboarding rule). Tune via existing `L(kinds, empty, …)`
  defs only — verify with `node tests/harness.js 1 6`.

---

## Feature 2 — Par + live move tracker (deepen the existing 100)

The single biggest "more challenge" win: turns every existing board into a **second,
self-directed challenge** (beat par) with **no comparison to anyone**. Explicitly green-listed
(engagement-ethics §5.3 "quiet mastery signals, never comparative").

### 2a. What counts as a "move"
- One **committed** item relocation = one move. `commitMove` (index.html:2363) is the *single*
  choke-point for every player action (drag-drop and tap-place both route through it), so:
  - Increment `G.moves` once per `commitMove` call.
  - **Cascades count as one move** — a single drop that triggers a chain of clears was one
    player action. (`commitMove` already bundles cascades into one call.)
  - Invalid drags / snap-backs never reach `commitMove`, so they correctly don't count.
- `resetBoard` and `startLevel` reset `G.moves = 0`.

### 2b. Par computation (baked, zero runtime cost)
- **Par = a fair, beatable target**, not necessarily provably optimal. Players just see "Par 9."
- Current `solve` (index.html:1425) is a *first-solution* DFS — it does **not** return shortest
  length. Do **not** compute par at runtime.
- Compute par **offline in the test harness** and **bake it into each level def** as a new
  `par` field (frozen, like the rest of the curated 100):
  - Extend `tests/harness.js` with a **BFS / iterative-deepening** shortest-solve over
    `canonical`/`legalMoves`/`applyMove` (the harness already evals the engine slice).
  - Boards are small (≤6 shelves), so most solve to true optimum quickly. For the heavy ones
    (deep sealed-layers, wildcard), cap the search by node/time budget and bake the **best
    length found** under budget (still a fair target). Record provenance internally
    (`parExact: true/false`) for our own notes; the player only sees the number.
  - Determinism holds: boards are deterministic per index and frozen-per-session, so a par
    computed from the same generator matches the board the player gets.
- Store as `LEVELS[i].par`. If a level somehow lacks a par (e.g. new generated modes later),
  the tracker degrades gracefully to a plain counter (see 2c).

### 2c. Challenge-mode selector — one HUD readout at a time
**Timer and par are mutually exclusive.** They pull in opposite directions (the clock rewards
speed; par rewards slowing down to find the elegant line), so showing both at once is
contradictory pressure and HUD clutter. Instead, **fold par into the existing timer control**
and let the player pick *how* they want to be challenged — exactly one readout ever occupies
the HUD slot.

- Reframe the menu's segmented control `#timerSeg` (index.html:1220) from a **Timer** selector
  into a **Challenge** selector:
  | Mode | HUD | Notes |
  |---|---|---|
  | **Zen** | nothing | = current *Casual* (∞, no clock). Pure flow. |
  | **Timed** | the clock | uses the current *Easy* timing (`durationFor` unchanged). |
  | **Tidy** | move-vs-par tracker | no clock; the green→orange→red counter is the HUD. |
- **DECIDED (a): collapse to a clean 3-way *Zen · Timed · Tidy*.** The old **Hard** clock-speed
  mode is **retired** — Tidy becomes the new "hard" challenge axis. `HARD_TIME_FACTOR` and the
  Hard segment go dormant/removed; **Timed** uses the Easy timing.
- Switching modes re-bases the HUD live (the control already re-bases the running clock on
  switch — extend that to swap clock ↔ tracker).

### 2d. The live move tracker (Tidy mode HUD — the requested element)
When **Tidy** is selected, the HUD shows a counter that **changes color as you cross par
thresholds** — the user's explicit ask. Reads `G.moves` vs `G.def.par`.

- Display: `Moves 7 · par 9` (par shown so the target is legible).
- Color states (thresholds as fractions of par — tune by playtest):
  | State | Condition | Meaning |
  |---|---|---|
  | 🟢 green | `moves ≤ par` | on a tidy line |
  | 🟠 orange | `par < moves ≤ ceil(par × 1.5)` | loose but fine |
  | 🔴 red | `moves > ceil(par × 1.5)` | lots of moves |
- Update inside `commitMove` after `G.moves++` (re-color via a small `updateMovesUI()`,
  mirroring `updateTimerUI`); only rendered in Tidy mode.
- If a level has no `par` (e.g. future generated modes), Tidy degrades to a plain neutral
  counter (`Moves 7`), no color.
- `G.moves` is still **counted in every mode** (for the win card + personal best below); it's
  only *displayed* in Tidy.

### 2e. Win card + self-record
- On `finishWin`: if `G.moves <= par`, add a **"Tidy! solved in N (par M)"** flourish; else
  "Solved in N — tidy is M." Reuse the existing juice vocabulary; **no new failure framing**.
- Persist a **per-level personal best**: `save.best[i] = min(existing, G.moves)`. Show
  "Best: 11" on the card and (optionally) a subtle **tidy tick** on the level selector for
  levels solved at ≤ par. This is a *self-record only*.

### 2f. Save changes
- `save.best`: `{ [levelIndex]: number }`. Migrate old saves (absent → `{}`) in `loadSave`
  (index.html:2027). Don't bump `SAVE_KEY` — additive/optional fields, backward compatible.
- Challenge mode: the existing `save.timer` (`casual|easy|hard`) is replaced by `save.mode`
  (`zen|timed|tidy`). Migrate in `loadSave`: `casual→zen`, `easy→timed`, **`hard→timed`** (Hard
  is retired). Default stays the gentle clocked mode (`timed`), as today.

### Ethics / principle check (important — this one touches coziness)
- Self-referential, non-comparative, optional to care about → green-list §5.3. ✅
- **Opt-in by construction:** par pressure only appears if the player *chooses* Tidy mode, and
  it's mutually exclusive with the clock — so the HUD is never cluttered and the player always
  controls which (if any) pressure they feel. This is the coziness requirement (pressure must
  be dismissible) satisfied structurally, no separate hide-toggle needed.
- **Coziness guard:** a red counter must never *punish* — it does not block, fail, or reset
  anything; it's purely informational, and the language is "lots of moves," **never** "you
  failed." No loss-aversion framing (red-list).
- **No global star/coin hoard.** Per-level best + an optional tidy tick is the ceiling; do not
  add a collectible-stars meter (extrinsic-reward greed → undermines coziness, ethics §4).

---

## Feature 3 — New gimmick(s) / Conveyor mode (more literal "features")

Two sub-options; they can ship independently. New gimmicks are sanctioned (progress doc #181).
Every candidate must pass the bar set by the **cut aisle-sort** lesson: *intuitive at a glance,
spatial/planning, never a redefinition of what "match" means, no depleting resource.*

### 3a. New gimmick candidates (design-only — pick later)
Existing 7 already cover: hidden depth (sealed layers), type-restricted shelf (reserved),
any-match (wildcard), take-only (dispenser), time-locked shelf (shutter), immovable item
(frozen). Genuinely-new planning axes that fit:

1. **Linked shelves (lead candidate).** Two visually-tethered shelves that must be cleared with
   the **same grocery type** as each other (each still monochrome — we add "…and they match
   each other"). New *global* planning constraint; reads instantly with a connecting ribbon;
   no match-rule redefinition. Solver impact: `canonical` must encode the link + the chosen
   type once committed; add a link-aware gate.
2. **Anchor shelf (alt).** A shelf that must be cleared **last** (a soft ordering constraint).
   Cheaper to build; weaker "aha" — risk of reading as arbitrary. Lower priority.
3. *(Rejected on history):* anything multipack-shaped (split-pack bugs, removed 2026-06-18),
   anything that changes types over time (breaks stable-board planning), variable shelf sizes
   or buffer slots (anti-design).

**Cost reality:** per `top-shelf-level-design.md`, each new gimmick is a **full Nintendo
4-step chapter** (introduce → develop → twist → set-piece) = ~10 authored, solver-gated levels
+ engine + render + `canonical` + soft-lock support. Budget one gimmick at a time. Recommend
**Linked shelves** as the one to prototype first.

### 3b. Conveyor mode (the marquee new feature — separate sub-engine)
From the original inspiration (handoff "Open work" #2), never built. The strongest "whole new
thing," and the biggest build.

- **A separate, opt-in mode** (its own menu entry; **not** spliced into the cozy 100-arc) —
  which is exactly what protects coziness (autonomy: the player chooses to enter real-time).
- **Loop:** groceries ride a belt into a queue; player drags from the belt head onto shelves;
  same **monochrome-3-clears** rule. Pure spatial sort with real-time feed layered on.
- **Fail = belt overflow** (queue fills). Soft-fail, cozy: restart, **no lives, no penalty, no
  score-shame.** Same no-lose architecture as the main game.
- **Difficulty levers:** belt speed, type count, shelf count. (Not depleting resources.)
- **Replay shape:** "keep the belt clear" endless. A **personal best** (longest tidy run) is OK
  — self-record only. **No leaderboard, no global score table** (red-list: competition is the
  compulsion wedge).
- **Engine reality:** a real timed-input loop + fail-on-overflow is a meaningfully different
  sub-engine from the turn-based puzzle. It reuses the board/match/clear core and SFX/juice but
  needs its own tick loop, belt model, and feed generator. Treat as a **phase-2** build after
  Features 1–2 land.

### Ethics / principle check
- New gimmicks: same constraints as the existing 7 — spatial, intuitive, no resource. ✅
- Conveyor: real-time pressure flirts with the cozy line, neutralized by being **opt-in and
  consequence-free** (coziness = pressure must be dismissible, not absent — ethics §4). ✅
- Personal bests only; never a versus/leaderboard. ✅

---

## Recommended sequencing

| Phase | Scope | Effort | Why first |
|---|---|---|---|
| **1 ✅ DONE** | Sampler/Tour | small | **Built + browser-verified (2026-06-24).** Menu "Take a quick tour" → 3 showcase levels (3 / 24 / 90), clock-free, progression untouched, exits to Level 1. SW cache → v25. |
| **2 ✅ DONE** | Par + live move tracker + per-level best | medium | **Built + browser-verified (2026-06-24).** `save.timer`→`save.mode` (zen·timed·tidy, Hard retired) + `save.best`, with migration. `G.moves` counter; Tidy HUD `N · par M` green→orange→red; win card "Tidy!/par/best". Par baked as `PARS[]` (offline `tests/gen-pars.js`: exact BFS + beam for deep boards). SW cache → v26. |
| **3 ✅ DONE** | One new gimmick (Linked shelves) | larger | **Built + browser-verified (2026-06-24).** Two shelves tethered by a coloured ring must clear with the SAME grocery, together. Engine: clear-together `resolveClears` + link-encoded `canonical` (fuzz-verified vs brute force). `buildLinkedLevel` (reverse-scramble). New "Paired Aisles" chapter (10 levels) **before Rush Hour → arc is now 110 levels** (Rush Hour 91–100, Closing Time 101–110). Pars rebaked (110). SW cache → v27. Conveyor (Phase 4) still pending. |
| **4 ❌ CUT** | Conveyor mode ("The Belt") | largest | Built + verified, then **REMOVED after playtest (2026-06-24)** — the user didn't like the real-time mode. Entire self-contained module deleted (own `CV` state, feed loop, render, pointer handling, the screen + CSS, the menu entry, `save.bestBelt`). The puzzle game was untouched by it, so removal was clean (−244 lines). The `ic-ui-*`/shelf helpers it reused remain. If ever revisited, the design is in git history (commit `168f13c`). |
| **5 ✅ DONE** | Feel/juice pass + "Your Shop" meta | medium | **Built + browser-verified (2026-07-07). From the "more fun/engaging" brainstorm (Tier 1 minus undo, + Tier 2 #8).** SW cache → **v34**. See below. |
| **6 ✅ DONE** | Harder puzzles + drop the clock | medium | **Built + browser-verified (2026-07-08). Playtest signal: "too easy."** SW cache → **v35**. See below. |

### Phase 6 detail — harder boards + untimed (2026-07-08)
Playtesters (all but one) found the game too easy. Two separable changes (the timer is the *least*
cozy-relevant difficulty lever per `top-shelf-level-design.md`, so dropping it is a coziness win but
NOT the difficulty fix):
- **Difficulty floor strengthened (the fix for "too easy").** `greedySolvable` gained a **1-move
  lookahead (2-ply)**; a new `hardnessTier(board)` grades boards (tier-2 = defeats the lookahead
  planner, tier-1 = old myopic-floor quality, tier-0 = trivial). Every generator (`generateBoard`,
  `genLayered`, `buildLinkedLevel`, `buildDispenserLevel`, `buildFrozenLevel`) now prefers the highest
  tier it can find and **never ships below tier-1**, so the change can only make boards harder, never
  easier. Boards reseed automatically (deterministic per index). **Result: 54 of 89 non-breather levels
  are now genuinely harder, 0 easier, 0 trivial;** generation stays fast (no slow levels). **PARS
  rebaked** via `tests/gen-pars.js` (now defaults to all levels; the harness default was likewise
  fixed to cover 101–110). Breathers/intros/finales still skip the floor — the sawtooth's rest beats
  are preserved.
- **Timer removed — the game is now untimed (supersedes Feature 2's Timed mode).** The Challenge
  selector is now **Zen · Tidy** only; `save.mode ∈ {zen, tidy}`, default **zen** (legacy
  `timed`/`casual`/`easy`/`hard` migrate → zen). All clock code deleted (`durationFor`, `mkTime`,
  `tickTimer`/`startTimer`/`stopTimer`, `finishTimeUp`, the timer bar); `updateTimerUI` → `updateHUD`
  (HUD occupied only in Tidy). **Feature 2's par/Tidy tracker and per-level best are unchanged** —
  only the clock axis is gone.

### Phase 5 detail — feel & the shop-wakes-up meta (2026-07-07)
The brainstorm's diagnosis: *"that's it?" is mostly a spectacle + first-impression gap, not a
mechanics gap* (ethics doc §5.1 "make competence *felt*"). Shipped, all green-list, zero sacred-rule
violations:
- **Cascade choreography.** `juiceClears` now **staggers** each cleared shelf ~70ms apart (was
  simultaneous), matching the rising musical run already in `SFX.clear()`, so a combo reads as a
  phrase resolving. `clearShelf` records the cleared grocery into `out.keys` (guarded so the solver's
  hot path skips it) and each shelf gives a **grocery "poof"** (`.poof`) + a warm **"sigh"** swell
  (`.shelf.sigh`) under the existing spark/flash.
- **Placement micro-feel.** Non-clearing drops pulse the receiving shelf (`.shelf.recv` via
  `pulseShelf`).
- **Sound + haptics + ambient beds.** `SFX.setDept(chapter)` swaps the ambient music to a
  **per-department scale + timbre** (`DEPT_BEDS[11]`), called from `startLevel`. `SFX.haptic()`
  (navigator.vibrate, Android-only, gated by the sfx toggle) fires on clears/cascades.
- **Gentle nudge (opt-in hint).** New header 💡 button → `hintMove()` picks a genuinely useful move
  (prefers a clearing move, else the first that keeps the board solvable via a budgeted `solve`;
  wildcard falls back to any legal move) and **glows the source shelf** (`.shelf.nudge`) + dashes the
  target — never plays the move (preserves the "aha"). Unlimited, free, no resource. Auto-fades 3.2s.
- **Your Shop (Tier 2 #8).** A cosmetic storefront overlay (`#shopScrim`) with **11 cubbies**, one per
  department, that light up as each aisle is finished. `deptDone(c)` = all 10 of a chapter's levels
  have a `save.best` entry (derived from existing save — **no new stars/coins/streak fields**; §4
  extrinsic-hoard guard). Plant appears ≥3 depts, shop cat ≥6, **OPEN sign lights at 11/11**. Entry
  point: menu "Your shop" + a **dept-completion win card** ("Aisle stocked! … See your shop") that
  pops the just-finished cubby. Purely abundance/peak-end.

Phases 1–2 are ~a day, violate zero principles, and hit both halves of the diagnosis. 3–5 are
the "if they still want more *stuff*" follow-on. (Note: **undo** and an **endless/Corner-Shop mode**
were on the brainstorm's Tier-1/Tier-2 lists but deliberately **not** built this pass.)

## Side fix shipped alongside Phase 2 (2026-06-24)
**Drop lands in the slot you target.** Previously `applyMove` always placed a dropped item in
the *first* empty slot (`findIndex`), so dropping on the 2nd/3rd slot snapped it left — reading
as "you can only drop on the first empty space." Now the drop honors the exact empty slot under
the pointer (`applyMove` takes an optional `mv.ts2`; UI passes `slotIndexFromPoint`; falls back
to first-empty on an occupied/dead-space drop). **Safe because `canonical` sorts slots** — sparse
arrangements are identical states to the solver/par/soft-deadlock, so nothing downstream changes.
Each `.slot` now carries `data-slot`. Browser-verified: drops land in slots 0/1/2, clearing and
full solves unaffected.

## After every change
- `node tests/harness.js` (all 100 must print OK; ranges supported).
- Browser-verify at iPhone viewport (0 console errors).
- **Bump `CACHE` in `sw.js`** (currently `topshelf-v24`) or returning players get the stale copy.

## Open decisions for the user
1. **Par thresholds** for the tracker colors — start green ≤par / orange ≤1.5×par / red beyond;
   confirm or adjust after a playtest.
2. ~~Tour level picks~~ — **DECIDED + shipped:** Levels 3 (core) / 24 (one reserved sign) /
   90 (dispenser + 3-sign peak). Adjust by editing the `TOUR` array in index.html if desired.
3. ~~Challenge selector shape~~ — **DECIDED:** 3-way *Zen · Timed · Tidy*; Hard timing retired;
   default `timed`.
4. **New gimmick** — confirm Linked shelves as the one to prototype (vs. Anchor or another).
5. **Conveyor scope** — full mode now, or defer until 1–3 are validated by a playtest?
