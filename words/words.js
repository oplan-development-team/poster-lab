import { MONO, SANS, mulberry32, drawSheet, fitCanvas, exportPNG, copyLink } from '../shared.js';

// Palettes: two flat colours + one accent, lifted from the reference posters (red/blue, neon/red, red/cream, black/cream…)
const THEMES = [
  { n: 'Signal', bg: '#ff2a1a', ink: '#1414ff', ac: '#f4f4f0' },
  { n: 'Acid', bg: '#e6ff00', ink: '#ff3b1f', ac: '#111' },
  { n: 'Poster Red', bg: '#e0301e', ink: '#f5ead6', ac: '#111' },
  { n: 'Cream', bg: '#efe6d2', ink: '#111', ac: '#e0301e' },
  { n: 'Peach', bg: '#f7e6d8', ink: '#1b1464', ac: '#ff3b1f' },
  { n: 'Magenta', bg: '#e8ff3a', ink: '#ff1aa8', ac: '#111' },
  { n: 'Cobalt', bg: '#1414ff', ink: '#ff2a1a', ac: '#f4f4f0' },
  { n: 'Night', bg: '#111', ink: '#efe6d2', ac: '#ff3b1f' },
];
const FONTS = { condensed: 'Anton', wide: '"Archivo Black"', serif: '"Playfair Display"' };
const LAYOUTS = ['bleed', 'repeat', 'vertical', 'shape'];

const $ = s => document.querySelector(s), canvas = $('#sheet');
const S = { hero: 'CALL IT\nWHAT YOU\nWANT', small: 'You don\'t need to save me\nAll the liars are calling me one', label: '', layout: 'bleed', font: 'condensed', theme: 0, grain: 1, seed: 7 };

function loadHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  for (const k in S) if (h.has(k)) S[k] = typeof S[k] === 'number' ? +h.get(k) : h.get(k);
}
const saveHash = () => history.replaceState(null, '', '#' + new URLSearchParams(S));

// ---- helpers ----
const fitSize = (ctx, text, font, width) => { ctx.font = `100px ${font}`; return 100 * width / Math.max(1, ctx.measureText(text).width); };
let grainTile;
function grain(ctx, W, H) {
  if (!grainTile) {
    grainTile = document.createElement('canvas'); grainTile.width = grainTile.height = 256;
    const g = grainTile.getContext('2d'), img = g.createImageData(256, 256), rng = mulberry32(1);
    for (let i = 0; i < img.data.length; i += 4) { const v = rng() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
  }
  ctx.save(); ctx.globalAlpha = 0.09; ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(grainTile, 'repeat'); ctx.fillRect(-200, -200, W + 400, H + 400); ctx.restore();
}
function smallBlock(ctx, lines, x, y, align = 'left', size = 15) {
  ctx.font = `500 ${size}px ${SANS}`; ctx.textAlign = align; ctx.textBaseline = 'top'; ctx.letterSpacing = '0px';
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * size * 1.35));
  return lines.length * size * 1.35;
}
// One word per line may take the accent colour (like the blue words in the references)
function heroLine(ctx, line, x, y, rng, th, align = 'left') {
  const words = line.split(' '), hit = rng() < 0.4 ? Math.floor(rng() * words.length) : -1;
  if (hit < 0) { ctx.fillStyle = th.ink; ctx.textAlign = align; ctx.fillText(line, x, y); return; }
  const wsp = ctx.measureText(' ').width, total = ctx.measureText(line).width;
  let cx = align === 'right' ? x - total : align === 'center' ? x - total / 2 : x;
  ctx.textAlign = 'left';
  words.forEach((w, i) => { ctx.fillStyle = i === hit ? th.ac : th.ink; ctx.fillText(w, cx, y); cx += ctx.measureText(w).width + wsp; });
}

// ---- layouts: (ctx, W, H, hero[], small[], th, rng, font) ----
const layouts = {
  bleed(ctx, W, H, hero, small, th, rng, font) {
    const sizes = hero.map(l => fitSize(ctx, l, font, W * 1.08));
    const lh = 0.84, total = sizes.reduce((a, s) => a + s * lh, 0), k = Math.min(1, (H - 90) / total);
    let y = 0; ctx.textBaseline = 'top';
    hero.forEach((l, i) => { const s = sizes[i] * k; ctx.font = `${s}px ${font}`; heroLine(ctx, l, -W * 0.04, y - s * 0.08, rng, th); y += s * lh; });
    ctx.fillStyle = th.ink;
    if (H - y > 70) smallBlock(ctx, small, W, y + 30, 'right');
    else smallBlock(ctx, small, W, -110, 'right');
  },
  repeat(ctx, W, H, hero, small, th, rng, font) {
    const word = hero[0] || 'WORD', rows = 9, s = Math.min(fitSize(ctx, word, font, W), (H - 80) / rows / 0.9);
    ctx.font = `${s}px ${font}`; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    const top = (H - 80 - rows * s * 0.9) / 2;
    for (let i = 0; i < rows; i++) {
      ctx.globalAlpha = 0.12 + 0.88 * (i / (rows - 1)) ** 1.6; ctx.fillStyle = i === rows - 1 ? th.ac : th.ink;
      ctx.fillText(word, 0, top + i * s * 0.9);
    }
    ctx.globalAlpha = 1; ctx.fillStyle = th.ink;
    smallBlock(ctx, small, W, H - 20 - small.length * 20, 'right');
  },
  vertical(ctx, W, H, hero, small, th, rng, font) {
    const word = hero[0] || 'WORD', s = Math.min(fitSize(ctx, word, font, H * 1.06), W * 0.62);
    ctx.save(); ctx.translate(-W * 0.02, -H * 0.03); ctx.rotate(Math.PI / 2); // glyphs grow toward +x after the turn: word hugs the left edge
    ctx.font = `${s}px ${font}`; ctx.textBaseline = 'bottom'; heroLine(ctx, word, 0, s * 0.02, rng, th); ctx.restore();
    ctx.fillStyle = th.ink;
    const x = W, rest = hero.slice(1);
    let y = H * 0.12;
    if (rest.length) { ctx.font = `${Math.min(56, W * 0.1)}px ${font}`; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; rest.forEach(l => { ctx.fillText(l, x, y); y += 60; }); }
    smallBlock(ctx, small, x, H * 0.72, 'right');
  },
  shape(ctx, W, H, hero, small, th, rng, font) {
    const R = W * 0.44, cx = W / 2 + (rng() - 0.5) * W * 0.2, cy = H / 2 + (rng() - 0.5) * H * 0.2;
    const sizes = hero.map(l => fitSize(ctx, l, font, W * 0.98)), lh = 0.86;
    const total = sizes.reduce((a, s) => a + s * lh, 0), k = Math.min(1, (H - 40) / total), top = (H - total * k) / 2;
    const text = () => { let y = top; hero.forEach((l, i) => { const s = sizes[i] * k; ctx.font = `${s}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(l, W / 2, y - s * 0.08); y += s * lh; }); };
    ctx.fillStyle = th.ink; text();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip();
    ctx.fillStyle = th.ink; ctx.fillRect(-100, -100, W + 200, H + 200); ctx.fillStyle = th.bg; text(); ctx.restore();
    ctx.save(); ctx.translate(W + 4, H); ctx.rotate(-Math.PI / 2); ctx.fillStyle = th.ac;
    ctx.font = `600 12px ${MONO}`; ctx.letterSpacing = '2px'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText(small.join('   ·   ').toUpperCase(), 0, 0); ctx.restore();
  },
};

function draw(ctx, scale) {
  const th = THEMES[S.theme], rng = mulberry32(S.seed), font = FONTS[S.font];
  const hero = S.hero.split('\n').map(l => l.trim()).filter(Boolean), small = S.small.split('\n').map(l => l.trim()).filter(Boolean);
  const label = (S.label || `WORDS  ·  ${new Date().getFullYear()}`).toUpperCase();
  drawSheet(ctx, scale, th, { title: '', r1: label, r2: `NO. ${String(S.seed).padStart(3, '0')}`, fl: `${S.layout.toUpperCase()}  ·  ${th.n.toUpperCase()}`, bleed: true },
    (ctx, W, H) => { layouts[S.layout](ctx, W, H, hero, small, th, rng, font); if (S.grain) grain(ctx, W, H); });
}
function render() { fitCanvas(canvas, draw); saveHash(); }

// ---- ui ----
const pills = (el, keys, cur, on) => { el.innerHTML = keys.map(k => `<button data-k="${k}" class="${k === cur ? 'on' : ''}">${k}</button>`).join(''); el.onclick = e => { if (e.target.dataset.k) on(e.target.dataset.k); }; };
const buildLayouts = () => pills($('#layouts'), LAYOUTS, S.layout, k => { S.layout = k; buildLayouts(); render(); });
const buildFonts = () => pills($('#fonts'), Object.keys(FONTS), S.font, k => { S.font = k; buildFonts(); render(); });
const buildThemes = () => {
  $('#themes').innerHTML = THEMES.map((t, i) => `<button data-t="${i}" title="${t.n}" class="${i === S.theme ? 'on' : ''}" style="background:${t.bg}"><i style="background:${t.ink}"></i></button>`).join('');
  $('#themes').onclick = e => { const b = e.target.closest('button'); if (b) { S.theme = +b.dataset.t; buildThemes(); render(); } };
};
for (const k of ['hero', 'small', 'label']) $('#' + k).oninput = e => { S[k] = e.target.value; render(); };
$('#grain').onchange = e => { S.grain = +e.target.checked; render(); };
$('#shuffle').onclick = () => { S.seed = Math.floor(Math.random() * 1000); render(); };
$('#download').onclick = () => exportPNG(+$('#size').value, `words-${S.layout}-${S.seed}.png`, draw);
$('#copy').onclick = e => copyLink(e.target);
addEventListener('resize', render);

loadHash();
$('#hero').value = S.hero; $('#small').value = S.small; $('#label').value = S.label; $('#grain').checked = !!S.grain;
buildLayouts(); buildFonts(); buildThemes();
await Promise.all(Object.values(FONTS).map(f => document.fonts.load(`100px ${f}`))).catch(() => {});
render();
