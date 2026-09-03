import { PATTERNS } from './patterns.js';

const SHEET = { W: 1000, H: 1414, M: 80, TOP: 150, BOT: 100 }; // A-series ratio, 1000 = 1 unit
const THEMES = [
  { n: 'Paper', bg: '#f3efe6', ink: '#171717', ac: '#c8412b' },
  { n: 'Midnight', bg: '#0b0d12', ink: '#e8e6df', ac: '#f0b429' },
  { n: 'Terracotta', bg: '#c4532f', ink: '#f7ecd9', ac: '#20150f' },
  { n: 'Forest', bg: '#13291f', ink: '#dfe8d8', ac: '#e5a93a' },
  { n: 'Sky', bg: '#dfe9f2', ink: '#1a2a3a', ac: '#d64545' },
  { n: 'Blueprint', bg: '#1c3c8f', ink: '#e8eefb', ac: '#ffd166' },
  { n: 'Rose', bg: '#f2d9d5', ink: '#3a1f24', ac: '#1f5f5b' },
  { n: 'Ink', bg: '#111', ink: '#fff', ac: '#ff3b30' },
];

// ---- seeded rng + perlin noise ----
const mulberry32 = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
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
const canvas = $('#sheet'), dpr = Math.min(devicePixelRatio || 1, 2);
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
function drawSheet(ctx, scale) {
  const { W, H, M, TOP, BOT } = SHEET, th = THEMES[S.theme], rng = mulberry32(S.seed), noise = makeNoise(rng);
  ctx.save(); ctx.scale(scale, scale);
  ctx.fillStyle = th.bg; ctx.fillRect(0, 0, W, H);
  const mono = 'ui-monospace, Menlo, Consolas, monospace', sans = '-apple-system, Helvetica Neue, Inter, Arial, sans-serif';
  const title = (S.title || S.pat.name).toUpperCase(), seed = String(S.seed).padStart(9, '0');
  ctx.fillStyle = th.ink; ctx.textBaseline = 'top';
  ctx.font = `600 34px ${sans}`; ctx.letterSpacing = '-0.5px'; ctx.fillText(title, M, M);
  ctx.font = `400 13px ${mono}`; ctx.letterSpacing = '1px';
  if (S.sub) ctx.fillText(S.sub.toUpperCase(), M, M + 46);
  ctx.textAlign = 'right';
  ctx.fillText(`NO. ${seed.slice(0, 3)}-${seed.slice(3)}`, W - M, M + 2);
  ctx.fillText(S.pat.tags, W - M, M + 22);
  ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText(`${S.pat.name.toUpperCase()}  ·  ${th.n.toUpperCase()}`, M, H - M + 6);
  ctx.textAlign = 'right'; ctx.fillText('EDITION 01  ·  POSTER LAB', W - M, H - M + 6);
  ctx.fillStyle = th.ac; ctx.beginPath(); ctx.arc(M + 4, H - M - 20, 4, 0, 7); ctx.fill();
  // art area
  const aw = W - 2 * M, ah = H - TOP - BOT;
  ctx.save(); ctx.translate(M, TOP); ctx.beginPath(); ctx.rect(0, 0, aw, ah); ctx.clip();
  ctx.strokeStyle = th.ink; ctx.fillStyle = th.ink; ctx.textAlign = 'left';
  S.pat.draw({ ctx, W: aw, H: ah, p: S.p, rng, noise, ink: th.ink, accent: th.ac });
  ctx.restore(); ctx.restore();
}
function render() {
  const cssW = canvas.clientWidth, sc = cssW / SHEET.W;
  canvas.width = SHEET.W * sc * dpr; canvas.height = SHEET.H * sc * dpr;
  drawSheet(canvas.getContext('2d'), sc * dpr);
  saveHash();
  $('#seed').textContent = 'seed ' + S.seed;
}

// ---- ui ----
function buildPatterns() {
  $('#patterns').innerHTML = PATTERNS.map(x => `<button data-id="${x.id}" class="${x === S.pat ? 'on' : ''}">${x.name}</button>`).join('');
}
function buildParams() {
  $('#params').innerHTML = S.pat.params.map(q => `
    <label><span>${q.l}</span><input type="range" data-k="${q.k}" min="${q.min}" max="${q.max}" step="${q.step}" value="${S.p[q.k]}"><output>${S.p[q.k]}</output></label>`).join('');
}
function buildThemes() {
  $('#themes').innerHTML = THEMES.map((t, i) => `<button data-t="${i}" title="${t.n}" class="${i === S.theme ? 'on' : ''}" style="background:${t.bg};color:${t.ink}"><i style="background:${t.ac}"></i></button>`).join('');
}
$('#patterns').onclick = e => {
  const id = e.target.dataset.id; if (!id) return;
  S.pat = PATTERNS.find(x => x.id === id); S.p = Object.fromEntries(S.pat.params.map(q => [q.k, q.d]));
  buildPatterns(); buildParams(); render();
};
$('#params').oninput = e => { S.p[e.target.dataset.k] = +e.target.value; e.target.nextElementSibling.value = e.target.value; render(); };
$('#themes').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.theme = +b.dataset.t; buildThemes(); render(); };
$('#title').oninput = e => { S.title = e.target.value; render(); };
$('#sub').oninput = e => { S.sub = e.target.value; render(); };
$('#roll').onclick = () => { S.seed = newSeed(); render(); };
$('#prev').onclick = () => { S.seed = (S.seed - 1 + 1e9) % 1e9; render(); };
$('#next').onclick = () => { S.seed = (S.seed + 1) % 1e9; render(); };
$('#recolour').onclick = () => { S.theme = (S.theme + 1 + Math.floor(Math.random() * (THEMES.length - 1))) % THEMES.length; buildThemes(); render(); };
$('#random').onclick = () => { S.p = Object.fromEntries(S.pat.params.map(q => [q.k, +(q.min + Math.random() * (q.max - q.min)).toFixed(2)])); S.seed = newSeed(); buildParams(); render(); };
$('#copy').onclick = e => { navigator.clipboard.writeText(location.href); e.target.textContent = 'Copied'; setTimeout(() => e.target.textContent = 'Copy link', 1200); };
$('#download').onclick = () => {
  const px = +$('#size').value, off = document.createElement('canvas');
  off.width = SHEET.W * px; off.height = SHEET.H * px;
  drawSheet(off.getContext('2d'), px);
  off.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${S.pat.id}-${S.seed}.png`; a.click(); }, 'image/png');
};
addEventListener('resize', render);
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; if (e.key === ' ') { e.preventDefault(); $('#roll').click(); } if (e.key === 'ArrowLeft') $('#prev').click(); if (e.key === 'ArrowRight') $('#next').click(); });

loadHash(); $('#title').value = S.title; $('#sub').value = S.sub;
buildPatterns(); buildParams(); buildThemes(); render();
