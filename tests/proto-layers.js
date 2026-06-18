"use strict";
/* PROTOTYPE for the new "sealed layers" back-row mechanic (standalone, not wired
   into the game yet). Goal: validate that we can still GENERATE solvable, hard
   boards efficiently under the new rules before rewriting index.html.

   New model:
     shelf = { a: [s0,s1,s2], b: [row, row, ...] }
       a = the ACTIVE top layer (each slot is a type-id or null)
       b = BURIED full rows beneath (each row = [t,t,t]); b[0] rises next
     - You only ever move items in/out of the active layer.
     - Moving a front away just empties that slot — buried items DO NOT advance.
     - A shelf clears when its 3 active slots match; the active layer is removed
       and b[0] rises to become the new active layer (which may itself match →
       cascade/combo). Buried rows are visible-but-inert until they rise.

   Run: node tests/proto-layers.js
*/

function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rand){ for(let i=arr.length-1;i>0;i--){ const j=(rand()*(i+1))|0; [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

const clone = b => b.map(sh => ({ a: sh.a.slice(), b: sh.b.map(r => r.slice()) }));
const hasItems = b => b.some(sh => sh.a.some(x => x != null) || sh.b.length);
const monoActive = sh => sh.a[0] != null && sh.a[0] === sh.a[1] && sh.a[1] === sh.a[2];
const hasMono = b => b.some(monoActive);

function resolveClears(b, out){
  let changed = true, n = 0;
  while(changed){
    changed = false;
    for(let i=0;i<b.length;i++){
      if(monoActive(b[i])){
        b[i].a = b[i].b.length ? b[i].b.shift() : [null,null,null];   // clear active; rise buried
        changed = true; n++; if(out) out.push(i);
      }
    }
  }
  return n;
}
function legalMoves(b){
  const out = [];
  for(let i=0;i<b.length;i++) for(let s=0;s<3;s++){
    if(b[i].a[s] == null) continue;
    for(let j=0;j<b.length;j++){
      if(j === i) continue;
      if(b[j].a.indexOf(null) >= 0) out.push({ fs:i, ss:s, ts:j });
    }
  }
  return out;
}
function applyMove(b, mv){
  const nb = clone(b);
  const t = nb[mv.fs].a[mv.ss]; nb[mv.fs].a[mv.ss] = null;
  nb[mv.ts].a[nb[mv.ts].a.indexOf(null)] = t;
  resolveClears(nb);
  return nb;
}
function canonical(b){
  const shelves = b.map(sh => {
    const act = sh.a.filter(x => x != null).slice().sort((x,y)=>x-y).join(",");
    const bur = sh.b.map(r => r.slice().sort((x,y)=>x-y).join(",")).join(";");
    return act + "|" + bur;
  });
  shelves.sort();
  return shelves.join("/");
}
function solve(board, cap){
  if(!hasItems(board)) return { solvable:true };
  const seen = new Set([canonical(board)]);
  let nodes = 0; const stack = [board];
  while(stack.length){
    const b = stack.pop();
    if(!hasItems(b)) return { solvable:true, exhausted:false };
    if(++nodes > cap) return { solvable:false, exhausted:true };
    for(const mv of legalMoves(b)){
      const nb = applyMove(b, mv);
      if(!hasItems(nb)) return { solvable:true, exhausted:false };
      const k = canonical(nb);
      if(seen.has(k)) continue;
      seen.add(k); stack.push(nb);
    }
  }
  return { solvable:false, exhausted:false };
}
/* myopic greedy: take an immediate clear, else build a match, else give up */
function greedySolvable(board){
  let b = clone(board); const seen = new Set();
  const count = bd => bd.reduce((n,sh)=>n+sh.a.filter(x=>x!=null).length + sh.b.length*3, 0);
  while(hasItems(b)){
    const k = canonical(b); if(seen.has(k)) return false; seen.add(k);
    const moves = legalMoves(b); if(!moves.length) return false;
    const before = count(b); let adv = false;
    for(const mv of moves){ const nb = applyMove(b, mv); if(count(nb) < before){ b = nb; adv = true; break; } }
    if(adv) continue;
    let best = null, bestScore = 0;
    for(const mv of moves){
      const t = b[mv.fs].a[mv.ss];
      let same = 0; for(const x of b[mv.ts].a) if(x === t) same++;
      if(same > bestScore){ bestScore = same; best = mv; }
    }
    if(best){ b = applyMove(b, best); continue; }
    return false;
  }
  return true;
}

/* GENERATION strategy A: random fill + solver gate.
   numFilled filled shelves (active + depth-1 buried rows) + E empty shelves,
   K types. Each type lands in a whole number of rows so counts are multiples of
   3 by construction. Reject auto-clearing boards; gate on solvable (+ optionally
   greedy-hard). Returns {board, attempts} or null. */
function genRandom(numFilled, E, depth, K, levelSeed, wantHard){
  const rows = numFilled * depth;
  for(let attempt=0; attempt<200; attempt++){
    const rand = mulberry32(levelSeed * 1000003 + attempt * 7919);
    const rowTypes = []; for(let r=0;r<rows;r++) rowTypes.push(r % K);
    shuffle(rowTypes, rand);
    let items = []; for(const t of rowTypes) items.push(t,t,t);
    shuffle(items, rand);
    const board = []; let idx = 0;
    for(let f=0; f<numFilled; f++){
      const a = [items[idx++], items[idx++], items[idx++]];
      const bur = []; for(let d=0; d<depth-1; d++) bur.push([items[idx++], items[idx++], items[idx++]]);
      board.push({ a, b: bur });
    }
    for(let e=0;e<E;e++) board.push({ a:[null,null,null], b:[] });
    if(hasMono(board)) continue;                       // never auto-clear on frame one
    if(legalMoves(board).length === 0) continue;
    const v = solve(board, 60000);
    if(!v.solvable) continue;
    if(wantHard && greedySolvable(board)) continue;    // require planning
    return { board, attempts: attempt + 1 };
  }
  return null;
}

/* ---- measure solvable rate, difficulty, speed across configs ---- */
function measure(label, numFilled, E, depth, K, n){
  let solvableHits = 0, hardHits = 0, totAttempts = 0, totMs = 0, fails = 0, totItems = 0;
  for(let s=1; s<=n; s++){
    const t0 = Date.now();
    const r = genRandom(numFilled, E, depth, K, s, true);
    totMs += Date.now() - t0;
    if(!r){ fails++; continue; }
    solvableHits++; hardHits++; totAttempts += r.attempts;
    totItems += r.board.reduce((m,sh)=>m+sh.a.filter(x=>x!=null).length + sh.b.length*3, 0);
  }
  const shelves = numFilled + E;
  console.log(
    label.padEnd(26),
    "shelves=" + shelves,
    "K=" + K, "depth=" + depth,
    "| hardBoards=" + hardHits + "/" + n,
    "fails=" + fails,
    "avgAttempts=" + (totAttempts/Math.max(1,hardHits)).toFixed(1),
    "avgItems=" + (totItems/Math.max(1,hardHits)).toFixed(0),
    "avgGen=" + (totMs/n).toFixed(0) + "ms"
  );
}

/* Also: raw solvable rate (no greedy requirement) to see how often random fills work */
function rawRate(numFilled, E, depth, K, n){
  let solv = 0, hard = 0;
  for(let s=1; s<=n; s++){
    const rand = mulberry32(s * 7 + 3);
    const rows = numFilled * depth;
    const rowTypes = []; for(let r=0;r<rows;r++) rowTypes.push(r % K); shuffle(rowTypes, rand);
    let items = []; for(const t of rowTypes) items.push(t,t,t); shuffle(items, rand);
    const board = []; let idx = 0;
    for(let f=0; f<numFilled; f++){ const a=[items[idx++],items[idx++],items[idx++]]; const bur=[]; for(let d=0;d<depth-1;d++) bur.push([items[idx++],items[idx++],items[idx++]]); board.push({a,b:bur}); }
    for(let e=0;e<E;e++) board.push({a:[null,null,null],b:[]});
    if(hasMono(board) || legalMoves(board).length===0) continue;
    const v = solve(board, 200000);
    if(v.solvable){ solv++; if(!greedySolvable(board)) hard++; }
  }
  return { solvRate: (100*solv/n).toFixed(0)+"%", hardRate: (100*hard/n).toFixed(0)+"%" };
}

console.log("=== generator timing (random fill + solve-gate@60k + greedy-gate), 50 seeds each ===");
measure("ch2 intro (5 shelf)",  3, 1, 2, 3, 50);
measure("ch2 standard",         4, 1, 2, 4, 50);
measure("deep depth-3",         4, 1, 3, 4, 50);
measure("deep depth-3 roomy",   4, 2, 3, 4, 50);
measure("deep depth-3 K5",      4, 1, 3, 5, 50);
measure("tight depth-2 K5",     5, 1, 2, 5, 50);
measure("hard depth-3 5shelf",  5, 1, 3, 4, 50);
measure("very deep 5shelf K5",  5, 1, 3, 5, 50);
