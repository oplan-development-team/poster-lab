import { PATTERNS } from './patterns.js';
import { THEMES, mulberry32, drawSheet, fitCanvas, exportPNG, themeButtons, copyLink } from '../shared.js';

// ---- seeded rng + perlin noise ----
function makeNoise(rng) {
  const perm = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  const P = new Uint8Array(512).map((_, i) => perm[i & 255]);
  const G = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10), lerp = (a, b, t) => a + (b - a) * t;
  const d = (hx, hy, dx, dy) => { const g = G[P[P[hx & 255] + (hy & 255)] & 7]; return g[0] * dx + g[1] * dy; };
  const base = (x, y) => {
    const X = Math.floor(x), Y = Math.floor(y); x -= X; y -= Y;
    const u = fade(x), v = fade(y);
    return lerp(lerp(d(X, Y, x, y), d(X + 1, Y, x - 1, y), u), lerp(d(X, Y + 1, x, y - 1), d(X + 1, Y + 1, x - 1, y - 1), u), v);
  };
  return (x, y) => base(x, y) + 0.5 * base(x * 2, y * 2) + 0.25 * base(x * 4, y * 4); // fbm, 3 octaves, ~[-1.75,1.75]
}

// ---- state ----
const S = { pat: PATTERNS[0], seed: 0, theme: 0, title: '', sub: '', p: {} };
const $ = s => document.querySelector(s);
const canvas = $('#sheet');
const newSeed = () => Math.floor(Math.random() * 1e9);

function loadHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  S.pat = PATTERNS.find(x => x.id === h.get('p')) || PATTERNS[0];
  S.seed = +h.get('s') || newSeed();
  S.theme = Math.min(+h.get('t') || 0, THEMES.length - 1);
  S.title = h.get('title') || ''; S.sub = h.get('sub') || '';
  S.p = Object.fromEntries(S.pat.params.map(q => [q.k, h.has(q.k) ? +h.get(q.k) : q.d]));
}
function saveHash() {
  const h = new URLSearchParams({ p: S.pat.id, s: S.seed, t: S.theme, ...S.p });
  if (S.title) h.set('title', S.title); if (S.sub) h.set('sub', S.sub);
  history.replaceState(null, '', '#' + h);
}

// ---- drawing ----
function draw(ctx, scale) {
  const th = THEMES[S.theme], rng = mulberry32(S.seed), noise = makeNoise(rng), seed = String(S.seed).padStart(9, '0');
  drawSheet(ctx, scale, th, {
    title: (S.title || S.pat.name).toUpperCase(), sub: S.sub.toUpperCase(),
    r1: `NO. ${seed.slice(0, 3)}-${seed.slice(3)}`, r2: S.pat.tags,
    fl: `${S.pat.name.toUpperCase()}  ·  ${th.n.toUpperCase()}`, fr: 'EDITION 01  ·  POSTER LAB',
  }, (ctx, W, H) => S.pat.draw({ ctx, W, H, p: S.p, rng, noise, ink: th.ink, accent: th.ac }));
}
function render() { fitCanvas(canvas, draw); saveHash(); $('#seed').textContent = 'seed ' + S.seed; }

// ---- ui ----
function buildPatterns() {
  $('#patterns').innerHTML = PATTERNS.map(x => `<button data-id="${x.id}" class="${x === S.pat ? 'on' : ''}">${x.name}</button>`).join('');
}
function buildParams() {
  $('#params').innerHTML = S.pat.params.map(q => `
    <label><span>${q.l}</span><input type="range" data-k="${q.k}" min="${q.min}" max="${q.max}" step="${q.step}" value="${S.p[q.k]}"><output>${S.p[q.k]}</output></label>`).join('');
}
function buildThemes() { themeButtons($('#themes'), S.theme, t => { S.theme = t; buildThemes(); render(); }); }
$('#patterns').onclick = e => {
  const id = e.target.dataset.id; if (!id) return;
  S.pat = PATTERNS.find(x => x.id === id); S.p = Object.fromEntries(S.pat.params.map(q => [q.k, q.d]));
  buildPatterns(); buildParams(); render();
};
$('#params').oninput = e => { S.p[e.target.dataset.k] = +e.target.value; e.target.nextElementSibling.value = e.target.value; render(); };
$('#title').oninput = e => { S.title = e.target.value; render(); };
$('#sub').oninput = e => { S.sub = e.target.value; render(); };
$('#roll').onclick = () => { S.seed = newSeed(); render(); };
$('#prev').onclick = () => { S.seed = (S.seed - 1 + 1e9) % 1e9; render(); };
$('#next').onclick = () => { S.seed = (S.seed + 1) % 1e9; render(); };
$('#recolour').onclick = () => { S.theme = (S.theme + 1 + Math.floor(Math.random() * (THEMES.length - 1))) % THEMES.length; buildThemes(); render(); };
$('#random').onclick = () => { S.p = Object.fromEntries(S.pat.params.map(q => [q.k, +(q.min + Math.random() * (q.max - q.min)).toFixed(2)])); S.seed = newSeed(); buildParams(); render(); };
$('#copy').onclick = e => copyLink(e.target);
$('#download').onclick = () => exportPNG(+$('#size').value, `${S.pat.id}-${S.seed}.png`, draw);
addEventListener('resize', render);
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; if (e.key === ' ') { e.preventDefault(); $('#roll').click(); } if (e.key === 'ArrowLeft') $('#prev').click(); if (e.key === 'ArrowRight') $('#next').click(); });

loadHash(); $('#title').value = S.title; $('#sub').value = S.sub;
buildPatterns(); buildParams(); buildThemes(); render();
