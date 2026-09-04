# Poster Lab

Print-ready posters made from a moment that is yours. No build, nothing uploaded (three.js from CDN for the 3D bits) — every sheet is drawn in the browser.

Live: https://oplan-development-team.github.io/poster-lab/

| Page | What goes in | What comes out |
|---|---|---|
| [`starmap/`](starmap/) | date + time + place | the night sky above that place, stereographic, with constellation lines |
| [`words/`](words/) | a few lines of text | a typographic poster: bleed / repeat / vertical / shape layouts, two flat colours, grain |
| [`3d/`](3d/) | a seed + sliders | ten three.js patterns (iso blocks, dot sphere, wave terrain, ring stack, cube cloud, pillars, tunnel, torus knot, louvers, sphere grid) painted onto the sheet |
| [`patterns/`](patterns/) | a seed + a few sliders | one of nine generative patterns on a typographic sheet |

Every poster is reproducible from its URL — copy the link to share the exact sheet. PNG export at 2000 / 3000 / 5000 px wide (A-series ratio).

```bash
python3 -m http.server 8778
node starmap/check.mjs   # astro math self-check (Polaris sits north at alt ≈ latitude)
```

## Layout
- `shared.js` / `shared.css` — sheet frame (header/footer typography, palettes, canvas sizing, PNG export)
- `starmap/` — `astro.js` (LST, alt/az, stereographic projection), `starmap.js` (UI), `check.mjs`
- `words/` — `words.js` (4 layouts, display fonts via Google Fonts: Anton, Archivo Black, Playfair Display)
- `three-sheet.js` — shared WebGLRenderer → `drawImage` into the 2D sheet; `3d/patterns3d.js` pattern objects return `{ scene, camera }`
- `words/` glass layout: three.js TextGeometry + PMREM RoomEnvironment chrome, `data/helvetiker_bold.typeface.json`
- `patterns/` — `patterns.js` (pattern objects: params + draw), `app.js` (UI)
- `data/` — 5,044 stars to mag 6 and 150 constellation lines, trimmed from [d3-celestial](https://github.com/ofrohn/d3-celestial) (BSD-3)

Place search uses [Nominatim](https://nominatim.org/) (OpenStreetMap). Local time at a place is approximated as `round(lng / 15)` hours from UTC.

## Next
Route poster from a GPX file — only if Star Map earns it.
