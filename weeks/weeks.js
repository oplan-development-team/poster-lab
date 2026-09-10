import { THEMES, MONO, drawSheet, fitCanvas, exportPNG, themeButtons, copyLink, withOrient, isLandscape } from '../shared.js';

const $ = s => document.querySelector(s), canvas = $('#sheet');
const S = { birth: '1990-01-01', years: 90, name: '', theme: 0, shape: 'dot' };
const WEEK = 7 * 86400000;

function loadHash() { const h = new URLSearchParams(location.hash.slice(1)); for (const k in S) if (h.has(k)) S[k] = typeof S[k] === 'number' ? +h.get(k) : h.get(k); }
const saveHash = () => history.replaceState(null, '', '#' + withOrient(new URLSearchParams(S)));
const fmt = d => new Date(d + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

function draw(ctx, scale) {
  const th = THEMES[S.theme], birth = new Date(S.birth + 'T00:00'), lived = Math.max(0, Math.floor((Date.now() - birth) / WEEK)), total = S.years * 52;
  drawSheet(ctx, scale, th, {
    title: (S.name || 'LIFE IN WEEKS').toUpperCase(), spaced: !!S.name,
    sub: `BORN ${fmt(S.birth)}`,
    r1: `${lived.toLocaleString()} WEEKS LIVED`, r2: `OF ${total.toLocaleString()}  ·  ${S.years} YEARS`,
    fl: `ONE ${isLandscape() ? 'COLUMN' : 'ROW'} IS ONE YEAR  ·  ${th.n.toUpperCase()}`,
  }, (ctx, W, H) => {
    const land = W > H, C = land ? S.years : 52, Rw = land ? 52 : S.years, left = 34;
    const cell = Math.min((W - left) / C, (H - 10) / Rw), r = cell * 0.3, x0 = left + (W - left - cell * C) / 2, y0 = (H - cell * Rw) / 2;
    ctx.font = `500 9px ${MONO}`; ctx.textAlign = land ? 'center' : 'right'; ctx.textBaseline = 'middle'; ctx.globalAlpha = 0.55;
    for (let y = 0; y < S.years; y += 10) land ? ctx.fillText(String(y), x0 + y * cell + cell / 2, y0 - 12) : ctx.fillText(String(y), left - 12, y0 + y * cell + cell / 2);
    ctx.globalAlpha = 1;
    for (let i = 0; i < total; i++) {
      const wk = i % 52, yr = Math.floor(i / 52), x = x0 + (land ? yr : wk) * cell + cell / 2, y = y0 + (land ? wk : yr) * cell + cell / 2, past = i < lived, now = i === lived;
      ctx.fillStyle = now ? th.ac : th.ink; ctx.strokeStyle = th.ink;
      ctx.globalAlpha = past || now ? 1 : 0.28; ctx.lineWidth = 0.8;
      ctx.beginPath();
      if (S.shape === 'square') { const s = r * 1.7; past || now ? ctx.fillRect(x - s / 2, y - s / 2, s, s) : ctx.strokeRect(x - s / 2, y - s / 2, s, s); }
      else { ctx.arc(x, y, now ? r * 1.4 : r, 0, 7); past || now ? ctx.fill() : ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
  });
}
function render() { fitCanvas(canvas, draw); saveHash(); }
const buildThemes = () => themeButtons($('#themes'), S.theme, t => { S.theme = t; buildThemes(); render(); });
const buildShapes = () => { $('#shapes').innerHTML = ['dot', 'square'].map(k => `<button data-k="${k}" class="${k === S.shape ? 'on' : ''}">${k}</button>`).join(''); $('#shapes').onclick = e => { if (e.target.dataset.k) { S.shape = e.target.dataset.k; buildShapes(); render(); } }; };
$('#birth').oninput = e => { if (e.target.value) { S.birth = e.target.value; render(); } };
$('#years').oninput = e => { S.years = Math.min(120, Math.max(1, +e.target.value || 90)); render(); };
$('#name').oninput = e => { S.name = e.target.value; render(); };
$('#download').onclick = () => exportPNG(+$('#size').value, `life-in-weeks-${S.birth}.png`, draw);
$('#copy').onclick = e => copyLink(e.target);
addEventListener('resize', render);
loadHash(); $('#birth').value = S.birth; $('#years').value = S.years; $('#name').value = S.name;
buildThemes(); buildShapes(); render();
