# Top Shelf — Progress & Handoff (current state)

**Read `top-shelf-handoff.md` first** for the original design intent, anti-design rules, and the three sacred principles. This document is the *current state* after several build sessions and supersedes the "Current prototype state / Open work" sections of that original doc.

The whole game lives in one file: **`index.html`** (~3470 lines, single self-contained file, no build step, no dependencies beyond two Google Fonts). Open it in any browser.

---

## CURRENT STATE — 2026-07-08 (v36, read me FIRST) 🔝

> This banner is the authoritative snapshot. The dated session logs below are **history** — accurate
> for their day but superseded on the points here. The "more challenge / more features" work since
> 2026-06-23 is tracked in **`top-shelf-depth-spec.md`** (Phases 1–7) and the auto-memory
> `depth-features-work.md`; this banner summarizes where that landed.

- **Difficulty is a RAMP, not a flat lift, and hard boards still give early wins (v36).** The 2-ply
  floor (below) targets tier-2 only in the **meat of the later chapters**; teaching chapters (CH1–3),
  each chapter's intro/develop levels, and the Closing Time finale stay **tier-1** (frequent wins
  while learning) — a rising sawtooth. Generation also **prefers boards that clear a shelf within ~4
  moves** (reward cadence: the feedback unit is the shelf-clear, not the level-win), so hard boards
  aren't setup-heavy slogs. Helpers: `targetTier`, `movesToFirstClear`/`earlyClear`, shared
  `gradeBoard`. **`save.current` resumes on exit** (boot restore is PLAYTEST-aware).

- **NO TIMER — the game is now untimed (Timed mode retired 2026-07-08).** Playtest signal was
  "too easy"; the fix is harder *puzzles*, not a clock, and the clock read as "arcade" not "cozy."
  The Challenge selector is now just **Zen (calm, no clock) · Tidy (no clock + move-vs-par tracker)**;
  **`save.mode ∈ {zen, tidy}`, default `zen`** (legacy `timed`/`casual`/`easy`/`hard` all migrate → zen).
  All clock machinery removed (`durationFor`/`mkTime`/`tickTimer`/`startTimer`/`finishTimeUp`/the timer
  bar). `updateHUD()` replaced `updateTimerUI()`; the HUD slot is occupied only in Tidy.
- **Harder boards — the difficulty FLOOR was strengthened (2026-07-08).** `greedySolvable` gained a
  1-move **lookahead (2-ply)** and generation now picks the hardest board it can (`hardnessTier`:
  tier-2 defeats the lookahead planner, tier-1 = old quality) — **never shipping below old quality**,
  so no level got easier. Result: **54 of 89 non-breather levels are now genuinely harder**, 0 easier,
  0 trivial. Applies across `generateBoard`, `genLayered`, `buildLinkedLevel`, and the dispenser/frozen
  builders. **PARS rebaked** (`tests/gen-pars.js`, now defaults to all levels) for the new boards.

- **Arc is now 110 levels across 11 departments.** A **"Paired Aisles"** chapter (linked shelves)
  was inserted before Rush Hour, so: …CH8 Freezer → **CH_LINKED Paired Aisles (81–90)** → Rush Hour
  (91–100) → Closing Time (101–110). `LEVELS = concat(CH1…CH8, CH_LINKED, CH9, CH10)`; `DEPTS` has 11
  entries. **The "100 levels / 10 departments" phrasing and the chapter table further down are stale
  by one chapter.**
- **8 gimmicks** now (was 7): core · sealed layers · reserved 🪧 · wildcard 🛍️ · dispenser 📦 ·
  shutter 🔒 · frozen ❄️ · **linked 🔗** (two ring-tethered shelves that must clear with the SAME
  grocery, together; `resolveClears` clears the group, `canonical` encodes `.link`, `buildLinkedLevel`
  reverse-scrambles).
- **Challenge selector replaced the timer toggle.** `save.timer` (casual/easy/hard) → **`save.mode`
  ∈ {zen, timed, tidy}** (Hard timing retired; old saves migrate). *(Timed itself was later retired
  2026-07-08 → the selector is now just **Zen · Tidy**; see the top banner.)* **Tidy** mode is a no-clock
  **move-vs-par** tracker (green→orange→red), par baked as `PARS[]` (offline `tests/gen-pars.js`).
  Per-level personal best in **`save.best`** (also powers the shop, below).
- **Save shape is now** `topshelf.save.v1` = **`{ unlocked, current, mode, best, sfx, music }`** (was
  `{unlocked,current,easy,sfx,music}`). `best` = `{ [levelIndex]: fewestMoves }`.
- **New player-facing features:** a **Tour** (menu → 3 showcase levels, progression untouched); a
  **gentle nudge** (header 💡 → `hintMove`/`showNudge`, glows a useful source shelf, opt-in, free,
  never plays the move); and **Your Shop** (`#shopScrim`/`buildShop`/`deptDone`) — a cosmetic
  storefront whose 11 cubbies light up as you finish each department (plant ≥3, cat ≥6, OPEN sign at
  11/11), reachable from the menu and a dept-completion win card.
- **Feel/juice pass (Phase 5):** clears now **cascade** (staggered ~70ms + grocery "poof" + shelf
  "sigh"), placement pulses the receiving shelf, ambient music has **per-department beds**
  (`SFX.setDept`/`DEPT_BEDS`), and clears fire **haptics** (`SFX.haptic`).
- **Conveyor mode ("The Belt") was built then CUT** after playtest (2026-06-24) — user didn't like the
  real-time mode; module fully removed (design in git history `168f13c`).
- **Multipack is GONE** (frozen ❄️ replaced it, 2026-06-18). **Ignore every `pack`/`isPack`/
  `doPackMove`/`{t,p}` reference in the Code-map / Gotchas below — those functions no longer exist.**
- **SW cache is `topshelf-v36`.** **`PLAYTEST` is still `true`** (all levels open, for testing) at
  `index.html:3249` — **flip to `false` to ship** progression locks. Art is 100% bespoke inline SVG
  (no emoji on screen). Verified: `node tests/harness.js` = all **110** OK (default now covers every
  level); iPhone-viewport browser check, 0 console errors.

---

## Session update — 2026-06-19 (read me first — release prep + license)

Release-readiness pass. **SW cache bumped v22 → v23.** Committed + pushed to `main` (commit `992ed65`); GitHub Pages rebuilt and is live.

1. **SHIPPED WITH PROGRESSION LOCKS — `PLAYTEST = false` now.** This is the big one: the live game was previously running with `PLAYTEST = true` (all 100 levels open, no progression). Now levels unlock as you finish them, as designed. Browser-verified: only Level 1 enabled on a fresh save, 2–100 disabled. **If you ever need free level navigation for testing, flip it back to `true` — but don't ship it that way.**
2. **LICENSE added — PolyForm Noncommercial 1.0.0** (`LICENSE`, `Copyright 2026 Lukas Martinson`). **Decision + rationale (don't re-litigate):** the user wants (a) **no one ever puts ads on it**, (b) to **retain the ability to monetize later** (a paid sequel and/or app-store releases of this game), (c) some portfolio value. Key facts that drove the choice: *no OSI-approved open-source license can forbid ads* (Open Source Definition §6 bars field-of-use restrictions — MIT/GPL/AGPL all permit ads); a **license is an outbound grant and never binds the owner**, so PolyForm does NOT restrict Lukas's own future paid/app-store plans — only third parties. PolyForm Noncommercial bars commercial use by others (ads = commercial → prohibited) while keeping the source public to read/learn from. AGPL-3.0 was the considered alternative (deters ads via forced-open but can't ban them); rejected because it doesn't actually prohibit ads. The user also noted this is a vibe-coded project — anyone could re-derive a replica from an LLM in an afternoon — so open-source *reuse* value is low, making the noncommercial trade cheap. **Label it "source-available / noncommercial," NOT "open source"** (the README License section already does this). To keep full relicensing/monetization freedom, **stay sole copyright holder** — use a CLA or rewrite/decline any outside contributions.
3. **Social-share meta added** — Open Graph + Twitter Card tags in `<head>` (title/description/url + `og:image` → `icon-512.png`). Shared links now unfurl with a preview (matters because distribution is link-sharing). *Optional later polish:* swap `og:image` for a 1200×630 landscape shot for richer Twitter/Discord cards (square icon works for now).
4. **`<noscript>` fallback** — styled "needs JavaScript" message instead of a blank page.
5. **README polish** — `▶ Play it live` link at top, gameplay **`screenshot.png`** (captured at iPhone viewport via Playwright), and an honest **License** section.

Verified: `node tests/harness.js` = all 100 OK, page loads with 0 console errors, progression locks render correctly. **All release-readiness items are now closed.** Remaining open work is the can't-do-solo set (real illustrated art vs. bespoke SVGs, drag-feel tuning on physical iPhone, optional endless/daily mode) — none block portfolio/release.

---

## Session update — 2026-06-18 (read me first)

Five changes shipped this session (SW cache bumped **v8 → v9**):

1. **Multipack REMOVED, replaced by FROZEN ❄️.** Multipack (the bound 2-pack) was buggy — packs could land split across a shelf with another item between them — so the whole mechanic and its support code were deleted (`packSlots`, `doPackMove`, pack moves in `legalMoves`/`applyMove`, pack item form `{t,p}`, all pack CSS/drag/render paths). The new gimmick is a **single-item modifier** (no multi-slot binding = no split-pack class of bugs): an item `{t,fz:1}` that is **iced to its shelf and can never be moved**, but whose shelf still clears in place when its three fronts match. You sort the *other* items around it; it pins that shelf's final color and costs a buffer slot. Engine: `isFrozen()`; `legalMoves` never offers a frozen item as a source; `canonical` encodes it (`"F"+t`); `buildFrozenLevel` ices N plain front items on distinct non-special shelves and solver-gates (cap 120k — flat boards verify/reject fast). UI: frost-glaze tile + ❄️ tag, can't be dragged (shiver + buzz on attempt), but its shelf still receives drops. Chapter 8 reskinned **The Bulk Aisle → The Freezer Aisle** (frozen-food palette). All frozen levels machine-verified solvable AND won end-to-end through the real `doMove` path (incl. the 3-frozen setpiece).
2. **Timer overhaul — three modes + shorter clocks.** `save.easy` (bool) → `save.timer` ∈ `{casual,easy,hard}` (old saves migrate: `easy:true`→casual, else→easy; default **easy**). **Casual** = no clock (∞). **Easy** = the level's base time, now **much shorter** (`mkTime`: items×6.5 +25/feature, clamp **60–240s**, was ×12 +50, 160–620). **Hard** = `easy × 0.55` (`HARD_TIME_FACTOR`, floor 30s). `durationFor(def)` resolves the clock; a segmented control (`#timerSeg`) in the menu replaced the Easy toggle and re-bases the running clock on switch.
3. **Bigger icons.** Tile emoji ratio .54 → **.62**, tile box 84% → **88%**, back-row peek .40 → **.46**, drag-ghost .54 → **.62**. (Slot fit math unchanged; 6-shelf cap keeps them readable.)
4. **Mobile sound fix.** Two real causes addressed: (a) audio now arms on the **first interaction anywhere** (document-level `pointerdown/touchend/click/keydown`), not only a board touch, and resumes on tab-return; (b) the **iOS ring/silent switch** — which mutes Web-Audio (the classic "works on laptop, silent on iPhone") — is defeated by playing a tiny runtime-built **silent looping WAV** through an `<audio>` element on first gesture, flipping the page into the "playback" audio session. Plus the canonical one-sample silent-buffer unlock. **Needs confirmation on real iPhone hardware** (couldn't test the silent switch here).
5. **Final challenge levels = real combos.** **Important engine fact (re)confirmed:** sealed layers (`genLayered`/`shelf.buried`) **do NOT combine with features** — a `layers:true` def that also sets `feature`/`reserved` routes to `generateBoard`→`tryBuild`, whose layer path is the *deprecated invisible within-slot* back-row (and with `extra:0` produces no depth at all). So the only supported multi-gimmick board is **feature + reserved sign(s)** (both flat). CH9 Rush Hour is now nine such two-gimmick combos (pallet+sign, shutter+signs, frozen+signs, wildcard+sign, … peak L90 = pallet + 3 signs), and CH10 opens with two combo sendoffs (shutter+sign, pallet+sign) before the original calm wind-down. All verified: features + reserved counts coexist exactly, all solvable, max 6 shelves, total gen 6.9s (worst single = ~2s one-time on the L80 frozen setpiece, cached after).

Everything browser-verified at iPhone viewport (0 console errors). `node tests/harness.js` = all 100 OK. `PLAYTEST` still `true`.

---

## TL;DR for the next session

- **The game is LIVE** as a free hosted PWA: **https://lux-username.github.io/top-shelf/** (repo `github.com/lux-username/top-shelf`, GitHub Pages from `main`). Installable (Add to Home Screen / a one-tap "📲 Install" button) and fully offline. Decided **against** the paid App Store route — see "Distribution decision".
- **100-level curated arc** across 10 departments (one mechanic introduced per chapter; sawtooth difficulty; calm finale). Every level **machine-verified solvable** and **deterministic per level index** (stable across retries). Boards are **built once per session then cached** (`buildLevelCached`) — replays/resets are instant.
- **Big changes shipped THIS session (all live):**
  1. **Sealed-layers mechanic** REPLACED the old back-rows — a buried row surfaces only when its shelf is matched-and-cleared (no excavating by shuffling fronts). New engine + `genLayered` generation + render + curve. **The "Board/data model" and "mechanics" sections below are updated for this; ignore any lingering "front+back stack" phrasing.**
  2. **Difficulty overhaul** — a greedy "needs-planning" floor rejects trivially-easy boards (~91% now require planning); difficulty comes from tight space + depth + constraints, NOT shelf count; boards capped **≤6 shelves** for readable tiles.
  3. **Juice + sound** — clear bursts + "Combo ×N" + synthesized Web-Audio SFX and optional ambient music (menu toggles).
  4. **Bigger icons**, **PWA install helper**, **in-memory board cache**.
- **Currently in PLAYTEST mode** (`const PLAYTEST = true`, just above `buildLevelGrid`): all 100 levels freely selectable, no progression locks. **Set `PLAYTEST = false` to ship** with unlock-as-you-finish (that code is intact, just bypassed).
- **User playtested the current build and approved it** ("I have playtested and it looks good").
- **What's left is mostly non-code:** real grocery art (still emoji), iPhone drag-feel tuning, optional feature+depth combos (sealed-layers v2), optional endless/daily mode.
- **Read before adding "engagement" features:** [`top-shelf-level-design.md`](top-shelf-level-design.md) and [`top-shelf-engagement-ethics.md`](top-shelf-engagement-ethics.md).

---

## How to run / test

- **Play:** open `index.html`, or `python3 -m http.server` + browse to it. (Tester always kills the server after, so none runs by default.)
- **Headless logic validation (used constantly this session):** extract the script body and `eval` it in Node, then exercise the pure functions:
  ```js
  const html = require('fs').readFileSync('index.html','utf8');
  const s = html.indexOf('"use strict";');
  const e = html.indexOf('/* =======================================================================\n   Persistence');
  eval(html.slice(s,e) + `<your test code that uses LEVELS, buildLevel, solve, etc.>`);
  ```
  (Must append test code to the *same* eval string — strict-mode `const`/`let` don't leak out of `eval`.)
- **Browser/UI checks:** Playwright MCP. Auto-solve a level with a DFS path finder over `legalMoves`/`applyMove`/`canonical`, then replay through the real `doMove`/`doPackMove`. Shutter and pack levels need clears-aware / pack-aware path finders (mirrors of `solveShutter` / pack moves).

---

## Board / data model

```
board   = array of shelves
shelf   = [slot, slot, slot]   (the ACTIVE layer; always exactly 3 slots)
          + optional static attributes (see below), preserved through cloning
slot    = array of items, now 0 OR 1 item — the active front.
          (Old multi-item per-slot back-row stacks are GONE; depth lives in
           shelf.buried — see "Sealed-layers mechanic".)
shelf.buried = array of full rows [t,t,t]; buried[0] rises next when the shelf
               clears. Absent/empty on flat shelves.
item    = a plain type-id (int)         normal grocery
        | WILD (= -1)                   wildcard "mixed bag"
        | { t, p }                      a multipack half: type t, pack-group id p
```

**Read an item's type with `TYPE(x)`** (handles all three forms) and detect packs with `isPack(x)`. Never compare raw items — always `TYPE()`.

**Per-shelf attributes** (in `SHELF_ATTRS`, copied by `cloneShelf`; `.buried` is deep-cloned):
- `.label` (type-id) — **reserved shelf**, accepts only that type.
- `.dispenser` (bool) — **take-only pallet**, never accepts anything.
- `.locked` (bool) — **shutter currently closed**; its stock is inert (can't move from/onto).
- `.lockedUntil` (int) — clears needed before the shutter opens.
- `.buried` (rows) — **sealed back layers** beneath the active layer (sealed-layers mechanic).

A shelf **clears** when all 3 active slots are filled and their fronts match (`frontsMatch`, WILD-aware). Clearing removes the 3 fronts; **if the active layer is now empty and a buried row waits, that whole row rises** to become the new active layer (may itself match → cascade); `resolveClears` loops. **Cleared shelves stay in place as empty shelves** (never removed) — a core design rule.

---

## The mechanics (all shipped)

| Gimmick | Marker | Rule | Notes |
|---|---|---|---|
| Core sort | — | drag a front item to a shelf with room; 3 matching fronts clear | the whole game |
| Sealed layers | greyed peek + "+N" badge | active row over `depth-1` buried full rows; a buried row rises ONLY when the shelf is matched-and-cleared (can't excavate by moving fronts) | replaced old back-rows; CH2 (d2), CH5 (d3); `genLayered` |
| Reserved 🪧 | "X ONLY" sign | shelf accepts only its labeled type | `.label`; difficulty via count + tightness |
| Wildcard 🛍️ | rainbow tile | completes any monochrome shelf | **flat levels only** (see gotcha) |
| Dispenser 📦 | "UNLOAD" tag, cool tint | take-only; never accepts | shrinks working space over time |
| Shutter 🔒 | translucent gate, "opens in N clears" | a **stocked** back-room shelf, inert until N shelves cleared | **redesigned** (see below) |
| Frozen ❄️ | frosty glaze + snowflake tag | an item **iced to its shelf** — can never be lifted, but its shelf still clears in place when its three fronts match | item = `{t,fz:1}`; **flat only**; `isFrozen()`/`buildFrozenLevel`; **replaced multipack** |
| Linked 🔗 | coloured ring + chain badge | two ring-tethered shelves must clear with the **same** grocery, **together** (neither clears alone) | *(added v34, CH_LINKED "Paired Aisles")* `.link`; `resolveClears` clears the group; `canonical` encodes the link; `buildLinkedLevel` |

*(Modes, not gimmicks:* the menu **Challenge** selector — **Zen · Tidy** (untimed; Timed retired) — plus the opt-in **💡 nudge**, the **Tour**, and **Your Shop** are UI/meta, covered in the top banner.)*

---

## Code map (`index.html`, single `<script>`)

- **RNG:** `mulberry32(seed)`, `shuffle` — deterministic; boards stable across retries.
- **Board helpers:** `cloneShelf`/`cloneBoard` (copy `SHELF_ATTRS`), `hasItems`, `filledCount`, `shelfHasRoom`, `emptyCount`, `emptyShelfCount`, `canAccept`/`canAcceptN`, `TYPE`/`isPack`, `frontsMatch`, `shelfMonochrome`, `hasMonochromeFull`, `resolveClears`.
- **Moves:** `packSlots(sh)` (the two slots of a shelf's pack, or null), `legalMoves(b)` (singles + pack moves; skips locked shelves as source), `applyMove(b, mv)` (single or `{pack:true}`).
- **Solver:** `canonical(b)` (encodes items + label/dispenser/shutter-state/pack so states aren't conflated), `solve(board, cap, startCleared)` — iterative DFS, mark-on-push, node cap; returns `{solvable, exhausted}`. **Routes to `solveShutter`** when any `.lockedUntil` shelf exists (carries a running clear count so it must *earn* the unlock with reachable items). `exhausted` = hit the cap, no claim.
- **Difficulty floor:** `greedySolvable(board)` — a myopic player sim; generation **rejects greedy-solvable (trivial) boards** so every shipped board needs planning (~91% hard). Buried-aware.
- **Generation:**
  - FLAT levels (core + all feature levels): `tryBuild` (inverse-clears + inverse-moves) → `generateBoard` (fallback ladder that drops constraints/types — **never adds empty shelves** past the 6-shelf cap — solver-gated + greedy-gated). Flat = active slots 0–1 = the new model with no `.buried`, so this still works unchanged.
  - **SEALED-LAYERS levels:** `genLayered(def, i)` = random-fill + solver-gate + greedy-gate (validated in `tests/proto-layers.js`). Used for **plain layered levels only** (`def.layers && !feature && !reserved`); cap **K≤4**.
  - Feature builders `injectWildcards`, `buildDispenserLevel`, `buildShutterLevel`, `buildMultipackLevel` (all flat in the current curve); router `buildLevel(def, i)` → `{board, emojis}`. `paletteFor` keys a stable emoji set off the chapter.
- **Levels (data-first):** `DEPTS` (10 departments: name + palette), `L(kinds, empty, opts)` constructor, `mkTime`, ten chapter arrays `CH1…CH10` (10 defs each) concatenated into `LEVELS` (each gets `easy` from role intro/breather/finale, `time`, `chapter`). **No more `levelDef`/`PALETTE`/`BLURBS`/append-blocks — that was the old 47-level build.** Def fields: `kinds, empty, layers, depth(2|3), reserved, feature, wildcards, packs, shutterAfter, role, blurb`.
- **Persistence:** `localStorage['topshelf.save.v1']` = `{unlocked, current, mode, best, sfx, music}` *(updated v34; was `{…, easy, …}`)*. `mode ∈ {zen,tidy}` *(Timed retired v35)*; `best = {[levelIndex]: fewestMoves}`.
- **Game state `G`:** `{index, def, board, emojis, remaining, total, selected, drag, over, ended, moveToken, cleared, moves, tour, tourStep}`. `G.cleared` drives shutter opening; `G.moves` feeds the Tidy par tracker.
- **Lifecycle/UI:** `startLevel`, **`buildLevelCached`** (build-once-per-session + clone-on-use), `resetBoard` (same seed → identical board), `fitBoard` (sizes slots to fit; min 44px), `render` (active tile + greyed `.buried[0]` peek + `.depthtag`), `updateShutters`, `commitMove`, `doMove`/`doPackMove`, juice (`juiceClears`/`burstShelf`/`showCombo`), win/fail (`finishWin`, `finishDead('hard'|'soft')`, `finishTimeUp`), `showCard`/`hideCard`.
- **Sound:** `SFX` module (Web Audio, synthesized — no asset files): pickup/place/invalid/clear-chime/win + optional ambient `music`; gated by `save.sfx`/`save.music`; unlocks on first gesture.
- **Timer:** rAF loop; Easy mode = ∞ (global toggle, persisted); pauses on overlay/hidden tab.
- **Input:** pointer drag with 8px deadband + tap-to-select fallback. Soft-deadlock check is async (`setTimeout`, cap 200k) and now runs on **layered levels too** — fires **~15s after the player's last move** (token-cancelled, so a fresh move reschedules it). The 15s delay both gives the player time to notice on their own AND means the solver runs at most once per stuck pause, so it's cheap even on deep layered boards (measured 13–230ms; a *per-move* check was the only thing that was too heavy). This catches the layered "back rows can never open because no shelf can be matched" soft-lock. **Still skipped on WILDCARD levels alone** (their solver explodes — tens of seconds).
- **Menu:** level selector grouped by department; **`PLAYTEST` flag** (currently `true` = all levels open; `false` = progression locks). Easy / Sound effects / Music toggles, install row, reset progress. Header has a "📲 Install" button.

---

## Current level layout (100 levels — the shipping arc)

Defined data-first in the `<script>`: a `DEPTS` array (10 departments: name + grocery
palette) and ten chapter arrays `CH1…CH10` of 10 level defs each, concatenated into
`LEVELS` (each gets `time` via `mkTime` and `chapter = floor(i/10)`). `L(kinds, empty, opts)`
is the compact level constructor. `paletteFor` keys emoji off the chapter so each aisle
looks distinct.

| Ch | Levels | Department | New wrinkle introduced |
|----|--------|------------|------------------------|
| 1  | 1–10   | Opening Up        | core sort (the verb), flat |
| 2  | 11–20  | The Back Shelves  | hidden back rows |
| 3  | 21–30  | Reserved Homes    | reserved 🪧 |
| 4  | 31–40  | The Loading Dock  | dispenser 📦 |
| 5  | 41–50  | Deep Storage      | (no new gimmick) deep back rows + pressure |
| 6  | 51–60  | Mixed Bags        | wildcard 🛍️ (flat, kinds≤5) |
| 7  | 61–70  | The Stockroom     | shutter 🔒 (reskinned off "The Cold Room" so the Freezer Aisle owns cold) |
| 8  | 71–80  | The Freezer Aisle | frozen ❄️ (flat) — immovable items, match-in-place |
| 9  | 81–90  | **Paired Aisles** | **linked 🔗 shelves** *(chapter added v34 — see banner; shifts everything below down by 10)* |
| 10 | 91–100 | Rush Hour         | combinations (feature + reserved signs); global peak ~L90 |
| 11 | 101–110| Closing Time      | wind-down to calm finale |

Teaching order (confirmed with user): reserved → dispenser → back-rows(deepen) →
wildcard → shutter → multipack. Gimmicks combine **only** from Ch9 on (one new thing at a
time before that). Combinations are reachable without new builders: the dispenser/shutter/
multipack builders all call `generateBoard(def)`, which already honors `def.reserved` and
`def.layers` — so e.g. "dispenser + 2 reserved + back rows" is just a def. **Wildcard and
multipack stay flat** (layers would explode/tangle the solver).

> **NOTE — the chapter table above shows the ORIGINAL plan. The sealed-layers redo changed
> several chapters:** CH2 Back Shelves & CH5 Deep Storage are now the **sealed-layers** mechanic
> (depth 2 / depth 3, plain); CH9 Rush Hour alternates plain-deep with flat-feature levels;
> all feature chapters (3,4,6,7,8) are **flat** (features don't combine with depth in v1). See
> the "Sealed-layers mechanic" section for the authoritative current layout.

**Level selector:** grouped by department; `featBadge()` adds the per-level gimmick icon.
**`PLAYTEST` flag** (a `const` just above `buildLevelGrid`) controls locks: **currently `true`**
= every level freely selectable (no locks); set **`false` to ship** with unlock-as-you-finish
(level playable once `i+1 <= save.unlocked`, later levels greyed/disabled, `🔒` on locked
chapters). The lock code is intact, just bypassed by the flag.

---

## Key design decisions & rationale (don't re-litigate these)

1. **Aisle sort (match-by-category) was built, then CUT.** The user found it "counterintuitive, not in a good way." Removed entirely (mechanic + levels + the category rule engine). **Lesson: a gimmick must be intuitive at a glance and *spatial/planning*, not a redefinition of what "match" means.**
2. **Shutter was redesigned.** v1 = "bonus empty space that opens after N clears" — self-defeating, because *clearing is how you get space*, so the shutter opened exactly when you no longer needed it (user caught this). v2 = **a stocked back room, locked until N clears** — early play is genuinely tighter (a shelf of items + its space is unavailable) and the opening hands you *work*, not relief. Required the **clears-aware solver** (`solveShutter`) to verify the N clears are achievable without the locked stock. User confirmed v2 works.
3. **Wildcards explode the solver** (a single roomy/high-kind wildcard board took **47–124s** to solve — boards generate *on demand at level load*, so that would hang the game). Fix, shipped: wildcard levels are **flat and kept to kinds≤5**, AND the **build-time solve-gate was removed entirely** for wildcards. Justification (proof in the code comment at the wildcard branch of `buildLevel`): a WILD stands in for any item, so every legal move that solved the base board is still legal and still clears with a wild present — converting items to WILD can **only make a board more solvable, never less**. The base board is already solver-verified inside `generateBoard`, so the wildcard result is **solvable by construction**; no gate needed. For the same reason the **async soft-deadlock check is skipped on wildcard levels** (a 60k-node search would freeze the single-threaded check for seconds; wildcard soft-locks are vanishingly rare, and hard-deadlock + timer still cover the player). Multipack levels are flat too (packs + hidden layers = a tangle). **Don't reintroduce a wildcard solve-gate or raise wildcard kinds above 5.**
4. **Wildcard tile border** was deliberately made bold (rainbow ring + glow + shimmer) after the user said the original was too subtle.
5. **Difficulty comes from configuration, not new verbs** (per the original principles): type count, empty-shelf scarcity, back-row depth, reserved count, board tightness — plus the gimmicks. The user asked for new gimmicks specifically; that was a conscious, approved expansion of the "no new mechanics" rule (still no depleting resources, still relaxing).
6. **Everything stays solvable-by-construction or solver-gated, and seeded per level index** (stable boards reward planning — a core rule).

### Solver soundness notes (important)
- `canonical` **must** encode any new shelf/item distinction, or the solver conflates states and can give wrong answers. (label/dispenser/shutter-locked/pack are all encoded.)
- Soft-deadlock only fires on a **definitive** `!solvable && !exhausted`. Hitting the node cap (`exhausted`) never ends a level. This is why wildcard/pack state-explosion is safe — worst case it just doesn't detect a soft-deadlock.
- Pack objects are shared by reference across clones and **treated as immutable** (we move them, never mutate `t`/`p`). Don't introduce code that mutates a pack object in place.

---

## Playtest status (user-confirmed)

- **Current build (100-level arc + sealed layers + difficulty overhaul + juice/sound): playtested, approved.** ("I have playtested and it looks good.")
- Core game + all five gimmicks (earlier 47-level build): **playtested, approved.** ("I'm happy with the gimmicks.")
- Reserved: "alright" → added harder variants (37–39).
- Wildcards: liked; border beefed up per feedback.
- Dispenser: works.
- Shutter: v2 works ("the new one … works").
- Multipack: approved.

### Bugs fixed this project (so they don't regress)
- **Timer froze after level 1** — `startLevel` now restarts the rAF timer loop (the win card had stopped it).
- **Tall levels overflowed phones** — `fitBoard` sizes slots to fit; later corrected to account for reserved/shutter shelves being ~14px taller (their signs need headroom).
- **Tagline mismatch** — level 4 said "apples" but the reserved color is random; blurbs were audited so none claim specifics the generator doesn't guarantee. (Feature blurbs that *do* state numbers were verified against actual generation.)

---

## NEXT STEPS

### ✅ DONE this session — the 100-level arc, progression locks, PWA
- **100-level arc built** per [`top-shelf-level-design.md`](top-shelf-level-design.md) (sawtooth flow channel, Nintendo four-step gimmick teaching, breathers, set-pieces, calm finale). Structure table above. All 100 machine-verified solvable + fast.
- **Progression locks** shipped (replaced the playtest free-nav); menu grouped by department.
- **PWA packaging** shipped: `manifest.webmanifest`, `sw.js` (cache-first app shell + runtime-cached fonts → installable + fully offline), and generated icons `icon-192.png` / `icon-512.png` / `apple-touch-icon.png` (made by `tests/gen-icon.js`, a dependency-free PNG rasterizer — a wood shelf with three matched groceries). Head has manifest + apple-touch-icon + theme meta. SW registration is guarded so opening the file via `file://` still works standalone.
- **Browser-verified** (Playwright, iPhone viewport): loads clean (0 console errors), plays/wins/unlocks, department labels + all five gimmick renders correct, SW controls the page.

### Still-open items (mostly non-code — as close to publishable as one can get solo)
- Real grocery **art** (currently emoji placeholders). The biggest "can't do solo" gap — needs an illustrator; emoji are a fine stand-in meanwhile.
- **Drag-feel tuning on real iPhone hardware** (deadband/snap timings) — needs a physical device.
- **App Store path** (Capacitor wrapper + Apple Developer account + re-check name availability) if it goes beyond a hosted web link. The hosted-PWA / add-to-home-screen path works **now**.
- Optional **endless/daily** mode (soft-deadlock detection exists, so it's safe to add).

### Distribution decision (this session)
- **Shipping as a free, hosted PWA — not a paid App Store app.** Rationale discussed with the user: the paid mobile model is a poor commercial bet in this crowded genre with no marketing, and the game's anti-monetization principles remove every F2P lever. Selling on the App Store would also force an art upgrade (emoji are Apple's copyrighted font — fine to render in-app, but not licensable for a paid product's store listing/icon/marketing) and the $99/yr Apple Developer fee.
- **DEPLOYED & LIVE on GitHub Pages:** **https://lux-username.github.io/top-shelf/** (repo `github.com/lux-username/top-shelf`, public, Pages serves `main` from root). The whole flow was driven from here: the user authenticated `gh` once (the binary is at `/tmp/gh`; git credential helper points at it); I create/push and check build status via `gh api repos/lux-username/top-shelf/pages/builds/latest`. Commits use the user's GitHub **noreply** email (privacy). **To deploy an update:** edit → `git commit` → `git push origin main` → bump `CACHE` in `sw.js` (currently **`topshelf-v8`**) or returning players get the stale cached copy → Pages rebuilds in ~35s. Returning players may need 1–2 reloads for the new SW to take over; fresh visitors get it immediately.
- **PWA install helper:** a dismissible bottom banner + a permanent "📲 Install" header button + a menu row. One-tap native prompt on Chrome/Android (`beforeinstallprompt`); on iOS Safari (no programmatic install) it shows the Share → Add to Home Screen steps; on unsupported browsers a short how-to; auto-hides once installed.
- **Emoji art retained** (no upgrade for now) — correct for a free link-shared PWA; the licensing/quality concerns only applied to the paid-App-Store path. If art is ever revisited, an AI-generator comparison research pass was scoped but stopped (re-run it then — pricing/terms will be fresher).
- **Cheap upgrade if a store listing is ever wanted:** Google Play is a one-time $25 (vs Apple's $99/yr); the web app wraps via TWA/Bevy/Capacitor.

### Playtest overhaul (this session — target-player feedback: too easy / static / tiny icons / silent)
Pivoted toward "more stimulating & challenging, keep the warm look" per the user. Changes:
- **Difficulty FLOOR via a greedy gate.** `greedySolvable(board)` simulates a myopic player; `generateBoard` now **rejects greedy-solvable boards** (they need no planning = the "boring" failure mode) and ships the hardest solvable candidate. ~91% of boards are now greedy-hard. Stable across retries (deterministic). Don't remove this — it's the main fix for "even mid levels aren't hard."
- **Difficulty from screen-free levers, not shelf count.** Boards **capped at 6 shelves** (7 only for the two CH9 peaks) so tiles stay readable — driven by an explicit insight: difficulty in sort puzzles comes from **tight space (empty 0-1), deep back-rows (new `depth` param, 2-3), and constraints**, NOT type count. The curve was rewritten accordingly (types capped ~5, much tighter/deeper). `generateBoard`'s fallback ladder now relaxes by **dropping constraints/types, never adding empty shelves** (which used to inflate shelf count past the cap AND make boards easier), and gates playability on empty **slots**, not empty shelves (so tight boards aren't rejected).
- **Bigger icons.** Emoji ratio 0.46→0.54, back-row 0.34→0.40, fitBoard min slot 38→44. No scrolling (it fights the drag gesture); the 6-shelf cap is what makes tiles readable.
- **Juice.** Real clears now flash the shelf + spray sparks (`burstShelf`), and cascades show a **"Combo ×N!"** badge (`juiceClears`/`showCombo`). Ethical per the engagement doc: feedback only ever celebrates a genuine clear.
- **Sound (Web Audio, no asset files).** `SFX` module: pickup/place/invalid blips, a clear-chime that climbs with combo depth, a win flourish, and an optional gentle ambient music loop. Menu toggles **Sound effects** (default on) and **Music** (default off); persisted in `save.sfx`/`save.music`. Audio unlocks on first gesture (autoplay policy). `resolveClears`/`applyMove` gained an optional clear-index `out` param (solver calls unchanged) so the UI knows exactly which shelves cleared.

### Sealed-layers mechanic (this session — REPLACED the old back-rows)
The hidden-layer mechanic was redesigned per user request. **Old:** a slot held [front, back] and moving the front away revealed the back (you could "excavate" by shuffling fronts). **New "sealed layers":** a layered shelf is an **active row (3 slots) over `depth-1` buried full rows** (`shelf.buried`, deep-cloned via SHELF_ATTRS). A buried row surfaces **only when the shelf is matched-and-cleared** — `resolveClears` removes the 3 active fronts and, if the active layer is now empty and a buried row waits, that whole row **rises** to become the new active layer (and may itself match → cascade). Buried items are **visible-but-greyed** (one peek shown; a `+N` `.depthtag` marks more below). You can't peek by moving fronts — you must commit and match each layer in place. (Decisions confirmed with user: stays-buried / visible-greyed / replace-everywhere.)
- **Engine:** `resolveClears` (rise), `hasItems`/`emptyShelfCount`/`cloneShelf`/`canonical`/`greedySolvable` are buried-aware; `legalMoves`/`applyMove`/`shelfMonochrome` unchanged (they act on the active layer, now always 0–1 items). Backward-compatible: flat shelves have no `.buried` and behave exactly as before.
- **Generation:** new `genLayered` = random-fill + solver-gate + greedy-gate (validated in `tests/proto-layers.js`: ~100% hard/solvable in ~1–2 tries). Routed in `buildLevel` for **plain layered levels only** (`def.layers && !feature && !reserved`). **Cap layered at K≤4** (K5 makes the solver ~1s). Depth is **purely vertical** → deep hard boards at ≤6 shelves.
- **Features stay FLAT in v1** (reserved/dispenser/shutter/wildcard/multipack never combine with depth). Combining a feature with sealed layers is a possible v2.
- **Soft-deadlock now RUNS on layered levels** (2026-06-18): the worry was a *per-move* solve hitching the main thread, but the check now fires only ~15s after the last move (≈once per stuck pause) at cap 200k — measured 13–230ms on deep boards. It catches the "back rows can never open" soft-lock that build-time gating can't (that only guarantees the *starting* board is winnable, not every reachable state). Wildcard stays skipped (solver explosion).
- **Known tuning note:** the deepest levels (K4 depth-3, ~36 items) have long solutions (~50–90 moves). Verified solvable + hard, but watch for tedium on playtest; dial depth/K down on specific peaks if it drags.
- Curve: **CH2 Back Shelves** = sealed depth-2, **CH5 Deep Storage** = sealed depth-3, **CH9 Rush Hour** alternates plain-deep with flat-feature, **CH10** eases deep→flat. All other chapters flat.

### Design reference docs (read before adding "engagement" features)
- [`top-shelf-level-design.md`](top-shelf-level-design.md) — how to build good levels & the difficulty arc.
- [`top-shelf-engagement-ethics.md`](top-shelf-engagement-ethics.md) — **research-backed catalog of engagement/retention mechanics with an ethical verdict for each (engaging vs compulsive/dark-pattern), and the one actionable ethics test to apply to any new feature.** Use it to keep the game "sticky" through craft (mastery, autonomy, honest feedback) without crossing into compulsion. Names explicitly the two newly-considered-and-rejected mechanics: competition/leaderboards and penalty-bearing streaks.

### Maintenance notes
- **Art is now 100% bespoke inline SVG (no emoji anywhere on screen).** ~70 icons live in one hidden `<svg>` sprite of `<symbol>`s near the top of `index.html`, drawn via `<use href="#ic-…">` and a `glyphHTML()` helper (1.25em sizing). Covers groceries, gimmick markers (`ic-mk-*`), UI chrome (`ic-ui-*`), result cards (`ic-card-*`), and clear-burst sparks. Department palettes in `DEPTS` are now icon-key strings, not emoji. Only remaining emoji are in code comments.
- **Icon set backup/working-copy workflow** lives in **`icons/`** (`set-A.svg` = frozen backup, `set-B.svg` = working copy, `iconset.mjs` = export/apply tool, `README.md` = how-to). The game keeps its sprite **inline**; `node icons/iconset.mjs apply B` pushes `set-B.svg` into `index.html` (lossless round-trip), `apply A` restores the backup. **Edit set-B, never set-A.** Applying doesn't bump the SW cache — do that + deploy separately.
- **2026-06-20 icon revisions:** cake-slice cherry removed (cleaner 3D wedge), shipped **v21**. **`pretzel` was replaced by `pancakes`** (the knot never read cleanly at icon size after many passes) — item key renamed `pretzel → pancakes` in the **Mixed Bags** palette and the `ICON_KEYS` list, `gPretzel` gradient swapped for `gPancake` + `gSyrup`, new `ic-pancakes` symbol; shipped **v22**. If adding bakery items, note already-used: bread, cookie, pie, croissant, baguette, bagel, cupcake, cakeslice, donut, pancakes.
- Game file is **`index.html`** (was `top-shelf.html`). `sw.js`, `manifest.webmanifest`, `tests/harness.js` reference it.
- **`tests/harness.js`** evals the engine slice and times `buildLevel`+`solve` for every level: `node tests/harness.js [lo] [hi]` (1-based; **default now covers all 110** — the default `hi` was previously capped at 100 and silently skipped the last chapter, fixed 2026-07-07). It reports solvable/greedy-easy/shelf-count/gen-time per level. **Run after any change to defs, generation, or the engine.** All 110 currently: solvable, **≤6 shelves**, greedy-hard except breathers/finale/intro.
- **`tests/proto-layers.js`** — standalone prototype that validated the sealed-layers generation (keep as reference if revisiting that mechanic).
- **`tests/gen-icon.js`** — regenerates the app icons (dependency-free PNG rasterizer).
- **In-memory board cache** (`buildLevelCached` + `_boardCache`): boards build once per session, cloned per use. Clone is essential — `updateShutters` mutates `.locked` in place; sharing the cached board would corrupt replays (tested). If you precompute/bake boards later, preserve clone-on-use.
- **SW cache** is at **`topshelf-v34`** — bump it on every HTML/asset change or returning players get the stale copy.
- **Headless eval gotcha:** append test code to the *same* `eval` string as the engine slice (strict-mode `const`/`let` don't leak out of `eval`). Engine slice = from `"use strict";` to the `Persistence` comment.

---

## Gotchas cheat-sheet
- Items are polymorphic — always `TYPE(x)` / `isPack(x)`.
- `solve(board, cap, startCleared)` — pass `G.cleared` in-game so shutters unlock correctly; pass `0` at generation.
- Generation is deterministic per level index; feature builders vary the seed by `attempt` but deterministically, so accepted boards are stable across retries.
- `fitBoard` runs on every `render` and on resize/orientation; tune slot sizing there.
- The Node test harness must `eval` the script slice + test code together (strict-mode scoping).
