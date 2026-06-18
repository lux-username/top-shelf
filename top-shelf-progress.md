# Top Shelf — Progress & Handoff (current state)

**Read `top-shelf-handoff.md` first** for the original design intent, anti-design rules, and the three sacred principles. This document is the *current state* after several build sessions and supersedes the "Current prototype state / Open work" sections of that original doc.

The whole game lives in one file: **`index.html`** (~1490 lines, single self-contained file, no build step, no dependencies beyond two Google Fonts). Open it in any browser.

---

## TL;DR for the next session

- The game is **complete and shippable**: the full **100-level progression arc** is built (replacing the old 47-level demo build), plus **progression locks** and **PWA packaging** (installable + offline). Core mechanic + back-rows + **five gimmicks**, a bounded solver, on-demand generation, localStorage persistence, responsive phone layout, drag + tap input.
- The **100 levels are a curated 10-chapter arc** (a shop's day; one department per chapter). Built per the research in [`top-shelf-level-design.md`](top-shelf-level-design.md): each chapter introduces ONE wrinkle in isolation, develops/twists it, breather every ~7th, set-piece at chapter ends, sawtooth difficulty peaking ~L90, calm wind-down to a serene finale at L100 ("Closing time — leave it neat.").
- Every one of the 100 levels is **machine-verified solvable and fast to generate** (worst-case ~360ms one-time at level load; see `tests/harness.js`). Boards are **stable across retries** (seeded by level index).
- The user **playtested and approved the full gimmick set** (in the earlier 47-level build).
- **What's left is mostly non-code:** real grocery art (still emoji), drag-feel tuning on actual iPhone hardware, and an optional endless/daily mode. See "Next steps".

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
shelf   = [slot, slot, slot]   (always exactly 3 slots)
          + optional static attributes (see below), preserved through cloning
slot    = array of items, index 0 = FRONT (visible, movable), 1.. = hidden back-row layers
item    = a plain type-id (int)         normal grocery
        | WILD (= -1)                   wildcard "mixed bag"
        | { t, p }                      a multipack half: type t, pack-group id p
```

**Read an item's type with `TYPE(x)`** (handles all three forms) and detect packs with `isPack(x)`. Never compare raw items — always `TYPE()`.

**Per-shelf attributes** (in `SHELF_ATTRS`, copied by `cloneShelf`):
- `.label` (type-id) — **reserved shelf**, accepts only that type.
- `.dispenser` (bool) — **take-only pallet**, never accepts anything.
- `.locked` (bool) — **shutter currently closed**; its stock is inert (can't move from/onto).
- `.lockedUntil` (int) — clears needed before the shutter opens.

A shelf **clears** when all 3 slots are filled and their fronts match (`frontsMatch`, WILD-aware). Clearing removes the 3 fronts; back-row items advance; cascades resolve (`resolveClears`). **Cleared shelves stay in place as empty shelves** (never removed) — a core design rule.

---

## The mechanics (all shipped)

| Gimmick | Marker | Rule | Notes |
|---|---|---|---|
| Core sort | — | drag a front item to a shelf with room; 3 matching fronts clear | the whole game |
| Back-rows | greyed item peeking | a slot holds front + 1 hidden item, revealed when front leaves | "layers" levels |
| Reserved 🪧 | "X ONLY" sign | shelf accepts only its labeled type | `.label`; difficulty via count + tightness |
| Wildcard 🛍️ | rainbow tile | completes any monochrome shelf | **flat levels only** (see gotcha) |
| Dispenser 📦 | "UNLOAD" tag, cool tint | take-only; never accepts | shrinks working space over time |
| Shutter 🔒 | translucent gate, "opens in N clears" | a **stocked** back-room shelf, inert until N shelves cleared | **redesigned** (see below) |
| Multipack 🎀 | shrink-wrap band + ribbon | two same-type items bound; move as a unit into 2 open slots | item = `{t,p}`; **flat only** |

---

## Code map (`index.html`, single `<script>`)

- **RNG:** `mulberry32(seed)`, `shuffle` — deterministic; boards stable across retries.
- **Board helpers:** `cloneShelf`/`cloneBoard` (copy `SHELF_ATTRS`), `hasItems`, `filledCount`, `shelfHasRoom`, `emptyCount`, `emptyShelfCount`, `canAccept`/`canAcceptN`, `TYPE`/`isPack`, `frontsMatch`, `shelfMonochrome`, `hasMonochromeFull`, `resolveClears`.
- **Moves:** `packSlots(sh)` (the two slots of a shelf's pack, or null), `legalMoves(b)` (singles + pack moves; skips locked shelves as source), `applyMove(b, mv)` (single or `{pack:true}`).
- **Solver:** `canonical(b)` (encodes items + label/dispenser/shutter-state/pack so states aren't conflated), `solve(board, cap, startCleared)` — iterative DFS, mark-on-push, node cap; returns `{solvable, exhausted}`. **Routes to `solveShutter`** when any `.lockedUntil` shelf exists (carries a running clear count so it must *earn* the unlock with reachable items). `exhausted` = hit the cap, no claim.
- **Generation (backward shuffle from solved):** `tryBuild` (inverse-clears + inverse-moves, respects reserved labels), `generateBoard` (fallback ladder that relaxes params, **solver-gated**), feature builders `injectWildcards`, `buildDispenserLevel`, `buildShutterLevel`, `buildMultipackLevel`, and the router `buildLevel(def, i)` → `{board, emojis}`. `paletteFor` assigns a stable, level-varied emoji set.
- **Levels:** `PALETTE`, `BLURBS`, `levelDef(i)` (base curve), `LEVELS` array, then an **injection block** (overrides base levels 4/8/13 with reserved) and **append blocks** (reserved-hard, wildcard, dispenser, shutter, multipack demos).
- **Persistence:** `localStorage['topshelf.save.v1']` = `{unlocked, current, easy}`.
- **Game state `G`:** `{index, def, board, emojis, remaining, total, selected, drag, over, ended, moveToken, cleared}`. `G.cleared` drives shutter opening.
- **Lifecycle/UI:** `startLevel`, `resetBoard` (same seed → identical board), `fitBoard` (sizes slots so the whole board fits the viewport — accounts for reserved/shutter shelves being taller), `render`, `updateShutters`, `commitMove` (shared post-move resolve), `doMove` (single), `doPackMove` (pack), win/fail (`finishWin`, `finishDead('hard'|'soft')`, `finishTimeUp`), `showCard`/`hideCard`.
- **Timer:** rAF loop; Easy mode = ∞ (global toggle, persisted); pauses on overlay/hidden tab.
- **Input:** pointer drag with 8px deadband + tap-to-select fallback; pack-aware via `dragAccepts`, `moveSelectedTo`. Soft-deadlock check runs **async** (`setTimeout`, cap 60k) so it never blocks move feedback and never false-positives.
- **Menu:** free level selector (every level tappable — playtest scaffolding), feature badges + legend, Easy toggle, reset progress.

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
| 7  | 61–70  | The Cold Room     | shutter 🔒 |
| 8  | 71–80  | The Bulk Aisle    | multipack 🎀 (flat) |
| 9  | 81–90  | Rush Hour         | combinations; global peak ~L90 |
| 10 | 91–100 | Closing Time      | wind-down to calm finale |

Teaching order (confirmed with user): reserved → dispenser → back-rows(deepen) →
wildcard → shutter → multipack. Gimmicks combine **only** from Ch9 on (one new thing at a
time before that). Combinations are reachable without new builders: the dispenser/shutter/
multipack builders all call `generateBoard(def)`, which already honors `def.reserved` and
`def.layers` — so e.g. "dispenser + 2 reserved + back rows" is just a def. **Wildcard and
multipack stay flat** (layers would explode/tangle the solver).

**Progression locks** (shipping, replaced the playtest free-nav): a level is playable once
reached (`i+1 <= save.unlocked`); later levels show greyed, disabled numbers. The menu groups
the picker by department with a `🔒` on not-yet-reached chapters. `featBadge()` adds the
per-level gimmick icon.

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

- Core game + all five gimmicks: **playtested, approved.** ("I'm happy with the gimmicks.")
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
- **Free-hosting path chosen:** the game is just static files (`index.html` + manifest + `sw.js` + icons), deployable on any free static host (Netlify Drop / Cloudflare Pages / GitHub Pages). Users open the link in Safari → Add to Home Screen → installed, fullscreen, offline. See `README.md` for exact steps. The repo is `git init`'d and ready to push.
- **Emoji art retained** (no upgrade for now) — correct for a free link-shared PWA; the licensing/quality concerns only applied to the paid-App-Store path. If art is ever revisited, an AI-generator comparison research pass was scoped but stopped (re-run it then — pricing/terms will be fresher).
- **Cheap upgrade if a store listing is ever wanted:** Google Play is a one-time $25 (vs Apple's $99/yr); the web app wraps via TWA/Bevy/Capacitor.

### Design reference docs (read before adding "engagement" features)
- [`top-shelf-level-design.md`](top-shelf-level-design.md) — how to build good levels & the difficulty arc.
- [`top-shelf-engagement-ethics.md`](top-shelf-engagement-ethics.md) — **research-backed catalog of engagement/retention mechanics with an ethical verdict for each (engaging vs compulsive/dark-pattern), and the one actionable ethics test to apply to any new feature.** Use it to keep the game "sticky" through craft (mastery, autonomy, honest feedback) without crossing into compulsion. Names explicitly the two newly-considered-and-rejected mechanics: competition/leaderboards and penalty-bearing streaks.

### Maintenance notes
- The game file was renamed `top-shelf.html` → **`index.html`** (so the bare hosting URL loads it). `sw.js`, `manifest.webmanifest`, and `tests/harness.js` were updated to match.
- `tests/harness.js` evals the engine slice and times `buildLevel`+`solve` for every level: `node tests/harness.js [loLevel] [hiLevel]` (1-based, prints per level). Run it after any change to level defs or generation to confirm all boards stay solvable and fast. Bump `CACHE` in `sw.js` whenever you change the HTML/assets, or the service worker will serve a stale cached copy (this bit during dev — cache-first hides edits until the cache version changes).

---

## Gotchas cheat-sheet
- Items are polymorphic — always `TYPE(x)` / `isPack(x)`.
- `solve(board, cap, startCleared)` — pass `G.cleared` in-game so shutters unlock correctly; pass `0` at generation.
- Generation is deterministic per level index; feature builders vary the seed by `attempt` but deterministically, so accepted boards are stable across retries.
- `fitBoard` runs on every `render` and on resize/orientation; tune slot sizing there.
- The Node test harness must `eval` the script slice + test code together (strict-mode scoping).
