# Top Shelf — Level Design Principles (research-backed)

> Source: deep-research pass (Jun 2026) over game-design literature + shipped sort games.
> 25 claims adversarially verified (3-vote). **Principles below are the confirmed ones.**
> Read `top-shelf-handoff.md` (intent + sacred rules) and `top-shelf-progress.md` (current build) first.
> This doc exists to guide authoring the **100-level arc** (the deferred main work).

---

## The one meta-finding

**Trust principles, distrust numeric prescriptions.** Every *specific* numeric rule we found
("levels 1–20 easy, hard spike at 20–30, ramp after 50"; "1–3 attempts = easy, 20–35 = hard")
**failed verification** — they're single-blog assertions with no support. The structural
principles (flow channel, isolate-then-combine, breathers, sawtooth) are **well-supported and
convergent across sources**. So: use the shapes below, but tune the actual numbers by playtest
feel, not by importing someone's KPI table.

---

## 1. The difficulty curve = a sawtooth inside a flow channel

**Confirmed:** Flow happens when perceived challenge ≈ perceived skill. Challenge *above* skill →
anxiety; *below* → boredom. Both break flow. As the player's skill rises across 100 levels, raw
difficulty must rise too, or the back half goes slack.

**But not monotonically.** Confirmed: pacing should **alternate challenge and rest**. The proven
shape is a **sawtooth** — each level a bit harder, then a sharp drop to a breather, then climb
again — with the *peaks and the floors both trending upward*. A late-game breather should still be
harder than an early-game peak.

Applied to Top Shelf:
- Keep the planned **峰 around level ~90, then deliberately wind down to a calm finale at 100.**
  This is well-supported: ending in the flow channel (not at max anxiety) is what makes a relaxing
  game feel *complete* rather than *survived*.
- **Breather every ~7th level** (already planned) is the sawtooth's down-stroke. Confirmed role:
  rest beats between challenge spikes. Make breathers *visibly* easier (more empty shelves, fewer
  types, no new gimmick) so the relief reads instantly.
- Don't fear a hard level — fear a hard level with **no breather after it**. The drop is what
  converts difficulty into rhythm instead of grind.

**Top Shelf's difficulty levers, ranked by how cozy-safe they are to push:**
1. **Type count** (3→6+) — cleanest knob; raises planning load without anxiety.
2. **Empty-shelf scarcity** — the core pressure. 2 empty = open; 1 empty = tight; 0 spare = the
   board is a near-deadlock you must thread. This is your primary sawtooth axis.
3. **Back-row depth** — adds *planning uncertainty* (can't fully pre-plan). Use sparingly in cozy
   stretches; it's the lever most likely to tip into "I can't see a path" frustration.
4. **Gimmicks** — each is a difficulty event in itself (see §2). Treat introducing one as a spike.
5. **Timer** — keep it the soft/optional lever it already is. Never the source of a spike.

---

## 2. Teach each gimmick in isolation, THEN develop, twist, combine

This is the most strongly-confirmed cluster in the whole research (Nintendo four-step, "hierarchy
of learning," tutorialization-without-tutorials, kishōtenketsu all agree).

**The four-step teaching method (Nintendo / Super Mario), confirmed and mapped to us:**

| Step | Nintendo | Top Shelf application |
|---|---|---|
| **1. Introduce** | new mechanic appears alone, safe, can't fail | a level where the *only* challenge is the new gimmick — everything else trivially easy (lots of empty shelves, few types). Player discovers the rule by doing, no text wall. |
| **2. Develop** | same mechanic, slightly higher stakes | re-present the gimmick with a real (but gentle) constraint so they *use* it deliberately. |
| **3. Twist** | mechanic in a new combination/context | combine the new gimmick with one *already-mastered* lever (e.g. reserved + tight space), or invert the expectation. |
| **4. Conclusion / set-piece** | mastery test | the chapter-ending set-piece: the gimmick at full strength. Then breather, then next gimmick. |

**Hard rules (all confirmed):**
- **One new wrinkle at a time.** Never introduce two unfamiliar things in the same level. The
  handoff already commits to this — research backs it unequivocally.
- **Introduce in a low-stakes level where the mechanic can't punish a first mistake.** A gimmick's
  debut level should be nearly unfailable.
- **Group levels by mechanic** (= our chapter/department structure). Confirmed: grouping is what
  *lets* you do introduce→develop→twist cleanly. Each ~10-level department owns one gimmick's full
  teaching arc.
- **Teach by level design, not by modal popups.** "Instructive level design" / "tutorialization":
  the board itself should make the correct first move obvious. Reserve text for a one-line blurb.

**Implication for the 100 arc:** the chapter order *is* the gimmick-teaching order. Sequence
gimmicks easiest-to-grok first. Suggested teaching order (cozy-safe → spicy):
reserved 🪧 → dispenser 📦 → back-rows (deepen) → wildcard 🛍️ → shutter 🔒 → multipack 🎀,
with early chapters being pure-core space/type escalation before any gimmick. Late chapters are the
**twist/combine** zone where mastered gimmicks meet (the only place two appear together).

---

## 3. What makes an individual level satisfying (not tedious)

**Confirmed distinction: "aha" puzzles vs "process" puzzles.** A good level hinges on an *insight*
(spot the one shelf that unlocks everything), not on executing a long obvious procedure. Pure
bookkeeping — where the solution is visible and you just grind it out — is the tedium failure mode.

Design each level around **one insight**:
- There should be a non-obvious **key move / key shelf** — the thing that, once seen, collapses the
  puzzle. Tangle the board so that key isn't the first thing you reach for.
- **Forced vs free moves:** a level that's *all forced* (only one legal move each step) is a
  cutscene, not a puzzle. All free (everything works) is trivial. Aim for a board that offers
  several plausible-looking moves where **most lead to dead ends or longer paths** and a few lead
  home. The choice is the gameplay.
- **"Tangle" at start:** items should be scattered so that no shelf is one move from clearing.
  Roughly: the opening board should require the player to *make space before they can make
  matches*. Our reverse-scramble generator does this by construction — tune the scramble depth as
  the tangle knob.

**Soft-lock avoidance (confirmed important + we already solve it):**
- These puzzles are **NP-complete** (verified, 2022 paper) and **reverse-scrambling from a solved
  state guarantees solvability** — exactly our generation strategy. Keep it.
- We already machine-verify every board and detect hard + soft deadlocks. Research validates this
  as essential: an unsolvable-looking board in a cozy game reads as *broken*, not *hard*.
- **Optimal (shortest) solution length is a usable difficulty metric** (confirmed). Longer optimal
  solution ≈ harder. We can compute it from the solver. Use it as a *relative* sort key within a
  chapter, not an absolute target — pair it with branching factor (how many legal moves per state)
  for a fuller read.

**A concrete per-level checklist** (apply when authoring/accepting a generated board):
- [ ] Solvable + no soft-lock (solver-gated — already enforced).
- [ ] Has a non-obvious key move (not solvable by always-clear-the-nearest-match).
- [ ] Not all-forced and not all-free — there are tempting *wrong* moves.
- [ ] Exactly one *new* concept vs the player's current vocabulary (or zero, if it's a develop/breather level).
- [ ] Optimal solution length sits where you want it on the chapter's sawtooth.
- [ ] Tangled start: no shelf is one move from monochrome.

---

## 4. Coziness — what it actually is (and one myth, busted)

**Refuted:** "coziness = absence of difficulty / danger / cost." This overstated claim **failed
verification 0-3.** Cozy is **not** the same as easy. A cozy game can be genuinely challenging.

**Confirmed, what coziness actually requires:**
- **Player agency / opt-in pressure.** The player controls their own pace and exposure. Our
  optional timer + unlimited retries + stable boards are textbook-correct: *the player chooses how
  much pressure to feel.* Keep Easy mode (timer off) prominent.
- **Don't lean on extrinsic rewards.** Confirmed: extrinsic reward systems (coins, streak meters,
  star-greed) *undermine* coziness by reframing intrinsic play as a chore. This is the same insight
  as our "no depleting resources, ever" rule — research independently confirms it's not just
  ethics, it's *what makes the game feel good.* Don't add stars/coins later "for engagement."
- **No failure that costs the player anything.** Soft-fail resets, no lives — already correct.

So coziness constrains difficulty's *shape*, not its *height*: pressure must always be **opt-in and
consequence-free**, but the puzzles themselves can get genuinely hard. The relaxation comes from
*how* you can fail (freely, repeatably, on your own schedule), not from never being challenged.

**Flow + cozy together → the design constraint:** keep challenge tracking the player's rising skill
(so they're never bored), but make every pressure source dismissible (so they're never anxious).
The sawtooth gives the engagement; the opt-in framing gives the calm.

---

## 5. Generation: hybrid, not either/or

**Refuted:** "modern tile puzzles are *predominantly hand-authored*" (failed 1-2 — it's actually
**hybrid** in practice). Shipped sort/tile games typically **generate candidates procedurally, then
curate/tune by hand** and gate on a solver.

For Top Shelf this means our existing approach is industry-correct: **reverse-scramble generation +
solver gate + seeded-stable boards.** For the 100 arc, the *curation* layer is the work:
- Generate many candidate boards per level slot (vary seed), then **hand-pick** the one with the
  best insight/tangle/solution-length for that point on the curve.
- The 100 levels should be **frozen, curated picks** (replace the current demo/append blocks), not
  live-generated at runtime — so the sawtooth is authored, not accidental.
- Keep procedural generation available later for an **endless/daily** mode (safe now that
  soft-deadlock detection exists) — but the main 100 are hand-curated.

---

## 6. Concrete heuristics to apply (the actionable shortlist)

Tunable knobs, with starting intuitions (calibrate by playtest, per the meta-finding):
- **Types per level:** start 3, end ~6. More types = more planning, low anxiety. Primary smooth ramp.
- **Empty shelves:** 2 (open) → 1 (tight) → 0-spare (threading a near-deadlock). Primary sawtooth axis.
- **Optimal solution length:** compute via solver; use as the *within-chapter* difficulty sort key.
- **Branching factor:** legal moves per state — low+long = forced/tedious; high+short = trivial;
  want *moderate branching with several dead-end-leading options.*
- **Tangle:** scramble depth tuned so no shelf opens one-move-from-clear.
- **One-new-thing rule:** ≤1 unfamiliar concept per level; breathers add 0.
- **Breather cadence:** ~every 7th level, visibly easier, no new gimmick.
- **Set-piece cadence:** chapter-end, the chapter's gimmick at full strength.
- **Global shape:** rising sawtooth, peak ~L90, calm wind-down to L100 finale ("Closing time —
  leave it neat.").

---

## What to ignore from the research

- Any *specific* difficulty-by-level-number table (refuted, unsupported).
- Any *specific* attempts-per-level KPI tier (refuted; and we have no analytics anyway — this is a
  gift, not a LiveOps title).
- "Pass rate is dead as a metric" (refuted; moot for us — no telemetry).
- Engagement/retention/extrinsic-reward advice from the mobile-monetization sources — actively
  *contrary* to this project's principles. Cited sources skew F2P; filter for the craft, drop the
  growth-hacking.

---

## Sources (verified subset)

- Nintendo four-step stage design — gamedeveloper.com "The secret to Mario level design";
  nintendolife four-step writeup.
- Tutorialization / hierarchy of learning — gamedeveloper.com "Tutorialization", "Teaching game
  mechanics: a hierarchy of learning"; TVTropes Instructive Level Design; kishōtenketsu writeup.
- Flow channel — gamedeveloper.com "Cognitive flow", "Understanding the flow channel";
  Wikipedia Flow (psychology).
- Coziness — lostgarden "Cozy games"; gamedeveloper.com "Designing for coziness" (the *overstated*
  three-element claim was refuted; the agency/opt-in/anti-extrinsic claims confirmed).
- Sort-puzzle structure & NP-completeness — arxiv 2202.09495 (NP-complete + reverse-scramble);
  Water/Ball sort optimal solver (hkociemba); gamedeveloper "Smart casual: state of tile-puzzle
  level design" (its hand-authored-predominance and pass-rate claims were refuted as overstated).
- Puzzle craft — thecodex.ca "Puzzles: aha vs process"; brdelfino "Puzzle design: a guide."
