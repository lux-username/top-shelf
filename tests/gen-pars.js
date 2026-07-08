"use strict";
/* Offline PAR generator. Computes a "par" (tidy-solve target) move-count for every
   level and prints a PARS array to paste into index.html.

   par = shortest solution length found. Method:
     1. Exact BFS over canonical states (dedup) up to a state cap → true optimum.
     2. If a level exceeds the cap, fall back to a memory-bounded beam search → a valid
        (achievable, near-optimal) upper-bound target.
   The search is SHUTTER-AWARE (threads a running clear count and re-opens shutters,
   mirroring the in-game solveShutter), so locked-stock levels solve correctly.

   A "move" here == one legalMoves/applyMove step == one in-game commitMove (cascades
   bundled), so solver length == the player's move counter.

   Usage: node tests/gen-pars.js [lo] [hi] [cap]
*/
const fs = require("fs");
const path = require("path");

const HTML = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const start = HTML.indexOf('"use strict";');
const endMarker = "/* =======================================================================\n   Persistence";
const end = HTML.indexOf(endMarker);
if (start < 0 || end < 0) { console.error("Could not locate engine slice boundaries"); process.exit(1); }
const ENGINE = HTML.slice(start, end);

const lo  = process.argv[2] ? Number(process.argv[2]) : 1;
const hi  = process.argv[3] ? Number(process.argv[3]) : 1e9;   // default = all levels (clamped to N)
const CAP = process.argv[4] ? Number(process.argv[4]) : 80000;
const BW  = process.argv[5] ? Number(process.argv[5]) : 6000;   // beam width
const BD  = process.argv[6] ? Number(process.argv[6]) : 400;    // beam max depth

const test = `
  globalThis.__out__ = (s) => process.stdout.write(s + "\\n");

  // Shutter-aware state stepping: carry a running clear count, re-open shutters whose
  // threshold is met, and fold the (capped) clear count into the dedup key — exactly as
  // the in-game solveShutter does. For non-shutter boards this collapses to plain canonical.
  function makeStepper(board){
    const hasShutter = board.some(sh => sh.lockedUntil != null);
    const maxT = hasShutter ? Math.max(...board.map(sh => sh.lockedUntil || 0)) : 0;
    const relock = (b, c) => { if(!hasShutter) return; for(const sh of b) if(sh.lockedUntil != null) sh.locked = c < sh.lockedUntil; };
    const key = (b, c) => hasShutter ? canonical(b) + "@" + Math.min(c, maxT) : canonical(b);
    const expand = (b, c) => {
      const res = [];
      for(const mv of legalMoves(b)){
        const out = [];
        const nb = applyMove(b, mv, out);     // resolveClears (cascades) applied inside; out = cleared idxs
        const nc = c + out.length;
        relock(nb, nc);
        res.push({ nb, nc });
      }
      return res;
    };
    return { relock, key, expand };
  }

  // Exact shortest-path BFS over (state, clearCount). Returns true optimum or null if capped.
  function parBFS(board, cap){
    const { relock, key, expand } = makeStepper(board);
    const root = cloneBoard(board); relock(root, 0);
    if(!hasItems(root)) return { par: 0, states: 1, exact: true };
    const seen = new Set([key(root, 0)]);
    let frontier = [{ b: root, c: 0 }], depth = 0, states = 1;
    while(frontier.length){
      depth++;
      const next = [];
      for(const { b, c } of frontier){
        for(const { nb, nc } of expand(b, c)){
          if(!hasItems(nb)) return { par: depth, states, exact: true };
          const k = key(nb, nc);
          if(seen.has(k)) continue;
          seen.add(k); states++;
          if(states > cap) return { par: null, states, exact: false };
          next.push({ b: nb, c: nc });
        }
      }
      frontier = next;
    }
    return { par: null, states, exact: false }; // unsolvable (shouldn't happen)
  }

  // Lower-bound-ish heuristic for ranking: for each color, every item not in that color's
  // single largest existing cluster must move at least once. (Ignores WILD; underestimate.)
  function heur(b){
    const cnt = new Map(), maxC = new Map();
    for(const sh of b){
      const local = new Map();
      for(const sl of sh){
        if(!sl.length) continue;
        const t = TYPE(sl[0]);
        if(t === WILD) continue;
        local.set(t, (local.get(t) || 0) + 1);
        cnt.set(t, (cnt.get(t) || 0) + 1);
      }
      for(const [t, c] of local) if(c > (maxC.get(t) || 0)) maxC.set(t, c);
    }
    let h = 0;
    for(const [t, c] of cnt) h += c - (maxC.get(t) || 0);
    return h;
  }

  // Beam search: memory-bounded to the beam width per layer (won't OOM on deep boards).
  // Returns an achievable (near-optimal) solution length for levels whose exact BFS caps out.
  function parBeam(board, width, maxDepth){
    const { relock, key, expand } = makeStepper(board);
    const root = cloneBoard(board); relock(root, 0);
    let layer = [{ b: root, c: 0, g: 0 }];
    const seen = new Set([key(root, 0)]);
    for(let depth = 0; depth < maxDepth; depth++){
      const cand = [];
      for(const st of layer){
        for(const { nb, nc } of expand(st.b, st.c)){
          if(!hasItems(nb)) return st.g + 1;
          const k = key(nb, nc);
          if(seen.has(k)) continue;
          seen.add(k);
          cand.push({ b: nb, c: nc, g: st.g + 1, f: st.g + 1 + heur(nb) });
        }
      }
      if(!cand.length) return null;
      cand.sort((a, b2) => a.f - b2.f);
      layer = cand.slice(0, width);
    }
    return null;
  }

  const pars = [];
  const N = LEVELS.length;
  __out__("lvl  feat        it  par   states   ms  method");
  for(let i = ${lo - 1}; i < Math.min(N, ${hi}); i++){
    const def = LEVELS[i];
    const built = buildLevel(def, i);
    const board = built.board;
    const items = board.reduce((n,sh)=>n+sh.reduce((m,sl)=>m+sl.length,0),0);
    const t0 = Date.now();
    let r = parBFS(board, ${CAP});
    let method = "BFS";
    if(r.par == null){
      const g = parBeam(board, ${BW}, ${BD});
      r = { par: g, states: r.states, exact: false };
      method = "beam";
    }
    const ms = Date.now() - t0;
    pars[i] = r.par;
    __out__(
      String(i+1).padStart(3) + " " + (def.feature||"core").padEnd(11) + " " +
      String(items).padStart(2) + " " + String(r.par).padStart(4) + " " +
      String(r.states).padStart(8) + " " + String(ms).padStart(5) + "  " +
      method + (r.exact ? " (exact)" : " (upper-bound)")
    );
  }
  __out__("\\nPARS = [" + pars.map(p => p==null?"null":p).join(",") + "];");
  globalThis.__PARS__ = pars;
`;
eval(ENGINE + test);
