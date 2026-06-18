# Top Shelf — Engagement vs. Compulsion: an ethics-of-stickiness reference

> Purpose: catalog the engagement/retention techniques used in casual & puzzle mobile
> games, the psychology behind each, and a clear **ethical verdict** for each — so future
> work can make *Top Shelf* more satisfying **without** crossing into compulsive/addictive
> "dark pattern" territory. The whole project is the *honest* version of this genre; this
> doc is the guardrail.
>
> **Provenance / confidence tags** (this came from a deep-research pass, Jun 2026, 23
> mostly-primary sources, 25 claims adversarially verified — 20 confirmed, 5 killed):
> - **[V]** verified 3-0 by the research pass (strong)
> - **[V~]** verified but rests on a single study or a transfer from an adjacent domain
> - **[X]** a claim the pass *refuted/corrected* — recorded so we don't repeat the error
> - **[K]** standard design/psychology literature, **not** verified by this pass — treat as
>   plausible-but-unproven; do not present as settled
>
> Read alongside `top-shelf-handoff.md` (the three sacred principles) and
> `top-shelf-level-design.md`.

---

## 0. The one-paragraph version

The research is unusually unanimous on the key point: **whether a mechanic is "engaging" or
"exploitative" is determined by its *implementation, optionality, and effect on the player* —
not by the mechanic itself.** [V] The same daily-reward or progression system can be healthy
or predatory depending on how it's built. So the goal isn't to find "good mechanics" and bolt
them on; it's to apply a consistent **ethics test** to anything we add, and to power
engagement from the player-respecting drivers (mastery, autonomy, clear goals, honest
feedback) rather than from pressure, scarcity, or manufactured compulsion.

---

## 1. The actionable ethics test (use this on every future feature)

From Zagal, Björk & Lewis, *Dark Patterns in the Design of Games* (FDG 2013) — a "dark game
design pattern" is one used **intentionally, against the player's best interests, and without
their consent.** [V] They sort dark patterns by what the player is tricked into spending:

- **TIME** — grinding, *playing-by-appointment*, loss-aversion chores (the canonical example:
  *FarmVille* crops that wither if you don't return). [V]
- **MONEY** — pay-to-skip artificial friction, pre-delivered/locked content, monetized
  rivalries / pay-to-win. [V]
- **SOCIAL CAPITAL** — friend-spam, social-pyramid/invite mechanics. [V]

> **[X] Correction the research pass caught:** the popular "**four**-category Zagal taxonomy"
> (adding a *Psychological* bucket of variable rewards/badges) was **refuted** — that's a
> later mis-citation. Zagal 2013 is **three** categories (time/money/social-capital). Don't
> repeat the four-category version. Also refuted: attributing "variable-ratio = addiction" to
> Zagal — that mechanism belongs to the loot-box/gambling literature (§4), not this paper.

**The single most actionable rule** (Zagal's context-dependence test) [V]:

> A mechanic's "darkness" is **nullified when it is optional and non-gating** — i.e. you can
> fully enjoy and progress in the game without engaging with it. It becomes dark only when
> **most players *must* engage with it to progress** *and* it **doesn't support their actual
> play/enjoyment.** (Grinding is fine in Pokémon, dark in FarmVille — same mechanic, different
> implementation.)

This is reinforced by the rest of the field: Deterding, Björk et al., *Against Dark Game
Design Patterns* (DiGRA 2020) argue the term is conceptually incoherent as a list of
*mechanics* and should be reframed; Aagaard et al. (CHI 2022) define a dark pattern by its
**harmful implementation** — one "implemented in such a way that it drives players towards
experiences negatively affecting their wellbeing." [V] Exploitation empirically concentrates
in free-to-play / IAP titles (Niknejad et al., MUM 2024: F2P games carried dark patterns far
more often than premium — ~96.8% vs ~53%, monetary patterns p<.001). [V~]

**The test, distilled — a feature is safe if all three hold:**
1. **Optional & non-gating** — the player can fully enjoy/finish without it.
2. **Serves the player's enjoyment/mastery** — not merely time-on-app or our metrics.
3. **Survives daylight** — you'd happily explain exactly how and why it works to the player.

If it's effectively mandatory to progress, works against the player's interest, and relies on
them *not noticing* — it's a dark pattern.

---

## 2. How to tell engagement from compulsion (the wedge)

The crucial empirical distinction: **compulsion can rise while enjoyment falls.** In the SDT
games research (Ryan, Rigby & Przybylski 2006, across four studies), an **achievement/
competition motive predicted *more* hours-per-week while *lowering* post-play mood and *not*
predicting genuine intent to keep playing.** [V] That dissociation is the signature of a
compulsion loop: the player spends more time but feels worse and doesn't actually want to
return.

**Design implication:** optimize for **enjoyment and authentic desire-to-return**, never for
raw time-on-app or session count. If a feature would increase minutes-played but you suspect
it'd lower how the player *feels*, that's the wedge — reject it. (Top Shelf has no metrics and
no monetization, which structurally protects us from the usual incentive to chase time — keep
it that way.)

> **[X] Refuted overstatement:** the stronger claim that need-satisfaction *causally improved
> short-term well-being / self-esteem* did **not** survive verification (0-3). SDT reliably
> predicts *enjoyment and future-play intent* from autonomy/competence/relatedness [V]; it does
> **not** license a claim that the game measurably makes people happier. Don't oversell it.

---

## 3. The healthy engine (what Top Shelf *should* run on)

These are the player-respecting drivers — the ethical sources of "stickiness." Lean here.

- **Self-Determination Theory — autonomy, competence, relatedness** (Ryan/Rigby/Przybylski
  2006). Enjoyment and future-play intent come from these, independent of tricks. [V]
  Mapped to Top Shelf: **autonomy** = unlimited retries, optional timer/Easy mode, free choice
  of pace and replay; **competence** = difficulty tuned to growing skill, the satisfying click
  of a clean solve; **relatedness** = the gentlest lever for a single-player gift (theming,
  voice, maybe optional sharing) — lowest priority.
- **Flow / GameFlow** (Sweetser & Wyeth 2005): eight elements; the load-bearing one is
  **challenge matched to skill and *rising* as skill improves** — and it needs no scarcity or
  monetization to work. [V] This is exactly what the 100-level sawtooth arc already targets.
- **Cozy design = safety + abundance + softness** (Project Horseshoe 2017 / DiGRA cozy-games
  paper; Lostgarden): safety = absence of danger/failure-punishment, abundance = needs met
  without pressing lack, softness = gentle stimuli that lower arousal. Removing failure-risk
  and timed pressure are *recognized markers of coziness*. [V~] Our no-lose, no-penalty design
  is textbook-correct; protect it.
- **Loops build mastery** (Daniel Cook, *Loops and Arcs*): repeated model→action→feedback
  cycles deliver value through repetition and grow transferable skill ("wisdom"), unlike a
  one-shot "arc." [V~] A sort puzzle *is* a mastery loop — that's its honest engine. Cook also
  notes IAP creates the financial motive to keep players in a loop forever rather than letting
  them finish; we have no such motive, so we can let players reach a real, calm ending (the L100
  finale).
- **Onboarding by competence, not coercion** (GameRefinery): early, low-friction wins and
  teach-by-doing. [secondary] Already done — Level 1 is a near-unfailable warm-up.

---

## 4. The full technique taxonomy with verdicts

Verdict key: **ADOPT** (player-respecting, use it) · **GREY** (dualistic — ethical only in a
specific implementation) · **REJECT** (compulsion/dark-pattern risk or against the relaxing
intent). Many REJECTs are already barred by the sacred "no depleting resources / no
monetization" rules; they're listed so the line is explicit.

### Mastery & progression
| Technique | Mechanism | Verdict | Notes for Top Shelf |
|---|---|---|---|
| Flow-tuned difficulty curve | challenge≈skill, rising [V] | **ADOPT** | Core; already the sawtooth arc. |
| Meta-progression (level/chapter unlocks) | competence + clear goals [V] | **ADOPT** | Already have 100 levels + locks. Keep unlocks earned by play, never purchasable/skippable. |
| Mastery loop / skill growth | loops build "wisdom" [V~] | **ADOPT** | The puzzle itself. Could surface mastery quietly (e.g. an optional, non-comparative "tidy solve" acknowledgment). |
| Onboarding / early wins (FTUE) | competence, low friction [sec] | **ADOPT** | Done. |
| Endowed-progress effect (artificial head-start toward a goal) | goal feels closer → pursued [K] | **GREY** | Honest version only (e.g. a chapter shown partly underway). Never fake progress to bait. |
| Goal-gradient effect (effort rises near a goal) | proximity motivates [K] | **GREY** | A gentle chapter progress indicator is fine; don't weaponize "so close!" into pressure. |

### Feedback & game-feel
| Technique | Mechanism | Verdict | Notes |
|---|---|---|---|
| Juice / satisfying clear FX & sound | competence feedback; sensory reward | **ADOPT — for *real* wins only** | A great clear animation/sound is ethical *because there's a genuine accomplishment*. [V corollary] |
| Peak-end rule (end on a high) | memory weights peak + ending [K] | **ADOPT** | The calm L100 finale and chapter-end set-pieces already use this. |
| Near-miss effects | "almost won" drives replay (gambling) [V] | **REJECT** | A real win/loss only. Never stage a fake "so close." |
| Losses-disguised-as-wins (LDW) | win-style audiovisuals on a non-win inflate perceived success (Barton 2017) [V] | **REJECT** | Never celebrate a non-accomplishment. (Top Shelf has no losses to disguise — keep it that way.) |

### Goals, sessions & open loops
| Technique | Mechanism | Verdict | Notes |
|---|---|---|---|
| Clear, legible goals | flow prerequisite [V] | **ADOPT** | "Make every shelf monochrome" — already crisp. |
| Zeigarnik effect (open tasks nag completion) | unfinished tasks stay salient [K] | **GREY** | Ethical when the pull is the player's *own* wish to finish a board. Dark when externalized into guilt ("3 unfinished levels!" nags). |
| "Just one more" session loop | momentum / curiosity [blog] | **GREY** | Fine if intrinsic ("this is fun"). Dark if engineered via cliffhangers, countdowns, or withheld payoffs. |
| Session-length pacing | rhythm of tension/rest [blog] | **ADOPT** | We already pace via breathers; no coercion. |

### Reward schedules
| Technique | Mechanism | Verdict | Notes |
|---|---|---|---|
| Fixed / predictable rewards | simple reinforcement | **ADOPT** | If we ever reward, make it predictable and earned. |
| **Variable-ratio (slot-machine) rewards** | highest, steadiest response rate; the engine of gambling [V] | **REJECT** | The core mechanism behind loot boxes & problem-gambling links (PLOS/PMC loot-box studies). No random/rare drops, ever. |
| Daily login / streaks / daily quests | dualistic: harmonious passion **or** FOMO/obligation/chore (Frommel & Mandryk, CHI PLAY 2022) [V] | **GREY → mostly REJECT** | If ever added: **no streak-loss penalty**, fully optional, rewards *play* not mere appearance. A penalty-on-miss streak is an appointment mechanic in disguise — reject that form. |

### Social & competition
| Technique | Mechanism | Verdict | Notes |
|---|---|---|---|
| Leaderboards / competition | achievement motive = the compulsion wedge (↑time, ↓mood) [V] | **REJECT (as core)** | Directly against the relaxing intent; the one motive the data ties to *more time, less enjoyment*. At most a strictly-optional, non-default, non-monetized aside. |
| Friend-spam / social pyramids | social-capital dark pattern [V] | **REJECT** | Never. |
| Gentle, non-competitive sharing | relatedness [V] | **GREY (low priority)** | e.g. share a pretty finished board. Optional, no pressure, no virality loop. |

### Time & scarcity pressure (the classic F2P retention toolkit)
| Technique | Mechanism | Verdict | Notes |
|---|---|---|---|
| Energy / lives / hearts | manufactured scarcity → wait or pay | **REJECT** | Sacred rule. The architecture forbids depleting resources. |
| Appointment mechanics / withering | loss aversion → obligation (FarmVille) [V] | **REJECT** | The textbook *time* dark pattern. |
| Limited-time events / FOMO | scarcity + fear of missing out [V] | **REJECT** | Against relaxing intent; a named pitfall of engagement rewards. |
| Push notifications (nagging) | re-engagement via interruption; erodes autonomy (Lostgarden) | **REJECT nagging** | Only ever a *user-requested* reminder, off by default. |

### Monetization
| Technique | Mechanism | Verdict | Notes |
|---|---|---|---|
| IAP / pay-to-skip / pay-to-win / loot boxes | where exploitation concentrates [V]; loot boxes share gambling's structure & correlate with problem gambling (PLOS, n=7,422; PMC review) [V~] | **REJECT** | Sacred rule. None of it, ever. |
| Ads | attention extraction | **REJECT** | Sacred rule. |

### Theming & collection (the cozy meta-layer)
| Technique | Mechanism | Verdict | Notes |
|---|---|---|---|
| Narrative / cosmetic meta ("shop's day") | meaning, softness, abundance [V~] | **ADOPT** | Already have departments + voice. Keep cosmetics free and earned-by-play. |
| Collections / sets | completionist satisfaction **or** gotta-catch-'em-all compulsion | **GREY** | A gentle "departments completed" display is fine; avoid rarity/randomized-drop framing (that imports the variable-ratio problem). |

---

## 5. Green list — what Top Shelf can ethically adopt to feel *more* engaging

Concrete, all powered by the healthy engine (§3), none crossing the line:

1. **Make competence *felt*.** Invest in juice for genuine moments — a satisfying clear
   animation + sound when a shelf goes monochrome, a gentle flourish on a chapter set-piece.
   Ethical because each celebrates a real accomplishment. [V corollary]
2. **Protect and surface autonomy.** Keep unlimited retries, Easy mode, replay of any cleared
   level. Consider an explicit **Zen / endless mode** (no timer, no fail, just sorting) — pure
   autonomy + flow. [SDT, cozy]
3. **Quiet mastery signals, never comparative.** Optionally acknowledge an elegant solve
   ("Tidy! solved in N moves") as a *self-referential* competence cue — **no leaderboard, no
   versus, no streak.** Keep it the player's relationship with their own skill.
4. **Peak-end shaping.** Keep ending chapters on a satisfying set-piece and the whole game on
   the calm L100 finale; let people reach a *real ending* (we have no reason to trap them in a
   loop). [K + Cook]
5. **Richer theming as intrinsic reward.** Department palettes, voice, the shop's-day arc —
   "abundance & softness." More flavor, zero pressure. [cozy V~]
6. **Honest completion pull.** A board that's nearly sorted naturally invites finishing
   (benign Zeigarnik) — lean on the *intrinsic* pull, never externalize it into nags.

## 6. Red list — reject on purpose (and say why in code/docs)

Energy/lives · streak-loss penalties · limited-time/FOMO events · variable-ratio or randomized
rewards · loot boxes · leaderboards/competition as a core or default · nagging push
notifications · appointment/withering mechanics · loss-aversion framing · fake near-miss or
losses-disguised-as-wins juice · any IAP or ads. Most are already barred by the sacred rules;
the ones worth *naming explicitly* as newly-considered-and-rejected are **competition/
leaderboards** (the empirical compulsion wedge) and **penalty-bearing streaks** (an appointment
mechanic in disguise).

## 7. The grey zone (dualistic mechanics — only the healthy form, if ever)

Daily content, streaks, collections, and gentle social all *can* be ethical — the research is
explicit that they're dualistic, not inherently dark (Frommel & Mandryk). [V] If any is ever
added, it must pass the §1 test: **optional, non-gating, no punishment for ignoring it,
rewards genuine play, and survives daylight.** A streak that *resets and punishes* fails; a
streak that *only ever adds a small grace note for playing* can pass. Default to leaving them
out — a relaxing gift doesn't need them.

---

## 8. Caveats, confidence & open questions (don't overstate this doc)

- **Verified strongly [V]:** the implementation-not-mechanic principle; Zagal's three-category
  taxonomy and the optional/non-gating test; the SDT enjoyment/future-play link; the
  achievement-motive compulsion wedge; GameFlow's challenge-matching; the dualistic nature of
  engagement rewards; near-miss & LDW as gambling feedback weapons; variable-ratio's potency;
  exploitation concentrating in F2P/IAP.
- **Refuted/corrected [X]:** the four-category Zagal taxonomy; "variable-ratio = addiction" as a
  Zagal claim; an SDT *causal well-being* claim; a "only 10.76% of games have zero dark
  patterns" near-ubiquity figure (data was crowdsourced/fuzzy); some specific monetary-pattern
  labels. Don't cite these.
- **Not verified by this pass [K] — treat as plausible, not proven:** the Zeigarnik effect,
  endowed-progress effect, goal-gradient effect, peak-end rule, "compulsion loop" as a formal
  construct, and dopamine/anticipation framing. They're standard in design talks and broadly
  supported in general psychology, but this research pass did **not** confirm them *for cozy
  puzzle games* specifically. Use them as design intuition, not citations.
- **Transfer caution:** near-miss / losses-disguised-as-wins evidence comes from real-money
  electronic gaming machines (Barton 2017); applying it to a non-gambling puzzle game is an
  inference (a sound one: don't fake wins), not a measured result.
- **Open questions worth a future pass:** evidence for Zeigarnik/goal-gradient/peak-end *in
  cozy puzzle games*; how to design a *no-penalty* streak that stays healthy; post-mortems of
  cozy-puzzle exemplars (Goods Sort, *Unpacking*); whether cosmetic meta-progression reads as
  reward or compulsion.

## 9. Sources (verified primary set)

- Zagal, Björk & Lewis, *Dark Patterns in the Design of Games*, FDG 2013 — fdg2013.org/program/papers/paper06_zagal_etal.pdf
- Deterding, Björk et al., *Against Dark Game Design Patterns*, DiGRA 2020 — researchgate 339054289
- Aagaard, Knudsen, Bækgaard & Doherty, dark patterns in mobile games, CHI 2022 — dl.acm.org/doi/fullHtml/10.1145/3491101.3519837
- Niknejad et al., dark patterns across 1,496 mobile games, MUM 2024 — arxiv.org/html/2412.05039v1
- Ryan, Rigby & Przybylski, *The Motivational Pull of Video Games: A Self-Determination Theory Approach*, Motivation & Emotion 2006 — selfdeterminationtheory.org (2006_RyanRigbyPrzybylski_MandE.pdf)
- Sweetser & Wyeth, *GameFlow: A Model for Evaluating Player Enjoyment in Games*, 2005 — researchgate 220686347
- Frommel & Mandryk, *Daily Quests or Daily Pests? …Engagement Rewards in Games*, CHI PLAY 2022 — researchgate 365003534
- Barton et al., near-miss & losses-disguised-as-wins, *J. Gambling Studies* 2017 — link.springer.com/article/10.1007/s10899-017-9688-0
- Zendle & Cairns, loot boxes & problem gambling (n=7,422), PLOS ONE 2018 — journals.plos.org/plosone/article?id=10.1371/journal.pone.0206767
- Microtransactions / IGD systematic review — pmc.ncbi.nlm.nih.gov/articles/PMC9006671/
- Project Horseshoe 2017 cozy games / DiGRA cozy-games paper — dl.digra.org/.../2662
- Daniel Cook (Lostgarden): *Cozy Games* (2018), *Loops and Arcs* (2012), *Kind Games* (2023) — lostgarden.com
- Celia Hodent, *The Gamer's Brain* pt.3 (UX, engagement, retention), GDC17 — celiahodent.com
- Industry analysis (secondary): GameRefinery (onboarding, collections, motivations), Deconstructor of Fun, Mobile Free to Play (session/pacing)
