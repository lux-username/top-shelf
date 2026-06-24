"use strict";
/* Dependency-free PNG icon generator for Top Shelf.
   Draws the game's "win" image — three matched groceries resting on a wood
   shelf, warm cream background — and writes opaque square PNGs at the sizes a
   PWA / iOS add-to-home-screen needs. 3x supersampling gives smooth edges.
   Run: node tests/gen-icon.js  (writes icons into the project root). */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

/* ---- tiny PNG encoder (8-bit RGBA, single IDAT) ---- */
const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const crcv = Buffer.alloc(4); crcv.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crcv]);
}
function encodePNG(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; // RGBA
  const stride = w * 4 + 1;
  const raw = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) { raw[y * stride] = 0; rgba.copy(raw, y * stride + 1, y * w * 4, (y + 1) * w * 4); }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

/* ---- color helpers (work in 0..255) ---- */
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
const over = (dst, src, a) => [lerp(dst[0], src[0], a), lerp(dst[1], src[1], a), lerp(dst[2], src[2], a)];
const clamp01 = t => (t < 0 ? 0 : t > 1 ? 1 : t);
const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
/* signed distance to a rounded rect (negative inside) — for soft, AA'd edges */
function sdRound(u, v, x0, y0, x1, y1, r) {
  const hx = (x1 - x0) / 2 - r, hy = (y1 - y0) / 2 - r;
  const dx = Math.abs(u - (x0 + x1) / 2) - hx, dy = Math.abs(v - (y0 + y1) / 2) - hy;
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - r;
}

const BG_TOP = hex("#fcf5e7"), BG_BOT = hex("#eed8b2"), BG_GLOW = hex("#fffdf6");
const SHELF_TOP = hex("#cb9f67"), SHELF_BOT = hex("#8a5a2c"), SHELF_LIP = hex("#6f461d"), GRAIN = hex("#9a6a39");
const ITEM = hex("#ec3f23"), ITEM_DK = hex("#b21f10"), ITEM_HI = hex("#ffc6a6");
const LEAF = hex("#62a06b"), LEAF_DK = hex("#3f7a4c"), LEAF_HI = hex("#a7d39e"), STEM = hex("#7c5230");
const SHADOW = hex("#5e4326"), SPARK = hex("#fff7e4");
const WHITE = [255, 255, 255];

/* scene color at unit coords (u,v in 0..1, v down). Always opaque. */
function scene(u, v) {
  // warm cream backdrop with a soft top glow
  let c = mix(BG_TOP, BG_BOT, smooth(0.02, 1.0, v));
  const g = 1 - clamp01(Math.hypot((u - 0.5) * 1.15, (v - 0.28) * 1.25) / 0.72);
  c = over(c, BG_GLOW, 0.32 * g * g);

  const cxs = [0.272, 0.5, 0.728], cy = 0.472, rad = 0.108;

  // soft contact shadows where each grocery meets the shelf
  for (const cx of cxs) {
    const e = Math.hypot((u - cx) / 0.115, (v - 0.585) / 0.022);
    if (e < 1.5) c = over(c, SHADOW, 0.20 * (1 - smooth(0.3, 1.4, e)));
  }

  // wood shelf plank (rounded ends, top sheen, two faint grain lines)
  const dPlank = sdRound(u, v, 0.12, 0.578, 0.88, 0.69, 0.03);
  if (dPlank < 0.008) {
    let wood = mix(SHELF_TOP, SHELF_BOT, smooth(0.578, 0.69, v));
    wood = over(wood, WHITE, 0.16 * (1 - smooth(0.578, 0.60, v)));        // top sheen
    wood = over(wood, GRAIN, 0.20 * Math.exp(-((v - 0.632) ** 2) / 2e-5));
    wood = over(wood, GRAIN, 0.13 * Math.exp(-((v - 0.664) ** 2) / 2e-5));
    c = over(c, wood, 1 - smooth(-0.004, 0.006, dPlank));
  }
  // shelf front lip
  const dLip = sdRound(u, v, 0.15, 0.69, 0.85, 0.726, 0.012);
  if (dLip < 0.008) c = over(c, SHELF_LIP, 1 - smooth(-0.004, 0.006, dLip));

  // three matched groceries (a solved shelf), clearly spaced
  for (const cx of cxs) {
    const d = Math.hypot(u - cx, v - cy);
    if (d > rad + 0.012) continue;
    const t = clamp01((v - (cy - rad)) / (2 * rad));                       // 0 top -> 1 bottom
    let body = mix(mix(ITEM_HI, ITEM, 0.45), ITEM_DK, smooth(0.18, 1.05, t));
    body = mix(body, ITEM_DK, smooth(rad - 0.024, rad, d) * smooth(0.35, 0.8, t) * 0.7); // grounding rim
    const hd = Math.hypot((u - (cx - 0.036)) / 1.0, (v - (cy - 0.044)) / 1.15);          // gloss highlight
    body = over(body, WHITE, 0.55 * (1 - smooth(0.0, 0.044, hd)));
    const hd2 = Math.hypot(u - (cx + 0.026), v - (cy + 0.02));                           // tiny reflected dot
    body = over(body, WHITE, 0.22 * (1 - smooth(0, 0.012, hd2)));
    c = over(c, body, 1 - smooth(rad - 0.006, rad + 0.006, d));
  }

  // second pass: stem + leaf sprigs, so no neighbouring apple body paints over a leaf
  for (const cx of cxs) {
    const topX = cx + 0.004, topY = cy - rad;
    const ds = sdRound(u, v, topX - 0.006, topY - 0.05, topX + 0.006, topY + 0.006, 0.005);
    if (ds < 0.006) c = over(c, STEM, 1 - smooth(-0.003, 0.005, ds));
    const lcx = topX + 0.05, lcy = topY - 0.024;                                         // leaf center
    const lx = (u - lcx) * 0.8 + (v - lcy) * 0.6, ly = (v - lcy) * 0.8 - (u - lcx) * 0.6;
    const le = Math.hypot(lx / 0.064, ly / 0.03);
    if (le < 1.04) {
      let leaf = mix(LEAF, LEAF_DK, smooth(-0.026, 0.03, ly));                           // lower edge in shadow
      if (Math.abs(ly) < 0.0032) leaf = over(leaf, LEAF_HI, 0.5);                        // center vein
      c = over(c, leaf, 1 - smooth(0.88, 1.04, le));
    }
  }

  // a small "top shelf" sparkle, upper right
  const sx = 0.785, sy = 0.235, star = Math.min(
    Math.abs(u - sx) / 0.011 + Math.abs(v - sy) / 0.048,
    Math.abs(u - sx) / 0.048 + Math.abs(v - sy) / 0.011);
  if (star < 1) c = over(c, SPARK, 0.8 * (1 - smooth(0.25, 1, star)));

  return c;
}

/* Favicon scene — one big glossy apple on the warm tile. The three-item
   composition turns to mush at 16px, so the favicon zooms to a single hero
   grocery (still instantly "Top Shelf"). */
function faviconScene(u, v) {
  let c = mix(BG_TOP, BG_BOT, smooth(0.0, 1.0, v));
  const cx = 0.5, cy = 0.55, rad = 0.34;
  // ground shadow
  const e = Math.hypot((u - cx) / 0.34, (v - 0.9) / 0.055);
  if (e < 1.4) c = over(c, SHADOW, 0.18 * (1 - smooth(0.3, 1.3, e)));
  // apple body
  const d = Math.hypot(u - cx, v - cy);
  if (d <= rad + 0.02) {
    const t = clamp01((v - (cy - rad)) / (2 * rad));
    let body = mix(mix(ITEM_HI, ITEM, 0.45), ITEM_DK, smooth(0.18, 1.05, t));
    body = mix(body, ITEM_DK, smooth(rad - 0.08, rad, d) * smooth(0.35, 0.85, t) * 0.7);
    const hd = Math.hypot((u - (cx - 0.12)) / 1.0, (v - (cy - 0.14)) / 1.15);
    body = over(body, WHITE, 0.6 * (1 - smooth(0, 0.14, hd)));
    c = over(c, body, 1 - smooth(rad - 0.012, rad + 0.012, d));
  }
  // stem + leaf
  const topY = cy - rad, topX = cx + 0.01;
  const ds = sdRound(u, v, topX - 0.018, topY - 0.14, topX + 0.018, topY + 0.02, 0.014);
  if (ds < 0.01) c = over(c, STEM, 1 - smooth(-0.006, 0.01, ds));
  const lcx = topX + 0.17, lcy = topY - 0.05;
  const lx = (u - lcx) * 0.8 + (v - lcy) * 0.6, ly = (v - lcy) * 0.8 - (u - lcx) * 0.6;
  const le = Math.hypot(lx / 0.2, ly / 0.095);
  if (le < 1.04) {
    let leaf = mix(LEAF, LEAF_DK, smooth(-0.08, 0.09, ly));
    if (Math.abs(ly) < 0.011) leaf = over(leaf, LEAF_HI, 0.5);
    c = over(c, leaf, 1 - smooth(0.88, 1.04, le));
  }
  return c;
}

function render(size, sceneFn = scene) {
  const SS = 3;                                          // supersample factor
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let r = 0, g = 0, b = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const u = (x + (sx + 0.5) / SS) / size;
      const v = (y + (sy + 0.5) / SS) / size;
      const col = sceneFn(u, v);
      r += col[0]; g += col[1]; b += col[2];
    }
    const n = SS * SS, i = (y * size + x) * 4;
    out[i] = Math.round(r / n); out[i + 1] = Math.round(g / n); out[i + 2] = Math.round(b / n); out[i + 3] = 255;
  }
  return out;
}

/* ---- ICO container (embeds PNGs; modern browsers read PNG-in-ICO) ---- */
function buildIco(entries) {                              // entries: [{size, png}]
  const dir = Buffer.alloc(6 + 16 * entries.length);
  dir.writeUInt16LE(0, 0); dir.writeUInt16LE(1, 2); dir.writeUInt16LE(entries.length, 4);
  let offset = dir.length;
  entries.forEach((e, i) => {
    const b = 6 + i * 16;
    dir[b] = e.size >= 256 ? 0 : e.size; dir[b + 1] = e.size >= 256 ? 0 : e.size;
    dir.writeUInt16LE(1, b + 4); dir.writeUInt16LE(32, b + 6);
    dir.writeUInt32LE(e.png.length, b + 8); dir.writeUInt32LE(offset, b + 12);
    offset += e.png.length;
  });
  return Buffer.concat([dir, ...entries.map(e => e.png)]);
}

const root = path.join(__dirname, "..");
// app / home-screen icons (full three-item scene)
for (const [name, size] of [["icon-512.png", 512], ["icon-192.png", 192], ["apple-touch-icon.png", 180]]) {
  fs.writeFileSync(path.join(root, name), encodePNG(size, size, render(size)));
  console.log("wrote", name, size + "x" + size);
}
// browser-tab favicons (single hero apple) + a multi-size .ico
const favEntries = [];
for (const size of [16, 32, 48]) {
  const png = encodePNG(size, size, render(size, faviconScene));
  fs.writeFileSync(path.join(root, `favicon-${size}.png`), png);
  console.log("wrote", `favicon-${size}.png`, size + "x" + size);
  favEntries.push({ size, png });
}
fs.writeFileSync(path.join(root, "favicon.ico"), buildIco(favEntries));
console.log("wrote favicon.ico (16+32+48)");
