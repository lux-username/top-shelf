#!/usr/bin/env node
/* Top Shelf — icon set tool.  Run from the repo root.
 *
 *   node icons/iconset.mjs export A     # snapshot index.html's icons -> icons/set-A.svg
 *   node icons/iconset.mjs export B     # snapshot -> icons/set-B.svg
 *   node icons/iconset.mjs apply  B     # push icons/set-B.svg into index.html's inline sprite
 *   node icons/iconset.mjs apply  A     # restore the backup
 *
 * The game keeps its icons INLINE in index.html (single-file, offline-safe). Each
 * set file is a standalone, browser-viewable SVG whose source of truth is the markup
 * between <!--SPRITE-START--> and <!--SPRITE-END--> (a verbatim copy of the inline
 * sprite); a generated grid below it renders every icon so you can open/compare the
 * file. Edit a set's symbols/gradients, then `apply` it, bump CACHE in sw.js, deploy.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INDEX = path.join(ROOT, "index.html");
const SET = (name) => path.join(ROOT, "icons", `set-${name}.svg`);
const OPEN = '<svg aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden">';
const START = "<!--SPRITE-START-->", END = "<!--SPRITE-END-->";

function spriteInner(html) {
  const a = html.indexOf(OPEN);
  if (a < 0) throw new Error("inline icon sprite not found in index.html");
  const innerStart = a + OPEN.length;
  const end = html.indexOf("</svg>", innerStart);
  if (end < 0) throw new Error("sprite </svg> not found");
  return { innerStart, end, inner: html.slice(innerStart, end) };
}

const symbolIds = (inner) => [...inner.matchAll(/<symbol id="(ic-[^"]+)"/g)].map((m) => m[1]);

function previewGrid(ids) {
  const cols = 6, cw = 122, ch = 132, x0 = 16, y0 = 78, icon = 74, tile = 106;
  const rows = Math.ceil(ids.length / cols);
  const W = x0 * 2 + cols * cw, H = y0 + rows * ch + 16;
  const cells = ids.map((id, i) => {
    const cx = x0 + (i % cols) * cw, cy = y0 + Math.floor(i / cols) * ch;
    const off = (tile - icon) / 2, label = id.replace(/^ic-/, "");
    return `    <g><rect x="${cx}" y="${cy}" width="${tile}" height="${tile}" rx="16" fill="#fffaf1"/>` +
      `<use href="#${id}" x="${cx + off}" y="${cy + off}" width="${icon}" height="${icon}"/>` +
      `<text x="${cx + tile / 2}" y="${cy + tile + 16}" text-anchor="middle" font-size="12" font-weight="700" fill="#4a3a2a">${label}</text></g>`;
  }).join("\n");
  return { W, H, cells };
}

function exportSet(name) {
  const { inner } = spriteInner(fs.readFileSync(INDEX, "utf8"));
  const ids = symbolIds(inner);
  const { W, H, cells } = previewGrid(ids);
  const note = name === "A" ? "backup — do not edit" : "working copy";
  const svg =
`<?xml version="1.0" encoding="UTF-8"?>
<!-- Top Shelf icon set ${name} (${note}). ${ids.length} icons.
     Source of truth: the markup between SPRITE-START/SPRITE-END (verbatim copy of
     index.html's inline sprite). Edit there, then: node icons/iconset.mjs apply ${name} -->
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="color:#4a3a2a">
  <rect width="100%" height="100%" fill="#f7efe1"/>
  <text x="${W / 2}" y="40" text-anchor="middle" font-family="Georgia,serif" font-size="26" font-weight="700" fill="#4a3a2a">Top Shelf — Icon Set ${name}</text>
  <text x="${W / 2}" y="62" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#7a6a56">${ids.length} icons · ${note}</text>
  ${START}${inner}${END}
  <g font-family="sans-serif">
${cells}
  </g>
</svg>
`;
  fs.mkdirSync(path.join(ROOT, "icons"), { recursive: true });
  fs.writeFileSync(SET(name), svg);
  console.log(`wrote icons/set-${name}.svg — ${ids.length} icons, ${svg.length} bytes`);
}

function applySet(name) {
  const set = fs.readFileSync(SET(name), "utf8");
  const s = set.indexOf(START), e = set.indexOf(END);
  if (s < 0 || e < 0) throw new Error(`SPRITE markers missing in set-${name}.svg`);
  const inner = set.slice(s + START.length, e);
  const html = fs.readFileSync(INDEX, "utf8");
  const { innerStart, end } = spriteInner(html);
  const next = html.slice(0, innerStart) + inner + html.slice(end);
  if (next === html) return console.log(`index.html already matches set ${name} — no change.`);
  fs.writeFileSync(INDEX, next);
  console.log(`applied icon set ${name} -> index.html. Now bump CACHE in sw.js and redeploy.`);
}

const [cmd, name] = process.argv.slice(2);
if (!["export", "apply"].includes(cmd) || !["A", "B"].includes(name)) {
  console.log("usage: node icons/iconset.mjs <export|apply> <A|B>");
  process.exit(1);
}
(cmd === "export" ? exportSet : applySet)(name);
