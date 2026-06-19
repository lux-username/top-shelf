# Top Shelf — icon sets

The game's icons live **inline** in `index.html` (one hidden `<svg>` sprite of
`<symbol>`s, referenced by `<use href="#ic-…">`). That keeps the app single-file and
offline-safe. This folder holds **named copies** of that sprite plus a tool to swap
them in and out.

## Files

| File | What it is |
|------|------------|
| `set-A.svg` | **Backup — do not edit.** Frozen snapshot of the icons as of this commit (the fully hand-drawn, emoji-free set: 70 icons). The safety net. |
| `set-B.svg` | **Working copy.** Edit this one. Identical to A right now. |
| `iconset.mjs` | Export/apply tool (Node, no deps). |

Each `set-*.svg` is a **standalone, browser-viewable** file: open it to see every icon
in a labeled grid. Its *source of truth* is the markup between `<!--SPRITE-START-->`
and `<!--SPRITE-END-->` (a verbatim copy of the inline sprite); the grid below just
renders it.

## Workflow

Run from the repo root.

```sh
# edit icons/set-B.svg (the <symbol>/<defs> between the SPRITE markers), then:
node icons/iconset.mjs apply B      # push set-B into index.html's inline sprite
# test, then bump CACHE in sw.js and deploy

node icons/iconset.mjs apply A      # restore the backup if an experiment goes wrong
```

To re-snapshot the *current* in-game icons into a set file (e.g. after editing the
inline sprite directly):

```sh
node icons/iconset.mjs export B     # index.html sprite -> icons/set-B.svg
```

The round-trip is **lossless** — `apply` reinserts the sprite byte-for-byte, so
`export X` then `apply X` is a no-op.

## Going forward

- **Edit set B**, never set A. A is the restore point.
- `apply` only changes `index.html`; it does **not** bump the service-worker cache or
  deploy. After applying, bump `CACHE` in `sw.js` and push as usual.
- If you want a third variant, copy `set-B.svg` to `set-C.svg` and add `"C"` to the
  allowed names in `iconset.mjs`.
