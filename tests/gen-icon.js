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

const BG_TOP = hex("#f8f0e2"), BG_BOT = hex("#ead7b8");
const SHELF_TOP = hex("#caa06f"), SHELF_BOT = hex("#9c6a3a"), SHELF_LIP = hex("#82592f");
const ITEM = hex("#d96a4f"), ITEM_RIM = hex("#b8472f"), LEAF = hex("#5a8f6e");
const WHITE = [255, 255, 255];

const inRound = (u, v, x0, y0, x1, y1, r) => {
  const cx = Math.min(Math.max(u, x0 + r), x1 - r);
  const cy = Math.min(Math.max(v, y0 + r), y1 - r);
  if (u >= x0 && u <= x1 && v >= y0 && v <= y1) {
    if (u >= x0 + r && u <= x1 - r) return true;
    if (v >= y0 + r && v <= y1 - r) return true;
    return Math.hypot(u - cx, v - cy) <= r;
  }
  return false;
};

/* scene color at unit coords (u,v in 0..1, v down). Always opaque. */
function scene(u, v) {
  let c = mix(BG_TOP, BG_BOT, v);                       // cream backdrop

  // three grocery circles resting on the shelf (matched = same color)
  const cy = 0.49, rad = 0.115;
  for (const cx of [0.295, 0.5, 0.705]) {
    const d = Math.hypot(u - cx, (v - cy));
    if (d <= rad) {
      // soft top-lit body
      const shade = mix(mix(ITEM, WHITE, 0.18), ITEM, Math.min(1, (v - (cy - rad)) / (2 * rad) + 0.15));
      c = shade;
      if (d > rad - 0.012) c = ITEM_RIM;               // rim
      // glossy highlight upper-left
      const hd = Math.hypot(u - (cx - 0.035), v - (cy - 0.04));
      if (hd < 0.032) c = over(c, WHITE, 0.45 * (1 - hd / 0.032));
      // little leaf nub at top
      if (Math.hypot(u - (cx + 0.018), v - (cy - rad + 0.012)) < 0.022) c = LEAF;
    }
  }

  // wood shelf plank
  if (inRound(u, v, 0.14, 0.60, 0.86, 0.715, 0.028)) {
    c = mix(SHELF_TOP, SHELF_BOT, (v - 0.60) / 0.115);
    if (v < 0.617) c = over(c, WHITE, 0.18);            // top sheen
  }
  // shelf front lip
  if (inRound(u, v, 0.165, 0.715, 0.835, 0.745, 0.012)) c = SHELF_LIP;

  return c;
}

function render(size) {
  const SS = 3;                                          // supersample factor
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let r = 0, g = 0, b = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const u = (x + (sx + 0.5) / SS) / size;
      const v = (y + (sy + 0.5) / SS) / size;
      const col = scene(u, v);
      r += col[0]; g += col[1]; b += col[2];
    }
    const n = SS * SS, i = (y * size + x) * 4;
    out[i] = Math.round(r / n); out[i + 1] = Math.round(g / n); out[i + 2] = Math.round(b / n); out[i + 3] = 255;
  }
  return out;
}

const root = path.join(__dirname, "..");
for (const [name, size] of [["icon-512.png", 512], ["icon-192.png", 192], ["apple-touch-icon.png", 180]]) {
  fs.writeFileSync(path.join(root, name), encodePNG(size, size, render(size)));
  console.log("wrote", name, size + "x" + size);
}
